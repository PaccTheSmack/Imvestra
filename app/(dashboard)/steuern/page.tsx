import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SteuernView from "@/components/dashboard/SteuernView";
import type { Property, RentPayment, Expense, Financing } from "@/types";

export default async function SteuernPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const currentYear = new Date().getFullYear();

  const [
    { data: properties },
    { data: payments },
    { data: expenses },
    { data: financings },
  ] = await Promise.all([
    supabase.from("properties").select("*").eq("user_id", user.id),
    supabase.from("rent_payments").select("*").eq("user_id", user.id),
    supabase.from("expenses").select("*").eq("user_id", user.id),
    supabase.from("financings").select("*").eq("user_id", user.id),
  ]);

  return (
    <SteuernView
      properties={(properties ?? []) as Property[]}
      payments={(payments ?? []) as RentPayment[]}
      expenses={(expenses ?? []) as Expense[]}
      financings={(financings ?? []) as Financing[]}
      year={currentYear}
    />
  );
}
