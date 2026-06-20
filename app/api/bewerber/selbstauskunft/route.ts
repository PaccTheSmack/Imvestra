import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { bewerber_id } = await request.json()

  // Verify ownership
  const { data: bewerber } = await supabase
    .from("bewerber")
    .select("id, name, email")
    .eq("id", bewerber_id)
    .eq("user_id", user.id)
    .single()

  if (!bewerber) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Check if already exists
  const { data: existing } = await supabase
    .from("selbstauskuenfte")
    .select("id, zugangscode, ausgefuellt_am")
    .eq("bewerber_id", bewerber_id)
    .single()

  if (existing && !existing.ausgefuellt_am) {
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/selbstauskunft/${existing.zugangscode}`
    return NextResponse.json({ zugangscode: existing.zugangscode, link })
  }

  // Create new
  const { data: auskunft, error } = await supabase
    .from("selbstauskuenfte")
    .insert({ bewerber_id, user_id: user.id })
    .select("zugangscode")
    .single()

  if (error || !auskunft) return NextResponse.json({ error: error?.message }, { status: 500 })

  // Update bewerber status
  await supabase
    .from("bewerber")
    .update({ status: "selbstauskunft_angefordert" })
    .eq("id", bewerber_id)

  const link = `${process.env.NEXT_PUBLIC_APP_URL}/selbstauskunft/${auskunft.zugangscode}`
  return NextResponse.json({ zugangscode: auskunft.zugangscode, link })
}
