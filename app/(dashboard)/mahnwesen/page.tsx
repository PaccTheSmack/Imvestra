import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import MahnwesenView from "@/components/dashboard/MahnwesenView"

export default async function MahnwesenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: mahnungen }, { data: profile }] = await Promise.all([
    supabase
      .from("mahnungen")
      .select("*, tenants(name, email), properties(name, address)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single(),
  ])

  return (
    <MahnwesenView
      mahnungen={mahnungen ?? []}
      vermieterName={profile?.name ?? "Vermieter"}
    />
  )
}
