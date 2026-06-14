import { createClient } from "@/lib/supabase/server";
import FinanzenView from "@/components/dashboard/FinanzenView";
import type { FinanzierungWithProperty, FinanzierungUrgency } from "@/types";

function computeUrgency(fixedUntil: string | null): {
  daysUntilExpiry: number;
  monthsUntilExpiry: number;
  urgency: FinanzierungUrgency;
} {
  if (!fixedUntil) {
    return { daysUntilExpiry: 9999, monthsUntilExpiry: 999, urgency: "ok" };
  }
  const today = new Date();
  const expiry = new Date(fixedUntil);
  const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const months = Math.ceil(days / 30);
  const urgency: FinanzierungUrgency =
    days < 0   ? "expired" :
    days < 180 ? "critical" :
    days < 365 ? "warning" : "ok";
  return { daysUntilExpiry: days, monthsUntilExpiry: months, urgency };
}

export default async function FinanzenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawFinancings } = await supabase
    .from("financings")
    .select("*, properties(id, name, type, purchase_price)")
    .eq("user_id", user!.id)
    .order("fixed_until", { ascending: true });

  const financings: FinanzierungWithProperty[] = (rawFinancings ?? []).map((f) => {
    const { daysUntilExpiry, monthsUntilExpiry, urgency } = computeUrgency(f.fixed_until ?? null);
    const prop = Array.isArray(f.properties) ? f.properties[0] : f.properties;
    return {
      ...f,
      bank: f.bank ?? undefined,
      fixed_until: f.fixed_until ?? "",
      current_debt: f.current_debt ?? f.loan_amount,
      property: prop ?? { id: f.property_id, name: "Unbekannt", type: "ETW", purchase_price: 0 },
      daysUntilExpiry,
      monthsUntilExpiry,
      urgency,
    };
  });

  return <FinanzenView financings={financings} />;
}
