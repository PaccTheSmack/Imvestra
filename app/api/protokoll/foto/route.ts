import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const protokoll_id = formData.get("protokoll_id") as string | null
  const raum_id = formData.get("raum_id") as string | null
  const beschreibung = formData.get("beschreibung") as string | null

  if (!file || !protokoll_id) {
    return NextResponse.json({ error: "Missing file or protokoll_id" }, { status: 400 })
  }

  const ext = file.name.split(".").pop() ?? "jpg"
  const filePath = `${user.id}/${protokoll_id}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("protokoll-fotos")
    .upload(filePath, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: foto, error: dbError } = await supabase
    .from("protokoll_fotos")
    .insert({
      protokoll_id,
      raum_id: raum_id || null,
      user_id: user.id,
      file_path: filePath,
      file_name: file.name,
      beschreibung: beschreibung || null,
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ foto })
}
