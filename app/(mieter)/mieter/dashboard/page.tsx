import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MieterDashboard from "@/components/mieter/MieterDashboard";

export default async function MieterDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/mieter/login");

  let mieterName = "Mieter";
  let tenantId: string | null = null;
  let rentMonthly: number | null = null;
  let recentPayments: Array<{
    id: string;
    amount: number;
    due_date: string;
    status: string;
    paid_at: string | null;
  }> = [];
  let openAnfragenCount = 0;
  let letzterZaehlerstand: string | null = null;
  let nextDueDate: string | null = null;

  try {
    const { data: mieterAccount } = await supabase
      .from("mieter_accounts")
      .select("mieter_name, tenant_id, tenants(name, rent_monthly)")
      .eq("supabase_user_id", user.id)
      .maybeSingle();

    if (mieterAccount) {
      mieterName = mieterAccount.mieter_name || mieterName;
      tenantId = mieterAccount.tenant_id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tenant = mieterAccount.tenants as any;
      if (tenant?.rent_monthly) {
        rentMonthly = tenant.rent_monthly;
      }
    }
  } catch {
    // ignore
  }

  if (tenantId) {
    try {
      const { data: payments } = await supabase
        .from("rent_payments")
        .select("id, amount, due_date, status, paid_at")
        .eq("tenant_id", tenantId)
        .order("due_date", { ascending: false })
        .limit(3);

      if (payments) recentPayments = payments;

      // Next upcoming payment
      const { data: nextPayment } = await supabase
        .from("rent_payments")
        .select("due_date")
        .eq("tenant_id", tenantId)
        .eq("status", "pending")
        .order("due_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextPayment) nextDueDate = nextPayment.due_date;
    } catch {
      // ignore
    }

    try {
      const { count } = await supabase
        .from("anfragen")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "open");

      openAnfragenCount = count || 0;
    } catch {
      // ignore
    }

    try {
      const { data: zaehler } = await supabase
        .from("zaehlerstaende")
        .select("created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (zaehler) letzterZaehlerstand = zaehler.created_at;
    } catch {
      // ignore
    }
  }

  return (
    <MieterDashboard
      mieterName={mieterName}
      rentMonthly={rentMonthly}
      nextDueDate={nextDueDate}
      recentPayments={recentPayments}
      openAnfragenCount={openAnfragenCount}
      letzterZaehlerstand={letzterZaehlerstand}
    />
  );
}
