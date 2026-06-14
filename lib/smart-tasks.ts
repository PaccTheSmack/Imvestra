import { createClient } from "@/lib/supabase/client";

interface SmartTaskRule {
  source_type: string;
  source_id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  category: string;
  due_date?: string;
  property_id?: string;
}

export async function generateSmartTasks(userId: string): Promise<{ created: number }> {
  const supabase = createClient();

  const [
    { data: financings },
    { data: tenants },
    { data: properties },
    { data: existingAuto },
  ] = await Promise.all([
    supabase.from("financings").select("*, properties(id, name)").eq("user_id", userId),
    supabase.from("tenants").select("*").eq("user_id", userId).eq("is_active", true),
    supabase.from("properties").select("*").eq("user_id", userId),
    supabase.from("tasks")
      .select("source_type, source_id")
      .eq("user_id", userId)
      .eq("auto_generated", true)
      .eq("completed", false),
  ]);

  const existing = new Set(
    existingAuto?.map((t) => `${t.source_type}:${t.source_id}`) ?? []
  );

  const rules: SmartTaskRule[] = [];
  const today = new Date();

  // ── Finanzierungen ─────────────────────────────────────────────────────────
  financings?.forEach((f) => {
    if (!f.fixed_until) return;
    const expiry  = new Date(f.fixed_until);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const propName = (f as any).properties?.name ?? "Objekt";

    if (daysLeft < 0) {
      rules.push({
        source_type: "financing_expired",
        source_id: f.id,
        title: `Zinsbindung abgelaufen – ${propName}`,
        description: `Die Zinsbindung für ${propName} ist seit ${Math.abs(daysLeft)} Tagen abgelaufen. Sofort Anschlussfinanzierung klären.`,
        priority: "high",
        category: "financial",
        property_id: f.property_id,
      });
    } else if (daysLeft <= 180) {
      rules.push({
        source_type: "financing_critical",
        source_id: f.id,
        title: `Zinsbindung läuft bald aus – ${propName}`,
        description: `Noch ${daysLeft} Tage bis zur Zinsbindung. Jetzt Angebote einholen.`,
        priority: "high",
        category: "financial",
        due_date: f.fixed_until,
        property_id: f.property_id,
      });
    } else if (daysLeft <= 365) {
      rules.push({
        source_type: "financing_warning",
        source_id: f.id,
        title: `Anschlussfinanzierung vorbereiten – ${propName}`,
        description: `Zinsbindung läuft in ${Math.ceil(daysLeft / 30)} Monaten aus. Jetzt Vergleiche starten.`,
        priority: "medium",
        category: "financial",
        due_date: new Date(expiry.getTime() - 90 * 86400000).toISOString().split("T")[0],
        property_id: f.property_id,
      });
    }
  });

  // ── Mieter ─────────────────────────────────────────────────────────────────
  tenants?.forEach((t) => {
    const moveIn      = new Date(t.move_in_date);
    const monthsRented = Math.floor((today.getTime() - moveIn.getTime()) / (86400000 * 30));

    if (monthsRented > 0 && monthsRented % 12 >= 11) {
      const year = moveIn.getFullYear() + Math.floor(monthsRented / 12);
      rules.push({
        source_type: "nka_due",
        source_id: `${t.id}_${year}`,
        title: `Nebenkostenabrechnung ${year} – ${t.name}`,
        description: `Jährliche Nebenkostenabrechnung für Mieter ${t.name} erstellen.`,
        priority: "medium",
        category: "tenant",
        due_date: new Date(year + 1, 0, 31).toISOString().split("T")[0],
        property_id: t.property_id,
      });
    }

    if (monthsRented > 0 && monthsRented % 24 >= 22) {
      rules.push({
        source_type: "rent_adjustment",
        source_id: `${t.id}_adj_${Math.floor(monthsRented / 24)}`,
        title: `Mietanpassung prüfen – ${t.name}`,
        description: `${t.name} wohnt seit über ${Math.floor(monthsRented / 12)} Jahren. Mieterhöhung gemäß Mietspiegel prüfen.`,
        priority: "low",
        category: "tenant",
        property_id: t.property_id,
      });
    }
  });

  // ── Objekte ────────────────────────────────────────────────────────────────
  properties?.forEach((p) => {
    const hasActiveTenant = tenants?.some((t) => t.property_id === p.id);
    if (!hasActiveTenant) {
      rules.push({
        source_type: "no_tenant",
        source_id: p.id,
        title: `Objekt nicht vermietet – ${p.name}`,
        description: `${p.name} hat keinen aktiven Mieter. Leerstand kostet Rendite.`,
        priority: "medium",
        category: "general",
        property_id: p.id,
      });
    }
  });

  // ── System / Wiederkehrend ─────────────────────────────────────────────────
  const cm = today.getMonth() + 1;
  const cy = today.getFullYear();

  if (cm >= 1 && cm <= 3) {
    rules.push({
      source_type: "tax_return",
      source_id: `tax_${cy}`,
      title: `Steuererklärung ${cy} vorbereiten`,
      description: `Anlage V (Einkünfte aus Vermietung) für ${cy} beim Steuerberater einreichen.`,
      priority: "medium",
      category: "financial",
      due_date: `${cy}-07-31`,
    });
  }

  if (cm === 12 || cm === 1) {
    rules.push({
      source_type: "nka_annual",
      source_id: `nka_${cy}`,
      title: `Nebenkostenabrechnung ${cy} erstellen`,
      description: `Jährliche Nebenkostenabrechnung für alle Objekte bis 31. März erstellen.`,
      priority: "medium",
      category: "tenant",
      due_date: `${cy + (cm === 12 ? 1 : 0)}-03-31`,
    });
  }

  // ── Insert ─────────────────────────────────────────────────────────────────
  const toInsert = rules.filter((r) => !existing.has(`${r.source_type}:${r.source_id}`));
  if (toInsert.length === 0) return { created: 0 };

  const { error } = await supabase.from("tasks").insert(
    toInsert.map((r) => ({
      user_id:        userId,
      title:          r.title,
      description:    r.description,
      priority:       r.priority,
      category:       r.category,
      due_date:       r.due_date ?? null,
      property_id:    r.property_id ?? null,
      source_type:    r.source_type,
      source_id:      r.source_id,
      auto_generated: true,
      completed:      false,
    }))
  );

  if (error) console.error("Smart tasks error:", error);
  return { created: toInsert.length };
}
