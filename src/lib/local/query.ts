import { getDB, mutate, uuid, nowISO } from "./store";
import type { DBShape, TableName } from "./types";

type Row = Record<string, unknown>;
type Filter = (row: Row) => boolean;

function rowsOf(table: TableName): Row[] {
  return getDB()[table] as unknown as Row[];
}

interface ParsedSelectField {
  name: string;
  alias?: string;
  nested?: ParsedSelect;
  count?: boolean;
}

interface ParsedSelect {
  fields: ParsedSelectField[];
  all: boolean;
}

function parseSelect(input: string): ParsedSelect {
  const trimmed = input.replace(/\s+/g, " ").trim();
  if (!trimmed || trimmed === "*") return { fields: [], all: true };

  const fields: ParsedSelectField[] = [];
  let depth = 0;
  let buf = "";

  const flush = () => {
    const item = buf.trim();
    buf = "";
    if (!item) return;
    const parenIdx = item.indexOf("(");
    if (parenIdx >= 0) {
      const name = item.slice(0, parenIdx).trim();
      const inner = item.slice(parenIdx + 1, item.lastIndexOf(")"));
      fields.push({ name, nested: parseSelect(inner) });
    } else {
      fields.push({ name: item });
    }
  };

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      flush();
    } else {
      buf += ch;
    }
  }
  flush();
  return { fields, all: false };
}

// Resolve a foreign key relationship. Supabase convention: `child(col)` joins
// the child table on either child.<parent>_id = parent.id or
// parent.<child>_id = child.id, depending on which exists.
function joinNested(
  parentRow: Row,
  parentTable: TableName,
  childName: string,
  childSelect: ParsedSelect
): unknown {
  const db = getDB();
  const tables = Object.keys(db) as TableName[];

  // Pluralisation: child can be the literal table name (modules), or a foreign
  // key column without _id (product → products), or the singular form.
  const candidates: TableName[] = [];
  if (tables.includes(childName as TableName)) candidates.push(childName as TableName);
  if (tables.includes((childName + "s") as TableName)) candidates.push((childName + "s") as TableName);
  if (tables.includes((childName + "es") as TableName)) candidates.push((childName + "es") as TableName);
  if (childName.endsWith("y")) {
    const alt = (childName.slice(0, -1) + "ies") as TableName;
    if (tables.includes(alt)) candidates.push(alt);
  }
  if (!candidates.length) return null;
  const childTable = candidates[0];
  const childRows = (db[childTable] as unknown as Row[]) ?? [];

  const parentSingular = parentTable.replace(/s$/, "");
  const childSingular = childName.endsWith("s") ? childName.slice(0, -1) : childName;

  // ── One-to-many: child has <parent_singular>_id column ─────────
  const childFkToParent = `${parentSingular}_id`;
  if (childRows.length && childFkToParent in childRows[0]) {
    const matches = childRows.filter((r) => r[childFkToParent] === parentRow.id);
    return matches.map((r) => shapeRow(r, childTable, childSelect));
  }

  // ── Many-to-one: parent has <child_singular>_id column ─────────
  const parentFkToChild = `${childSingular}_id`;
  if (parentFkToChild in parentRow) {
    const match = childRows.find((r) => r.id === parentRow[parentFkToChild]);
    return match ? shapeRow(match, childTable, childSelect) : null;
  }

  return null;
}

function shapeRow(row: Row, table: TableName, sel: ParsedSelect): Row {
  if (sel.all || sel.fields.length === 0) return { ...row };
  const out: Row = {};
  for (const f of sel.fields) {
    if (f.nested) {
      out[f.name] = joinNested(row, table, f.name, f.nested);
    } else if (f.name in row) {
      out[f.name] = row[f.name];
    } else {
      out[f.name] = null;
    }
  }
  return out;
}

type Mode = "select" | "insert" | "update" | "delete" | "upsert";

