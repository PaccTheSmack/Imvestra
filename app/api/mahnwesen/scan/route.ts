import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getMahngebuehr,
  calculateVerzugszinsen,
  getZahlungsfrist,
  type MahnungPreview,
} from "@/lib/mahnwesen"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const today = new Date().toISOString().split("T")[0]

  const { data: overduePayments } = await supabase
    .from("rent_payments")
    .select("*, tenants(id, name, email), properties(id, name, address)")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .lt("due_date", today)
    .eq("mahnsperre", false)
    .order("due_date", { ascending: true })

  if (!overduePayments) return NextResponse.json({ previews: [] })

  const { data: existingMahnungen } = await supabase
    .from("mahnungen")
    .select("rent_payment_id, mahnstufe")
    .eq("user_id", user.id)
    .eq("status", "offen")

  const mahnungMap = new Map(
    existingMahnungen?.map((m) => [m.rent_payment_id, m.mahnstufe]) ?? []
  )

  const previews: MahnungPreview[] = overduePayments.map((payment) => {
    const faelligSeit = payment.due_date
    const tage = Math.floor(
      (new Date().getTime() - new Date(faelligSeit).getTime()) /
        (1000 * 60 * 60 * 24)
    )
    const existingStufe = (mahnungMap.get(payment.id) as number) ?? 0
    const mahnstufe = Math.min(3, existingStufe + 1) as 1 | 2 | 3
    const mahngebuehr = getMahngebuehr(mahnstufe)
    const verzugszinsen = calculateVerzugszinsen(payment.amount, faelligSeit)
    const gesamtbetrag = payment.amount + mahngebuehr + verzugszinsen
    const zahlungsfrist = getZahlungsfrist(today, mahnstufe)

    return {
      tenant_id: payment.tenant_id,
      property_id: payment.property_id,
      rent_payment_id: payment.id,
      tenantName: payment.tenants?.name ?? "Unbekannt",
      propertyName: payment.properties?.name ?? "Unbekannt",
      address: payment.properties?.address ?? "",
      betrag_offen: payment.amount,
      mahnstufe,
      mahngebuehr,
      verzugszinsen,
      gesamtbetrag,
      faellig_seit: faelligSeit,
      tage_ueberfaellig: tage,
      zahlungsfrist,
      email: payment.tenants?.email ?? null,
      mahnsperre: false,
    }
  })

  return NextResponse.json({ previews })
}
