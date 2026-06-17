import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// CHANGE THIS to your user ID from Supabase Auth dashboard
const USER_ID = "ceade153-87f2-4952-bc10-dd7a877634f9"

async function seed() {
  // 1. Update profile to Manager plan
  await supabase.from("profiles").update({
    plan: "manager",
    name: "Pascal Schwarze",
  }).eq("id", USER_ID)

  // 2. Insert properties
  const { data: properties } = await supabase
    .from("properties")
    .insert([
      {
        user_id: USER_ID,
        name: "Altbauwohnung Goslar",
        address: "Rosentorstraße 12, 38640 Goslar",
        type: "ETW",
        build_year: 1968,
        sqm: 68,
        purchase_price: 185000,
        ancillary_costs_pct: 0.10,
        market_value: 195000,
        rent_monthly: 850,
        monthly_rate: 720,
        units: 1,
      },
      {
        user_id: USER_ID,
        name: "Mehrfamilienhaus Leipzig",
        address: "Karl-Liebknecht-Str. 45, 04275 Leipzig",
        type: "MFH",
        build_year: 1995,
        sqm: 320,
        purchase_price: 680000,
        ancillary_costs_pct: 0.10,
        market_value: 720000,
        rent_monthly: 3800,
        monthly_rate: 2800,
        units: 6,
      },
      {
        user_id: USER_ID,
        name: "ETW München Schwabing",
        address: "Leopoldstraße 88, 80802 München",
        type: "ETW",
        build_year: 2005,
        sqm: 52,
        purchase_price: 620000,
        ancillary_costs_pct: 0.10,
        market_value: 650000,
        rent_monthly: 1650,
        monthly_rate: 2100,
        units: 1,
      },
      {
        user_id: USER_ID,
        name: "Doppelhaushälfte Hannover",
        address: "Eilenriede Str. 23, 30161 Hannover",
        type: "DHH",
        build_year: 1988,
        sqm: 145,
        purchase_price: 380000,
        ancillary_costs_pct: 0.10,
        market_value: 400000,
        rent_monthly: 1800,
        monthly_rate: 1450,
        units: 1,
      },
    ])
    .select()

  if (!properties) { console.error("Properties insert failed"); return }

  // 3. Insert financings (no user_id column — linked via property_id)
  await supabase.from("financings").insert([
    {
      property_id: properties[0].id,
      bank: "Volksbank Goslar",
      loan_amount: 148000,
      interest_rate: 0.035,
      repayment_rate: 0.02,
      rate_monthly: 720,
      fixed_until: "2028-06-30",
      current_debt: 138000,
    },
    {
      property_id: properties[1].id,
      bank: "Deutsche Bank",
      loan_amount: 544000,
      interest_rate: 0.038,
      repayment_rate: 0.02,
      rate_monthly: 2800,
      fixed_until: "2026-12-31",
      current_debt: 520000,
    },
    {
      property_id: properties[2].id,
      bank: "Sparkasse München",
      loan_amount: 496000,
      interest_rate: 0.042,
      repayment_rate: 0.015,
      rate_monthly: 2100,
      fixed_until: "2031-03-31",
      current_debt: 480000,
    },
  ])

  // 4. Insert tenants
  const { data: tenants } = await supabase
    .from("tenants")
    .insert([
      {
        property_id: properties[0].id,
        user_id: USER_ID,
        name: "Klaus Müller",
        email: "k.mueller@email.de",
        phone: "+49 5321 12345",
        move_in_date: "2021-03-01",
        rent_monthly: 850,
        deposit: 2550,
        unit_number: "EG",
        is_active: true,
      },
      {
        property_id: properties[1].id,
        user_id: USER_ID,
        name: "Familie Schmidt",
        email: "schmidt@web.de",
        phone: "+49 341 98765",
        move_in_date: "2019-07-01",
        rent_monthly: 680,
        deposit: 2040,
        unit_number: "1. OG links",
        is_active: true,
      },
      {
        property_id: properties[1].id,
        user_id: USER_ID,
        name: "Anna Weber",
        email: "a.weber@gmail.com",
        phone: "+49 341 11223",
        move_in_date: "2022-01-15",
        rent_monthly: 720,
        deposit: 2160,
        unit_number: "2. OG rechts",
        is_active: true,
      },
      {
        property_id: properties[3].id,
        user_id: USER_ID,
        name: "Thomas Becker",
        email: "t.becker@gmx.de",
        phone: "+49 511 44556",
        move_in_date: "2020-09-01",
        rent_monthly: 1800,
        deposit: 5400,
        unit_number: "Gesamt",
        is_active: true,
      },
    ])
    .select()

  // 5. Insert rent payments (last 3 months)
  if (tenants) {
    const payments = []
    const today = new Date()

    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const date = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1)
      const dateStr = date.toISOString().split("T")[0]

      for (const tenant of tenants) {
        payments.push({
          tenant_id: tenant.id,
          property_id: tenant.property_id,
          user_id: USER_ID,
          amount: tenant.rent_monthly,
          due_date: dateStr,
          paid_date: monthOffset > 0 ? dateStr : null,
          status: monthOffset > 0 ? "paid" : "pending",
        })
      }
    }

    await supabase.from("rent_payments").insert(payments)
  }

  // 6. Insert expenses
  const now = new Date()
  await supabase.from("expenses").insert([
    {
      user_id: USER_ID,
      property_id: properties[0].id,
      title: "Heizungsreparatur",
      amount: 850,
      category: "maintenance",
      date: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString().split("T")[0],
    },
    {
      user_id: USER_ID,
      property_id: properties[1].id,
      title: "Hausverwaltung Q1",
      amount: 1200,
      category: "management",
      date: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split("T")[0],
    },
    {
      user_id: USER_ID,
      property_id: properties[1].id,
      title: "Gebäudeversicherung",
      amount: 680,
      category: "insurance",
      date: new Date(now.getFullYear(), 0, 15).toISOString().split("T")[0],
    },
    {
      user_id: USER_ID,
      property_id: properties[3].id,
      title: "Dachrinne reinigen",
      amount: 320,
      category: "maintenance",
      date: new Date(now.getFullYear(), now.getMonth() - 1, 8).toISOString().split("T")[0],
    },
  ])

  // 7. Insert tasks
  await supabase.from("tasks").insert([
    {
      user_id: USER_ID,
      property_id: properties[1].id,
      title: "Zinsbindung läuft ab – MFH Leipzig",
      description: "Deutsche Bank Zinsbindung läuft Dez 2026 aus. Angebote einholen.",
      priority: "high",
      category: "financial",
      due_date: "2026-09-30",
      completed: false,
    },
    {
      user_id: USER_ID,
      property_id: properties[0].id,
      title: "Nebenkostenabrechnung 2025",
      description: "Für Klaus Müller erstellen und zusenden.",
      priority: "medium",
      category: "tenant",
      due_date: new Date(now.getFullYear(), 2, 31).toISOString().split("T")[0],
      completed: false,
    },
    {
      user_id: USER_ID,
      title: "Steuererklärung 2025 vorbereiten",
      description: "Anlage V für alle 4 Objekte. Steuerberater Termin vereinbaren.",
      priority: "medium",
      category: "financial",
      due_date: new Date(now.getFullYear(), 6, 31).toISOString().split("T")[0],
      completed: false,
    },
    {
      user_id: USER_ID,
      property_id: properties[2].id,
      title: "Mieter für München gesucht",
      description: "ETW München aktuell leer. Inserat auf ImmoScout schalten.",
      priority: "high",
      category: "tenant",
      completed: false,
    },
  ])

  console.log("Demo data seeded successfully!")
  console.log(`Properties: ${properties.length}`)
  console.log(`Tenants: ${tenants?.length}`)
}

seed().catch(console.error)
