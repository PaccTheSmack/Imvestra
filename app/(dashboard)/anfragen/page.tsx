import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AnfragenView from "@/components/dashboard/AnfragenView"

export default async function AnfragenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: anfragen } = await supabase
    .from("mieter_anfragen")
    .select("*, mieter_accounts(mieter_name), tenants(name), properties(name)")
    .eq("vermieter_id", user.id)
    .order("created_at", { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <AnfragenView anfragen={(anfragen ?? []) as any} />
}
