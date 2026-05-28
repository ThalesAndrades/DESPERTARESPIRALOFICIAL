/**
 * AdminConversionPage — `/admin/conversao`
 *
 * Análise das leads de `public.launch_waitlist`:
 *   - cards rápidos: total / hoje / últimos 7 / últimos 30 dias
 *   - breakdown por origem (waitlist hero, quiz, caption:<arquétipo>)
 *   - breakdown por utm_source e utm_campaign
 *   - timeline de inscrições nos últimos 30 dias (barras CSS)
 *   - top arquétipos do /caption
 *
 * Tudo agrupado client-side em cima do mesmo select que o /admin/waitlist
 * usa — sem nova RPC, sem dependência de chart library.
 */
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  BarChart3, Calendar, Loader2, RefreshCw, Sparkles,
  TrendingUp, Tag, Compass, Mail,
} from "lucide-react";
import type { WaitlistRow } from "@/lib/local/types";

interface EngagementRow {
  slug: string;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  complained_count: number;
  open_rate_pct: number;
  click_through_rate_pct: number;
}

const MAX_ROWS = 5000;
const DAY = 86400_000;

export default function AdminConversionPage() {
  const [rows, setRows] = useState<WaitlistRow[]>([]);
  const [engagement, setEngagement] = useState<EngagementRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: leads, error }, { data: eng }] = await Promise.all([
      supabase.from("launch_waitlist").select("*")
        .order("created_at", { ascending: false }).limit(MAX_ROWS),
      supabase.from("email_engagement_summary").select("*"),
    ]);
    if (error) {
      toast.error("Não consegui carregar as métricas.");
      setLoading(false);
      return;
    }
    setRows((leads ?? []) as WaitlistRow[]);
    setEngagement((eng ?? []) as EngagementRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const inWindow = (ms: number) => rows.filter((r) => now - new Date(r.created_at).getTime() < ms).length;
    return {
      total: rows.length,
      today: inWindow(DAY),
      last7: inWindow(7 * DAY),
      last30: inWindow(30 * DAY),
    };
  }, [rows]);

  const bySource = useMemo(() => groupCount(rows, (r) => r.source ?? "(sem origem)"), [rows]);
  const byUtmSource = useMemo(() => groupCount(rows, (r) => r.utm_source ?? "(direto)"), [rows]);
  const byUtmCampaign = useMemo(() => groupCount(rows, (r) => r.utm_campaign).filter((g) => g.key), [rows]);
  const byArchetype = useMemo(() =>
    groupCount(
      rows.filter((r) => r.source?.startsWith("caption:")),
      (r) => r.source!.replace("caption:", ""),
    )
  , [rows]);

  const timeline = useMemo(() => buildTimeline(rows, 30), [rows]);
  const maxDaily = Math.max(1, ...timeline.map((d) => d.count));

  return (
    <AdminLayout>
      <div style={{ padding: "clamp(16px,3vw,32px)" }}>
        {/* Header */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", marginBottom: 26 }}>
          <div>
            <p className="font-label" style={{ fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>
              Análise de conversões
            </p>
            <h1 className="font-display" style={{ fontSize: "clamp(26px,3.5vw,38px)", fontWeight: 300, color: "var(--text-primary)", lineHeight: 1.1 }}>
              De onde vem cada inscrita
            </h1>
          </div>
          <button onClick={load} className="btn-ghost" style={btn}>
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <>
            {/* Quick stats */}
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", marginBottom: 26 }}>
              <Stat icon={Sparkles}   label="Total"             value={stats.total} accent />
              <Stat icon={Calendar}   label="Hoje"              value={stats.today} />
              <Stat icon={Calendar}   label="Últimos 7 dias"    value={stats.last7} />
              <Stat icon={TrendingUp} label="Últimos 30 dias"   value={stats.last30} />
            </div>

            {/* Timeline */}
            <Card title="Inscrições nos últimos 30 dias" icon={BarChart3}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 140, marginTop: 8 }}>
                {timeline.map((d) => (
                  <div
                    key={d.iso}
                    title={`${d.label} · ${d.count} ${d.count === 1 ? "inscrita" : "inscritas"}`}
                    style={{
                      flex: 1, minWidth: 8,
                      height: `${(d.count / maxDaily) * 100}%`,
                      background: d.count > 0
                        ? "linear-gradient(180deg, var(--gold) 0%, rgba(198,168,112,0.45) 100%)"
                        : "rgba(198,168,112,0.10)",
                      borderRadius: 4,
                      transition: "background .2s",
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: "var(--text-faint)" }}>
                <span>{timeline[0]?.label}</span>
                <span>hoje</span>
              </div>
            </Card>

            {/* Source + UTM grids */}
            <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", marginTop: 22 }}>
              <Card title="Por origem do botão" icon={Compass}>
                <BarList items={bySource} />
              </Card>
              <Card title="Por canal (utm_source)" icon={Tag}>
                <BarList items={byUtmSource} />
              </Card>
            </div>

            <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", marginTop: 18 }}>
              {byUtmCampaign.length > 0 && (
                <Card title="Por campanha (utm_campaign)" icon={Tag}>
                  <BarList items={byUtmCampaign} />
                </Card>
              )}
              {byArchetype.length > 0 && (
                <Card title="Arquétipos descobertos no /caption" icon={Sparkles}>
                  <BarList items={byArchetype} />
                </Card>
              )}
            </div>

            {/* Engagement de email */}
            {engagement.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <Card title="Engajamento dos emails do drip" icon={Mail}>
                  <EngagementTable rows={engagement} />
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

/* ── helpers de agregação ─────────────────────────────────────────── */
interface Group { key: string; count: number; }

function groupCount<T>(items: T[], by: (r: T) => string | null | undefined): Group[] {
  const map = new Map<string, number>();
  for (const it of items) {
    const k = by(it);
    if (k == null || k === "") continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

interface TimelinePoint { iso: string; label: string; count: number; }

function buildTimeline(rows: WaitlistRow[], days: number): TimelinePoint[] {
  const bucket = new Map<string, number>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY);
    bucket.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const k = r.created_at.slice(0, 10);
    if (bucket.has(k)) bucket.set(k, (bucket.get(k) ?? 0) + 1);
  }
  return Array.from(bucket.entries()).map(([iso, count]) => ({
    iso,
    label: new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    count,
  }));
}

/* ── primitives visuais ───────────────────────────────────────────── */
function Stat({
  icon: Icon, label, value, accent,
}: {
  icon: React.ElementType; label: string; value: number; accent?: boolean;
}) {
  return (
    <div style={{
      padding: 18,
      background: accent ? "rgba(198,168,112,0.07)" : "var(--bg-elevated)",
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

function Card({
  title, icon: Icon, children,
}: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div style={{
      padding: "20px 22px",
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 14,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <Icon size={14} style={{ color: "var(--gold)" }} />
        <p className="font-label" style={{ fontSize: 10, letterSpacing: "0.20em", textTransform: "uppercase", color: "var(--text-muted)" }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function BarList({ items }: { items: Group[] }) {
  if (!items.length) return <p style={{ fontSize: 13, color: "var(--text-faint)" }}>Sem dados ainda.</p>;
  const max = Math.max(...items.map((i) => i.count));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.slice(0, 12).map((it) => (
        <div key={it.key}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {it.key}
            </span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{it.count}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "rgba(198,168,112,0.10)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${(it.count / max) * 100}%`,
              background: "linear-gradient(90deg, var(--gold) 0%, var(--rose) 100%)",
              transition: "width .3s",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const SLUG_LABELS: Record<string, string> = {
  "drip-1-origem":         "1 · Por que escrevi",
  "drip-2-reconhecer":     "2 · Reconhecer",
  "drip-3-corpo":          "3 · O corpo guarda",
  "drip-4-comunidade":     "4 · Comunidade",
  "drip-5-prelancamento":  "5 · Em breve",
};

function EngagementTable({ rows }: { rows: EngagementRow[] }) {
  return (
    <div style={{ overflowX: "auto", marginTop: 6 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 540 }}>
        <thead>
          <tr style={{ color: "var(--text-muted)" }}>
            <th style={th}>Email</th>
            <th style={{ ...th, textAlign: "right" }}>Enviados</th>
            <th style={{ ...th, textAlign: "right" }}>Abertura</th>
            <th style={{ ...th, textAlign: "right" }}>Cliques</th>
            <th style={{ ...th, textAlign: "right" }}>Bounce/Spam</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.slug} style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <td style={td}>{SLUG_LABELS[r.slug] ?? r.slug}</td>
              <td style={{ ...td, textAlign: "right", color: "var(--text-primary)" }}>{r.sent_count}</td>
              <td style={{ ...td, textAlign: "right" }}>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{r.open_rate_pct}%</span>
                <span style={{ color: "var(--text-faint)", marginLeft: 6, fontSize: 11 }}>({r.opened_count})</span>
              </td>
              <td style={{ ...td, textAlign: "right" }}>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{r.click_through_rate_pct}%</span>
                <span style={{ color: "var(--text-faint)", marginLeft: 6, fontSize: 11 }}>({r.clicked_count})</span>
              </td>
              <td style={{ ...td, textAlign: "right", color: r.bounced_count + r.complained_count > 0 ? "#e07a90" : "var(--text-faint)" }}>
                {r.bounced_count + r.complained_count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left", padding: "10px 12px", fontWeight: 500, fontSize: 10,
  letterSpacing: "0.18em", textTransform: "uppercase",
};
const td: React.CSSProperties = {
  padding: "12px", color: "var(--text-secondary)", verticalAlign: "top",
};

function Loader() {
  return (
    <div style={{
      padding: 60, textAlign: "center",
      background: "var(--bg-elevated)", border: "1px dashed var(--border-soft)",
      borderRadius: 14, color: "var(--text-muted)",
    }}>
      <Loader2 size={26} className="animate-spin" style={{ marginBottom: 12, opacity: 0.6 }} />
      <p style={{ fontSize: 13 }}>Compilando os números…</p>
    </div>
  );
}

const btn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "10px 16px", fontSize: 10, letterSpacing: "0.16em",
  textTransform: "uppercase", borderRadius: 10, cursor: "pointer",
  fontFamily: "Montserrat, sans-serif", fontWeight: 500,
};
