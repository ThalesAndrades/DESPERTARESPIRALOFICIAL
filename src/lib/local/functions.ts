import { getDB, mutate, uuid, nowISO } from "./store";

type InvokeOptions = {
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InvokeResult<T = any> = { data: T | null; error: { message: string; context?: unknown } | null };

// All edge function handlers run locally — no network. They consult the
// in-memory DB so the admin dashboards still see numbers that match the
// member-facing data.

const handlers: Record<string, (opts: InvokeOptions) => Promise<InvokeResult>> = {
  "checkout-session": async ({ body }) => {
    const { product_id, email, payment_method } = (body ?? {}) as {
      product_id?: string;
      email?: string;
      payment_method?: "pix" | "credit_card" | "boleto";
    };
    if (!product_id || !email) {
      return { data: null, error: { message: "product_id e email são obrigatórios" } };
    }
    const order = {
      id: uuid(),
      user_id: null as string | null,
      email,
      product_id,
      payment_method: payment_method ?? "pix",
      status: "pending" as const,
      amount: 0,
      created_at: nowISO(),
    };
    let resolved = order;
    mutate((db) => {
      const product = db.products.find((p) => p.id === product_id || p.slug === product_id);
      if (product) resolved = { ...order, product_id: product.id, amount: product.price };
      db.orders.push(resolved);
    });
    return {
      data: {
        order_id: resolved.id,
        checkout_url: `/obrigado?order=${resolved.id}`,
        qr_code: "data:image/svg+xml;base64,PHN2Zy8+",
        pix_copy_paste: `pix-local-${resolved.id}`,
        amount: resolved.amount,
      },
      error: null,
    };
  },

  "grant-pending-access": async () => {
    return { data: { granted: 0, products: [] }, error: null };
  },

  "send-email": async ({ body }) => {
    if (import.meta.env?.DEV) {
      console.info("[local-functions] send-email (mock):", body);
    }
    return { data: { ok: true, id: `local-email-${uuid()}` }, error: null };
  },

  "sequenzy-event": async ({ body }) => {
    if (import.meta.env?.DEV) {
      console.info("[local-functions] sequenzy-event (mock):", body);
    }
    return { data: { ok: true }, error: null };
  },

  "sequenzy-webhook": async () => ({ data: { ok: true }, error: null }),

  "crm-stats": async () => {
    const db = getDB();
    const paidOrders = db.orders.filter((o) => o.status === "paid");
    const totalRevenue = paidOrders.reduce((s, o) => s + o.amount, 0);
    return {
      data: {
        total_users: db.user_profiles.length,
        total_orders: db.orders.length,
        paid_orders: paidOrders.length,
        total_revenue: totalRevenue,
        recent_signups: db.user_profiles.slice(-10).reverse(),
        recent_orders: db.orders.slice(-10).reverse(),
        conversion_rate: db.orders.length
          ? Math.round((paidOrders.length / db.orders.length) * 1000) / 10
          : 0,
      },
      error: null,
    };
  },

  "social-stats": async () => ({
    data: {
      followers: { instagram: 0, tiktok: 0, youtube: 0 },
      reach: { weekly: 0, monthly: 0 },
      engagement_rate: 0,
      top_posts: [],
    },
    error: null,
  }),

  "ads-stats": async () => ({
    data: {
      spend: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      cpc: 0,
      conversions: 0,
      roas: 0,
      campaigns: [],
    },
    error: null,
  }),

  "order-recovery": async () => {
    const db = getDB();
    const pending = db.orders.filter((o) => o.status === "pending");
    return {
      data: { pending_count: pending.length, recovered: 0, orders: pending },
      error: null,
    };
  },

  "trello-boards": async () => ({
    data: { boards: [], lists: [], cards: [] },
    error: null,
  }),
};

export const localFunctions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async invoke<T = any>(name: string, options?: InvokeOptions): Promise<InvokeResult<T>> {
    const handler = handlers[name];
    if (!handler) {
      return { data: null, error: { message: `Edge function "${name}" não está disponível em modo local` } };
    }
    const res = await handler(options ?? {});
    return res as InvokeResult<T>;
  },
};