interface BuilderState {
  mode: Mode;
  table: TableName;
  filters: Filter[];
  select: ParsedSelect;
  insertValues: Row | Row[] | null;
  updateValues: Row | null;
  upsertOnConflict: string[] | null;
  orderBy: { col: string; asc: boolean } | null;
  limit: number | null;
  range: { from: number; to: number } | null;
  expect: "single" | "maybeSingle" | "many";
  countMode: "exact" | "head" | null;
  countHead: boolean;
  returnInserted: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class LocalQueryBuilder<T = any> implements PromiseLike<{ data: T | null; error: { message: string } | null; count?: number }> {
  private state: BuilderState;

  constructor(table: TableName) {
    this.state = {
      mode: "select",
      table,
      filters: [],
      select: { fields: [], all: true },
      insertValues: null,
      updateValues: null,
      upsertOnConflict: null,
      orderBy: null,
      limit: null,
      range: null,
      expect: "many",
      countMode: null,
      countHead: false,
      returnInserted: true,
    };
  }

  select(columns = "*", opts?: { count?: "exact"; head?: boolean }): this {
    this.state.mode = this.state.mode === "select" ? "select" : this.state.mode;
    this.state.select = parseSelect(columns);
    if (opts?.count) this.state.countMode = opts.count;
    if (opts?.head) this.state.countHead = true;
    return this;
  }

  insert(values: Row | Row[]): this {
    this.state.mode = "insert";
    this.state.insertValues = values;
    return this;
  }

  update(values: Row): this {
    this.state.mode = "update";
    this.state.updateValues = values;
    return this;
  }

  upsert(values: Row | Row[], opts?: { onConflict?: string }): this {
    this.state.mode = "upsert";
    this.state.insertValues = values;
    this.state.upsertOnConflict = opts?.onConflict
      ? opts.onConflict.split(",").map((c) => c.trim())
      : ["id"];
    return this;
  }

  delete(): this {
    this.state.mode = "delete";
    return this;
  }

  eq(col: string, val: unknown): this {
    this.state.filters.push((r) => r[col] === val);
    return this;
  }

  neq(col: string, val: unknown): this {
    this.state.filters.push((r) => r[col] !== val);
    return this;
  }

  in(col: string, vals: unknown[]): this {
    const set = new Set(vals);
    this.state.filters.push((r) => set.has(r[col] as never));
    return this;
  }

  gte(col: string, val: number | string): this {
    this.state.filters.push((r) => (r[col] as number | string) >= val);
    return this;
  }

  lte(col: string, val: number | string): this {
    this.state.filters.push((r) => (r[col] as number | string) <= val);
    return this;
  }

  gt(col: string, val: number | string): this {
    this.state.filters.push((r) => (r[col] as number | string) > val);
    return this;
  }

  lt(col: string, val: number | string): this {
    this.state.filters.push((r) => (r[col] as number | string) < val);
    return this;
  }

  is(col: string, val: unknown): this {
    this.state.filters.push((r) => r[col] === val);
    return this;
  }

  like(col: string, pattern: string): this {
    const regex = new RegExp("^" + pattern.replace(/%/g, ".*").replace(/_/g, ".") + "$", "i");
    this.state.filters.push((r) => regex.test(String(r[col] ?? "")));
    return this;
  }

  ilike(col: string, pattern: string): this {
    return this.like(col, pattern);
  }

  or(_expr: string): this {
    // Best-effort: skip — local mock doesn't parse OR expressions.
    return this;
  }

  not(col: string, op: string, val: unknown): this {
    if (op === "is" && val === null) {
      this.state.filters.push((r) => r[col] != null);
    } else if (op === "eq") {
      this.state.filters.push((r) => r[col] !== val);
    } else {
      this.state.filters.push((r) => r[col] !== val);
    }
    return this;
  }

  contains(col: string, vals: unknown[]): this {
    this.state.filters.push((r) => {
      const v = r[col];
      if (!Array.isArray(v)) return false;
      return vals.every((x) => v.includes(x));
    });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }): this {
    this.state.orderBy = { col, asc: opts?.ascending !== false };
    return this;
  }

  limit(n: number): this {
    this.state.limit = n;
    return this;
  }

  range(from: number, to: number): this {
    this.state.range = { from, to };
    return this;
  }

  single(): this {
    this.state.expect = "single";
    return this;
  }

  maybeSingle(): this {
    this.state.expect = "maybeSingle";
    return this;
  }

  private fetchRows(): Row[] {
    const all = (getDB()[this.state.table] as unknown as Row[]) ?? [];
    const filtered = this.state.filters.length
      ? all.filter((r) => this.state.filters.every((f) => f(r)))
      : all.slice();
    if (this.state.orderBy) {
      const { col, asc } = this.state.orderBy;
      filtered.sort((a, b) => {
        const av = a[col];
        const bv = b[col];
        if (av == null && bv == null) return 0;
        if (av == null) return asc ? -1 : 1;
        if (bv == null) return asc ? 1 : -1;
        if (av < bv) return asc ? -1 : 1;
        if (av > bv) return asc ? 1 : -1;
        return 0;
      });
    }
    let result = filtered;
    if (this.state.range) {
      result = result.slice(this.state.range.from, this.state.range.to + 1);
    }
    if (this.state.limit != null) {
      result = result.slice(0, this.state.limit);
    }
    return result;
  }

