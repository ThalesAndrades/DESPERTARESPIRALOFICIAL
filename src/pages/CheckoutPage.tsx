/**
 * CheckoutPage — durante o pré-lançamento, esta rota não realiza pagamentos.
 * Mostra o estado de pré-lançamento e leva a interessada à lista (waitlist).
 */
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import SpiralLogo from "@/components/layout/SpiralLogo";
import WaitlistModal from "@/components/features/WaitlistModal";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-deep)", color: "var(--text-primary)", fontFamily: "DM Sans, sans-serif" }}>
      <Helmet>
        <title>Pré-lançamento · Despertar Espiral</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header style={{
        padding: "18px clamp(20px,5vw,40px)",
        borderBottom: "1px solid rgba(198,168,112,0.10)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--text-primary)" }}>
          <SpiralLogo size={28} />
          <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18, fontWeight: 500 }}>Despertar Espiral</span>
        </Link>
      </header>

      <main style={{
        maxWidth: 640, margin: "0 auto",
        padding: "clamp(60px,12vw,120px) clamp(20px,5vw,32px)",
        textAlign: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(198,168,112,0.12)", border: "1px solid rgba(198,168,112,0.30)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 28px",
        }}>
          <Sparkles size={26} style={{ color: "var(--gold)" }} />
        </div>

        <p style={{
          fontFamily: "Montserrat, sans-serif", fontSize: 10, letterSpacing: "0.28em",
          textTransform: "uppercase", color: "var(--gold)", marginBottom: 14,
        }}>
          Pré-lançamento
        </p>
        <h1 style={{
          fontFamily: "Cormorant Garamond, serif", fontWeight: 300, lineHeight: 1.1,
          fontSize: "clamp(28px,5vw,46px)", color: "var(--text-primary)", marginBottom: 18,
          letterSpacing: "-0.01em",
        }}>
          As vagas ainda não estão abertas
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "clamp(15px,1.6vw,17px)", lineHeight: 1.7, marginBottom: 32 }}>
          O Mulher Espiral está em pré-lançamento. Entre na lista e te avisamos antes de qualquer pessoa quando a primeira turma abrir.
        </p>

        <button
          type="button"
          onClick={() => setWaitlistOpen(true)}
          className="btn-gold"
          style={{
            padding: "16px 32px", fontSize: 11,
            border: "none", cursor: "pointer",
            margin: "0 auto",
          }}
        >
          Entrar na lista do pré-lançamento
        </button>

        <div style={{ marginTop: 36 }}>
          <Link
            to="/"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              color: "var(--text-muted)", textDecoration: "none",
              fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
            }}
          >
            <ArrowLeft size={14} /> Voltar para a home
          </Link>
        </div>
      </main>

      <WaitlistModal
        open={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        source={slug ? `checkout:${slug}` : "checkout"}
      />
    </div>
  );
}
