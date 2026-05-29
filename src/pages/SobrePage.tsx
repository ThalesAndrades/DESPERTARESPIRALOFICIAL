/**
 * SobrePage — /sobre. Biografia rica da Sunyan + manifesto do método.
 * Pública, ranqueia pra "Sunyan Nunes" e palavras-chave do programa.
 */
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import LandingNav from "@/components/layout/LandingNav";
import WhatsAppFAB from "@/components/features/WhatsAppFAB";
import sunyanPortrait from "@/assets/sunyan-portrait.jpg";

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://despertarespiral.com";

export default function SobrePage() {
  return (
    <>
      <Helmet>
        <title>Sobre Sunyan Nunes — Despertar Espiral</title>
        <meta name="description" content="Sunyan Nunes é a criadora do método Mulher Espiral — um caminho feminino de autoconhecimento que une psicologia profunda, corpo e sagrado." />
        <link rel="canonical" href={`${SITE_URL}/sobre`} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content="Sobre Sunyan Nunes — Despertar Espiral" />
        <meta property="og:description" content="Conheça a história e o método de quem criou o Mulher Espiral." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Sunyan Nunes",
            jobTitle: "Criadora do método Mulher Espiral",
            url: `${SITE_URL}/sobre`,
            image: `${SITE_URL}/og-image.jpg`,
            sameAs: [],
            description:
              "Terapeuta e educadora feminina, criadora do método Mulher Espiral — caminho de reconexão feminina que une psicologia profunda, corpo e sagrado.",
          })}
        </script>
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
        {/* Hero */}
        <section style={{
          padding: "clamp(48px,8vw,108px) clamp(20px,5vw,32px) clamp(48px,6vw,72px)",
          maxWidth: 1080, margin: "0 auto",
        }}>
          <div className="grid lg:grid-cols-2" style={{
            gap: "clamp(28px,5vw,56px)",
            alignItems: "center",
          }}>
            <div>
              <p className="font-label" style={{
                fontSize: 10, letterSpacing: "0.30em", textTransform: "uppercase",
                color: "var(--gold)", marginBottom: 16,
              }}>Quem conduz</p>
              <h1 className="font-display text-balance" style={{
                fontSize: "clamp(36px,6vw,76px)", fontWeight: 300, lineHeight: 1.04,
                letterSpacing: "-0.02em", marginBottom: 22,
              }}>
                Eu sou <em style={{ fontStyle: "italic", color: "var(--gold)" }}>Sunyan</em>.<br />
                E você chegou aqui<br />por um motivo.
              </h1>
              <p style={{
                fontSize: "clamp(15px,1.8vw,18px)",
                color: "var(--text-secondary)",
                lineHeight: 1.85,
                maxWidth: 520,
              }}>
                Há mais de oito anos eu acompanho mulheres atravessando a espiral —
                não a metáfora bonita, mas o movimento real de quem decide parar
                de fugir de si.
              </p>
            </div>
            <div style={{
              position: "relative",
              borderRadius: "clamp(20px,2vw,28px)",
              overflow: "hidden",
              boxShadow: "0 30px 80px -20px rgba(0,0,0,0.45)",
              aspectRatio: "3 / 4",
              maxWidth: 460, marginInline: "auto",
            }}>
              <img
                src={sunyanPortrait}
                alt="Sunyan Nunes — criadora do método Mulher Espiral"
                width={720} height={960}
                loading="eager" decoding="async"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div aria-hidden="true" style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(180deg, transparent 55%, rgba(11,13,28,0.55) 100%)",
              }} />
            </div>
          </div>
        </section>

        {/* Manifesto */}
        <section style={{
          padding: "clamp(48px,6vw,80px) clamp(20px,5vw,32px)",
          background: "var(--bg-elevated)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <p className="font-label" style={{
              fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase",
              color: "var(--gold)", marginBottom: 18,
            }}>O que eu defendo</p>

            <Block>
              Acredito que <em>nenhuma mulher chega quebrada</em> — chega ecoando histórias
              que ainda não foram ouvidas. O método Mulher Espiral é o caminho que
              eu mesma precisei aos 30, e que escrevi pra outras mulheres não terem
              que reinventar sozinhas.
            </Block>

            <Block>
              O feminino se cura em <strong>camadas</strong>, não em saltos. Por isso o método
              é estruturado em 8 espirais — cada uma toca uma parte que pede
              reconhecimento, no seu ritmo. Sem urgência. Sem cobrança.
            </Block>

            <Block>
              Acredito que <em>a profundidade não exige sofrimento</em>. O que cura é
              o cuidado, não a dor. Tudo aqui foi escrito com gentileza — e
              construído com rigor: psicologia profunda, somática, ciclos
              femininos, antropologia do sagrado.
            </Block>

            <Block>
              E acredito, sobretudo, que <strong>nenhuma mulher percorre essa espiral
              sozinha</strong>. Por isso o Mulher Espiral tem uma comunidade real, com
              cuidado humano, onde você vai ser ouvida com calma.
            </Block>
          </div>
        </section>

        {/* Trajetória */}
        <section style={{
          padding: "clamp(48px,7vw,96px) clamp(20px,5vw,32px)",
          maxWidth: 880, margin: "0 auto",
        }}>
          <p className="font-label" style={{
            fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase",
            color: "var(--gold)", marginBottom: 18,
          }}>Trajetória</p>

          <h2 className="font-display text-balance" style={{
            fontSize: "clamp(28px,4vw,46px)", fontWeight: 300, lineHeight: 1.1,
            marginBottom: 32,
          }}>
            O caminho até aqui
          </h2>

          <Timeline>
            <Step year="Antes do método" title="A pergunta que abriu tudo">
              Aos 30, com a vida funcionando por fora e desconectada por dentro,
              comecei a estudar o que ainda não tinha lido nos terapeutas que tinha
              consultado: psicologia profunda, neurociência do trauma e os ciclos
              do feminino sagrado.
            </Step>
            <Step year="2018 — 2021" title="Os primeiros círculos">
              Conduzi mais de 60 círculos presenciais com pequenos grupos, sentando
              em sala com mulheres que me ensinaram a importância do espaço seguro
              real — não o discurso de espaço seguro.
            </Step>
            <Step year="2022 — 2024" title="A primeira versão de Mulher Espiral">
              Estruturei o método em 8 espirais e levei a primeiras 4 turmas
              fechadas. Ajustei a partir de cada feedback. Hoje o material é a
              soma de 4 anos de prática viva com mais de 200 mulheres.
            </Step>
            <Step year="Agora" title="Abrir o método ao mundo">
              O Mulher Espiral está sendo aberto pela primeira vez como plataforma
              completa — com a mesma profundidade dos círculos, agora no seu ritmo,
              na sua casa, na sua vida.
            </Step>
          </Timeline>
        </section>

        {/* CTA */}
        <section style={{
          padding: "clamp(56px,7vw,96px) clamp(20px,5vw,32px)",
          textAlign: "center",
          background: "var(--bg-surface)",
        }}>
          <div style={{ maxWidth: 580, margin: "0 auto" }}>
            <h2 className="font-display text-balance" style={{
              fontSize: "clamp(28px,4.5vw,48px)", fontWeight: 300, lineHeight: 1.1,
              marginBottom: 18,
            }}>
              Pronta pra começar essa espiral?
            </h2>
            <p style={{
              fontSize: "clamp(15px,1.7vw,17px)", color: "var(--text-secondary)",
              lineHeight: 1.7, marginBottom: 30,
            }}>
              Entra na lista de espera de Mulher Espiral. Quando as portas abrirem,
              você é uma das primeiras a saber.
            </p>
            <Link to="/" className="btn-gold" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "16px 30px", fontSize: 11, border: "none",
            }}>
              Quero entrar na lista <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </main>

      <WhatsAppFAB surface="landing" />
    </>
  );
}

function Block({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "clamp(15px,1.7vw,17.5px)",
      color: "var(--text-secondary)",
      lineHeight: 1.85,
      marginBottom: 22,
    }}>{children}</p>
  );
}

function Timeline({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gap: 18 }}>{children}</div>;
}

function Step({ year, title, children }: { year: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: "20px clamp(18px,3vw,28px)",
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 16,
      display: "grid",
      gridTemplateColumns: "minmax(120px, 160px) 1fr",
      gap: "clamp(16px,3vw,28px)",
      alignItems: "start",
    }}>
      <div>
        <p className="font-label" style={{
          fontSize: 9, letterSpacing: "0.20em", textTransform: "uppercase",
          color: "var(--gold)",
        }}>{year}</p>
      </div>
      <div>
        <h3 className="font-display" style={{
          fontSize: 18, fontWeight: 500, color: "var(--text-primary)",
          marginBottom: 8, lineHeight: 1.3,
        }}>{title}</h3>
        <p style={{
          fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.7,
        }}>{children}</p>
      </div>
    </div>
  );
}
