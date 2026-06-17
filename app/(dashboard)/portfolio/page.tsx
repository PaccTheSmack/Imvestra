import { createClient } from "@/lib/supabase/server"
import PortfolioView from "@/components/dashboard/PortfolioView"
import type { Property, Financing, RentPayment, Expense } from "@/types"

export default async function PortfolioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: properties },
    { data: financings },
    { data: payments },
    { data: expenses },
  ] = await Promise.all([
    supabase.from("properties").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("financings").select("*, properties!inner(user_id)").eq("properties.user_id", user!.id),
    supabase.from("rent_payments").select("*").eq("user_id", user!.id),
    supabase.from("expenses").select("*").eq("user_id", user!.id),
  ])

  return (
    <PortfolioView
      properties={(properties ?? []) as Property[]}
      financings={(financings ?? []) as Financing[]}
      payments={(payments ?? []) as RentPayment[]}
      expenses={(expenses ?? []) as Expense[]}
    />
  )
}
