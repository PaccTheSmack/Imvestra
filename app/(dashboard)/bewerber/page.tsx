import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import BewerberView from "@/components/dashboard/BewerberView"

export default async function BewerberPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [
    { data: bewerber },
    { data: properties },
    { data: inserate },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("bewerber")
      .select(`
        *,
        properties(name, address),
        inserate(titel, kaltmiete),
        selbstauskuenfte(id, ausgefuellt_am, zugangscode, nettoeinkommen, beschaeftigungsart, schufa_sauber, insolvenz, mietschulden, haustiere, raucher, arbeitgeber, aktuelle_adresse, einverstaendnis_datenschutz, anzahl_personen, vorname, nachname, geburtsdatum, beruf, beschaeftigt_seit, warum_diese_wohnung)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("properties").select("id, name, address, type").eq("user_id", user.id).order("name"),
    supabase.from("inserate").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("name").eq("id", user.id).single(),
  ])

  return (
    <BewerberView
      bewerber={bewerber ?? []}
      properties={properties ?? []}
      inserate={inserate ?? []}
      vermieterName={profile?.name ?? ""}
    />
  )
}
