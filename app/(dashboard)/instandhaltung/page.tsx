import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import InstandhaltungView from "@/components/dashboard/InstandhaltungView"

export default async function InstandhaltungPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [
    { data: aufgaben },
    { data: properties },
    { data: vorlagen },
  ] = await Promise.all([
    supabase
      .from("instandhaltung")
      .select("*")
      .eq("user_id", user.id)
      .order("faellig_am", { ascending: true }),
    supabase
      .from("properties")
      .select("*")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("instandhaltung_vorlagen")
      .select("*")
      .or(`user_id.eq.${user.id},user_id.eq.00000000-0000-0000-0000-000000000000`)
      .order("titel"),
  ])

  return (
    <InstandhaltungView
      aufgaben={aufgaben ?? []}
      properties={properties ?? []}
      vorlagen={vorlagen ?? []}
    />
  )
}
