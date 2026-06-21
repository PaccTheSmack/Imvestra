import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { berechneScore } from "@/lib/bewerber-scoring"

export async function POST(request: NextRequest, { params }: { params: { code: string } }) {
  const supabase = await createClient()

  // Find by zugangscode (public — no auth)
  const { data: auskunft } = await supabase
    .from("selbstauskuenfte")
    .select(`
      id, bewerber_id, ausgefuellt_am, abgelaufen_am,
      bewerber(id, user_id, inserate(kaltmiete), properties(id))
    `)
    .eq("zugangscode", params.code)
    .single()

  if (!auskunft) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  if (auskunft.ausgefuellt_am) return NextResponse.json({ error: "Bereits ausgefüllt" }, { status: 409 })
  if (new Date(auskunft.abgelaufen_am) < new Date()) return NextResponse.json({ error: "Abgelaufen" }, { status: 410 })

  const body = await request.json()

  // Sanitize: empty strings → null (prevents date column parse errors)
  const sanitized = Object.fromEntries(
    Object.entries(body as Record<string, unknown>).map(([k, v]) => [k, v === "" ? null : v])
  )

  // Save form data
  const { error: updateErr } = await supabase
    .from("selbstauskuenfte")
    .update({
      ...sanitized,
      ausgefuellt_am: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("zugangscode", params.code)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Update bewerber status
  const bewerberData = auskunft.bewerber as unknown as { id: string; user_id: string; inserate: { kaltmiete: number }[] | null } | null
  if (bewerberData) {
    const inseratArr = Array.isArray(bewerberData.inserate) ? bewerberData.inserate : []
    const kaltmiete = inseratArr[0]?.kaltmiete ?? 1000
    const score = berechneScore(body, kaltmiete)

    await supabase
      .from("bewerber")
      .update({
        status: "selbstauskunft_ausgefuellt",
        score: score.gesamt,
        score_details: score as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq("id", auskunft.bewerber_id)

    // Smart task for vermieter
    const today = new Date().toISOString().split("T")[0]
    const { data: bData } = await supabase.from("bewerber").select("name").eq("id", auskunft.bewerber_id).single()
    if (bData) {
      await supabase.from("tasks").insert({
        user_id: bewerberData.user_id,
        title: `Selbstauskunft prüfen — ${bData.name}`,
        description: `Score: ${score.gesamt}/100 · ${score.empfehlung === "stark" ? "Sehr empfohlen" : score.empfehlung === "gut" ? "Empfohlen" : score.empfehlung === "pruefen" ? "Genau prüfen" : "Nicht empfohlen"}. Jetzt prüfen.`,
        priority: score.gesamt > 70 ? "high" : "medium",
        category: "tenant",
        due_date: today,
        completed: false,
        source_type: "auto",
        action_type: "generic",
        action_payload: { redirect: "/bewerber" },
      })
    }
  }

  return NextResponse.json({ success: true })
}
