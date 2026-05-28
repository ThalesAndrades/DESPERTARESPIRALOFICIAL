/**
 * CaptionPage — landing dedicada para tráfego pago (Meta/Google Ads).
 *
 * Estrutura: hero → quiz arquetípico de 6 perguntas → resultado rico
 * (arquétipo dominante: Mística / Guerreira / Mãe-Terra / Amante / Sábia
 * / Selvagem) → captura nome + email + telefone para liberar o "Relatório
 * Completo do Poder Feminino" e entrar na lista prioritária.
 *
 * Tracking completo: page_view, view_content, start_quiz, quiz_step,
 * complete_quiz, generate_lead, join_waitlist (Meta/TikTok), Subscribe.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import {
  ARCHETYPES, CAPTION_QUESTIONS, computeArchetype, type Archetype,
} from "@/constants/captionQuiz";
import { Events, getAttribution, sha256, track } from "@/lib/analytics";
import { buildWaitlistPayload } from "@/lib/waitlistPayload";
import { sendEmailAsync } from "@/lib/email";
import { fireEventAsync } from "@/lib/sequenzy";
import { supabase } from "@/lib/supabase";
import LandingNav from "@/components/layout/LandingNav";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_MIN = 10;

type Stage = "intro" | "quiz" | "form";

export default function CaptionPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [animating, setAnimating] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = CAPTION_QUESTIONS.length;
  const progress = stage === "intro" ? 0 : Math.round(((step + (stage === "quiz" ? 0 : 1)) / total) * 100);

  const archetype: Archetype | null = useMemo(() => {
    if (answers.length < total) return null;
    return computeArchetype(answers);
  }, [answers, total]);

  const profile = archetype ? ARCHETYPES[archetype] : null;

  /* Tracking on stage transitions */
  useEffect(() => {
    track(Events.ViewContent, { content_name: "Caption — Teste de Poder Feminino", landing: "caption" }, "marketing");
  }, []);

  useEffect(() => {
    if (stage === "quiz" && step === 0) {
      track(Events.StartQuiz, { quiz: "poder-feminino" }, "analytics");
    }
  }, [stage, step]);

  function start() {
    setStage("quiz");
    setStep(0);
    setAnswers([]);
  }

  function choose(value: string) {
    if (animating) return;
    setAnimating(true);
    const next = [...answers.slice(0, step), value];
    setAnswers(next);
    track("quiz_step", { quiz: "poder-feminino", step, value }, "analytics");
    setTimeout(() => {
      const nextStep = step + 1;
      if (nextStep >= total) {
        setStage("form");
      } else {
        setStep(nextStep);
      }
      setAnimating(false);
    }, 340);
  }

  function goBack() {
    if (step === 0) {
      setStage("intro");
      return;
    }
    setStep(step - 1);
    setAnswers(answers.slice(0, -1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/[^\d+]/g, "");

    if (!cleanName) return setError("Como você gosta de ser chamada?");
    if (!EMAIL_RE.test(cleanEmail)) return setError("Confere o e-mail pra mim? Acho que ficou faltando algo.");
    if (cleanPhone.length < PHONE_MIN) return setError("Seu WhatsApp parece incompleto — pode revisar?");
    if (!archetype) return setError("Algo se perdeu no caminho. Pode refazer o teste?");

    setLoading(true);
    const attribution = getAttribution();

    const { error: insertError } = await supabase
      .from("launch_waitlist")
      .insert(buildWaitlistPayload({
        email: cleanEmail,
        name: cleanName,
        phone: cleanPhone,
        message: `Arquétipo: ${archetype}`,
        source: `caption:${archetype}`,
      }));

    if (insertError && !/duplicate|unique/i.test(insertError.message ?? "")) {
      setLoading(false);
      track(Events.FormError, { form: "caption", code: insertError.code ?? "unknown" }, "analytics");
      setError("Algo se perdeu no caminho. Pode tentar de novo em alguns segundos?");
      return;
    }

    const firstName = cleanName.split(" ")[0];
    const profileNow = ARCHETYPES[archetype];

    fireEventAsync("caption.archetype_completed", {
      email: cleanEmail,
      firstName,
      properties: { archetype, phone: cleanPhone, ...attribution },
    });

    sendEmailAsync({
      to: cleanEmail,
      template: {
        slug: "caption-result",
        variables: {
          firstName,
          archetypeName: profileNow.name,
          archetypeTagline: profileNow.tagline,
          archetypeDescription: profileNow.description,
          archetypeShadow: profileNow.shadow,
          archetypePractice: profileNow.practice,
        },
      },
    });

    const emailHash = await sha256(cleanEmail);
    const phoneHash = await sha256(cleanPhone);
    const baseParams = {
      content_name: `Arquétipo ${ARCHETYPES[archetype].name}`,
      content_category: "caption",
      archetype,
      currency: "BRL",
      value: 0,
      em_hash: emailHash,
      ph_hash: phoneHash,
      ...attribution,
    };
    track(Events.CompleteQuiz, baseParams, "analytics");
    track(Events.GenerateLead, baseParams, "marketing");
    track(Events.JoinWaitlist, baseParams, "marketing");
    track(Events.Subscribe, baseParams, "marketing");

    setLoading(false);
    navigate(`/recebido?archetype=${archetype}&name=${encodeURIComponent(firstName)}`);
  }

  return (
    <>
      <Helmet>
        <title>Descubra seu Poder Feminino — Teste Mulher Espiral</title>
        <meta name="description" content="Em 2 minutos, descubra qual é o seu arquétipo de poder feminino e receba um relatório completo gratuito. Por Sunyan Nunes." />
        <meta property="og:title" content="Descubra seu Poder Feminino — Teste Mulher Espiral" />
        <meta property="og:description" content="Teste gratuito: descubra qual é a sua força dominante e o caminho de retomada." />
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
        <BackgroundOrbs profile={profile} />

        {/* Progress */}
        {(stage === "quiz" || stage === "form") && (
          <div style={{ position: "fixed", top: 68, left: 0, right: 0, height: 2, background: "var(--border-subtle)", zIndex: 50 }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, var(--gold) 0%, var(--rose) 100%)",
              transition: "width .4s cubic-bezier(.16,1,.3,1)",
            }} />
          </div>
        )}

        <section style={{
          maxWidth: 780, margin: "0 auto",
          padding: "clamp(40px,8vw,96px) clamp(20px,5vw,32px) clamp(80px,10vw,128px)",
          position: "relative", zIndex: 1,
        }}>
          {stage === "intro" && <Intro onStart={start} />}

          {stage === "quiz" && (
            <Quiz
              step={step}
              total={total}
              animating={animating}
              onChoose={choose}
              onBack={goBack}
            />
          )}

          {stage === "form" && profile && (
            <Reveal
              profile={profile}
              name={name} setName={setName}
              email={email} setEmail={setEmail}
              phone={phone} setPhone={setPhone}
              loading={loading} error={error}
              onSubmit={handleSubmit}
            />
          )}

        </section>
      </main>
    </>
  );
}

