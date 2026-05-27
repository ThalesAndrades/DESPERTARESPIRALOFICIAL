/**
 * WaitlistModal — captura interessadas no pré-lançamento de Mulher Espiral.
 * Insere em public.launch_waitlist (insert público pela RLS).
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { fireEventAsync } from "@/lib/sequenzy";
import { Events, getAttribution, sha256, track } from "@/lib/analytics";
import { Loader2, X, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  source?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function WaitlistModal({ open, onClose, source = "landing" }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(false);
      track(Events.OpenWaitlist, { source }, "analytics");
      const t = setTimeout(() => firstInputRef.current?.focus(), 60);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(t);
        window.removeEventListener("keydown", onKey);
        document.body.style.overflow = "";
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanMessage = message.trim();

    if (!cleanName) {
      setError("Conte como podemos te chamar.");
      return;
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      setError("Confira o e-mail, parece inválido.");
      return;
    }

    setLoading(true);
    const attribution = getAttribution();
    const payload = {
      email: cleanEmail,
      name: cleanName,
      phone: cleanPhone || null,
      message: cleanMessage || null,
      source,
    };

    const { error: insertError } = await supabase
      .from("launch_waitlist")
      .insert(payload);

    if (insertError && !/duplicate|unique/i.test(insertError.message ?? "")) {
      setLoading(false);
      track(Events.FormError, { form: "waitlist", code: insertError.code ?? "unknown" }, "analytics");
      setError("Não conseguimos registrar agora. Tente novamente em instantes.");
      return;
    }

    fireEventAsync("waitlist.joined", {
      email: cleanEmail,
      firstName: cleanName.split(" ")[0],
      properties: {
        source,
        ...attribution,
      },
    });

    // Tracking: lead + waitlist (analytics e marketing pixels).
    const emailHash = await sha256(cleanEmail);
    const baseParams = {
      source,
      content_name: "Mulher Espiral — Pré-lançamento",
      content_category: "waitlist",
      currency: "BRL",
      value: 0,
      em_hash: emailHash,
      ...attribution,
    };
    track(Events.JoinWaitlist, baseParams, "marketing");
    track(Events.GenerateLead, baseParams, "marketing");
    track(Events.Subscribe, baseParams, "marketing");

    setLoading(false);
    setSuccess(true);
  }

  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(4, 6, 15, 0.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn .2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          background: "linear-gradient(180deg, #0a0d1c 0%, #050714 100%)",
          border: "1px solid rgba(198,168,112,0.25)",
          borderRadius: 20,
          padding: "36px 30px 30px",
          position: "relative",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: 6,
            borderRadius: 6,
            display: "flex",
          }}
        >
          <X size={18} />
        </button>

        {success ? (
          <div style={{ textAlign: "center", padding: "16px 6px" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(198,168,112,0.12)",
                margin: "0 auto 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={28} style={{ color: "var(--gold)" }} />
            </div>
            <h3
              id="waitlist-title"
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: 28,
                fontWeight: 300,
                color: "var(--text-primary)",
                marginBottom: 10,
              }}
            >
              Você está na lista
            </h3>
            <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 22 }}>
              Vamos te avisar antes de qualquer pessoa quando o Mulher Espiral abrir as portas. Fique de olho no seu e-mail.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: "12px 28px",
                background: "var(--gold)",
                color: "#04060f",
                border: "none",
                borderRadius: 10,
                fontFamily: "Montserrat, sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <p
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: 10,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: 10,
              }}
            >
              Pré-lançamento
            </p>
            <h3
              id="waitlist-title"
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: 30,
                fontWeight: 300,
                color: "var(--text-primary)",
                lineHeight: 1.15,
                marginBottom: 10,
                letterSpacing: "-0.01em",
              }}
            >
              Entre em contato para o pré-lançamento
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 22 }}>
              Deixe seus dados e te avisamos primeiro quando o Mulher Espiral abrir. Sem spam.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={fieldLabel}>
                <span>Nome</span>
                <input
                  ref={firstInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="given-name"
                  placeholder="Como podemos te chamar"
                  style={inputStyle}
                />
              </label>

              <label style={fieldLabel}>
                <span>E-mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="seu@email.com"
                  style={inputStyle}
                />
              </label>

              <label style={fieldLabel}>
                <span>WhatsApp <em style={{ color: "var(--text-faint)", fontStyle: "normal" }}>(opcional)</em></span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  style={inputStyle}
                />
              </label>

              <label style={fieldLabel}>
                <span>O que te trouxe até aqui? <em style={{ color: "var(--text-faint)", fontStyle: "normal" }}>(opcional)</em></span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Conte rapidamente o que está te chamando para essa jornada"
                  style={{ ...inputStyle, resize: "vertical", minHeight: 80, fontFamily: "Inter, system-ui, sans-serif" }}
                />
              </label>

              {error && (
                <p
                  role="alert"
                  style={{
                    fontSize: 13,
                    color: "#ff8a8a",
                    background: "rgba(255,138,138,0.08)",
                    border: "1px solid rgba(255,138,138,0.25)",
                    padding: "10px 12px",
                    borderRadius: 8,
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "15px 22px",
                  marginTop: 6,
                  background: "var(--gold)",
                  color: "#04060f",
                  border: "none",
                  borderRadius: 10,
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  cursor: loading ? "default" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  transition: "opacity .2s ease",
                }}
              >
                {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
                {loading ? "Enviando..." : "Quero entrar na lista"}
              </button>

              <p style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
                Ao enviar, você concorda em receber comunicações sobre o lançamento. Pode sair quando quiser.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

const fieldLabel: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontFamily: "Montserrat, sans-serif",
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(198,168,112,0.22)",
  borderRadius: 10,
  color: "var(--text-primary)",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 15,
  letterSpacing: "normal",
  textTransform: "none",
  outline: "none",
  transition: "border-color .2s ease",
};
