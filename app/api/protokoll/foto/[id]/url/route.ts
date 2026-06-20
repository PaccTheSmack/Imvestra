import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: foto } = await supabase
    .from("protokoll_fotos")
    .select("file_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!foto) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data: signed } = await supabase.storage
    .from("protokoll-fotos")
    .createSignedUrl(foto.file_path, 3600)

  return NextResponse.json({ url: signed?.signedUrl ?? null })
}
