import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateProperty } from "@/lib/calculations";
import DashboardHome from "@/components/dashboard/DashboardHome";
import UpgradeSuccess from "@/components/dashboard/UpgradeSuccess";
import type { Property } from "@/types";

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: properties }, { data: financings }] = await Promise.all([
    supabase.from("profiles").select("plan, name, onboarding_completed").eq("id", user!.id).single(),
    supabase.from("properties").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("financings").select("fixed_until").eq("user_id", user!.id),
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

  const financingAlertCount = (financings ?? []).filter((f) => {
    if (!f.fixed_until) return false;
    const days = daysUntil(f.fixed_until);
    return days < 365;
  }).length;

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
      />
      <Suspense fallback={null}>
        <UpgradeSuccess />
      </Suspense>
    </>
  );
}