/* ─────────────────────────────────────────────────────────── INTRO ── */
function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p className="font-label" style={{
        fontSize: 10, letterSpacing: "0.30em", textTransform: "uppercase",
        color: "var(--gold)", marginBottom: 18,
      }}>Teste do Poder Feminino · 2 minutos</p>

      <h1 className="font-display text-balance" style={{
        fontSize: "clamp(34px,6vw,68px)", fontWeight: 300, lineHeight: 1.04,
        letterSpacing: "-0.02em", marginBottom: 22,
      }}>
        Qual é a sua <em style={{ fontStyle: "italic", color: "var(--gold)" }}>força feminina</em> mais viva hoje?
      </h1>

      <p className="text-pretty" style={{
        fontSize: "clamp(15px,1.8vw,18px)", color: "var(--text-secondary)",
        lineHeight: 1.75, maxWidth: 560, margin: "0 auto 36px",
      }}>
        Dentro de você vivem 6 arquétipos do feminino. Um deles está mais aceso agora —
        guiando suas escolhas, seu corpo, o que você sonha de noite. Esse teste revela
        qual é, e o que está pedindo pra ser despertado no próximo ciclo da sua vida.
      </p>

      <div style={{
        display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
        maxWidth: 580, margin: "0 auto 40px",
      }}>
        {[
          ["6 perguntas", "intuitivas — sem certas ou erradas"],
          ["Resultado profundo", "seu arquétipo, sua sombra, sua prática"],
          ["Aprofundamento", "chega no seu e-mail, gratuito"],
        ].map(([t, s]) => (
          <div key={t} style={{
            padding: "16px 14px",
            background: "rgba(198,168,112,0.04)",
            border: "1px solid rgba(198,168,112,0.18)",
            borderRadius: 14,
            textAlign: "center",
          }}>
            <p className="font-label" style={{
              fontSize: 9, letterSpacing: "0.20em", textTransform: "uppercase",
              color: "var(--gold)", marginBottom: 6,
            }}>{t}</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{s}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onStart}
        className="btn-gold"
        style={{
          fontSize: 11, padding: "16px 36px",
          border: "none", cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 10,
        }}
      >
        Quero descobrir <ArrowRight size={14} />
      </button>

      <p className="font-label" style={{
        marginTop: 26, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
        color: "var(--text-faint)",
      }}>
        Conduzido por Sunyan Nunes · Método Mulher Espiral
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── QUIZ ── */
function Quiz({
  step, total, animating, onChoose, onBack,
}: {
  step: number; total: number; animating: boolean;
  onChoose: (v: string) => void; onBack: () => void;
}) {
  const q = CAPTION_QUESTIONS[step];
  return (
    <div style={{ animation: "captionFade .42s ease both" }} key={q.id}>
      <p className="font-label" style={{
        fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase",
        color: "var(--gold)", marginBottom: 14, textAlign: "center",
      }}>
        Pergunta {step + 1} de {total}
      </p>

      <h2 className="font-display text-balance" style={{
        fontSize: "clamp(26px,4.5vw,42px)", fontWeight: 300, lineHeight: 1.18,
        textAlign: "center", marginBottom: q.subtitle ? 10 : 28,
      }}>
        {q.prompt}
      </h2>
      {q.subtitle && (
        <p style={{
          fontSize: 14, color: "var(--text-muted)", textAlign: "center",
          marginBottom: 30, lineHeight: 1.6, fontStyle: "italic",
        }}>{q.subtitle}</p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {q.options.map((opt) => (
          <button
            key={opt.label}
            type="button"
            disabled={animating}
            onClick={() => onChoose(opt.label)}
            style={{
              textAlign: "left",
              padding: "18px 20px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-soft)",
              borderRadius: 14,
              color: "var(--text-primary)",
              fontSize: "clamp(14px,1.6vw,15.5px)",
              lineHeight: 1.55,
              cursor: animating ? "default" : "pointer",
              transition: "border-color .2s, transform .2s, background .2s, box-shadow .2s",
            }}
            onMouseEnter={(e) => {
              if (animating) return;
              e.currentTarget.style.borderColor = "var(--gold)";
              e.currentTarget.style.background = "rgba(198,168,112,0.06)";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 24px -4px rgba(198,168,112,0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-soft)";
              e.currentTarget.style.background = "var(--bg-elevated)";
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {opt.label}
            {opt.description && (
              <span style={{ display: "block", marginTop: 6, fontSize: 12.5, color: "var(--text-muted)" }}>{opt.description}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 22, textAlign: "center" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "transparent", border: "none",
            color: "var(--text-muted)", cursor: "pointer",
            fontFamily: "Montserrat,sans-serif", fontSize: 10,
            letterSpacing: "0.20em", textTransform: "uppercase",
            padding: "8px 12px",
          }}
        >← Voltar</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── REVEAL ── */
function Reveal({
  profile, name, setName, email, setEmail, phone, setPhone,
  loading, error, onSubmit,
}: {
  profile: ReturnType<typeof Object.values>[number] extends infer T ? T : never;
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  loading: boolean; error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const p = profile as typeof ARCHETYPES[Archetype];
  return (
    <div style={{ animation: "captionFade .5s ease both" }}>
      <div style={{
        textAlign: "center", marginBottom: 36,
      }}>
        <p className="font-label" style={{
          fontSize: 10, letterSpacing: "0.30em", textTransform: "uppercase",
          color: "var(--gold)", marginBottom: 16,
        }}>Seu arquétipo dominante é</p>

        <div style={{
          width: 96, height: 96, margin: "0 auto 18px",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${p.hueA} 0%, ${p.hueB} 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 44, color: "rgba(255,255,255,0.95)",
          boxShadow: `0 12px 50px -12px ${p.hueB}55, 0 0 0 1px rgba(198,168,112,0.25)`,
        }}>
          {p.glyph}
        </div>

        <h1 className="font-display text-balance" style={{
          fontSize: "clamp(34px,6vw,56px)", fontWeight: 300,
          letterSpacing: "-0.01em", marginBottom: 8, lineHeight: 1.08,
        }}>
          {p.name}
        </h1>
        <p className="font-display" style={{
          fontSize: "clamp(15px,2vw,19px)", fontStyle: "italic",
          color: "var(--text-secondary)", fontWeight: 300,
        }}>{p.tagline}</p>
      </div>

      <div style={{
        padding: "26px clamp(20px,4vw,32px)",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-soft)",
        borderRadius: 18,
        marginBottom: 26,
      }}>
        <p style={{ fontSize: "clamp(15px,1.7vw,16px)", color: "var(--text-secondary)", lineHeight: 1.75 }}>
          {p.description}
        </p>
      </div>

      <Card title="Suas forças visíveis">
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
          {p.strengths.map((s) => (
            <li key={s} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{
                width: 20, height: 20, borderRadius: "50%",
                background: "rgba(198,168,112,0.16)", color: "var(--gold)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, flexShrink: 0, marginTop: 2,
              }}>✦</span>
              <span style={{ fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.65 }}>{s}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Sua sombra a integrar" tone="rose">
        <p style={{ fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.72 }}>{p.shadow}</p>
      </Card>

      {/* Form CTA */}
      <div style={{
        marginTop: 36, padding: "28px clamp(20px,4vw,36px)",
        background: `linear-gradient(135deg, ${p.hueA}22 0%, ${p.hueB}1a 100%)`,
        border: "1px solid rgba(198,168,112,0.30)",
        borderRadius: 20,
      }}>
        <p className="font-label" style={{
          fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase",
          color: "var(--gold)", marginBottom: 10, textAlign: "center",
        }}>
          <Sparkles size={11} style={{ display: "inline", marginRight: 6, verticalAlign: "-1px" }} />
          Relatório completo gratuito
        </p>
        <h3 className="font-display text-balance" style={{
          fontSize: "clamp(22px,3.5vw,30px)", fontWeight: 300,
          marginBottom: 10, lineHeight: 1.18, textAlign: "center",
        }}>
          Receba sua leitura completa + prática de retomada
        </h3>
        <p style={{
          fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7,
          textAlign: "center", marginBottom: 22, maxWidth: 460, marginInline: "auto",
        }}>
          Eu te envio no e-mail (e no WhatsApp, se quiser) o aprofundamento da sua {p.name}: práticas,
          rituais, perguntas pra meditar e prioridade quando o Mulher Espiral abrir.
        </p>

        <form
          onSubmit={onSubmit}
          data-fb-disable-text-collection="true"
          style={{ display: "grid", gap: 12, maxWidth: 460, margin: "0 auto" }}
        >
          <FieldInput
            label="Seu nome" value={name} onChange={setName}
            placeholder="Como você gosta de ser chamada"
            autoComplete="given-name"
          />
          <FieldInput
            label="Melhor e-mail" value={email} onChange={setEmail}
            type="email" placeholder="o que você abre todo dia"
            autoComplete="email" inputMode="email"
          />
          <FieldInput
            label="Seu WhatsApp" value={phone} onChange={setPhone}
            type="tel" placeholder="(00) 00000-0000"
            autoComplete="tel" inputMode="tel"
          />

          {error && (
            <p role="alert" style={{ fontSize: 13, color: "#e07a90", marginTop: -4 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold"
            style={{
              marginTop: 6, fontSize: 11, padding: "15px 24px",
              border: "none", cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Cuidando do seu pedido…</> : <>Quero meu aprofundamento <ArrowRight size={13} /></>}
          </button>

          <p className="font-label" style={{
            fontSize: 8.5, letterSpacing: "0.16em", textTransform: "uppercase",
            color: "var(--text-faint)", textAlign: "center", marginTop: 4,
          }}>
            Cuidamos do seu cadastro · LGPD · Sem spam
          </p>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── HELPERS ── */
function Card({ title, tone, children }: { title: string; tone?: "rose"; children: React.ReactNode }) {
  return (
    <div style={{
      marginTop: 18, padding: "22px clamp(18px,3vw,28px)",
      background: tone === "rose" ? "rgba(172,128,142,0.06)" : "var(--bg-elevated)",
      border: `1px solid ${tone === "rose" ? "rgba(172,128,142,0.30)" : "var(--border-soft)"}`,
      borderRadius: 16,
    }}>
      <p className="font-label" style={{
        fontSize: 9.5, letterSpacing: "0.24em", textTransform: "uppercase",
        color: tone === "rose" ? "var(--rose)" : "var(--gold)",
        marginBottom: 14,
      }}>{title}</p>
      {children}
    </div>
  );
}

function FieldInput({
  label, value, onChange, type = "text", placeholder, autoComplete, inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span className="font-label" style={{
        fontSize: 9, letterSpacing: "0.20em", textTransform: "uppercase",
        color: "var(--text-muted)",
      }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required
        style={{
          padding: "13px 14px",
          background: "var(--bg-surface)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-soft)",
          borderRadius: 10,
          fontSize: 15, outline: "none",
          fontFamily: "Inter, system-ui, sans-serif",
          transition: "border-color .2s, box-shadow .2s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--gold)";
          e.currentTarget.style.boxShadow = "0 0 0 3px var(--gold-glow)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border-soft)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </label>
  );
}

function BackgroundOrbs({ profile }: { profile: typeof ARCHETYPES[Archetype] | null }) {
  const a = profile?.hueA ?? "rgba(122,94,30,0.18)";
  const b = profile?.hueB ?? "rgba(172,128,142,0.14)";
  return (
    <>
      <div aria-hidden="true" style={{
        position: "absolute", top: "-180px", left: "-120px",
        width: 520, height: 520, borderRadius: "50%",
        background: `radial-gradient(circle, ${a}55 0%, transparent 70%)`,
        filter: "blur(60px)", pointerEvents: "none",
        transition: "background .8s ease",
      }} />
      <div aria-hidden="true" style={{
        position: "absolute", bottom: "-200px", right: "-120px",
        width: 580, height: 580, borderRadius: "50%",
        background: `radial-gradient(circle, ${b}44 0%, transparent 70%)`,
        filter: "blur(70px)", pointerEvents: "none",
        transition: "background .8s ease",
      }} />
      <style>{`
        @keyframes captionFade {
          from { opacity: 0; transform: translateY(8px) }
          to   { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </>
  );
}
