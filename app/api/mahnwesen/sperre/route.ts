import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { payment_id, aktiv, grund } = await request.json()

  await supabase
    .from("rent_payments")
    .update({
      mahnsperre: aktiv,
      mahnsperre_grund: aktiv ? grund : null,
    })
    .eq("id", payment_id)
    .eq("user_id", user.id)

  return NextResponse.json({ success: true })
}
