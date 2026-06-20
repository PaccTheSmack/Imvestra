import type { SupabaseClient } from "@supabase/supabase-js"

export async function generateSmartTasks(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const today = new Date().toISOString().split("T")[0]

  const [
    { data: payments },
    { data: mahnungen },
    { data: transactions },
    { data: financings },
    { data: existingTasks },
  ] = await Promise.all([
    supabase
      .from("rent_payments")
      .select("*, tenants(name), properties(name)")
      .eq("user_id", userId)
      .eq("status", "pending")
      .lt("due_date", today),
    supabase
      .from("mahnungen")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "offen"),
    supabase
      .from("bank_transactions")
      .select("*, tenants(name)")
      .eq("user_id", userId)
      .eq("match_status", "suggested"),
    supabase
      .from("financings")
      .select("*, properties(name)")
      .eq("user_id", userId),
    supabase
      .from("tasks")
      .select("action_type, action_payload")
      .eq("user_id", userId)
      .eq("completed", false)
      .eq("source_type", "auto"),
  ])

  const tasksToCreate: Record<string, unknown>[] = []

  function isDuplicate(type: string, id: string): boolean {
    return existingTasks?.some(
      (t) =>
        t.action_type === type &&
        (t.action_payload as Record<string, unknown>)?.payment_id === id
    ) ?? false
  }

  function isDuplicateByField(type: string, field: string, value: string): boolean {
    return existingTasks?.some(
      (t) =>
        t.action_type === type &&
        (t.action_payload as Record<string, unknown>)?.[field] === value
    ) ?? false
  }

  // 1. Unbestätigte Bankzahlungen
  for (const tx of transactions ?? []) {
    if (!isDuplicateByField("confirm_payment", "transaction_id", tx.id)) {
      tasksToCreate.push({
        user_id: userId,
        title: `Zahlung prüfen — ${(tx.tenants as { name: string } | null)?.name ?? "Unbekannt"}`,
        description: `${tx.betrag}€ eingegangen am ${new Date(tx.transaction_date).toLocaleDateString("de-DE")}. Bitte Zuordnung prüfen und bestätigen.`,
        priority: "medium",
        category: "financial",
        due_date: today,
        completed: false,
        source_type: "auto",
        action_type: "confirm_payment",
        action_payload: {
          transaction_id: tx.id,
          suggested_tenant_id: tx.suggested_tenant_id,
          betrag: tx.betrag,
          confidence: tx.match_confidence ?? 0,
        },
      })
    }
  }

  // 2. Überfällige Zahlungen → Mahnung empfohlen
  for (const payment of payments ?? []) {
    const tage = Math.floor(
      (new Date().getTime() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24)
    )
    const hasMahnung = mahnungen?.some((m) => m.rent_payment_id === payment.id)
    const tenantName = (payment.tenants as { name: string } | null)?.name ?? "Unbekannt"

    if (tage >= 3 && !hasMahnung) {
      if (!isDuplicate("create_mahnung", payment.id)) {
        tasksToCreate.push({
          user_id: userId,
          property_id: payment.property_id,
          title: `Mahnung empfohlen — ${tenantName}`,
          description: `Miete ${payment.amount}€ ist seit ${tage} Tagen überfällig. Mahnung mit einem Klick erstellen.`,
          priority: tage > 14 ? "high" : "medium",
          category: "financial",
          due_date: today,
          completed: false,
          source_type: "auto",
          action_type: "create_mahnung",
          action_payload: {
            payment_id: payment.id,
            tenant_id: payment.tenant_id,
            betrag: payment.amount,
            tage_ueberfaellig: tage,
          },
        })
      }
    }
  }

  // 3. Mahnung Eskalation
  for (const mahnung of mahnungen ?? []) {
    if (mahnung.zahlungsfrist < today && mahnung.mahnstufe < 3) {
      if (!isDuplicateByField("create_mahnung", "existing_mahnung_id", mahnung.id)) {
        tasksToCreate.push({
          user_id: userId,
          title: `${mahnung.mahnstufe + 1}. Mahnung empfohlen`,
          description: `Zahlungsfrist der ${mahnung.mahnstufe}. Mahnung ist abgelaufen. Nächste Mahnstufe empfohlen.`,
          priority: "high",
          category: "financial",
          due_date: today,
          completed: false,
          source_type: "auto",
          action_type: "create_mahnung",
          action_payload: {
            existing_mahnung_id: mahnung.id,
            new_mahnstufe: mahnung.mahnstufe + 1,
            tenant_id: mahnung.tenant_id,
          },
        })
      }
    }
  }

  // 4. Zinsbindung
  for (const fin of financings ?? []) {
    if (!fin.fixed_until) continue
    const daysUntil = Math.floor(
      (new Date(fin.fixed_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntil <= 180 && daysUntil > 0) {
      if (!isDuplicateByField("check_zinsbindung", "financing_id", fin.id)) {
        tasksToCreate.push({
          user_id: userId,
          property_id: fin.property_id,
          title: `Zinsbindung läuft ab — ${(fin.properties as { name: string } | null)?.name ?? "Objekt"}`,
          description: `Zinsbindung endet am ${new Date(fin.fixed_until).toLocaleDateString("de-DE")}. Anschlussfinanzierung prüfen.`,
          priority: daysUntil <= 90 ? "high" : "medium",
          category: "financial",
          due_date: fin.fixed_until,
          completed: false,
          source_type: "auto",
          action_type: "check_zinsbindung",
          action_payload: { financing_id: fin.id },
        })
      }
    }
  }

  // 5. NKA Frist (ab September)
  const currentMonth = new Date().getMonth() + 1
  if (currentMonth >= 9) {
    const letzteJahr = new Date().getFullYear() - 1
    const { data: nkaProps } = await supabase
      .from("properties")
      .select("id, name")
      .eq("user_id", userId)

    const { data: vorhandeneNka } = await supabase
      .from("nka_abrechnungen")
      .select("property_id, abrechnungsjahr, status")
      .eq("user_id", userId)
      .eq("abrechnungsjahr", letzteJahr)

    for (const prop of nkaProps ?? []) {
      const nka = vorhandeneNka?.find(n => n.property_id === prop.id)
      if (!nka) {
        if (!isDuplicateByField("generic", "property_id", prop.id)) {
          tasksToCreate.push({
            user_id: userId,
            property_id: prop.id,
            title: `NKA ${letzteJahr} erstellen — ${prop.name}`,
            description: `Nebenkostenabrechnung ${letzteJahr} noch ausstehend. Frist: 31.12.${new Date().getFullYear()} (§556 BGB).`,
            priority: currentMonth >= 11 ? "high" : "medium",
            category: "financial",
            due_date: `${new Date().getFullYear()}-12-31`,
            completed: false,
            source_type: "auto",
            action_type: "generic",
            action_payload: { property_id: prop.id, redirect: "/nebenkostenabrechnung" },
          })
        }
      } else if (nka.status === "entwurf") {
        if (!isDuplicateByField("generic", "property_id", prop.id)) {
          tasksToCreate.push({
            user_id: userId,
            property_id: prop.id,
            title: `NKA ${letzteJahr} finalisieren — ${prop.name}`,
            description: `Entwurf vorhanden. Bitte finalisieren und an Mieter versenden.`,
            priority: "high",
            category: "financial",
            due_date: `${new Date().getFullYear()}-12-31`,
            completed: false,
            source_type: "auto",
            action_type: "generic",
            action_payload: { property_id: prop.id, redirect: "/nebenkostenabrechnung" },
          })
        }
      }
    }
  }

  // 6. Mietvertrag fehlt / läuft ab
  const { data: activeTenants } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("user_id", userId)
    .eq("is_active", true)

  const { data: allVertraege } = await supabase
    .from("mietvertraege")
    .select("tenant_id, mietende, befristet, status")
    .eq("user_id", userId)
    .neq("status", "archiviert")

  for (const tenant of activeTenants ?? []) {
    const vertrag = allVertraege?.find(v => v.tenant_id === tenant.id)
    if (!vertrag) {
      if (!isDuplicateByField("generic", "tenant_id", tenant.id)) {
        tasksToCreate.push({
          user_id: userId,
          property_id: null,
          title: `Mietvertrag fehlt — ${tenant.name}`,
          description: `Für ${tenant.name} ist kein digitaler Mietvertrag hinterlegt. Jetzt erstellen.`,
          priority: "low",
          category: "tenant",
          due_date: null,
          completed: false,
          source_type: "auto",
          action_type: "generic",
          action_payload: { redirect: "/mietvertraege", tenant_id: tenant.id },
        })
      }
    } else if (vertrag.befristet && vertrag.mietende) {
      const daysLeft = Math.floor((new Date(vertrag.mietende).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 90 && daysLeft >= 0) {
        if (!isDuplicateByField("generic", "tenant_id", tenant.id)) {
          tasksToCreate.push({
            user_id: userId,
            property_id: null,
            title: `Mietvertrag läuft ab — ${tenant.name}`,
            description: `Befristeter Mietvertrag endet am ${new Date(vertrag.mietende).toLocaleDateString("de-DE")}. Verlängern oder Auszug vorbereiten.`,
            priority: "high",
            category: "tenant",
            due_date: vertrag.mietende,
            completed: false,
            source_type: "auto",
            action_type: "generic",
            action_payload: { redirect: "/mietvertraege", tenant_id: tenant.id },
          })
        }
      }
    }
  }

  if (tasksToCreate.length > 0) {
    await supabase.from("tasks").insert(tasksToCreate)
  }
}
