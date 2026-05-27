/**
 * ConsentBanner — banner LGPD que pergunta ao usuário sobre cookies de
 * analytics/marketing. Aparece uma vez (até decidir) e expõe um botão flutuante
 * de preferências para revisar depois.
 */
import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import {
  acceptAll, rejectAll, setConsent, getConsent, hasDecided,
  consentRequired, onConsentChange,
} from "@/lib/analytics";

export default function ConsentBanner() {
  const [show, setShow] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    if (!consentRequired()) return;
    if (!hasDecided()) setShow(true);
    const off = onConsentChange(() => setShow(!hasDecided()));
    return () => off();
  }, []);

  if (!show) return null;

  const handleAcceptAll = () => { acceptAll(); setShow(false); };
  const handleReject    = () => { rejectAll(); setShow(false); };
  const handleSave      = () => {
    setConsent({ analytics, marketing });
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Preferências de cookies"
      style={{
        position: "fixed",
        left: 16, right: 16, bottom: 16,
        zIndex: 150,
        maxWidth: 560, margin: "0 auto",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-soft)",
        borderRadius: 18,
        padding: "18px 18px 16px",
        boxShadow: "0 20px 60px -10px rgba(0,0,0,0.5)",
        animation: "consentSlideIn .35s cubic-bezier(.16,1,.3,1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: details ? 10 : 14 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(198,168,112,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--gold)", flexShrink: 0,
        }}>
          <Cookie size={16} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: "Montserrat, sans-serif", fontSize: 10,
            letterSpacing: "0.20em", textTransform: "uppercase",
            color: "var(--gold)", marginBottom: 4,
          }}>Antes de entrar</p>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Usamos cookies pra entender o que está funcionando aqui e pra te oferecer uma experiência
            mais cuidada. Você escolhe o que aceitar — e pode mudar de ideia a qualquer momento.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReject}
          aria-label="Recusar e fechar"
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: "transparent", border: "none",
            color: "var(--text-muted)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>

      {details && (
        <div style={{ display: "grid", gap: 10, marginBottom: 14, padding: "12px 12px 10px", background: "var(--bg-surface)", borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
          <CookieRow
            label="Essenciais"
            description="O básico pro site funcionar — sempre ativo."
            checked
            disabled
            onChange={() => { /* sempre ativo */ }}
          />
          <CookieRow
            label="Medição anônima"
            description="Pra eu saber o que está ressoando aqui (Google Analytics)."
            checked={analytics}
            onChange={setAnalytics}
          />
          <CookieRow
            label="Conteúdo direcionado"
            description="Pra te encontrar com conteúdo que faz sentido nas redes (Meta, TikTok)."
            checked={marketing}
            onChange={setMarketing}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleAcceptAll}
          className="btn-gold"
          style={{ flex: 1, minWidth: 120, fontSize: 10, padding: "11px 16px", border: "none", cursor: "pointer" }}
        >Aceitar tudo</button>
        <button
          type="button"
          onClick={details ? handleSave : () => setDetails(true)}
          style={{
            flex: 1, minWidth: 120,
            padding: "11px 16px",
            background: "transparent",
            border: "1px solid var(--border-soft)",
            color: "var(--text-secondary)",
            fontFamily: "Montserrat, sans-serif", fontSize: 10,
            letterSpacing: "0.18em", textTransform: "uppercase",
            borderRadius: 10, cursor: "pointer",
            transition: "border-color .2s, color .2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--gold)";
            e.currentTarget.style.color = "var(--gold)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-soft)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          {details ? "Salvar" : "Personalizar"}
        </button>
      </div>

      <style>{`
        @keyframes consentSlideIn {
          from { opacity: 0; transform: translateY(20px) }
          to   { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </div>
  );
}

function CookieRow({
  label, description, checked, disabled, onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.7 : 1,
    }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        style={{ marginTop: 3, accentColor: "var(--gold)", width: 16, height: 16, flexShrink: 0 }}
      />
      <span>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)", display: "block" }}>{label}</span>
        <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{description}</span>
      </span>
    </label>
  );
}

/* Reabrir preferências (chamável de fora). Útil futuramente. */
export function reopenConsentBanner() {
  const evt = new CustomEvent("espiral.openConsent");
  window.dispatchEvent(evt);
}
