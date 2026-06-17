import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateProperty } from "@/lib/calculations";
import { calculatePortfolioSummary } from "@/lib/portfolio-calculations";
import DashboardHome from "@/components/dashboard/DashboardHome";
import UpgradeSuccess from "@/components/dashboard/UpgradeSuccess";
import type { Property, Financing } from "@/types";

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const todayStr = now.toISOString().split("T")[0];

  const [
    { data: profile },
    { data: properties },
    { data: portfolioFinancings },
    { data: tenants },
    { data: thisMonthPaidPayments },
    { data: openTasks },
  ] = await Promise.all([
    supabase.from("profiles").select("plan, name, onboarding_completed").eq("id", user!.id).single(),
    supabase.from("properties").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("financings").select("*, properties!inner(user_id)").eq("properties.user_id", user!.id),
    supabase.from("tenants").select("rent_monthly, is_active").eq("user_id", user!.id),
    supabase.from("rent_payments").select("amount").eq("user_id", user!.id).eq("status", "paid")
      .gte("due_date", firstDay).lte("due_date", lastDay),
    supabase.from("tasks").select("due_date, priority").eq("user_id", user!.id).eq("completed", false),
  ]);

  if (profile?.onboarding_completed === false) {
    redirect("/onboarding");
  }

  const firstName = (profile?.name ?? user?.email ?? "").split(" ")[0];
  const isFreePlan = !profile?.plan || profile.plan === "free";

  const props = (properties ?? []) as Property[];
  const results = props.map((p) => calculateProperty(p));
  const count = props.length;

  const totalCashflow   = count > 0 ? results.reduce((s, r) => s + r.cashflow_monthly, 0) : null;
  const avgNetYield     = count > 0 ? results.reduce((s, r) => s + r.net_yield, 0) / count : null;
  const totalInvestment = count > 0 ? results.reduce((s, r) => s + r.total_investment, 0) : null;

  const recentProperties = props.slice(0, 3).map((p, i) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    sqm: p.sqm,
    purchase_price: p.purchase_price,
    gross_yield: results[i].gross_yield,
    cashflow_monthly: results[i].cashflow_monthly,
  }));

  const financingAlertCount = (portfolioFinancings ?? []).filter((f) => {
    if (!f.fixed_until) return false;
    const days = daysUntil(f.fixed_until);
    return days < 365;
  }).length;

  const portfolioSummary = props.length > 0
    ? calculatePortfolioSummary(props, (portfolioFinancings ?? []) as unknown as Financing[], [], [])
    : undefined;

  const monthlyRentSoll = (tenants ?? [])
    .filter((t) => t.is_active)
    .reduce((s, t) => s + (t.rent_monthly ?? 0), 0);

  const monthlyRentIst = (thisMonthPaidPayments ?? [])
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  const overdueTasks      = (openTasks ?? []).filter((t) => t.due_date && t.due_date < todayStr).length;
  const highPriorityTasks = (openTasks ?? []).filter((t) => t.priority === "high").length;

  return (
    <>
      <DashboardHome
        firstName={firstName}
        isFreePlan={isFreePlan}
        count={count}
        totalCashflow={totalCashflow}
        avgNetYield={avgNetYield}
        totalInvestment={totalInvestment}
        recentProperties={recentProperties}
        financingAlertCount={financingAlertCount}
        monthlyRentSoll={monthlyRentSoll}
        monthlyRentIst={monthlyRentIst}
        overdueTasks={overdueTasks}
        highPriorityTasks={highPriorityTasks}
        userId={user!.id}
        portfolioSummary={portfolioSummary}
      />
      <Suspense fallback={null}>
        <UpgradeSuccess />
      </Suspense>
    </>
  );
}
