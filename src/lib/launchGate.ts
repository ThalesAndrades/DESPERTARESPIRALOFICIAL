/**
 * launchGate — controla o "modo pré-lançamento" do site.
 *
 * Em produção, todo o site fica em modo captação: rotas de auth, dashboard,
 * comunidade, checkout e admin ficam inacessíveis publicamente. A única forma
 * de liberar o acesso autenticado é digitar o código secreto no botão "?"
 * discreto no rodapé da home. Em desenvolvimento (vite dev), tudo permanece
 * liberado.
 *
 * Quando o gate está aberto e não há usuário autenticado pelo Supabase, o
 * `useAuth` injeta um usuário admin de bypass — assim a Sunyan entra direto
 * pelo código, sem precisar de email/senha. Veja src/hooks/useAuth.tsx.
 *
 * Token: salvo em localStorage; persiste entre sessões para o admin não
 * precisar redigitar o código a cada visita.
 */
const STORAGE_KEY = "espiral.launchGate";
const ADMIN_CODE = "190900";

let cached: boolean | null = null;
const listeners = new Set<() => void>();

function readStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "open";
  } catch {
    return false;
  }
}

/** True quando o site está em modo lançamento (esconde tudo, mostra waitlist). */
export function isLaunchMode(): boolean {
  // Em dev o gate é desligado; em prod sempre ligado.
  return !import.meta.env.DEV;
}

/** True se o acesso autenticado foi desbloqueado nesta máquina. */
export function isGateOpen(): boolean {
  if (!isLaunchMode()) return true;
  if (cached !== null) return cached;
  cached = readStorage();
  return cached;
}

/**
 * True quando o gate libera acesso admin sem login real. O front trata como
 * "admin bypass" — entra na área protegida com user mock.
 */
export function isAdminBypass(): boolean {
  return isGateOpen();
}

/** Tenta abrir o gate com um código. Retorna true se aceito. */
export function tryOpenGate(code: string): boolean {
  if (code.trim() !== ADMIN_CODE) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, "open");
  } catch {
    /* ignore */
  }
  cached = true;
  listeners.forEach((l) => l());
  return true;
}

/** Fecha o gate (logout completo de acesso admin). */
export function closeGate(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  cached = false;
  listeners.forEach((l) => l());
}

/** Subscribe para mudanças do gate (re-render). */
export function onGateChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
