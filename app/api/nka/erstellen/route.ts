import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const {
    property_id,
    abrechnungsjahr,
    zeitraum_von,
    zeitraum_bis,
    positionen,
    mieter,
    berechnungen,
  } = await request.json()

  // Create main abrechnung
  const gesamtkosten = (positionen as Array<{ gesamtbetrag: number }>).reduce((s: number, p) => s + p.gesamtbetrag, 0)
  const vorauszahlungenGesamt = (berechnungen as Array<{ vorauszahlungen_gesamt: number }>).reduce((s: number, b) => s + b.vorauszahlungen_gesamt, 0)
  const mieterAnteilGesamt = (berechnungen as Array<{ kosten_gesamt: number }>).reduce((s: number, b) => s + b.kosten_gesamt, 0)
  const saldoGesamt = (berechnungen as Array<{ saldo: number }>).reduce((s: number, b) => s + b.saldo, 0)

  const { data: abrechnung, error: abrErr } = await supabase
    .from("nka_abrechnungen")
    .insert({
      user_id: user.id,
      property_id,
      abrechnungsjahr,
      zeitraum_von,
      zeitraum_bis,
      status: "berechnet",
      gesamtkosten,
      mieter_anteil_gesamt: mieterAnteilGesamt,
      vorauszahlungen_gesamt: vorauszahlungenGesamt,
      saldo_gesamt: saldoGesamt,
    })
    .select("id")
    .single()

  if (abrErr || !abrechnung) {
    return NextResponse.json({ error: abrErr?.message ?? "Insert failed" }, { status: 500 })
  }

  const abrechnungId = abrechnung.id

  // Insert positions
  const positionRows = (positionen as Array<{
    kostenart: string
    kostenart_nr: number | null
    bezeichnung: string
    gesamtbetrag: number
    umlageschluessel: string
    document_id: string | null
    beleg_datum: string
    notizen: string
  }>).map((p, i) => ({
    abrechnung_id: abrechnungId,
    user_id: user.id,
    property_id,
    kostenart: p.kostenart,
    kostenart_nr: p.kostenart_nr ?? null,
    bezeichnung: p.bezeichnung,
    gesamtbetrag: p.gesamtbetrag,
    umlageschluessel: p.umlageschluessel,
    document_id: p.document_id ?? null,
    beleg_datum: p.beleg_datum || null,
    notizen: p.notizen || null,
    sort_order: i,
  }))

  if (positionRows.length > 0) {
    const { error: posErr } = await supabase.from("nka_positionen").insert(positionRows)
    if (posErr) return NextResponse.json({ error: posErr.message }, { status: 500 })
  }

  // Insert mieter abrechnungen
  const mieterRows = (berechnungen as Array<{
    tenant_id: string
    mieter_name: string
    zeitraum_von: string
    zeitraum_bis: string
    tage_anteil: number
    kosten_gesamt: number
    vorauszahlungen_gesamt: number
    saldo: number
  }>).map(b => {
    const mData = (mieter as Array<{
      id: string
      wohnflaeche_edit: number
      einwohnerzahl_edit: number
      vorauszahlung_edit: number
      email: string | null
      move_in_date: string | null
    }>).find(m => m.id === b.tenant_id)
    return {
      abrechnung_id: abrechnungId,
      tenant_id: b.tenant_id,
      user_id: user.id,
      mieter_name: b.mieter_name,
      mieter_email: mData?.email ?? null,
      einzugsdatum: mData?.move_in_date ?? zeitraum_von,
      wohnflaeche: mData?.wohnflaeche_edit ?? 0,
      einwohnerzahl: mData?.einwohnerzahl_edit ?? 1,
      vorauszahlungen_monatlich: mData?.vorauszahlung_edit ?? 0,
      vorauszahlungen_gesamt: b.vorauszahlungen_gesamt,
      kosten_gesamt: b.kosten_gesamt,
      saldo: b.saldo,
      status: "offen",
      zeitraum_von: b.zeitraum_von,
      zeitraum_bis: b.zeitraum_bis,
      tage_anteil: b.tage_anteil,
    }
  })

  if (mieterRows.length > 0) {
    const { error: mieterErr } = await supabase.from("nka_mieter_abrechnungen").insert(mieterRows)
    if (mieterErr) return NextResponse.json({ error: mieterErr.message }, { status: 500 })
  }

  return NextResponse.json({ id: abrechnungId, success: true })
}
