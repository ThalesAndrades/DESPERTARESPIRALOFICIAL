/**
 * AdminAccessButton — botão "?" discreto no footer.
 * Abre um modal pedindo código de acesso. Código correto libera o gate
 * e leva ao /login. Em DEV o botão também aparece (atalho de teste).
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, X } from "lucide-react";
import { tryOpenGate } from "@/lib/launchGate";

export default function AdminAccessButton() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    } else {
      setCode("");
      setError(null);
    }
  }, [open]);

  const submit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (tryOpenGate(code)) {
      setOpen(false);
      navigate("/login");
    } else {
      setError("Código inválido.");
    }
  }, [code, navigate]);

  return (
    <>
      <button
        type="button"
        aria-label="Acesso administrativo"
        onClick={() => setOpen(true)}
        style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "transparent",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-faint)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", padding: 0,
          opacity: 0.5, transition: "opacity .2s, color .2s, border-color .2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.color = "var(--gold)";
          e.currentTarget.style.borderColor = "var(--gold)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.5";
          e.currentTarget.style.color = "var(--text-faint)";
          e.currentTarget.style.borderColor = "var(--border-subtle)";
        }}
      >
        <HelpCircle size={14} strokeWidth={1.4} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Acesso administrativo"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(8,10,18,0.78)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, animation: "fadeInOverlay .18s ease",
          }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            style={{
              width: "min(380px, 100%)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 18,
              padding: "26px 24px 22px",
              boxShadow: "0 20px 60px -10px rgba(0,0,0,0.5)",
              animation: "popIn .22s cubic-bezier(.16,1,.3,1)",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              style={{
                position: "absolute", top: 10, right: 10,
                width: 32, height: 32, borderRadius: 8,
                background: "transparent", border: "none",
                color: "var(--text-muted)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
            <p
              className="font-label"
              style={{
                fontSize: 9, letterSpacing: "0.30em", textTransform: "uppercase",
                color: "var(--gold)", marginBottom: 8,
              }}
            >Acesso restrito</p>
            <h3
              className="font-display"
              style={{ fontSize: 20, fontWeight: 300, color: "var(--text-primary)", marginBottom: 18 }}
            >Código de acesso</h3>

            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(null); }}
              placeholder="••••••"
              aria-invalid={!!error}
              style={{
                width: "100%",
                padding: "13px 14px",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 16, letterSpacing: "0.18em", textAlign: "center",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                border: `1px solid ${error ? "#c0455e" : "var(--border-soft)"}`,
                borderRadius: 10, outline: "none",
                transition: "border-color .2s",
              }}
            />
            {error && (
              <p style={{ marginTop: 8, fontSize: 12, color: "#c0455e" }}>{error}</p>
            )}

            <button
              type="submit"
              className="btn-gold"
              style={{ width: "100%", marginTop: 18, fontSize: 10, border: "none", cursor: "pointer" }}
            >
              Confirmar
            </button>
          </form>
          <style>{`
            @keyframes fadeInOverlay { from { opacity: 0 } to { opacity: 1 } }
            @keyframes popIn {
              from { opacity: 0; transform: translateY(8px) scale(.98) }
              to   { opacity: 1; transform: translateY(0) scale(1) }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
