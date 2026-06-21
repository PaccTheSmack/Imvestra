import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JahresabrechnungView from "@/components/dashboard/JahresabrechnungView";
import { berechneJahresabrechnung } from "@/lib/jahresabrechnung";
import type { Property, RentPayment, Expense, Financing } from "@/types";

export default async function JahresabrechnungPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const props = (properties ?? []) as Property[];
  const pmnts = (payments ?? []) as RentPayment[];
  const exps = (expenses ?? []) as Expense[];
  const fins = (financings ?? []) as Financing[];

  const years = [currentYear - 1, currentYear - 2, currentYear - 3];
  const jahresData: Record<number, ReturnType<typeof berechneJahresabrechnung>> = {};
  for (const jahr of years) {
    jahresData[jahr] = berechneJahresabrechnung(props, pmnts, exps, fins, jahr);
  }

  return (
    <JahresabrechnungView
      jahresData={jahresData}
      defaultJahr={currentYear - 1}
    />
  );
}
