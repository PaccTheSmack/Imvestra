import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface RentPayment {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  paid_at: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    paid: { label: "Bezahlt", bg: "#D1FAE5", color: "#065F46" },
    pending: { label: "Ausstehend", bg: "#FEF3C7", color: "#92400E" },
    late: { label: "Verspätet", bg: "#FEE2E2", color: "#991B1B" },
  };
  const c = config[status] || { label: status, bg: "#F3F4F6", color: "#374151" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        backgroundColor: c.bg,
        color: c.color,
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {c.label}
    </span>
  );
}

export default async function MieterMietePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/mieter/login");

  let tenantId: string | null = null;
  let rentMonthly: number | null = null;
  let payments: RentPayment[] = [];

  try {
    const { data: mieterAccount } = await supabase
      .from("mieter_accounts")
      .select("tenant_id, tenants(rent_monthly)")
      .eq("supabase_user_id", user.id)
      .maybeSingle();

    if (mieterAccount) {
      tenantId = mieterAccount.tenant_id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tenant = mieterAccount.tenants as any;
      if (tenant?.rent_monthly) rentMonthly = tenant.rent_monthly;
    }
  } catch {
    // ignore
  }

  if (tenantId) {
    try {
      const { data } = await supabase
        .from("rent_payments")
        .select("id, amount, due_date, status, paid_at")
        .eq("tenant_id", tenantId)
        .order("due_date", { ascending: false });

      if (data) payments = data;
    } catch {
      // ignore
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-0.4px",
          }}
        >
          Meine Miete
        </h1>
        <p style={{ fontSize: 15, color: "#6B7280", marginTop: 4 }}>
          Übersicht über Ihre Mietzahlungen
        </p>
      </div>

      {/* Rent details card */}
      {rentMonthly && (
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 14,
            padding: "24px 28px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, marginBottom: 4 }}>
              MONATLICHE MIETE
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#00897B",
                letterSpacing: "-0.5px",
              }}
            >
              {formatCurrency(rentMonthly)}
            </div>
            <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
              Monatlich fällig
            </div>
          </div>
        </div>
      )}

      {/* Payments list */}
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 14,
          padding: "24px 28px",
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 20 }}>
          Zahlungshistorie
        </h2>

        {payments.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "#9CA3AF",
              fontSize: 14,
            }}
          >
            Noch keine Zahlungen vorhanden
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                padding: "0 0 10px",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                marginBottom: 8,
              }}
            >
              {["Betrag", "Fälligkeitsdatum", "Bezahlt am", "Status"].map((h) => (
                <div
                  key={h}
                  style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.5px" }}
                >
                  {h.toUpperCase()}
                </div>
              ))}
            </div>
            {payments.map((payment) => (
              <div
                key={payment.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(0,0,0,0.04)",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                  {formatCurrency(payment.amount)}
                </div>
                <div style={{ fontSize: 14, color: "#4B5563" }}>
                  {formatDate(payment.due_date)}
                </div>
                <div style={{ fontSize: 14, color: "#4B5563" }}>
                  {formatDate(payment.paid_at)}
                </div>
                <div>
                  <StatusBadge status={payment.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
