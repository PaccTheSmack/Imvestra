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
    { data: unmatchedOld },
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
      .from("bank_transactions")
      .select("id, betrag, transaction_date, auftraggeber_name")
      .eq("user_id", userId)
      .eq("match_status", "unmatched")
      .lt("created_at", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()),
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

  // 1b. Unzugeordnete Transaktionen älter als 3 Tage
  for (const tx of unmatchedOld ?? []) {
    if (!isDuplicateByField("confirm_payment", "transaction_id", tx.id)) {
      tasksToCreate.push({
        user_id: userId,
        title: `Bankzahlung nicht zugeordnet — ${tx.auftraggeber_name || "Unbekannt"}`,
        description: `${tx.betrag}€ vom ${new Date(tx.transaction_date).toLocaleDateString("de-DE")} konnte keinem Mieter zugeordnet werden. Bitte manuell prüfen.`,
        priority: "medium",
        category: "financial",
        due_date: today,
        completed: false,
        source_type: "auto",
        action_type: "confirm_payment",
        action_payload: {
          transaction_id: tx.id,
          betrag: tx.betrag,
          redirect: "/bank",
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

  // 7. Einzugsprotokoll fehlt für neue Mieter
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0]

  const { data: newTenants } = await supabase
    .from("tenants")
    .select("id, name, move_in_date")
    .eq("user_id", userId)
    .eq("is_active", true)
    .gte("move_in_date", sevenDaysAgoStr)
    .lte("move_in_date", today)

  const { data: einzugProtokolle } = await supabase
    .from("uebergabeprotokolle")
    .select("tenant_id")
    .eq("user_id", userId)
    .eq("typ", "einzug")

  for (const tenant of newTenants ?? []) {
    const hasProtokoll = einzugProtokolle?.some(p => p.tenant_id === tenant.id)
    if (!hasProtokoll) {
      if (!isDuplicateByField("generic", "tenant_id", tenant.id)) {
        tasksToCreate.push({
          user_id: userId,
          property_id: null,
          title: `Einzugsprotokoll erstellen — ${tenant.name}`,
          description: `Neuer Mieter seit ${new Date(tenant.move_in_date).toLocaleDateString("de-DE")}. Übergabeprotokoll für den Einzug erstellen.`,
          priority: "high",
          category: "tenant",
          due_date: today,
          completed: false,
          source_type: "auto",
          action_type: "generic",
          action_payload: { redirect: "/uebergabe", tenant_id: tenant.id },
        })
      }
    }
  }

  // 8. Bewerber: Selbstauskunft prüfen
  const { data: bewerberAusgefuellt } = await supabase
    .from("bewerber")
    .select("id, name, score")
    .eq("user_id", userId)
    .eq("status", "selbstauskunft_ausgefuellt")

  for (const b of bewerberAusgefuellt ?? []) {
    if (!isDuplicateByField("generic", "bewerber_id", b.id)) {
      const score = b.score ?? 0
      tasksToCreate.push({
        user_id: userId,
        title: `Selbstauskunft prüfen — ${b.name}`,
        description: `Score: ${score}/100. Bewerbung jetzt prüfen.`,
        priority: score > 70 ? "high" : "medium",
        category: "tenant",
        due_date: today,
        completed: false,
        source_type: "auto",
        action_type: "generic",
        action_payload: { redirect: "/bewerber", bewerber_id: b.id },
      })
    }
  }

  // 9. Bewerber: DSGVO Löschfrist
  const twoWeeksLater = new Date()
  twoWeeksLater.setDate(twoWeeksLater.getDate() + 14)
  const { data: dsgvoBewerber } = await supabase
    .from("bewerber")
    .select("id, name, dsgvo_loeschdatum")
    .eq("user_id", userId)
    .eq("status", "absage")
    .lte("dsgvo_loeschdatum", twoWeeksLater.toISOString().split("T")[0])
    .gte("dsgvo_loeschdatum", today)

  for (const b of dsgvoBewerber ?? []) {
    if (!isDuplicateByField("generic", "bewerber_id", b.id)) {
      tasksToCreate.push({
        user_id: userId,
        title: `Bewerberdaten löschen (DSGVO) — ${b.name}`,
        description: `Daten müssen bis ${new Date(b.dsgvo_loeschdatum).toLocaleDateString("de-DE")} gelöscht werden.`,
        priority: "medium",
        category: "tenant",
        due_date: b.dsgvo_loeschdatum,
        completed: false,
        source_type: "auto",
        action_type: "generic",
        action_payload: { redirect: "/bewerber", bewerber_id: b.id },
      })
    }
  }

  // 10. Überfällige Instandhaltung
  const { data: ueberfaelligeInstandhaltung } = await supabase
    .from("instandhaltung")
    .select("id, titel, faellig_am, kosten_geschaetzt, prioritaet, property_id")
    .eq("user_id", userId)
    .eq("status", "offen")
    .lt("faellig_am", today)

  for (const item of ueberfaelligeInstandhaltung ?? []) {
    if (!isDuplicateByField("generic", "instandhaltung_id", item.id)) {
      tasksToCreate.push({
        user_id: userId,
        property_id: item.property_id,
        title: `ÜBERFÄLLIG: ${item.titel}`,
        description: `Wartung war fällig am ${new Date(item.faellig_am).toLocaleDateString("de-DE")}${item.kosten_geschaetzt ? `. Kosten: ca. ${item.kosten_geschaetzt}€` : ""}.`,
        priority: "high",
        category: "maintenance",
        due_date: today,
        completed: false,
        source_type: "auto",
        action_type: "generic",
        action_payload: { redirect: "/instandhaltung", instandhaltung_id: item.id },
      })
    }
  }

  // 11. Instandhaltung fällig in 30 Tagen
  const thirtyDaysLater = new Date()
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
  const thirtyDaysStr = thirtyDaysLater.toISOString().split("T")[0]

  const { data: baldFaellig } = await supabase
    .from("instandhaltung")
    .select("id, titel, faellig_am, kosten_geschaetzt, prioritaet, property_id")
    .eq("user_id", userId)
    .in("status", ["offen", "in_bearbeitung"])
    .gte("faellig_am", today)
    .lte("faellig_am", thirtyDaysStr)

  for (const item of baldFaellig ?? []) {
    if (!isDuplicateByField("generic", "instandhaltung_id", item.id)) {
      tasksToCreate.push({
        user_id: userId,
        property_id: item.property_id,
        title: `${item.titel} — Wartung fällig`,
        description: `Fällig am ${new Date(item.faellig_am).toLocaleDateString("de-DE")}${item.kosten_geschaetzt ? `. Kosten: ca. ${item.kosten_geschaetzt}€` : ""}.`,
        priority: item.prioritaet === "dringend" || item.prioritaet === "hoch" ? "high" : "medium",
        category: "maintenance",
        due_date: item.faellig_am,
        completed: false,
        source_type: "auto",
        action_type: "generic",
        action_payload: { redirect: "/instandhaltung", instandhaltung_id: item.id },
      })
    }
  }

  // 12. Jahresabrechnung Reminder (Oktober+)
  const currentMonth2 = new Date().getMonth() + 1
  if (currentMonth2 >= 10) {
    const lastYear = new Date().getFullYear() - 1
    const { data: jahresAbr } = await supabase
      .from("jahresabrechnungen")
      .select("id")
      .eq("user_id", userId)
      .eq("jahr", lastYear)
      .single()

    if (!jahresAbr && !isDuplicateByField("generic", "redirect", "/jahresabrechnung")) {
      tasksToCreate.push({
        user_id: userId,
        title: `Jahresabrechnung ${lastYear} erstellen`,
        description: `Steuererklärung vorbereiten. Anlage V + DATEV Export für ${lastYear}.`,
        priority: "medium",
        category: "financial",
        due_date: `${new Date().getFullYear()}-05-31`,
        completed: false,
        source_type: "auto",
        action_type: "generic",
        action_payload: { redirect: "/jahresabrechnung" },
      })
    }
  }

  if (tasksToCreate.length > 0) {
    await supabase.from("tasks").insert(tasksToCreate)
  }
}
