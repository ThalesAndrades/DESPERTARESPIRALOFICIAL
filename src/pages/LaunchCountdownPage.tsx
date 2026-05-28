/**
 * LaunchCountdownPage — `/abrir`. Página pública (fora do gate) que
 * mostra o countdown pra abertura do Mulher Espiral e oferece:
 *   - "Adicionar ao meu calendário" (.ics)
 *   - "Entrar na lista" (waitlist modal) enquanto não abriu
 *   - "Quero entrar agora →" (link de checkout) quando o countdown zera
 *
 * Data alvo: VITE_LAUNCH_DATE (ISO 8601). Sem isso, mostra uma versão
 * "em breve" que ainda capta o lead.
 */
import { useCallback, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, MessageCircle } from "lucide-react";
import LandingNav from "@/components/layout/LandingNav";
import WaitlistModal from "@/components/features/WaitlistModal";
import WhatsAppFAB from "@/components/features/WhatsAppFAB";
import { useCountdown } from "@/hooks/useCountdown";
import { downloadICS } from "@/lib/calendar";
import { Events, track } from "@/lib/analytics";

const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://despertarespiral.com";
const RAW_LAUNCH = import.meta.env.VITE_LAUNCH_DATE as string | undefined;
const CHECKOUT_URL = import.meta.env.VITE_LAUNCH_CHECKOUT_URL as string | undefined;

