/**
 * WhatsAppFAB — botão flutuante discreto pra chamar direto no WhatsApp.
 *
 * Aparece no canto inferior-direito das páginas públicas (landing,
 * caption, recebido). Não aparece em /admin nem se o número não
 * estiver configurado (VITE_WHATSAPP_NUMBER no formato E.164 sem "+").
 *
 * Comportamento:
 *   - mobile: abre o app nativo via wa.me
 *   - desktop: abre WhatsApp Web em nova aba
 *   - mensagem inicial varia por `surface` (landing, caption, recebido)
 *   - tracking via Events: whatsapp_click
 */
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { track } from "@/lib/analytics";

interface Props {
  /** Onde o botão está aparecendo — entra na mensagem inicial e no tracking. */
  surface: "landing" | "caption" | "recebido" | "share";
}

function getNumber(): string | null {
  const raw = (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined)?.trim();
  if (!raw) return null;
  return raw.replace(/[^\d]/g, "") || null;
}

const INITIAL_MESSAGES: Record<Props["surface"], string> = {
  landing:  "Olá Sunyan, vim pelo site do Despertar Espiral e queria conversar.",
  caption:  "Olá Sunyan, fiz o teste do Poder Feminino e queria conversar.",
  recebido: "Olá Sunyan, acabei de entrar na lista de espera e queria conversar.",
  share:    "Olá Sunyan, recebi o link do teste e queria saber mais.",
};

export default function WhatsAppFAB({ surface }: Props) {
  const [number] = useState<string | null>(() => getNumber());
  const [hovered, setHovered] = useState(false);

  // Pequeno respiro inicial pra não pular logo no carregamento da página
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (!number) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    track("whatsapp_click", { surface }, "analytics");
    const text = encodeURIComponent(INITIAL_MESSAGES[surface]);
    const url = `https://wa.me/${number}?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <a
      href={`https://wa.me/${number}`}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Falar com Sunyan no WhatsApp"
      style={{
        position: "fixed",
        right: "clamp(14px,3vw,28px)",
        bottom: "clamp(14px,3vw,28px)",
        zIndex: 90,
        display: "inline-flex", alignItems: "center", gap: 10,
        padding: hovered ? "12px 18px 12px 14px" : 12,
        borderRadius: 999,
        background: "#25D366",
        color: "#fff",
        boxShadow: "0 12px 30px -10px rgba(37,211,102,0.55), 0 4px 14px rgba(0,0,0,0.18)",
        textDecoration: "none",
        fontFamily: "Montserrat, sans-serif",
        fontSize: 12, fontWeight: 600,
        letterSpacing: "0.04em",
        transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.92)",
        opacity: visible ? 1 : 0,
        transition: "transform .35s cubic-bezier(.16,1,.3,1), opacity .35s ease, padding .22s ease, box-shadow .22s ease",
      }}
    >
      <span style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "rgba(255,255,255,0.18)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <MessageCircle size={15} strokeWidth={2} />
      </span>
      <span
        style={{
          maxWidth: hovered ? 200 : 0,
          opacity: hovered ? 1 : 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
          transition: "max-width .25s ease, opacity .2s ease",
        }}
      >
        Falar com Sunyan
      </span>
    </a>
  );
}
