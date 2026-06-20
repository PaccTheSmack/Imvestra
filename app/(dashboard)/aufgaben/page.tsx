import { createClient } from "@/lib/supabase/server";
import AufgabenView from "@/components/dashboard/AufgabenView";
import type { Task } from "@/types";
import { generateSmartTasks } from "@/lib/smart-tasks";

type TaskWithProperty = Task & { properties?: { id: string; name: string } | null };

export default async function AufgabenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Regenerate smart tasks on every load (idempotent)
  await generateSmartTasks(supabase, user!.id)

  const [{ data: tasks }, { data: properties }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, properties(id, name)")
      .eq("user_id", user!.id)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("properties")
      .select("id, name")
      .eq("user_id", user!.id),
  ]);

  return (
    <AufgabenView
      tasks={(tasks ?? []) as TaskWithProperty[]}
      properties={properties ?? []}
    />
  );
}
