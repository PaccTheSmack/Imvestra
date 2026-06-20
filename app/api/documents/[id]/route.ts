import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(
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
    .select("file_path")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!doc) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  }

  await supabase.storage.from("documents").remove([doc.file_path])
  await supabase.from("documents").delete().eq("id", params.id)

  return NextResponse.json({ success: true })
}
