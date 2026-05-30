/**
 * AdminWaitlistPage — leads inscritos em `public.launch_waitlist`.
 *
 * Mostra: busca por nome/email, filtro por source, total + últimos 7 dias,
 * tabela responsiva (cards em mobile) e export CSV completo da seleção.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Search, Download, Loader2, RefreshCw, Inbox, Users as UsersIcon,
  Sparkles, Calendar, UserCheck, NotebookPen,
} from "lucide-react";
import type { WaitlistRow } from "@/lib/local/types";

const PAGE_SIZE = 100;

export default function AdminWaitlistPage() {
  const [rows, setRows]       = useState<WaitlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "contacted">("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("launch_waitlist")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE * 5);
    if (error) {
      toast.error("Não consegui carregar a lista. Pode tentar de novo?");
      setLoading(false);
      return;
    }
    setRows((data ?? []) as WaitlistRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sources = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.source && s.add(r.source));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
      if (statusFilter === "contacted" && !r.contacted_at) return false;
      if (statusFilter === "pending"   &&  r.contacted_at) return false;
      if (!q) return true;
      return (
        r.email.toLowerCase().includes(q) ||
        (r.name?.toLowerCase().includes(q) ?? false) ||
        (r.phone?.toLowerCase().includes(q) ?? false) ||
        (r.utm_campaign?.toLowerCase().includes(q) ?? false) ||
        (r.notes?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, search, sourceFilter, statusFilter]);

  const stats = useMemo(() => {
    const now = Date.now();
    const last7 = rows.filter((r) => now - new Date(r.created_at).getTime() < 7 * 86400_000).length;
    const last24 = rows.filter((r) => now - new Date(r.created_at).getTime() < 86400_000).length;
    return { total: rows.length, last7, last24 };
  }, [rows]);

  const exportCsv = () => {
    if (!filtered.length) {
      toast.message("Nada pra exportar nesse filtro.");
      return;
    }
    const header = [
      "created_at", "name", "email", "phone", "source", "message",
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "gclid", "fbclid", "ttclid", "referrer", "landing_path",
    ];
    const lines = [header.join(",")];
    for (const r of filtered) {
      lines.push(header.map((k) => csvCell((r as unknown as Record<string, unknown>)[k])).join(","));
    }
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exportei ${filtered.length} ${filtered.length === 1 ? "inscrita" : "inscritas"}.`);
  };

  return (
    <AdminLayout>
      <div style={{ padding: "clamp(16px,3vw,32px)" }}>
        {/* Header */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <p className="font-label" style={{ fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>
              Lista de espera
            </p>
            <h1 className="font-display" style={{ fontSize: "clamp(26px,3.5vw,38px)", fontWeight: 300, color: "var(--text-primary)", lineHeight: 1.1 }}>
              Quem está esperando o lançamento
            </h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={load} className="btn-ghost" style={btnStyle} title="Recarregar">
              <RefreshCw size={14} /> Atualizar
            </button>
            <button onClick={exportCsv} className="btn-gold" style={{ ...btnStyle, border: "none" }}>
              <Download size={14} /> Exportar CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", marginBottom: 22 }}>
          <StatCard icon={UsersIcon}  label="Total"        value={stats.total} />
          <StatCard icon={Calendar}   label="Últimos 7 dias" value={stats.last7} />
          <StatCard icon={Sparkles}   label="Últimas 24h"  value={stats.last24} accent />
        </div>

        {/* Search + filter */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <div style={{ position: "relative", flex: "1 1 240px" }}>
            <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, email, telefone ou campanha…"
              style={{
                width: "100%", padding: "11px 14px 11px 38px",
                background: "var(--bg-elevated)", color: "var(--text-primary)",
                border: "1px solid var(--border-soft)", borderRadius: 10, fontSize: 14, outline: "none",
              }}
            />
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{
              minWidth: 180, padding: "11px 14px",
              background: "var(--bg-elevated)", color: "var(--text-primary)",
              border: "1px solid var(--border-soft)", borderRadius: 10, fontSize: 14,
            }}
          >
            <option value="all">Todas as origens</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "contacted")}
            style={{
              minWidth: 180, padding: "11px 14px",
              background: "var(--bg-elevated)", color: "var(--text-primary)",
              border: "1px solid var(--border-soft)", borderRadius: 10, fontSize: 14,
            }}
          >
            <option value="all">Contactadas + pendentes</option>
            <option value="pending">Ainda não contactadas</option>
            <option value="contacted">Já contactadas</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <EmptyState icon={Loader2} label="Carregando…" spin />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Inbox} label="Nenhuma inscrita por enquanto." />
        ) : (
          <div style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 14, overflow: "hidden",
          }}>
            {/* Desktop table */}
            <div className="hidden md:block" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}>
                    <Th>Quando</Th>
                    <Th>Nome</Th>
                    <Th>Contato</Th>
                    <Th>Origem</Th>
                    <Th>Campanha</Th>
                    <Th>Mensagem</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <Td>{formatDate(r.created_at)}</Td>
                      <Td>
                        <Link to={`/admin/lead/${r.id}`} style={{ color: "var(--text-primary)", textDecoration: "none", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}>
                          {r.name ?? <span style={{ color: "var(--text-faint)" }}>—</span>}
                          {r.contacted_at && (
                            <UserCheck size={11} style={{ color: "var(--sage)" }} aria-label="Contactada" />
                          )}
                          {r.notes && (
                            <NotebookPen size={11} style={{ color: "var(--gold)" }} aria-label="Com notas" />
                          )}
                        </Link>
                      </Td>
                      <Td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <a href={`mailto:${r.email}`} style={{ color: "var(--gold)", textDecoration: "none" }}>{r.email}</a>
                          {r.phone && <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{r.phone}</span>}
                        </div>
                      </Td>
                      <Td><Badge>{r.source ?? "—"}</Badge></Td>
                      <Td>
                        {r.utm_campaign ? (
                          <span title={[r.utm_source, r.utm_medium, r.utm_campaign].filter(Boolean).join(" · ")}>
                            {r.utm_campaign}
                          </span>
                        ) : <span style={{ color: "var(--text-faint)" }}>—</span>}
                      </Td>
                      <Td>
                        {r.message ? (
                          <span style={{ color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {r.message}
                          </span>
                        ) : <span style={{ color: "var(--text-faint)" }}>—</span>}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden">
              {filtered.map((r) => (
                <Link key={r.id} to={`/admin/lead/${r.id}`} style={{ display: "block", padding: 16, borderTop: "1px solid var(--border-subtle)", textDecoration: "none", color: "inherit" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{r.name ?? r.email}</span>
                    <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{formatDate(r.created_at)}</span>
                  </div>
                  <div style={{ color: "var(--gold)", fontSize: 13 }}>{r.email}</div>
                  {r.phone && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{r.phone}</div>}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {r.source && <Badge>{r.source}</Badge>}
                    {r.utm_campaign && <Badge tone="muted">{r.utm_campaign}</Badge>}
                  </div>
                  {r.message && (
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 10, lineHeight: 1.55 }}>
                      "{r.message}"
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/* ── helpers ───────────────────────────────────────────────────────── */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

const btnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "10px 16px", fontSize: 10, letterSpacing: "0.16em",
  textTransform: "uppercase", borderRadius: 10, cursor: "pointer",
  fontFamily: "Manrope, system-ui, sans-serif", fontWeight: 500,
};

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 500, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase" }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "12px 16px", color: "var(--text-secondary)", verticalAlign: "top" }}>{children}</td>;
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "muted" }) {
  const isMuted = tone === "muted";
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px", borderRadius: 999,
      background: isMuted ? "rgba(140,140,160,0.10)" : "rgba(198,168,112,0.12)",
      color: isMuted ? "var(--text-muted)" : "var(--gold)",
      fontSize: 10.5, letterSpacing: "0.08em", fontFamily: "Manrope, system-ui, sans-serif",
      whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function StatCard({
  icon: Icon, label, value, accent,
}: {
  icon: React.ElementType; label: string; value: number; accent?: boolean;
}) {
  return (
    <div style={{
      padding: 18,
      background: accent ? "rgba(198,168,112,0.06)" : "var(--bg-elevated)",
      border: `1px solid ${accent ? "rgba(198,168,112,0.30)" : "var(--border-subtle)"}`,
      borderRadius: 14,
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: "50%",
        background: "rgba(198,168,112,0.12)", color: "var(--gold)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={16} />
      </div>
      <div>
        <p className="font-label" style={{ fontSize: 9, letterSpacing: "0.20em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>{label}</p>
        <p className="font-display" style={{ fontSize: 26, fontWeight: 300, color: "var(--text-primary)", lineHeight: 1 }}>{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, label, spin }: { icon: React.ElementType; label: string; spin?: boolean }) {
  return (
    <div style={{
      padding: 60, textAlign: "center",
      background: "var(--bg-elevated)", border: "1px dashed var(--border-soft)",
      borderRadius: 14, color: "var(--text-muted)",
    }}>
      <Icon size={26} className={spin ? "animate-spin" : ""} style={{ marginBottom: 12, opacity: 0.6 }} />
      <p style={{ fontSize: 13 }}>{label}</p>
    </div>
  );
}
