/**
 * LoginPage — Mobile-first, full theme coverage
 * Mobile: full-screen form | Desktop: split panel
 * Supports ?next= redirect param (safe open-redirect guard included)
 */
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SpiralLogo from "@/components/layout/SpiralLogo";
import { LazyAuthSpiral3D as AuthSpiral3D } from "@/components/layout/LazyDecorative";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

const LABEL: React.CSSProperties = {
  display: "block",
  fontFamily: "Manrope, system-ui, sans-serif",
  fontSize: "9px",
  letterSpacing: "0.20em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  marginBottom: "8px",
  fontWeight: 500,
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Safe open-redirect guard: only allow same-origin relative paths
  const nextPath = (() => {
    const raw = searchParams.get("next") ?? "";
    return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
  })();

  const { loginWithPassword } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Preencha todos os campos."); return; }
    setLoading(true);
    sessionStorage.removeItem("auth_next");
    const result = await loginWithPassword(email, password);
    if (result.error) { toast.error(result.error); setLoading(false); return; }
    toast.success("Bem-vinda de volta. ✦");
    navigate(nextPath, { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>Entrar — Despertar Espiral</title>
        <meta name="robots" content="noindex" />
      </Helmet>
    <div style={{ minHeight: "100dvh", display: "flex", background: "var(--bg-surface)", color: "var(--text-primary)" }}>

      {/* ── Left panel — desktop only ── */}
      <div className="hidden lg:flex" style={{
        flexDirection: "column", justifyContent: "space-between",
        width: "42%", padding: "clamp(36px,5vw,56px)",
        position: "relative", overflow: "hidden",
        background: "var(--bg-surface-2)",
        borderRight: "1px solid var(--border-subtle)",
        flexShrink: 0,
      }}>
        <AuthSpiral3D opacity={0.22} color="var(--gold)" />
        <Link to="/" style={{ textDecoration: "none", position: "relative", zIndex: 2 }}>
          <SpiralLogo variant="dark" size={34} autoTheme />
        </Link>
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: "24px" }}>
          <h2 className="font-display" style={{ fontSize: "clamp(26px,2.8vw,38px)", fontStyle: "italic", fontWeight: 300, lineHeight: 1.15, color: "var(--text-primary)" }}>
            Seu caminho de volta para si começa aqui.
          </h2>
          <div className="card-dark" style={{ padding: "clamp(16px,2.5vw,22px)" }}>
            <p className="font-label" style={{ fontSize: "9px", color: "var(--gold)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "10px" }}>
              Método Espiral
            </p>
            <p className="font-display" style={{ fontSize: "16px", color: "var(--text-secondary)", fontStyle: "italic", fontWeight: 300, lineHeight: 1.68 }}>
              Um caminho de volta para si, no seu ritmo.
            </p>
          </div>
        </div>
        <p className="font-label" style={{ fontSize: "9px", letterSpacing: "0.28em", color: "var(--text-faint)", textTransform: "uppercase", position: "relative", zIndex: 2 }}>DESPERTAR ESPIRAL</p>
      </div>

      {/* ── Form panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden auto", minWidth: 0 }}>

        {/* Mobile sticky header */}
        <div className="lg:hidden" style={{
          padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
          position: "sticky", top: 0, zIndex: 20,
        }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <SpiralLogo variant="dark" size={26} autoTheme />
          </Link>
          <Link to="/register" className="btn-ghost" style={{ padding: "8px 16px", fontSize: "9px", minHeight: "36px" }}>
            Criar conta
          </Link>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "clamp(28px,6vw,60px) clamp(20px,6vw,48px)" }}>
          <div style={{ width: "100%", maxWidth: "390px" }}>
            <p className="overline" style={{ color: "var(--gold)", marginBottom: "8px", textAlign: "center" }}>Área do membro</p>
            <h1 className="font-display" style={{ fontSize: "clamp(34px,6vw,52px)", fontWeight: 300, textAlign: "center", marginBottom: "clamp(24px,4vw,32px)", color: "var(--text-primary)" }}>
              Entrar
            </h1>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={LABEL}>E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com" className="input-dark" autoComplete="email"
                  style={{ borderRadius: "14px" }} />
              </div>

              <div>
                <label style={LABEL}>Senha</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" className="input-dark" autoComplete="current-password"
                    style={{ paddingRight: "52px", borderRadius: "14px" }} />
                  <button type="button"
                    style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer", padding: "6px", minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={() => setShowPass(!showPass)} aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}>
                    {showPass ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-2px" }}>
                <Link to="/forgot-password" className="font-label"
                  style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", textDecoration: "none", padding: "6px 0", minHeight: "36px", display: "inline-flex", alignItems: "center" }}>
                  Esqueci a senha
                </Link>
              </div>

              <button type="submit" disabled={loading} className="btn-gold"
                style={{ width: "100%", marginTop: "2px", borderRadius: "16px", minHeight: "54px" }}>
                {loading ? "Entrando…" : <><span>Entrar com e-mail</span><ArrowRight size={14} /></>}
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-faint)", marginTop: "14px", lineHeight: 1.7 }}>
              Ao continuar, você concorda com{" "}
              <Link to="/termos" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
                Termos de Uso
              </Link>{" "}
              e{" "}
              <Link to="/privacidade" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
                Política de Privacidade
              </Link>
              .
            </p>

            <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text-muted)", marginTop: "clamp(20px,3vw,28px)", lineHeight: 1.7 }}>
              Não tem conta?{" "}
              <Link to="/register" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
                Criar conta gratuita
              </Link>
            </p>

            <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-faint)", marginTop: "12px" }}>
              <Link to="/" style={{ color: "var(--text-faint)", textDecoration: "none" }}>← Voltar ao início</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
