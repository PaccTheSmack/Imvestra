import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("file_path, user_id, original_name")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!doc) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  }

  const { data: signedUrl } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.file_path, 3600)

  return NextResponse.json({ url: signedUrl?.signedUrl })
}
