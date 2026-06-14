import { createClient } from "@/lib/supabase/server";
import FinanzenHub from "@/components/dashboard/FinanzenHub";
import type { Property, Tenant, RentPayment, Expense } from "@/types";

export default async function FinanzenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: properties },
    { data: tenants },
    { data: payments },
    { data: expenses },
    { data: financings },
  ] = await Promise.all([
    supabase.from("properties").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("tenants").select("*").eq("user_id", user!.id),
    supabase.from("rent_payments").select("*").eq("user_id", user!.id).order("due_date", { ascending: false }),
    supabase.from("expenses").select("*").eq("user_id", user!.id).order("date", { ascending: false }),
    supabase
      .from("financings")
      .select("*, properties(id, name, type, purchase_price)")
      .eq("user_id", user!.id)
      .order("fixed_until", { ascending: true, nullsFirst: false }),
  ]);

  return (
    <FinanzenHub
      properties={(properties ?? []) as Property[]}
      tenants={(tenants ?? []) as Tenant[]}
      payments={(payments ?? []) as RentPayment[]}
      expenses={(expenses ?? []) as Expense[]}
      financings={financings ?? []}
    />
  );
}
