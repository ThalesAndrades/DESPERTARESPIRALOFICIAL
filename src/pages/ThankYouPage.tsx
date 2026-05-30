/**
 * ThankYouPage — pós-checkout do Stripe.
 *
 * URL: /obrigado?session_id={CHECKOUT_SESSION_ID}
 *
 * Tenta resolver o pedido pela `stripe_session_id` (webhook do Stripe
 * atualiza o status para `paid` em background). Faz polling curto
 * caso o webhook ainda não tenha chegado.
 */
import { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import SpiralLogo from "@/components/layout/SpiralLogo";
import { supabase, isRealBackend } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { fireEventAsync } from "@/lib/sequenzy";
import { CheckCircle2, Loader2, ArrowRight, Sparkles } from "lucide-react";

interface OrderState {
  id: string;
  status: "pending" | "paid" | "failed" | "refunded" | "canceled";
  amount: number;
  product_title?: string | null;
  product_slug?: string | null;
  email: string;
}

export default function ThankYouPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const isLocal = params.get("local") === "1" || !isRealBackend;
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderState | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    if (!sessionId) return;
    if (isLocal) {
      setOrder({ id: sessionId, status: "paid", amount: 0, product_title: null, product_slug: null, email: user?.email ?? "demo@demo.com" });
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("orders")
      .select("id, status, amount, email, products(title, slug)")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = (data as any).products;
      setOrder({
        id: data.id,
        status: data.status,
        amount: Number(data.amount),
        product_title: p?.title ?? null,
        product_slug: p?.slug ?? null,
        email: data.email,
      });
    }
    setLoading(false);
  }, [sessionId, isLocal, user?.email]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // Polling — espera o webhook do Stripe processar (até ~20s)
  useEffect(() => {
    if (!order || order.status === "paid" || attempts >= 10) return;
    const t = setTimeout(() => {
      setAttempts(a => a + 1);
      fetchOrder();
    }, 2000);
    return () => clearTimeout(t);
  }, [order, attempts, fetchOrder]);

  useEffect(() => {
    if (order?.status === "paid") {
      fireEventAsync("checkout.success", {
        email: order.email,
        properties: { product_slug: order.product_slug ?? "", amount: order.amount },
      });
    }
  }, [order?.status, order]);

  const isPaid = order?.status === "paid" || isLocal;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-deep)", color: "var(--text-primary)", fontFamily: "Lora, Georgia, serif" }}>
      <Helmet>
        <title>Obrigada · Despertar Espiral</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header style={{ padding: "20px clamp(20px,5vw,40px)" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--text-primary)" }}>
          <SpiralLogo size={28} />
          <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18 }}>Despertar Espiral</span>
        </Link>
      </header>

      <main style={{ maxWidth: 580, margin: "0 auto", padding: "clamp(40px,8vw,80px) clamp(20px,5vw,40px)", textAlign: "center" }}>
        {loading ? (
          <Loader2 size={32} style={{ color: "var(--gold)", animation: "spin 1s linear infinite" }} />
        ) : isPaid ? (
          <>
            <div style={{
              width: 88, height: 88, borderRadius: "50%",
              background: "rgba(140,170,150,0.18)", border: "2px solid rgba(140,170,150,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px", animation: "bounceScale 0.6s cubic-bezier(.34,1.56,.64,1) both",
            }}>
              <CheckCircle2 size={42} style={{ color: "#8caa96" }} strokeWidth={1.5} />
            </div>

            <p style={{ fontFamily: "Manrope, system-ui, sans-serif", fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>
              Pagamento confirmado
            </p>

            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(36px,5.5vw,56px)", fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.01em", marginBottom: 18 }}>
              Bem-vinda ao<br /><em style={{ color: "var(--gold)" }}>{order?.product_title ?? "Despertar Espiral"}</em>
            </h1>

            <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 28px" }}>
              Acabamos de receber sua compra. Em instantes você receberá um email de boas-vindas
              com seu acesso. Se ainda não criou sua conta, faça login com o mesmo email da compra.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 360, margin: "0 auto" }}>
              <Link to="/dashboard" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "17px 32px",
                background: "var(--gold)", color: "#04060f",
                borderRadius: 12, textDecoration: "none",
                fontFamily: "Manrope, system-ui, sans-serif", fontSize: 12, fontWeight: 700,
                letterSpacing: "0.18em", textTransform: "uppercase",
                boxShadow: "0 8px 30px rgba(198,168,112,0.30)",
              }}>
                <Sparkles size={15} /> Ir para meu painel
              </Link>

              {!user && (
                <Link to={`/login?next=/dashboard`} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: 14, color: "var(--text-muted)", textDecoration: "none",
                  fontFamily: "Manrope, system-ui, sans-serif", fontSize: 10,
                  letterSpacing: "0.18em", textTransform: "uppercase",
                  border: "1px solid rgba(198,168,112,0.25)", borderRadius: 12,
                }}>
                  Entrar com email da compra <ArrowRight size={12} />
                </Link>
              )}
            </div>

            <p style={{ marginTop: 32, fontSize: 12, color: "var(--text-faint)" }}>
              Não recebeu o email em 5 minutos? Verifique a caixa de spam ou
              {" "}<a href="mailto:contato@despertarespiral.com" style={{ color: "var(--gold)" }}>fale com a gente</a>.
            </p>
          </>
        ) : order?.status === "pending" ? (
          <>
            <Loader2 size={48} style={{ color: "var(--gold)", animation: "spin 1s linear infinite", margin: "0 auto 24px" }} />
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 36, fontWeight: 300, marginBottom: 14 }}>
              Aguardando confirmação…
            </h1>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
              Seu pedido está sendo processado. Em segundos o status atualiza.<br />
              Se preferir, você pode fechar essa página — enviaremos um email assim que tudo estiver pronto.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 36, fontWeight: 300, marginBottom: 14 }}>
              Não conseguimos confirmar
            </h1>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 22 }}>
              Se você foi cobrada, em alguns minutos o status atualiza por aqui. Caso o problema persista,
              entre em contato.
            </p>
            <Link to="/" style={{ color: "var(--gold)" }}>Voltar para a home</Link>
          </>
        )}
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        @keyframes bounceScale { 0% { transform: scale(0.7); opacity: 0; } 60% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
