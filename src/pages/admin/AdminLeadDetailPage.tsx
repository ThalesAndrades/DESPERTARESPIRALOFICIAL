/**
 * AdminLeadDetailPage — `/admin/lead/:id`
 *
 * Detalhe de uma inscrita: dados, attribution, jobs do drip com status,
 * histórico de eventos de email (open/click/bounce). Pensado pra dar à
 * Sunyan contexto suficiente pra responder pessoalmente via WhatsApp ou
 * e-mail.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, MessageCircle, Calendar, Tag, ExternalLink,
  CheckCircle2, Clock, AlertCircle, MousePointerClick, MailOpen,
  XCircle, Loader2,
} from "lucide-react";
import type { WaitlistRow } from "@/lib/local/types";

interface DripJob {
  id: string;
  slug: string;
  send_at: string;
  sent_at: string | null;
  error_message: string | null;
  attempts: number;
  resend_email_id: string | null;
}

interface EmailEvent {
  id: string;
  event_type: string;
  click_url: string | null;
  occurred_at: string;
  resend_email_id: string | null;
}

const SLUG_LABEL: Record<string, string> = {
  "drip-1-origem":        "1 · Por que escrevi",
  "drip-2-reconhecer":    "2 · Reconhecer",
  "drip-3-corpo":         "3 · O corpo guarda",
  "drip-4-comunidade":    "4 · Comunidade",
  "drip-5-prelancamento": "5 · Em breve",
};

const EVENT_ICON: Record<string, { Icon: React.ElementType; color: string; label: string }> = {
  "email.sent":       { Icon: Clock,             color: "var(--text-muted)", label: "Saiu da fila"  },
  "email.delivered":  { Icon: CheckCircle2,      color: "var(--sage)",       label: "Entregue"      },
  "email.opened":     { Icon: MailOpen,          color: "var(--gold)",       label: "Aberto"        },
  "email.clicked":    { Icon: MousePointerClick, color: "var(--rose)",       label: "Clicou"        },
  "email.bounced":    { Icon: XCircle,           color: "#e07a90",           label: "Bounce"        },
  "email.complained": { Icon: AlertCircle,       color: "#e07a90",           label: "Spam"          },
};

export default function AdminLeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<WaitlistRow | null>(null);
  const [drips, setDrips] = useState<DripJob[]>([]);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: leadRow, error } = await supabase
        .from("launch_waitlist")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        toast.error("Não consegui carregar essa lead.");
        setLoading(false);
        return;
      }
      if (!leadRow) {
        setLoading(false);
        return;
      }
      setLead(leadRow as WaitlistRow);

      const [dripsRes, eventsRes] = await Promise.all([
        supabase.from("email_drip_jobs")
          .select("id,slug,send_at,sent_at,error_message,attempts,resend_email_id")
          .eq("lead_email", leadRow.email)
          .order("send_at", { ascending: true }),
        supabase.from("email_events")
          .select("id,event_type,click_url,occurred_at,resend_email_id")
          .eq("recipient", leadRow.email)
          .order("occurred_at", { ascending: false })
          .limit(50),
      ]);

      setDrips((dripsRes.data ?? []) as DripJob[]);
      setEvents((eventsRes.data ?? []) as EmailEvent[]);
      setLoading(false);
    })();
  }, [id]);

  const whatsappUrl = useMemo(() => {
    if (!lead?.phone) return null;
    const num = lead.phone.replace(/[^\d]/g, "");
    const text = encodeURIComponent(
      `Olá ${(lead.name ?? "").split(" ")[0] || ""}, sou Sunyan do Despertar Espiral. Vi que você se inscreveu na lista e queria te dar boas-vindas em pessoa.`,
    );
    return `https://wa.me/${num}?text=${text}`;
  }, [lead]);

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: "clamp(16px,3vw,32px)", display: "flex", alignItems: "center", gap: 10, color: "var(--text-muted)" }}>
          <Loader2 size={18} className="animate-spin" /> Carregando contexto da lead…
        </div>
      </AdminLayout>
    );
  }

  if (!lead) {
    return (
      <AdminLayout>
        <div style={{ padding: "clamp(16px,3vw,32px)", textAlign: "center", color: "var(--text-muted)" }}>
          <p style={{ fontSize: 14 }}>Lead não encontrada.</p>
          <Link to="/admin/waitlist" style={{ color: "var(--gold)", textDecoration: "none", marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft size={13} /> Voltar pra lista
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const firstName = (lead.name ?? "").split(" ")[0];

  return (
    <AdminLayout>
      <div style={{ padding: "clamp(16px,3vw,32px)", maxWidth: 1000, margin: "0 auto" }}>
        <Link to="/admin/waitlist" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 11, color: "var(--text-muted)", textDecoration: "none",
          marginBottom: 18,
        }}>
          <ArrowLeft size={13} /> Voltar pra lista de espera
        </Link>

        {/* Header */}
        <div style={{
          padding: "clamp(20px,3vw,28px)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-soft)",
          borderRadius: 16,
          marginBottom: 22,
        }}>
          <p className="font-label" style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>
            Inscrita em {formatDateTime(lead.created_at)}
          </p>
          <h1 className="font-display" style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 300, color: "var(--text-primary)", marginBottom: 14 }}>
            {lead.name ?? lead.email}
          </h1>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href={`mailto:${lead.email}`} style={actionBtn}>
              <Mail size={13} /> {lead.email}
            </a>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{
                ...actionBtn,
                background: "#25D366",
                color: "#fff",
                border: "1px solid #25D366",
              }}>
                <MessageCircle size={13} /> WhatsApp ({lead.phone})
              </a>
            )}
          </div>

          {lead.message && (
            <div style={{
              marginTop: 18, padding: 14,
              background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
              borderRadius: 10,
            }}>
              <p className="font-label" style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
                O que ela escreveu
              </p>
              <p style={{ fontSize: 14, fontStyle: "italic", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                "{lead.message}"
              </p>
            </div>
          )}
        </div>

        {/* Attribution */}
        <Section title="De onde veio" icon={Tag}>
          <Grid>
            <Field label="Origem do botão"  value={lead.source} />
            <Field label="utm_source"        value={lead.utm_source} />
            <Field label="utm_medium"        value={lead.utm_medium} />
            <Field label="utm_campaign"      value={lead.utm_campaign} />
            <Field label="utm_term"          value={lead.utm_term} />
            <Field label="utm_content"       value={lead.utm_content} />
            <Field label="gclid"             value={lead.gclid} />
            <Field label="fbclid"            value={lead.fbclid} />
            <Field label="ttclid"            value={lead.ttclid} />
            <Field label="Landing"           value={lead.landing_path} />
            <Field label="Referrer"          value={lead.referrer} truncate />
          </Grid>
          {lead.user_agent && (
            <p style={{ marginTop: 10, fontSize: 11, color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={lead.user_agent}>
              UA: {lead.user_agent}
            </p>
          )}
        </Section>

        {/* Drips */}
        <Section title="Sequência de emails (drip)" icon={Calendar}>
          {drips.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-faint)" }}>Nenhum drip enfileirado (provavelmente foi inscrita antes do trigger).</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {drips.map((d) => (
                <div key={d.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                }}>
                  <DripStatusBadge sent={!!d.sent_at} error={!!d.error_message} attempts={d.attempts} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, color: "var(--text-primary)", fontWeight: 500 }}>{SLUG_LABEL[d.slug] ?? d.slug}</p>
                    <p style={{ fontSize: 11, color: "var(--text-faint)" }}>
                      {d.sent_at ? `Enviado em ${formatDateTime(d.sent_at)}` : `Agendado pra ${formatDateTime(d.send_at)}`}
                      {d.error_message && ` · erro: ${d.error_message.slice(0, 60)}…`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Email events */}
        <Section title={`Engajamento (${events.length} eventos)`} icon={MailOpen}>
          {events.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-faint)" }}>
              Nenhum evento ainda. Aparecem aqui assim que o webhook do Resend chegar.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {events.map((e) => {
                const info = EVENT_ICON[e.event_type] ?? { Icon: Clock, color: "var(--text-muted)", label: e.event_type };
                const { Icon } = info;
                return (
                  <div key={e.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px", fontSize: 12.5,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 8,
                  }}>
                    <Icon size={13} style={{ color: info.color, flexShrink: 0 }} />
                    <span style={{ color: "var(--text-secondary)", flex: 1 }}>
                      <strong style={{ color: info.color, fontWeight: 500 }}>{info.label}</strong>
                      {e.click_url && (
                        <a href={e.click_url} target="_blank" rel="noopener noreferrer"
                          style={{ marginLeft: 10, color: "var(--rose)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <ExternalLink size={10} /> link
                        </a>
                      )}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
                      {formatDateTime(e.occurred_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </AdminLayout>
  );
}

/* ── helpers ─────────────────────────────────────────────────────── */
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

const actionBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "10px 14px", fontSize: 12,
  background: "var(--bg-surface)",
  border: "1px solid var(--border-soft)",
  borderRadius: 999,
  color: "var(--text-primary)",
  textDecoration: "none",
  fontFamily: "Inter, system-ui, sans-serif",
};

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{
      padding: "clamp(18px,2.5vw,24px)",
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 14,
      marginBottom: 18,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Icon size={14} style={{ color: "var(--gold)" }} />
        <p className="font-label" style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-muted)" }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 10,
    }}>{children}</div>
  );
}

function Field({ label, value, truncate }: { label: string; value: string | null; truncate?: boolean }) {
  return (
    <div>
      <p className="font-label" style={{ fontSize: 9, letterSpacing: "0.20em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 4 }}>{label}</p>
      <p
        style={{
          fontSize: 13, color: value ? "var(--text-primary)" : "var(--text-faint)",
          ...(truncate
            ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
            : { wordBreak: "break-word" }),
        }}
        title={truncate && value ? value : undefined}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}

function DripStatusBadge({ sent, error, attempts }: { sent: boolean; error: boolean; attempts: number }) {
  if (sent) {
    return (
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(140,170,150,0.18)", color: "var(--sage)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} title="Enviado">
        <CheckCircle2 size={14} />
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(224,122,144,0.18)", color: "#e07a90", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} title={`Erro (${attempts} tentativas)`}>
        <AlertCircle size={14} />
      </div>
    );
  }
  return (
    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(198,168,112,0.16)", color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} title="Agendado">
      <Clock size={14} />
    </div>
  );
}
