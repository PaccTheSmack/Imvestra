import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { error } = await supabase
    .from("bewerber")
    .update({ status: "zusage", updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create smart task
  const today = new Date().toISOString().split("T")[0]
  const { data: bewerber } = await supabase
    .from("bewerber")
    .select("name")
    .eq("id", params.id)
    .single()

  if (bewerber) {
    await supabase.from("tasks").insert({
      user_id: user.id,
      title: `Mietvertrag erstellen — ${bewerber.name}`,
      description: "Zusage erteilt. Jetzt Mietvertrag anlegen.",
      priority: "high",
      category: "tenant",
      due_date: today,
      completed: false,
      source_type: "auto",
      action_type: "generic",
      action_payload: { redirect: `/mietvertraege`, bewerber_id: params.id },
    })
  }

  return NextResponse.json({ success: true })
}
