/**
 * AccountPage — /conta
 * Gerencia perfil, assinaturas e histórico de compras.
 *
 * Em modo Supabase: lista subscriptions + abre Billing Portal do Stripe.
 * Em modo local: mostra estado mock (somente visualização).
 */
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase, isRealBackend } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowRight, CreditCard, Receipt, Loader2, User as UserIcon, LogOut } from "lucide-react";

interface Subscription {
  id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  product?: { title: string; slug: string } | null;
}

interface Order {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  product?: { title: string } | null;
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [subRes, ordRes] = await Promise.all([
        supabase.from("subscriptions")
          .select("id, status, current_period_end, cancel_at_period_end, products(title, slug)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("orders")
          .select("id, amount, status, created_at, products(title)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSubscriptions((subRes.data ?? []).map((s: any) => ({ ...s, product: s.products })));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setOrders((ordRes.data ?? []).map((o: any) => ({ ...o, product: o.products })));
      setLoading(false);
    })();
  }, [user]);

  const openPortal = async () => {
    if (!isRealBackend) {
      toast.info("Em modo local — conecte Supabase + Stripe para gerenciar pagamentos.");
      return;
    }
    setOpeningPortal(true);
    const { data, error } = await supabase.functions.invoke("stripe-portal", { body: {} });
    if (error || !data?.url) {
      toast.error("Não foi possível abrir o portal. Tente novamente.");
      setOpeningPortal(false);
      return;
    }
    window.location.href = data.url;
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  const fmt = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents);

  return (
    <DashboardLayout>
      <Helmet><title>Minha conta · Despertar Espiral</title></Helmet>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>
        <header style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>
            Minha conta
          </p>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(28px,4vw,40px)", fontWeight: 300, lineHeight: 1.1 }}>
            Olá, <em style={{ color: "var(--gold)" }}>{user.name}</em>
          </h1>
        </header>

        {/* Perfil */}
        <section style={card()}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
            <UserIcon size={18} style={{ color: "var(--gold)" }} />
            <h2 style={sectionTitle()}>Perfil</h2>
          </div>
          <Row label="Nome" value={user.name} />
          <Row label="Email" value={user.email} />
          <Row label="Nome anônimo na comunidade" value={user.anonymous_name} />
        </section>

        {/* Assinaturas */}
        <section style={card()}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
            <CreditCard size={18} style={{ color: "var(--gold)" }} />
            <h2 style={sectionTitle()}>Assinaturas</h2>
          </div>

          {loading ? (
            <Loader2 size={20} style={{ color: "var(--gold)", animation: "spin 1s linear infinite" }} />
          ) : subscriptions.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              Você não tem assinaturas ativas.
            </p>
          ) : (
            subscriptions.map((s) => (
              <div key={s.id} style={{ padding: "14px 0", borderBottom: "1px solid rgba(198,168,112,0.10)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{s.product?.title ?? "Assinatura"}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                      Status: <strong style={{ color: s.status === "active" ? "#8caa96" : "var(--gold)" }}>{translateStatus(s.status)}</strong>
                      {s.current_period_end && ` · próxima cobrança em ${new Date(s.current_period_end).toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>
                  {s.cancel_at_period_end && (
                    <span style={{ fontSize: 11, color: "#ddc28d", background: "rgba(198,168,112,0.10)", padding: "4px 10px", borderRadius: 100 }}>
                      cancelamento agendado
                    </span>
                  )}
                </div>
              </div>
            ))
          )}

          {(subscriptions.length > 0 || isRealBackend) && (
            <button
              onClick={openPortal}
              disabled={openingPortal}
              style={btnSecondary(openingPortal)}
            >
              {openingPortal ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CreditCard size={14} />}
              Gerenciar pagamento e assinatura
              <ArrowRight size={12} />
            </button>
          )}
        </section>

        {/* Compras */}
        <section style={card()}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
            <Receipt size={18} style={{ color: "var(--gold)" }} />
            <h2 style={sectionTitle()}>Histórico de compras</h2>
          </div>
          {loading ? null : orders.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Você ainda não fez compras.</p>
          ) : (
            orders.map((o) => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(198,168,112,0.08)", fontSize: 14 }}>
                <span>{o.product?.title ?? "Item"}</span>
                <span style={{ color: "var(--text-muted)" }}>
                  {fmt(o.amount)} · {new Date(o.created_at).toLocaleDateString("pt-BR")} · {translateOrderStatus(o.status)}
                </span>
              </div>
            ))
          )}
        </section>

        {/* Sair */}
        <section style={{ marginTop: 32, textAlign: "center" }}>
          <button
            onClick={() => logout()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 24px", border: "1px solid rgba(198,168,112,0.25)",
              background: "transparent", color: "var(--text-muted)",
              borderRadius: 10, cursor: "pointer",
              fontFamily: "Montserrat, sans-serif", fontSize: 10,
              letterSpacing: "0.18em", textTransform: "uppercase",
            }}
          >
            <LogOut size={14} /> Sair
          </button>
        </section>
      </div>

      <style>{`@keyframes spin { from {transform: rotate(0);} to {transform: rotate(360deg);} }`}</style>
    </DashboardLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(198,168,112,0.08)" }}>
      <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{label}</span>
      <span style={{ fontSize: 14 }}>{value}</span>
    </div>
  );
}

const card = (): React.CSSProperties => ({
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(198,168,112,0.14)",
  borderRadius: 14,
  padding: 24,
  marginBottom: 20,
});

const sectionTitle = (): React.CSSProperties => ({
  fontFamily: "Cormorant Garamond, serif",
  fontSize: 22,
  fontWeight: 400,
});

const btnSecondary = (loading: boolean): React.CSSProperties => ({
  marginTop: 18,
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "12px 18px",
  background: "rgba(198,168,112,0.12)",
  border: "1px solid rgba(198,168,112,0.30)",
  borderRadius: 10, color: "var(--gold)",
  fontFamily: "Montserrat, sans-serif", fontSize: 10,
  letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600,
  cursor: loading ? "wait" : "pointer",
});

function translateStatus(s: string): string {
  return {
    trialing: "em período de teste",
    active: "ativa",
    past_due: "pagamento atrasado",
    canceled: "cancelada",
    incomplete: "incompleta",
    incomplete_expired: "expirada",
    unpaid: "não paga",
  }[s] ?? s;
}

function translateOrderStatus(s: string): string {
  return ({ paid: "pago", pending: "pendente", failed: "falhou", refunded: "reembolsado", canceled: "cancelado" } as Record<string, string>)[s] ?? s;
}
