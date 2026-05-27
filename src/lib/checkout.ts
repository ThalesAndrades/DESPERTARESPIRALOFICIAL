/**
 * Helper para iniciar Stripe Checkout pelo client.
 *
 * - Em modo real (Supabase configurado): chama a Edge Function `stripe-checkout`
 *   que cria uma Session no Stripe e retorna a URL hospedada.
 * - Em modo local: cria um pedido fake no banco local e redireciona pra
 *   /obrigado com um session_id sintético (apenas para demonstração).
 */
import { supabase, isRealBackend } from "./supabase";
import { fireEventAsync } from "./sequenzy";

interface StartCheckoutOptions {
  productSlug: string;
  mode?: "payment" | "subscription";
}

export async function startCheckout({ productSlug, mode = "payment" }: StartCheckoutOptions): Promise<{
  ok: boolean;
  url?: string;
  error?: string;
}> {
  fireEventAsync("checkout.started", { email: "anon", properties: { product_slug: productSlug, mode } });

  if (isRealBackend) {
    const { data, error } = await supabase.functions.invoke("stripe-checkout", {
      body: { product_slug: productSlug, mode },
    });
    if (error || !data?.url) {
      const msg = error?.message ?? "Falha ao criar sessão de pagamento";
      return { ok: false, error: msg };
    }
    return { ok: true, url: data.url as string };
  }

  // Modo local: simula um success_url
  const fakeSessionId = `local_session_${Date.now()}`;
  return { ok: true, url: `/obrigado?session_id=${fakeSessionId}&local=1` };
}
