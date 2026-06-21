import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SteuernView from "@/components/dashboard/SteuernView";
import { Receipt } from "@phosphor-icons/react/dist/ssr";
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
    <>
      <Link
        href="/jahresabrechnung"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(160,120,48,0.06)",
          border: "1px solid rgba(160,120,48,0.15)",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "16px",
          textDecoration: "none",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Receipt size={18} color="#A07830" weight="regular" />
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#101418" }}>
            Jahresabrechnung &amp; DATEV Export
          </span>
        </span>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#A07830" }}>
          Öffnen →
        </span>
      </Link>
      <SteuernView
        properties={(properties ?? []) as Property[]}
        payments={(payments ?? []) as RentPayment[]}
        expenses={(expenses ?? []) as Expense[]}
        financings={(financings ?? []) as Financing[]}
        year={currentYear}
      />
    </>
  );
}
