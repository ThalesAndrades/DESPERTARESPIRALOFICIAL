/**
 * PricingSection — bloco de pricing para a landing.
 * Lista produtos ativos com CTA "Comprar agora" que vai pro checkout Stripe.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Sparkles, Loader2 } from "lucide-react";

interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
}

const HIGHLIGHTS = ["Acesso vitalício", "Certificado", "Comunidade incluída", "Garantia 7 dias"];

export default function PricingSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id, slug, title, subtitle, description, price, thumbnail_url")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      setProducts(data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <Loader2 size={28} style={{ color: "var(--gold)", animation: "spin 1s linear infinite" }} />
      </section>
    );
  }

  if (!products.length) return null;

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <section style={{ padding: "clamp(60px,10vw,120px) clamp(20px,5vw,40px)", background: "var(--bg-deep)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>
            Investimento
          </p>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 300, lineHeight: 1.1, color: "var(--text-primary)", marginBottom: 14, letterSpacing: "-0.01em" }}>
            Escolha sua <em style={{ color: "var(--gold)" }}>jornada</em>
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 540, margin: "0 auto" }}>
            Pagamento único, sem mensalidades. Acesso vitalício e garantia de 7 dias.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
          gap: 24,
          maxWidth: products.length === 1 ? 480 : "100%",
          margin: "0 auto",
        }}>
          {products.map((p, idx) => {
            const isFeatured = idx === 0;
            return (
              <article key={p.id} style={{
                position: "relative",
                background: isFeatured ? "linear-gradient(180deg, rgba(198,168,112,0.10) 0%, rgba(198,168,112,0.04) 100%)" : "rgba(255,255,255,0.03)",
                border: isFeatured ? "1.5px solid var(--gold)" : "1px solid rgba(198,168,112,0.18)",
                borderRadius: 18,
                padding: 28,
                transition: "transform .2s ease",
                display: "flex", flexDirection: "column",
              }}>
                {isFeatured && (
                  <span style={{
                    position: "absolute", top: -12, left: 24,
                    padding: "5px 14px", background: "var(--gold)", color: "#04060f",
                    fontFamily: "Montserrat, sans-serif", fontSize: 9, fontWeight: 700,
                    letterSpacing: "0.18em", textTransform: "uppercase", borderRadius: 100,
                  }}>
                    <Sparkles size={10} style={{ marginRight: 4, verticalAlign: -1 }} /> Mais procurado
                  </span>
                )}

                <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, fontWeight: 400, marginBottom: 6, color: "var(--text-primary)" }}>
                  {p.title}
                </h3>
                {p.subtitle && (
                  <p style={{ fontSize: 13, color: "var(--gold)", fontStyle: "italic", marginBottom: 18 }}>
                    {p.subtitle}
                  </p>
                )}

                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 38, fontWeight: 400, color: "var(--text-primary)", lineHeight: 1 }}>
                    {fmt(p.price)}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    ou 12× de {fmt(p.price / 12)} sem juros
                  </p>
                </div>

                {p.description && (
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 18 }}>
                    {p.description}
                  </p>
                )}

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", flex: 1 }}>
                  {HIGHLIGHTS.map((h) => (
                    <li key={h} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, fontSize: 14 }}>
                      <CheckCircle2 size={16} style={{ color: "var(--gold)", flexShrink: 0 }} />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/checkout/${p.slug}`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "16px 24px",
                    background: isFeatured ? "var(--gold)" : "transparent",
                    color: isFeatured ? "#04060f" : "var(--gold)",
                    border: isFeatured ? "none" : "1.5px solid var(--gold)",
                    borderRadius: 10, textDecoration: "none",
                    fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.18em", textTransform: "uppercase",
                    transition: "all .2s ease",
                    boxShadow: isFeatured ? "0 8px 30px rgba(198,168,112,0.30)" : "none",
                  }}
                >
                  Quero começar agora →
                </Link>
              </article>
            );
          })}
        </div>

        <p style={{ marginTop: 40, textAlign: "center", fontSize: 12, color: "var(--text-faint)" }}>
          🔒 Pagamento processado com segurança pelo Stripe · PIX, cartão e boleto · Garantia incondicional de 7 dias
        </p>
      </div>
    </section>
  );
}
