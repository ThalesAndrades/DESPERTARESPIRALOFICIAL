/**
 * SharePage — `/share/:archetype` — destino compartilhável.
 *
 * Crawlers (Meta, Twitter, WhatsApp, LinkedIn) leem as meta tags do
 * Helmet e renderizam o card com o arquétipo correto. Humanos veem um
 * loader breve e são redirecionados para `/caption` (pra fazer o
 * próprio teste e descobrir o arquétipo deles).
 *
 * Estratégia: o Helmet escreve as meta tags antes do redirect, então o
 * crawler que renderiza JS (todos os principais hoje) consegue ler.
 * Para crawlers antigos, o `<noscript>` repete as informações.
 */
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { ARCHETYPES, type Archetype } from "@/constants/captionQuiz";
import { track } from "@/lib/analytics";

function isArchetype(v: string | undefined): v is Archetype {
  return !!v && Object.prototype.hasOwnProperty.call(ARCHETYPES, v);
}

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://despertarespiral.com";
const OG_FALLBACK = `${SITE_URL}/og-image.jpg`;

function ogImageFor(archetype: Archetype | null): { url: string; type: string } {
  if (!archetype) return { url: OG_FALLBACK, type: "image/jpeg" };
  return { url: `${SITE_URL}/og/${archetype}.svg`, type: "image/svg+xml" };
}

export default function SharePage() {
  const { archetype } = useParams<{ archetype: string }>();
  const navigate = useNavigate();
  const profile = isArchetype(archetype) ? ARCHETYPES[archetype] : null;

  useEffect(() => {
    track("share_landing", { archetype: profile?.key ?? "unknown" }, "analytics");
    // Pequeno atraso pra dar tempo de meta tags renderizarem para crawlers
    // e o evento de analytics sair antes do redirect.
    const t = setTimeout(() => navigate("/caption", { replace: true }), 600);
    return () => clearTimeout(t);
  }, [profile, navigate]);

  const title = profile
    ? `Sou ${profile.name} — ${profile.tagline} ✦`
    : "Descubra seu Poder Feminino — Mulher Espiral";
  const description = profile
    ? `${profile.description.slice(0, 180)}… Faça o teste e descubra qual é a sua força feminina mais viva agora.`
    : "Em 2 minutos, descubra qual é o seu arquétipo de poder feminino. Por Sunyan Nunes.";
  const shareUrl = profile ? `${SITE_URL}/share/${profile.key}` : `${SITE_URL}/share`;
  const og = ogImageFor(profile?.key ?? null);

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={shareUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={og.url} />
        <meta property="og:image:type" content={og.type} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={title} />
        {/* Fallback PNG-friendly: alguns crawlers preferem JPG */}
        {profile && <meta property="og:image" content={OG_FALLBACK} />}
        <meta property="og:site_name" content="Despertar Espiral" />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={og.url} />
        <meta name="twitter:image:alt" content={title} />
      </Helmet>

      <main style={{
        minHeight: "100vh",
        background: profile
          ? `linear-gradient(135deg, ${profile.hueA} 0%, ${profile.hueB} 100%)`
          : "var(--bg-surface)",
        color: "rgba(255,255,255,0.95)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          {profile && (
            <div style={{
              width: 96, height: 96, borderRadius: "50%", margin: "0 auto 22px",
              background: "rgba(255,255,255,0.12)", backdropFilter: "blur(20px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 44,
            }}>{profile.glyph}</div>
          )}
          <p style={{
            fontFamily: "Montserrat,sans-serif", fontSize: 10,
            letterSpacing: "0.30em", textTransform: "uppercase", opacity: 0.7,
            marginBottom: 10,
          }}>Despertar Espiral</p>
          <h1 className="font-display text-balance" style={{
            fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(28px,5vw,44px)",
            fontWeight: 300, lineHeight: 1.1, marginBottom: 12,
          }}>{title}</h1>
          <p style={{ fontSize: 15, lineHeight: 1.65, opacity: 0.85 }}>
            Levando você para descobrir o seu…
          </p>
          <noscript>
            <p style={{ marginTop: 18 }}>
              <a href="/caption" style={{ color: "rgba(255,255,255,0.95)" }}>
                Clique aqui para fazer o seu teste
              </a>
            </p>
          </noscript>
        </div>
      </main>
    </>
  );
}
