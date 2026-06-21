import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import NkaView from "@/components/dashboard/NkaView"

export default async function NkaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [
    { data: abrechnungen },
    { data: properties },
    { data: tenants },
    { data: documents },
  ] = await Promise.all([
    supabase
      .from("nka_abrechnungen")
      .select(`*, properties(name, address, sqm, units), nka_mieter_abrechnungen(id, status, saldo, mieter_name)`)
      .eq("user_id", user.id)
      .order("abrechnungsjahr", { ascending: false }),
    supabase
      .from("properties")
      .select("id, name, address, sqm, units")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("tenants")
      .select("id, name, email, property_id, move_in_date, move_out_date, rent_monthly, nk_vorauszahlung, wohnflaeche, einwohnerzahl")
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("documents")
      .select("id, name, category, created_at")
      .eq("user_id", user.id)
      .in("category", ["rechnung", "beleg"]),
  ])

  return (
    <Suspense fallback={null}>
      <NkaView
        abrechnungen={abrechnungen ?? []}
        properties={properties ?? []}
        tenants={tenants ?? []}
        documents={documents ?? []}
      />
    </Suspense>
  )
}
