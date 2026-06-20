import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("bewerber")
    .select(`
      *,
      properties(name, address),
      inserate(titel, kaltmiete),
      selbstauskuenfte(id, ausgefuellt_am, zugangscode, nettoeinkommen, beschaeftigungsart, schufa_sauber)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { name, email, telefon, property_id, inserat_id, quelle, notizen, selbstauskunft_sofort } = body

  const { data: bewerber, error } = await supabase
    .from("bewerber")
    .insert({
      user_id: user.id,
      property_id,
      inserat_id: inserat_id || null,
      name,
      email,
      telefon: telefon || null,
      quelle: quelle || null,
      notizen: notizen || null,
      status: "neu",
    })
    .select()
    .single()

  if (error || !bewerber) return NextResponse.json({ error: error?.message }, { status: 500 })

  if (selbstauskunft_sofort) {
    await supabase.from("selbstauskuenfte").insert({
      bewerber_id: bewerber.id,
      user_id: user.id,
    })
    await supabase.from("bewerber").update({ status: "selbstauskunft_angefordert" }).eq("id", bewerber.id)
  }

  return NextResponse.json(bewerber)
}