  private async execute(): Promise<{ data: T | null; error: { message: string } | null; count?: number }> {
    try {
      switch (this.state.mode) {
        case "select": {
          const rows = this.fetchRows();
          const shaped = rows.map((r) => shapeRow(r, this.state.table, this.state.select));
          const count = this.state.countMode === "exact" ? rows.length : undefined;
          if (this.state.countHead) {
            return { data: null as unknown as T, error: null, count };
          }
          if (this.state.expect === "single") {
            if (shaped.length !== 1) {
              return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned" } };
            }
            return { data: shaped[0] as T, error: null, count };
          }
          if (this.state.expect === "maybeSingle") {
            return { data: (shaped[0] ?? null) as T | null, error: null, count };
          }
          return { data: shaped as unknown as T, error: null, count };
        }

        case "insert": {
          const inserted: Row[] = [];
          const values = Array.isArray(this.state.insertValues)
            ? this.state.insertValues
            : [this.state.insertValues!];
          mutate((db) => {
            const tbl = db[this.state.table] as unknown as Row[];
            for (const v of values) {
              const row: Row = { id: uuid(), created_at: nowISO(), ...v };
              tbl.push(row);
              inserted.push(row);
            }
          });
          const shaped = inserted.map((r) => shapeRow(r, this.state.table, this.state.select));
          if (this.state.expect === "single") return { data: shaped[0] as T, error: null };
          return { data: shaped as unknown as T, error: null };
        }

        case "update": {
          const updated: Row[] = [];
          mutate((db) => {
            const tbl = db[this.state.table] as unknown as Row[];
            for (let i = 0; i < tbl.length; i++) {
              if (this.state.filters.every((f) => f(tbl[i]))) {
                tbl[i] = { ...tbl[i], ...this.state.updateValues };
                updated.push(tbl[i]);
              }
            }
          });
          const shaped = updated.map((r) => shapeRow(r, this.state.table, this.state.select));
          if (this.state.expect === "single") return { data: (shaped[0] ?? null) as T | null, error: null };
          return { data: shaped as unknown as T, error: null };
        }

        case "upsert": {
          const inserted: Row[] = [];
          const values = Array.isArray(this.state.insertValues)
            ? this.state.insertValues
            : [this.state.insertValues!];
          const conflict = this.state.upsertOnConflict ?? ["id"];
          mutate((db) => {
            const tbl = db[this.state.table] as unknown as Row[];
            for (const v of values) {
              const existingIdx = tbl.findIndex((r) =>
                conflict.every((c) => r[c] === v[c])
              );
              if (existingIdx >= 0) {
                tbl[existingIdx] = { ...tbl[existingIdx], ...v };
                inserted.push(tbl[existingIdx]);
              } else {
                const row: Row = { id: uuid(), created_at: nowISO(), ...v };
                tbl.push(row);
                inserted.push(row);
              }
            }
          });
          const shaped = inserted.map((r) => shapeRow(r, this.state.table, this.state.select));
          if (this.state.expect === "single") return { data: shaped[0] as T, error: null };
          return { data: shaped as unknown as T, error: null };
        }

        case "delete": {
          const deleted: Row[] = [];
          mutate((db) => {
            const tbl = db[this.state.table] as unknown as Row[];
            for (let i = tbl.length - 1; i >= 0; i--) {
              if (this.state.filters.every((f) => f(tbl[i]))) {
                deleted.push(tbl[i]);
                tbl.splice(i, 1);
              }
            }
          });
          return { data: deleted as unknown as T, error: null };
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Local query failed";
      return { data: null, error: { message: msg } };
    }
  }

  then<R1 = { data: T | null; error: { message: string } | null }, R2 = never>(
    onfulfilled?: ((value: { data: T | null; error: { message: string } | null; count?: number }) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null
  ): Promise<R1 | R2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromTable(name: TableName): LocalQueryBuilder<any> {
  return new LocalQueryBuilder(name);
}

export type { DBShape };
