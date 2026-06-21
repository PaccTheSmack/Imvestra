import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import BankView from "@/components/dashboard/BankView"

export default async function BankPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [
    { data: transactions },
    { data: tenants },
    { data: bankAccounts },
    { data: pendingPayments },
  ] = await Promise.all([
    supabase
      .from("bank_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .limit(100),
    supabase
      .from("tenants")
      .select("id, name, rent_monthly, rent_payments(id, amount, due_date, status)")
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("bank_accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("rent_payments")
      .select("id, amount, due_date, tenant_id, tenants(name)")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("due_date", { ascending: false })
      .limit(50),
  ])

  return (
    <BankView
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transactions={(transactions ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tenants={(tenants ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bankAccounts={(bankAccounts ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pendingPayments={(pendingPayments ?? []) as any}
    />
  )
}
