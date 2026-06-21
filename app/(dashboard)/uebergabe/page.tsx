import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import UebergabeView from "@/components/dashboard/UebergabeView"

export default async function UebergabePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [
    { data: protokolle },
    { data: properties },
    { data: tenants },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("uebergabeprotokolle")
      .select(`
        *,
        properties(name, address),
        tenants(name),
        protokoll_raeume(id),
        protokoll_fotos(id)
      `)
      .eq("user_id", user.id)
      .order("datum", { ascending: false }),
    supabase
      .from("properties")
      .select("id, name, address, type")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("tenants")
      .select("id, name, email, property_id, move_in_date")
      .eq("user_id", user.id),
    supabase
      .from("profiles")
      .select("name, email")
      .eq("id", user.id)
      .single(),
  ])

  return (
    <Suspense fallback={null}>
      <UebergabeView
        protokolle={protokolle ?? []}
        properties={properties ?? []}
        tenants={tenants ?? []}
        vermieterName={profile?.name ?? ""}
      />
    </Suspense>
  )
}
