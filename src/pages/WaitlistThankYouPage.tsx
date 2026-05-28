/**
 * WaitlistThankYouPage — destino pós-captura de waitlist (/recebido).
 *
 * Aceita query params opcionais:
 *   ?archetype=mistica       → mostra card do arquétipo descoberto
 *   ?name=Maria              → personaliza saudação
 *
 * Serve também como URL alvo de conversão para o Pixel da Meta: o evento
 * Lead acontece em URL própria (não na landing), o que melhora a
 * atribuição e o algoritmo de otimização dos Ads.
 */
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowRight, Sparkles, Mail, Users } from "lucide-react";
import LandingNav from "@/components/layout/LandingNav";
import { ARCHETYPES, type Archetype } from "@/constants/captionQuiz";
import { Events, track } from "@/lib/analytics";
import { supabase } from "@/lib/supabase";

function isArchetype(v: string | null): v is Archetype {
  return !!v && Object.prototype.hasOwnProperty.call(ARCHETYPES, v);
}

export default function WaitlistThankYouPage() {
  const [params] = useSearchParams();
  const archetypeKey = params.get("archetype");
  const firstName = (params.get("name") ?? "").trim();
  const profile = isArchetype(archetypeKey) ? ARCHETYPES[archetypeKey] : null;

  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    track("view_thank_you", { surface: "waitlist", archetype: profile?.key ?? null }, "analytics");
  }, [profile]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { count: c } = await supabase
        .from("launch_waitlist")
        .select("*", { count: "exact", head: true });
      if (alive && typeof c === "number") setCount(c);
    })().catch(() => { /* count é opcional */ });
    return () => { alive = false; };
  }, []);

  const accentA = profile?.hueA ?? "#3a3018";
  const accentB = profile?.hueB ?? "#8f7440";

  return (
    <>
      <Helmet>
        <title>Recebido com carinho — Despertar Espiral</title>
        <meta name="description" content="Sua inscrição na lista de espera de Mulher Espiral foi recebida. Próximos passos pra começar a jornada." />
        <meta name="robots" content="noindex,follow" />
      </Helmet>

      <LandingNav />

      <main style={{
        minHeight: "100vh",
        background: "var(--bg-surface)",
        color: "var(--text-primary)",
        paddingTop: 68,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Orbs */}
        <div aria-hidden="true" style={{
          position: "absolute", top: "-180px", left: "-120px",
          width: 520, height: 520, borderRadius: "50%",
          background: `radial-gradient(circle, ${accentA}55 0%, transparent 70%)`,
          filter: "blur(60px)", pointerEvents: "none",
        }} />
        <div aria-hidden="true" style={{
          position: "absolute", bottom: "-200px", right: "-120px",
          width: 580, height: 580, borderRadius: "50%",
          background: `radial-gradient(circle, ${accentB}44 0%, transparent 70%)`,
          filter: "blur(70px)", pointerEvents: "none",
        }} />

        <section style={{
          maxWidth: 720, margin: "0 auto",
          padding: "clamp(40px,7vw,92px) clamp(20px,5vw,32px) clamp(80px,10vw,128px)",
          position: "relative", zIndex: 1, textAlign: "center",
        }}>
          {/* Check */}
          <div style={{
            width: 80, height: 80, margin: "0 auto 26px",
            borderRadius: "50%",
            background: "rgba(72,187,120,0.15)",
            color: "#48bb78",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CheckCircle2 size={38} strokeWidth={1.4} />
          </div>

          <p className="font-label" style={{
            fontSize: 10, letterSpacing: "0.30em", textTransform: "uppercase",
            color: "var(--gold)", marginBottom: 14,
          }}>Recebi com carinho</p>

          <h1 className="font-display text-balance" style={{
            fontSize: "clamp(32px,5.5vw,58px)", fontWeight: 300, lineHeight: 1.06,
            marginBottom: 18, letterSpacing: "-0.01em",
          }}>
            {firstName ? `Que bom te ter por aqui, ${firstName}.` : "Que bom te ter por aqui."}
          </h1>

          <p style={{
            fontSize: "clamp(15px,1.8vw,18px)", color: "var(--text-secondary)",
            lineHeight: 1.75, maxWidth: 540, margin: "0 auto 40px",
          }}>
            Sua inscrição na lista de espera de <strong style={{ color: "var(--gold)", fontWeight: 500 }}>Mulher Espiral</strong> foi
            registrada. Eu já te mandei um primeiro email — dá uma olhada no seu inbox{profile ? " com o seu arquétipo" : ""}.
          </p>

          {/* Archetype card */}
          {profile && (
            <div style={{
              maxWidth: 480, margin: "0 auto 40px",
              padding: "26px clamp(20px,4vw,30px)",
              background: `linear-gradient(135deg, ${profile.hueA}22 0%, ${profile.hueB}1a 100%)`,
              border: `1px solid ${profile.hueB}55`,
              borderRadius: 18, textAlign: "center",
            }}>
              <div style={{
                width: 64, height: 64, margin: "0 auto 14px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${profile.hueA} 0%, ${profile.hueB} 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 30, color: "rgba(255,255,255,0.95)",
                boxShadow: `0 10px 30px -8px ${profile.hueB}77`,
              }}>{profile.glyph}</div>
              <p className="font-label" style={{
                fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase",
                color: "var(--gold)", marginBottom: 6,
              }}>Seu arquétipo</p>
              <h2 className="font-display" style={{
                fontSize: "clamp(22px,3.5vw,30px)", fontWeight: 300,
                lineHeight: 1.1, marginBottom: 4,
              }}>{profile.name}</h2>
              <p style={{ fontSize: 14, fontStyle: "italic", color: "var(--text-secondary)" }}>
                {profile.tagline}
              </p>
            </div>
          )}

          {/* Próximos passos */}
          <div style={{
            maxWidth: 560, margin: "0 auto",
            textAlign: "left",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-soft)",
            borderRadius: 18,
            padding: "clamp(24px,4vw,36px)",
          }}>
            <p className="font-label" style={{
              fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase",
              color: "var(--gold)", marginBottom: 16, textAlign: "center",
            }}>Próximos passos</p>

            <Step
              icon={Mail}
              title="Confere seu e-mail"
              body="Já enviei sua mensagem de boas-vindas. Se não chegar em 5 minutos, dá uma olhada na aba de Promoções ou Spam — e me marca como contato pra não perder os próximos."
            />
            <Step
              icon={Sparkles}
              title="Salve meu contato"
              body={
                <>
                  Adicione <strong style={{ color: "var(--text-primary)", fontWeight: 500 }}>ola@despertarespiral.com</strong> nos seus contatos. As mensagens vêm com calma e cuidado, no seu ritmo.
                </>
              }
            />
            {count != null && count > 1 && (
              <Step
                icon={Users}
                title={`Você e mais ${(count - 1).toLocaleString("pt-BR")} ${count - 1 === 1 ? "mulher" : "mulheres"}`}
                body="Estamos construindo uma comunidade real, com cuidado humano. Quando o curso abrir, todas vocês recebem o convite ao mesmo tempo."
              />
            )}
          </div>

          {/* Back home */}
          <div style={{ marginTop: 36 }}>
            <Link
              to="/"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontFamily: "Montserrat, sans-serif", fontSize: 10,
                letterSpacing: "0.20em", textTransform: "uppercase",
                color: "var(--text-muted)", textDecoration: "none",
                padding: "10px 18px",
                transition: "color .2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              Voltar pra home <ArrowRight size={12} />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

function Step({
  icon: Icon, title, body,
}: {
  icon: React.ElementType;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid var(--border-subtle)" }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%",
        background: "rgba(198,168,112,0.12)", color: "var(--gold)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={15} />
      </div>
      <div>
        <p style={{ fontSize: 14.5, fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>{body}</p>
      </div>
    </div>
  );
}
