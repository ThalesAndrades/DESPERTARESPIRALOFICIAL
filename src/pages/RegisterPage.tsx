/**
 * RegisterPage — Mobile-first, theme-aware
 * Passo 1: dados + OTP | Passo 2: verificação
 */
import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import SpiralLogo from "@/components/layout/SpiralLogo";
import { LazyAuthSpiral3D as AuthSpiral3D } from "@/components/layout/LazyDecorative";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Mail, KeyRound, ChevronLeft, RefreshCw, Loader2 } from "lucide-react";

const LABEL: React.CSSProperties = {
  display: "block",
  fontFamily: "Montserrat, sans-serif",
  fontSize: "9px",
  letterSpacing: "0.20em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  marginBottom: "8px",
  fontWeight: 500,
};

type Step = "form" | "otp";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { sendOtp, verifyOtpAndRegister } = useAuth();

  const [step,          setStep]          = useState<Step>("form");
  const [form,          setForm]          = useState({ name: "", email: "", password: "", confirm: "" });
  const [otp,           setOtp]           = useState("");
  const [showPass,      setShowPass]      = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) {
      if (cooldownRef.current) { clearInterval(cooldownRef.current); cooldownRef.current = null; }
      return;
    }
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); cooldownRef.current = null; return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [resendCooldown]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error("Preencha todos os campos."); return; }
    if (form.password !== form.confirm) { toast.error("As senhas não coincidem."); return; }
    if (form.password.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres."); return; }
    setLoading(true);
    const result = await sendOtp(form.email);
    setLoading(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Código enviado! Verifique seu e-mail.");
    setOtp("");
    setResendCooldown(60);
    setStep("otp");
  };

  const doVerify = async (code: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode || trimmedCode.length < 4) return;
    setLoading(true);
    // Clear any stale auth_next before registering to avoid onAuthStateChange hijacking navigation
    sessionStorage.removeItem("auth_next");
    const result = await verifyOtpAndRegister(form.email, trimmedCode, form.password, form.name);
    if (result.error) { toast.error(result.error); setLoading(false); return; }
    toast.success("Bem-vinda à espiral. ✦");
    navigate("/dashboard", { replace: true });
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    await doVerify(otp);
  };

  return (
    <>
      <Helmet>
        <title>Criar conta — Despertar Espiral</title>
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
        <div style={{ position: "relative", zIndex: 2 }}>
          <h2 className="font-display" style={{ fontSize: "clamp(28px,2.8vw,38px)", fontStyle: "italic", fontWeight: 300, lineHeight: 1.15, color: "var(--text-primary)", marginBottom: "20px" }}>
            Cada jornada começa com um primeiro passo.
          </h2>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.88, marginBottom: "28px" }}>
            Ao criar sua conta, você receberá um nome anônimo exclusivo para participar da comunidade com total segurança.
          </p>
          <div className="card-dark" style={{ padding: "20px 22px" }}>
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
          <Link to="/login" className="btn-ghost" style={{ padding: "8px 16px", fontSize: "9px", minHeight: "36px" }}>
            Entrar
          </Link>
        </div>

        {/* Step progress — mobile */}
        <div className="lg:hidden" style={{ padding: "16px 20px 0" }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {[1, 2].map((n) => (
              <div key={n} style={{ flex: 1, height: "3px", borderRadius: "100px", background: n <= (step === "form" ? 1 : 2) ? "var(--gold)" : "var(--border-subtle)", transition: "background 0.4s" }} />
            ))}
          </div>
          <p className="font-label" style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-faint)", marginTop: "8px" }}>
            Passo {step === "form" ? "1" : "2"} de 2
          </p>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "clamp(28px,5vw,56px) clamp(20px,6vw,48px)" }}>
          <div style={{ width: "100%", maxWidth: "390px" }}>

            {/* ── STEP 1 ── */}
            {step === "form" && (
              <>
                <p className="overline" style={{ color: "var(--gold)", marginBottom: "8px", textAlign: "center" }}>Primeiro acesso</p>
                <h1 className="font-display" style={{ fontSize: "clamp(34px,5vw,48px)", fontWeight: 300, textAlign: "center", marginBottom: "clamp(24px,4vw,32px)", color: "var(--text-primary)" }}>
                  Criar conta
                </h1>

                <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={LABEL}>Nome completo</label>
                    <input type="text" value={form.name} onChange={set("name")} placeholder="Seu nome" className="input-dark" autoComplete="name" />
                  </div>
                  <div>
                    <label style={LABEL}>E-mail</label>
                    <input type="email" value={form.email} onChange={set("email")} placeholder="seu@email.com" className="input-dark" autoComplete="email" />
                  </div>
                  <div>
                    <label style={LABEL}>Senha</label>
                    <div style={{ position: "relative" }}>
                      <input type={showPass ? "text" : "password"} value={form.password} onChange={set("password")}
                        placeholder="Mínimo 6 caracteres" className="input-dark" style={{ paddingRight: "52px" }} autoComplete="new-password" />
                      <button type="button"
                        style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer", minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
                        onClick={() => setShowPass(!showPass)} aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}>
                        {showPass ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={LABEL}>Confirmar senha</label>
                    <input type="password" value={form.confirm} onChange={set("confirm")} placeholder="Repita a senha" className="input-dark" autoComplete="new-password" />
                  </div>
                  <button type="submit" disabled={loading} className="btn-gold" style={{ width: "100%", marginTop: "4px", borderRadius: "16px", minHeight: "54px" }}>
                    {loading
                      ? "Enviando código…"
                      : <><Mail size={14} /><span>Enviar código de verificação</span></>
                    }
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
                  Já tem conta?{" "}
                  <Link to="/login" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>Entrar</Link>
                </p>
                <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-faint)", marginTop: "12px" }}>
                  <Link to="/" style={{ color: "var(--text-faint)", textDecoration: "none" }}>← Voltar ao início</Link>
                </p>
              </>
            )}

            {/* ── STEP 2: OTP ── */}
            {step === "otp" && (
              <>
                <button onClick={() => setStep("form")}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "13px", fontFamily: "DM Sans, sans-serif", padding: "0 0 24px", minHeight: "44px" }}>
                  <ChevronLeft size={16} strokeWidth={1.5} /> Voltar
                </button>

                <div style={{ textAlign: "center", marginBottom: "clamp(24px,4vw,36px)" }}>
                  <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(198,168,112,0.10)", border: "1px solid var(--border-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto clamp(16px,3vw,22px)" }}>
                    <KeyRound size={24} style={{ color: "var(--gold)" }} strokeWidth={1.5} />
                  </div>
                  <p className="overline" style={{ color: "var(--gold)", marginBottom: "8px" }}>Verificação</p>
                  <h1 className="font-display" style={{ fontSize: "clamp(30px,4vw,44px)", fontWeight: 300, color: "var(--text-primary)", marginBottom: "12px" }}>
                    Código enviado
                  </h1>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.78 }}>
                    Digite o código de verificação enviado para<br />
                    <strong style={{ color: "var(--text-primary)", fontWeight: 500 }}>{form.email}</strong>
                  </p>
                </div>

                <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={LABEL}>Código de verificação</label>
                    <input
                      type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4}
                      value={otp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setOtp(val);
                        // Auto-submit when 4th digit is typed — pass val directly to avoid stale closure
                        if (val.length === 4 && !loading) {
                          setTimeout(() => doVerify(val), 80);
                        }
                      }}
                      placeholder="• • • •" className="input-dark"
                      autoComplete="one-time-code"
                      disabled={loading}
                      style={{ textAlign: "center", fontSize: "clamp(22px,5vw,30px)", letterSpacing: "0.48em", fontFamily: "Montserrat, sans-serif", fontWeight: 500, minHeight: "64px", transition: "opacity 0.2s", opacity: loading ? 0.6 : 1 }}
                      autoFocus
                    />
                    {loading && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", marginTop: "8px" }}>
                        <Loader2 size={13} style={{ color: "var(--gold)", animation: "spin 0.8s linear infinite" }} />
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Verificando…</span>
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={loading} className="btn-gold" style={{ width: "100%", borderRadius: "16px", minHeight: "54px" }}>
                    {loading ? "Verificando…" : <><span>Confirmar e criar conta</span><ArrowRight size={14} /></>}
                  </button>
                </form>

                {/* Resend + expiry info */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginTop: "20px" }}>
                  <button
                    disabled={resendCooldown > 0 || loading}
                    onClick={async () => {
                      const r = await sendOtp(form.email);
                      if (r.error) { toast.error(r.error); return; }
                      toast.success("Novo código enviado!");
                      setOtp("");
                      setResendCooldown(60);
                    }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      background: "transparent", border: "none",
                      cursor: resendCooldown > 0 || loading ? "default" : "pointer",
                      fontSize: "14px",
                      color: resendCooldown > 0 || loading ? "var(--text-faint)" : "var(--gold)",
                      padding: "10px", minHeight: "44px", fontFamily: "DM Sans, sans-serif",
                      transition: "color 0.2s",
                    }}>
                    <RefreshCw size={13} style={{ opacity: resendCooldown > 0 ? 0.45 : 0.85 }} />
                    {resendCooldown > 0
                      ? `Reenviar em ${resendCooldown}s`
                      : "Reenviar código"}
                  </button>
                  <p style={{ fontSize: "11px", color: "var(--text-faint)", lineHeight: 1.6 }}>
                    O código expira em 60 minutos.
                  </p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
