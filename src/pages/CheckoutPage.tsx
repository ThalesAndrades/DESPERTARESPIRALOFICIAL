/**
 * CheckoutPage — Stripe-first.
 * Mostra resumo do produto, garantia, FAQ rápido. Botão único redireciona
 * para Stripe Checkout (hospedado — máxima conversão e segurança PCI).
 */
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import SpiralLogo from "@/components/layout/SpiralLogo";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { startCheckout } from "@/lib/checkout";
import { Shield, CheckCircle, ArrowLeft, Lock, Loader2, Star, Users, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { fireEventAsync } from "@/lib/sequenzy";

interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
  is_subscription?: boolean;
}

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id, slug, title, subtitle, description, price, thumbnail_url, is_subscription")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      setProduct(data ?? null);
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (search.get("canceled")) {
      toast.info("Pagamento cancelado — você pode tentar novamente.");
    }
  }, [search]);

  const handlePay = async () => {
    if (!product) return;
    setSubmitting(true);
    fireEventAsync("checkout.cta_clicked", {
      email: user?.email ?? "anon",
      properties: { product_slug: product.slug, mode: product.is_subscription ? "subscription" : "payment" },
    });
    const { ok, url, error } = await startCheckout({
      productSlug: product.slug,
      mode: product.is_subscription ? "subscription" : "payment",
    });
    if (!ok || !url) {
      toast.error(error ?? "Não foi possível abrir o pagamento. Tente novamente.");
      setSubmitting(false);
      return;
    }
    window.location.href = url;
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "var(--bg-deep)" }}>
        <Loader2 size={32} style={{ color: "var(--gold)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "var(--bg-deep)", padding: 24, textAlign: "center" }}>
        <div>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 36, fontWeight: 300, color: "var(--text-primary)" }}>
            Produto não encontrado
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 16, marginBottom: 24 }}>
            Verifique o link ou volte para o catálogo.
          </p>
          <Link to="/" style={{ color: "var(--gold)" }}>← Voltar para a home</Link>
        </div>
      </div>
    );
  }

  const formatPrice = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price);
  const isSub = !!product.is_subscription;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-deep)", color: "var(--text-primary)", fontFamily: "DM Sans, sans-serif" }}>
      <Helmet>
        <title>Finalize · {product.title} — Despertar Espiral</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Header */}
      <header style={{ padding: "18px clamp(20px,5vw,40px)", borderBottom: "1px solid rgba(198,168,112,0.10)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--text-primary)" }}>
          <SpiralLogo size={28} />
          <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18, fontWeight: 500 }}>Despertar Espiral</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 12 }}>
          <Lock size={14} /> Pagamento seguro
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(32px,6vw,64px) clamp(20px,5vw,40px)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(32px,4vw,56px)" }}>
        {/* Coluna 1 — produto */}
        <section style={{ minWidth: 0 }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", textDecoration: "none", fontSize: 13, marginBottom: 24 }}>
            <ArrowLeft size={14} /> Voltar
          </Link>

          {product.thumbnail_url && (
            <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 20, aspectRatio: "16/9", background: "rgba(255,255,255,0.04)" }}>
              <img src={product.thumbnail_url} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 10 }}>
            Você está acessando
          </p>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(28px,4vw,40px)", fontWeight: 300, lineHeight: 1.1, marginBottom: 8 }}>
            {product.title}
          </h1>
          {product.subtitle && (
            <p style={{ color: "var(--gold)", fontSize: 14, fontStyle: "italic", marginBottom: 18 }}>
              {product.subtitle}
            </p>
          )}
          {product.description && (
            <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
              {product.description}
            </p>
          )}

          {/* O que está incluso */}
          <div style={{ marginTop: 28, padding: 22, borderRadius: 14, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(198,168,112,0.12)" }}>
            <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 9, letterSpacing: "0.20em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>
              Você recebe
            </p>
            {[
              "Acesso completo a todas as aulas (vídeo + material em PDF)",
              "Acesso vitalício, sem mensalidades",
              "Comunidade privada de mulheres",
              "Certificado de conclusão",
              "Garantia incondicional de 7 dias",
            ].map((item) => (
              <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                <CheckCircle size={18} style={{ color: "var(--gold)", flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.55 }}>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Coluna 2 — checkout */}
        <aside style={{ minWidth: 0 }}>
          <div style={{ position: "sticky", top: 24, padding: "28px", borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(198,168,112,0.18)" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  {isSub ? "Assinatura mensal" : "Pagamento único"}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>BRL</span>
              </div>
              <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 44, fontWeight: 400, lineHeight: 1, color: "var(--text-primary)" }}>
                {formatPrice}
                {isSub && <span style={{ fontSize: 16, color: "var(--text-muted)", marginLeft: 8 }}>/mês</span>}
              </div>
              {!isSub && (
                <p style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)" }}>
                  ou 12× de {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price / 12)} sem juros
                </p>
              )}
            </div>

            <button
              onClick={handlePay}
              disabled={submitting}
              style={{
                width: "100%", padding: "18px",
                background: submitting ? "rgba(198,168,112,0.4)" : "var(--gold)",
                color: "#04060f", border: "none", borderRadius: 12,
                fontFamily: "Montserrat, sans-serif", fontSize: 13, fontWeight: 700,
                letterSpacing: "0.18em", textTransform: "uppercase",
                cursor: submitting ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                transition: "transform .15s ease",
                boxShadow: "0 8px 30px rgba(198,168,112,0.30)",
                minHeight: 58,
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
            >
              {submitting ? (
                <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Abrindo pagamento…</>
              ) : (
                <>Garantir minha vaga →</>
              )}
            </button>

            <p style={{ marginTop: 14, fontSize: 11, color: "var(--text-faint)", textAlign: "center", lineHeight: 1.6 }}>
              <Lock size={11} style={{ verticalAlign: "middle" }} /> Pagamento processado pelo Stripe.<br />
              PIX, cartão de crédito ou boleto.
            </p>

            <div style={{ marginTop: 22, padding: 14, borderRadius: 10, background: "rgba(140,170,150,0.10)", border: "1px solid rgba(140,170,150,0.30)", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <BadgeCheck size={20} style={{ color: "var(--sage, #8caa96)", flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Garantia de 7 dias</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Se não for o que você esperava, devolvemos 100% do valor sem perguntas.
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: "flex", justifyContent: "center", gap: 24, color: "var(--text-faint)", fontSize: 11 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Shield size={12} /> SSL</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={12} /> 4.9/5</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={12} /> +1.200 alunas</span>
          </div>
        </aside>
      </main>

      {/* CSS responsive */}
      <style>{`
        @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        @media (max-width: 800px) {
          main { grid-template-columns: 1fr !important; }
          aside > div { position: relative !important; }
        }
      `}</style>
    </div>
  );
}
