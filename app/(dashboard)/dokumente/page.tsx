import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DokumenteView from "@/components/dashboard/DokumenteView"

export default async function DokumentePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [
    { data: documents },
    { data: properties },
    { data: tenants },
  ] = await Promise.all([
    supabase
      .from("documents")
      .select("*, properties(name), tenants(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("properties")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("tenants")
      .select("id, name, property_id")
      .eq("user_id", user.id)
      .order("name"),
  ])

  return (
    <DokumenteView
      documents={documents ?? []}
      properties={properties ?? []}
      tenants={tenants ?? []}
    />
  )
}
