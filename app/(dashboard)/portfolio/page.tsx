import { createClient } from "@/lib/supabase/server";
import { calculateProperty } from "@/lib/calculations";
import PortfolioView from "@/components/dashboard/PortfolioView";
import type { Property, Plan } from "@/types";

export default async function PortfolioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: properties }, { data: profile }, { data: tenants }] = await Promise.all([
    supabase
      .from("properties")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("plan")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("tenants")
      .select("property_id, rent_monthly, is_active")
      .eq("user_id", user!.id),
  ]);

  const tenantsByProperty: Record<string, { count: number; totalRent: number }> = {};
  for (const t of tenants ?? []) {
    if (!t.is_active) continue;
    if (!tenantsByProperty[t.property_id]) tenantsByProperty[t.property_id] = { count: 0, totalRent: 0 };
    tenantsByProperty[t.property_id].count += 1;
    tenantsByProperty[t.property_id].totalRent += t.rent_monthly;
  }

  const plan = (profile?.plan ?? "free") as Plan;
  const props = (properties ?? []) as Property[];
  const results = props.map((p) => calculateProperty(p));

  const cards = props.map((p, i) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    type: p.type,
    sqm: p.sqm,
    purchase_price: p.purchase_price,
    gross_yield: results[i].gross_yield,
    net_yield: results[i].net_yield,
    cashflow_monthly: results[i].cashflow_monthly,
    ltv: results[i].ltv,
    total_investment: results[i].total_investment,
  }));

  const totalCashflow = results.reduce((s, r) => s + r.cashflow_monthly, 0);
  const totalInvestment = results.reduce((s, r) => s + r.total_investment, 0);
  const avgGrossYield =
    props.length > 0 ? results.reduce((s, r) => s + r.gross_yield, 0) / props.length : 0;

  return (
    <PortfolioView
      properties={cards}
      totalCashflow={totalCashflow}
      totalInvestment={totalInvestment}
      avgGrossYield={avgGrossYield}
      plan={plan}
      tenantsByProperty={tenantsByProperty}
    />
  );
}
