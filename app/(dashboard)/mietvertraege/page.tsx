import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import MietvertraegeView from "@/components/dashboard/MietvertraegeView"

export default async function MietvertraegePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [
    { data: mietvertraege },
    { data: properties },
    { data: tenants },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("mietvertraege")
      .select("*, properties(name), tenants(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("properties")
      .select("id, name, address, type")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("tenants")
      .select("id, name, email, phone, property_id, move_in_date, rent_monthly, nk_vorauszahlung")
      .eq("user_id", user.id),
    supabase
      .from("profiles")
      .select("name, email")
      .eq("id", user.id)
      .single(),
  ])

  return (
    <Suspense fallback={null}>
      <MietvertraegeView
        mietvertraege={mietvertraege ?? []}
        properties={properties ?? []}
        tenants={tenants ?? []}
        vermieterName={profile?.name ?? ""}
        vermieterEmail={profile?.email ?? ""}
      />
    </Suspense>
  )
}
