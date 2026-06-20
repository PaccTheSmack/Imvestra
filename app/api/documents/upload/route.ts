import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const category = formData.get("category") as string
    const property_id = formData.get("property_id") as string || null
    const tenant_id = formData.get("tenant_id") as string || null
    const notes = formData.get("notes") as string || null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Datei zu groß (max. 50MB)" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const filePath = `${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Upload fehlgeschlagen" }, { status: 500 })
    }

    const { data: doc, error: dbError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        property_id: property_id || null,
        tenant_id: tenant_id || null,
        name: file.name.replace(/\.[^/.]+$/, ""),
        original_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        category: category || "sonstiges",
        notes: notes || null,
      })
      .select()
      .single()

    if (dbError) {
      await supabase.storage.from("documents").remove([filePath])
      return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 })
    }

    return NextResponse.json({ document: doc })
  } catch (error) {
    console.error("Upload route error:", error)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