export default function LaunchCountdownPage() {
  const target = useMemo(() => {
    if (!RAW_LAUNCH) return null;
    const d = new Date(RAW_LAUNCH);
    return Number.isNaN(d.getTime()) ? null : d;
  }, []);

  const snap = useCountdown(target);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const formattedDate = target
    ? target.toLocaleString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      })
    : "em breve";

  const addToCalendar = useCallback(() => {
    if (!target) return;
    track("calendar_add", { surface: "launch_countdown" }, "analytics");
    downloadICS({
      start: target,
      end: new Date(target.getTime() + 7 * 86400_000),
      title: "Mulher Espiral — Abertura das vagas",
      description:
        "As portas do Mulher Espiral abrem oficialmente. Como você está na lista de espera, recebe o convite com prioridade no e-mail.",
      url: `${SITE_URL}/abrir`,
    }, "mulher-espiral-abertura.ics");
  }, [target]);

  const openCheckout = useCallback(() => {
    track(Events.BeginCheckout, { surface: "launch_countdown" }, "marketing");
    if (CHECKOUT_URL) window.location.href = CHECKOUT_URL;
    else setWaitlistOpen(true);
  }, []);

  return (
    <>
      <Helmet>
        <title>Mulher Espiral — Em breve as portas abrem</title>
        <meta
          name="description"
          content="A abertura oficial do Mulher Espiral está chegando. Veja a contagem regressiva e adicione ao seu calendário."
        />
        <meta name="robots" content="index,follow" />
      </Helmet>

      <LandingNav />

      <main
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(ellipse at top, rgba(122,94,30,0.18) 0%, transparent 55%), var(--bg-surface)",
          color: "var(--text-primary)",
          paddingTop: 68, position: "relative", overflow: "hidden",
        }}
      >
        {/* Orbs */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background:
            "radial-gradient(circle at 20% 80%, rgba(172,128,142,0.16) 0%, transparent 60%)," +
            "radial-gradient(circle at 80% 20%, rgba(198,168,112,0.16) 0%, transparent 60%)",
          filter: "blur(40px)",
        }} />

        <section
          style={{
            maxWidth: 880, margin: "0 auto",
            padding: "clamp(48px,8vw,108px) clamp(20px,5vw,32px) clamp(80px,10vw,128px)",
            position: "relative", zIndex: 1, textAlign: "center",
          }}
        >
          <p
            className="font-label"
            style={{
              fontSize: 10, letterSpacing: "0.30em", textTransform: "uppercase",
              color: "var(--gold)", marginBottom: 18,
            }}
          >
            Pré-lançamento · Mulher Espiral
          </p>

          <h1
            className="font-display text-balance"
            style={{
              fontSize: "clamp(36px,7vw,82px)", fontWeight: 300, lineHeight: 1.04,
              letterSpacing: "-0.02em", marginBottom: 22,
            }}
          >
            As portas se abrem em…
          </h1>

          {snap && !snap.finished && (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0,1fr))",
                gap: "clamp(8px,2vw,18px)",
                maxWidth: 640, margin: "0 auto clamp(32px,4vw,48px)",
              }}>
                <CountCell value={snap.days}    label="dias" />
                <CountCell value={snap.hours}   label="horas" />
                <CountCell value={snap.minutes} label="minutos" />
                <CountCell value={snap.seconds} label="segundos" />
              </div>

              <p style={{
                fontSize: "clamp(14px,1.7vw,16px)", color: "var(--text-secondary)",
                lineHeight: 1.7, maxWidth: 520, margin: "0 auto 30px",
              }}>
                A abertura oficial será em <strong style={{ color: "var(--gold)", fontWeight: 500 }}>{formattedDate}</strong> (horário de Brasília).
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={addToCalendar}
                  className="btn-outline-gold"
                  style={{ minHeight: 52, padding: "0 26px", display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                  <Calendar size={14} /> Adicionar ao calendário
                </button>
                <button
                  type="button"
                  onClick={() => setWaitlistOpen(true)}
                  className="btn-gold"
                  style={{ minHeight: 52, padding: "0 26px", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                  Entrar na lista <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}

          {snap?.finished && (
            <>
              <div style={{
                width: 96, height: 96, margin: "0 auto 22px",
                borderRadius: "50%",
                background: "rgba(198,168,112,0.16)",
                color: "var(--gold)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span className="font-display" style={{ fontSize: 42, fontWeight: 300 }}>✦</span>
              </div>
              <h2 className="font-display" style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 300, marginBottom: 14 }}>
                As portas estão abertas.
              </h2>
              <p style={{ fontSize: "clamp(14px,1.7vw,16px)", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 30px" }}>
                Você que entrou na lista tem prioridade nas vagas. Entrar agora garante o seu lugar e a condição especial de pré-venda.
              </p>
              <button
                type="button"
                onClick={openCheckout}
                className="btn-gold"
                style={{ minHeight: 56, padding: "0 32px", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10 }}
              >
                {CHECKOUT_URL ? "Quero entrar agora" : "Entrar na lista prioritária"} <ArrowRight size={14} />
              </button>
            </>
          )}

          {!snap && (
            <>
              <p style={{
                fontSize: "clamp(15px,1.8vw,18px)", color: "var(--text-secondary)",
                lineHeight: 1.7, maxWidth: 520, margin: "0 auto 30px",
              }}>
                A data de abertura está sendo definida. Entra na lista e eu te aviso antes de qualquer pessoa.
              </p>
              <button
                type="button"
                onClick={() => setWaitlistOpen(true)}
                className="btn-gold"
                style={{ minHeight: 52, padding: "0 26px", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                Entrar na lista <ArrowRight size={14} />
              </button>
            </>
          )}

          {/* Recurso secundário: link sutil pra WhatsApp */}
          <p style={{ marginTop: 36, fontSize: 12, color: "var(--text-faint)" }}>
            Dúvidas? <Link to="/caption" style={{ color: "var(--gold)", textDecoration: "none" }}>
              Faça o teste do Poder Feminino
            </Link> enquanto espera <MessageCircle size={10} style={{ verticalAlign: "middle", marginLeft: 4 }} />
          </p>
        </section>
      </main>

      <WaitlistModal open={waitlistOpen} source="abrir" onClose={() => setWaitlistOpen(false)} />
      <WhatsAppFAB surface="landing" />
    </>
  );
}

function CountCell({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");
  return (
    <div
      style={{
        padding: "clamp(14px,2.5vw,24px) clamp(8px,2vw,16px)",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-soft)",
        borderRadius: 16,
        boxShadow: "0 8px 30px -10px rgba(0,0,0,0.35)",
      }}
    >
      <p
        className="font-display"
        style={{
          fontSize: "clamp(34px,6vw,68px)", fontWeight: 300, lineHeight: 1,
          color: "var(--text-primary)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {display}
      </p>
      <p
        className="font-label"
        style={{
          fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase",
          color: "var(--text-muted)", marginTop: 8,
        }}
      >
        {label}
      </p>
    </div>
  );
}
