import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getZahlungsfrist,
  getMahngebuehr,
  calculateVerzugszinsen,
} from "@/lib/mahnwesen"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { selectedIds, versand_methode } = await request.json()
  const today = new Date().toISOString().split("T")[0]

  const { data: payments } = await supabase
    .from("rent_payments")
    .select("*, tenants(name, email), properties(name, address)")
    .in("id", selectedIds)
    .eq("user_id", user.id)

  if (!payments) {
    return NextResponse.json({ error: "Zahlungen nicht gefunden" }, { status: 404 })
  }

  const created = []

  for (const payment of payments) {
    const { data: existing } = await supabase
      .from("mahnungen")
      .select("mahnstufe")
      .eq("rent_payment_id", payment.id)
      .order("mahnstufe", { ascending: false })
      .limit(1)
      .maybeSingle()

    const mahnstufe = Math.min(3, (existing?.mahnstufe ?? 0) + 1) as 1 | 2 | 3
    const mahngebuehr = getMahngebuehr(mahnstufe)
    const verzugszinsen = calculateVerzugszinsen(payment.amount, payment.due_date)
    const gesamtbetrag = payment.amount + mahngebuehr + verzugszinsen

    const { data: mahnung } = await supabase
      .from("mahnungen")
      .insert({
        user_id: user.id,
        tenant_id: payment.tenant_id,
        property_id: payment.property_id,
        rent_payment_id: payment.id,
        mahnstufe,
        betrag_offen: payment.amount,
        mahngebuehr,
        verzugszinsen,
        gesamtbetrag,
        faellig_seit: payment.due_date,
        mahndatum: today,
        zahlungsfrist: getZahlungsfrist(today, mahnstufe),
        status: "offen",
        versand_methode: versand_methode ?? "email",
        versandt_an_email: payment.tenants?.email ?? null,
      })
      .select()
      .single()

    if (mahnung) created.push(mahnung)
  }

  return NextResponse.json({ created, count: created.length })
}
