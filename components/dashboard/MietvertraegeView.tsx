"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  FileText,
  Plus,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Warning,
  Buildings,
  UsersFour,
  FilePdf,
  Envelope,
  Printer,
  DotsThreeVertical,
} from "@phosphor-icons/react"
import { createClient } from "@/lib/supabase/client"
import { generateMietvertragText } from "@/lib/mietvertrag-text"

// ─── TYPES ────────────────────────────────────────────────────────

interface Property {
  id: string
  name: string
  address: string
  type: string | null
}

interface Tenant {
  id: string
  name: string
  email: string | null
  phone: string | null
  property_id: string | null
  move_in_date: string | null
  rent_monthly: number | null
  nk_vorauszahlung: number | null
}

interface Mietvertrag {
  id: string
  mieter_name: string
  objekt_adresse: string
  mietbeginn: string
  mietende: string | null
  befristet: boolean
  kaltmiete: number
  kaution: number
  status: "entwurf" | "fertig" | "unterzeichnet" | "archiviert"
  created_at: string
  properties: { name: string } | null
  tenants: { name: string } | null
}

interface MietvertraegeViewProps {
  mietvertraege: Mietvertrag[]
  properties: Property[]
  tenants: Tenant[]
  vermieterName: string
  vermieterEmail: string
}

// ─── DEFAULTS ─────────────────────────────────────────────────────

const DEFAULT_NK_POSITIONEN = [
  "Grundsteuer",
  "Wasserversorgung",
  "Entwässerung",
  "Straßenreinigung und Müllabfuhr",
  "Hausreinigung",
  "Beleuchtung",
  "Schornsteinreinigung",
  "Sach- und Haftpflichtversicherung",
]

const ALL_NK_POSITIONEN = [
  "Grundsteuer",
  "Wasserversorgung",
  "Entwässerung",
  "Heizung",
  "Warmwasserversorgung",
  "Fahrstuhl",
  "Straßenreinigung und Müllabfuhr",
  "Hausreinigung und Ungezieferbekämpfung",
  "Gartenpflege",
  "Beleuchtung",
  "Schornsteinreinigung",
  "Sach- und Haftpflichtversicherung",
  "Hauswart",
  "Gemeinschaftsantenne / Kabelfernsehen",
  "Wascheinrichtungen",
  "Sonstige Betriebskosten",
]

const STATUS_CONFIG = {
  entwurf:      { label: "Entwurf",      bg: "rgba(107,114,128,0.1)", color: "#6B7280" },
  fertig:       { label: "Fertig",        bg: "rgba(160,120,48,0.1)",  color: "#A07830" },
  unterzeichnet: { label: "Unterzeichnet", bg: "rgba(45,106,45,0.1)",  color: "#2D6A2D" },
  archiviert:   { label: "Archiviert",    bg: "rgba(107,114,128,0.08)", color: "#9CA3AF" },
}

const STEP_LABELS = ["Parteien", "Konditionen", "Details", "Vorschau"]

// ─── HELPERS ──────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("de-DE")
}

function fmtEur(n: number | null | undefined) {
  if (n == null) return "—"
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(n)
}

// ─── STEP INDICATOR ───────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
      {STEP_LABELS.map((label, i) => {
        const n = i + 1
        const done = n < step
        const active = n === step
        return (
          <div key={n} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 99,
                background: done || active ? "#A07830" : "rgba(0,0,0,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}>
                {done
                  ? <Check size={14} color="white" weight="bold" />
                  : <span style={{ fontSize: 12, fontWeight: 700, color: active ? "white" : "#9CA3AF" }}>{n}</span>
                }
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? "#A07830" : "#9CA3AF", marginTop: 4, whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ width: 48, height: 2, background: done ? "#A07830" : "rgba(0,0,0,0.08)", margin: "0 4px 20px 4px", transition: "background 0.3s" }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── DISCLAIMER ───────────────────────────────────────────────────

function Disclaimer() {
  return (
    <div style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <Warning size={14} color="#92400E" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11, color: "#92400E", lineHeight: 1.5 }}>
          Imvestra generiert Vertragsvorlagen. Dies ist keine Rechtsberatung. Bitte prüfe den Vertrag durch einen Rechtsanwalt oder Mieterverein.
        </p>
      </div>
    </div>
  )
}

// ─── TOGGLE ───────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
      <span style={{ fontSize: 13, color: "#101418" }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 99, position: "relative",
          background: checked ? "#A07830" : "rgba(0,0,0,0.15)",
          transition: "background 0.2s", flexShrink: 0, cursor: "pointer",
        }}
      >
        <span style={{
          position: "absolute", top: 3, left: checked ? 23 : 3, width: 18, height: 18,
          borderRadius: 99, background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }} />
      </button>
    </div>
  )
}

// ─── INPUT ────────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 5 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 3 }}>{hint}</p>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 9,
  border: "1px solid rgba(0,0,0,0.12)", fontSize: 13,
  background: "white", outline: "none", boxSizing: "border-box",
  color: "#101418",
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────

export default function MietvertraegeView({ mietvertraege, properties, tenants, vermieterName, vermieterEmail }: MietvertraegeViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [view, setView] = useState<"list" | "wizard">("list")
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [saving, setSaving] = useState(false)
  const [previewText, setPreviewText] = useState("")
  const [savedId, setSavedId] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  // ── Form state ──
  const [form, setForm] = useState({
    property_id: "",
    tenant_id: "",
    vermieter_name: vermieterName,
    vermieter_adresse: "",
    vermieter_email: vermieterEmail,
    vermieter_telefon: "",
    mieter_name: "",
    mieter_email: "",
    mieter_telefon: "",
    mieter_vorherige_adresse: "",
    objekt_adresse: "",
    objekt_lage: "",
    wohnflaeche: "",
    zimmer_anzahl: "",
    mietbeginn: "",
    befristet: false,
    mietende: "",
    befristung_grund: "",
    kaltmiete: "",
    nk_vorauszahlung: "",
    kaution: "",
    zahlung_faellig_tag: "3",
    zahlung_iban: "",
    zahlung_bank: "",
    zahlung_konto_inhaber: "",
    haustiere_erlaubt: false,
    haustiere_details: "",
    untervermietung_erlaubt: false,
    rauchen_erlaubt: false,
    schoenheitsrep: true,
    anzahl_schlussel: "2",
    nk_positionen: DEFAULT_NK_POSITIONEN,
    besondere_vereinbarungen: "",
  })

  // Pre-select tenant or bewerber from URL params
  useEffect(() => {
    const tenantId = searchParams.get("tenant")
    const bewerberId = searchParams.get("bewerber_id")
    if (tenantId) {
      setView("wizard")
      setStep(1)
      autofillTenant(tenantId)
    } else if (bewerberId) {
      setView("wizard")
      setStep(1)
      fetch(`/api/bewerber/${bewerberId}`)
        .then(r => r.json())
        .then((b: { name?: string; email?: string; telefon?: string; property_id?: string }) => {
          const prop = b.property_id ? properties.find(p => p.id === b.property_id) : undefined
          setForm(f => ({
            ...f,
            mieter_name: b.name ?? "",
            mieter_email: b.email ?? "",
            mieter_telefon: b.telefon ?? "",
            property_id: b.property_id ?? "",
            objekt_adresse: prop?.address ?? "",
          }))
        })
        .catch(() => {/* ignore */})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function autofillTenant(tenantId: string) {
    const tenant = tenants.find(t => t.id === tenantId)
    if (!tenant) return
    const prop = properties.find(p => p.id === tenant.property_id)
    const kalt = tenant.rent_monthly ?? 0
    setForm(f => ({
      ...f,
      tenant_id: tenantId,
      mieter_name: tenant.name,
      mieter_email: tenant.email ?? "",
      mieter_telefon: tenant.phone ?? "",
      objekt_adresse: prop?.address ?? "",
      property_id: prop?.id ?? "",
      kaltmiete: kalt > 0 ? String(kalt) : "",
      nk_vorauszahlung: tenant.nk_vorauszahlung ? String(tenant.nk_vorauszahlung) : "",
      mietbeginn: tenant.move_in_date ?? "",
      kaution: kalt > 0 ? String(kalt * 3) : "",
    }))
  }

  // Auto-calc kaution when kaltmiete changes
  function setKaltmiete(val: string) {
    const n = parseFloat(val) || 0
    setForm(f => ({
      ...f,
      kaltmiete: val,
      kaution: n > 0 ? String(Math.round(n * 3 * 100) / 100) : f.kaution,
    }))
  }

  const warmmiete = (parseFloat(form.kaltmiete) || 0) + (parseFloat(form.nk_vorauszahlung) || 0)
  const kautionZahl = parseFloat(form.kaution) || 0
  const kaltZahl = parseFloat(form.kaltmiete) || 0
  const kautionUeber3 = kaltZahl > 0 && kautionZahl > kaltZahl * 3

  // ── Save ──
  async function saveVertrag(status: string) {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data } = await supabase
        .from("mietvertraege")
        .upsert({
          ...(savedId ? { id: savedId } : {}),
          user_id: user.id,
          property_id: form.property_id || null,
          tenant_id: form.tenant_id || null,
          vermieter_name: form.vermieter_name,
          vermieter_adresse: form.vermieter_adresse,
          vermieter_email: form.vermieter_email,
          vermieter_telefon: form.vermieter_telefon || null,
          mieter_name: form.mieter_name,
          mieter_email: form.mieter_email || null,
          mieter_telefon: form.mieter_telefon || null,
          mieter_vorherige_adresse: form.mieter_vorherige_adresse || null,
          objekt_adresse: form.objekt_adresse,
          objekt_lage: form.objekt_lage || null,
          wohnflaeche: parseFloat(form.wohnflaeche) || null,
          zimmer_anzahl: parseFloat(form.zimmer_anzahl) || null,
          mietbeginn: form.mietbeginn,
          mietende: form.befristet ? form.mietende || null : null,
          befristet: form.befristet,
          befristung_grund: form.befristung_grund || null,
          kaltmiete: parseFloat(form.kaltmiete),
          nk_vorauszahlung: parseFloat(form.nk_vorauszahlung) || 0,
          warmmiete_gesamt: warmmiete,
          kaution: parseFloat(form.kaution) || 0,
          zahlung_faellig_tag: parseInt(form.zahlung_faellig_tag) || 3,
          zahlung_iban: form.zahlung_iban || null,
          zahlung_bank: form.zahlung_bank || null,
          zahlung_konto_inhaber: form.zahlung_konto_inhaber || null,
          haustiere_erlaubt: form.haustiere_erlaubt,
          haustiere_details: form.haustiere_details || null,
          untervermietung_erlaubt: form.untervermietung_erlaubt,
          rauchen_erlaubt: form.rauchen_erlaubt,
          schoenheitsrep: form.schoenheitsrep,
          besondere_vereinbarungen: form.besondere_vereinbarungen || null,
          anzahl_schlussel: parseInt(form.anzahl_schlussel) || 2,
          nk_positionen: form.nk_positionen,
          status,
        })
        .select("id")
        .single()

      if (data?.id) setSavedId(data.id)
      return data
    } finally {
      setSaving(false)
    }
  }

  // ── PDF ──
  function downloadPdf() {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mietvertrag — ${form.mieter_name}</title>
  <style>
    body { font-family: "Times New Roman", serif; font-size: 12px; line-height: 1.7;
      max-width: 740px; margin: 40px auto; padding: 20px; color: #101418; }
    pre { white-space: pre-wrap; font-family: inherit; margin: 0; }
    @page { margin: 2cm; }
  </style>
</head>
<body>
  <pre>${previewText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
  <script>window.onload = () => window.print();<\/script>
</body>
</html>`)
    printWindow.document.close()
  }

  function resetWizard() {
    setView("list")
    setStep(1)
    setSavedId(null)
    setPreviewText("")
    setForm({
      property_id: "", tenant_id: "",
      vermieter_name: vermieterName, vermieter_adresse: "", vermieter_email: vermieterEmail, vermieter_telefon: "",
      mieter_name: "", mieter_email: "", mieter_telefon: "", mieter_vorherige_adresse: "",
      objekt_adresse: "", objekt_lage: "", wohnflaeche: "", zimmer_anzahl: "",
      mietbeginn: "", befristet: false, mietende: "", befristung_grund: "",
      kaltmiete: "", nk_vorauszahlung: "", kaution: "",
      zahlung_faellig_tag: "3", zahlung_iban: "", zahlung_bank: "", zahlung_konto_inhaber: "",
      haustiere_erlaubt: false, haustiere_details: "", untervermietung_erlaubt: false,
      rauchen_erlaubt: false, schoenheitsrep: true, anzahl_schlussel: "2",
      nk_positionen: DEFAULT_NK_POSITIONEN, besondere_vereinbarungen: "",
    })
  }

  async function goToStep4() {
    const text = generateMietvertragText({
      vermieter_name: form.vermieter_name,
      vermieter_adresse: form.vermieter_adresse,
      mieter_name: form.mieter_name,
      mieter_vorherige_adresse: form.mieter_vorherige_adresse || undefined,
      objekt_adresse: form.objekt_adresse,
      objekt_lage: form.objekt_lage || undefined,
      wohnflaeche: parseFloat(form.wohnflaeche) || undefined,
      zimmer_anzahl: parseFloat(form.zimmer_anzahl) || undefined,
      mietbeginn: form.mietbeginn,
      mietende: form.mietende || undefined,
      befristet: form.befristet,
      befristung_grund: form.befristung_grund || undefined,
      kaltmiete: parseFloat(form.kaltmiete) || 0,
      nk_vorauszahlung: parseFloat(form.nk_vorauszahlung) || 0,
      kaution: parseFloat(form.kaution) || 0,
      zahlung_faellig_tag: parseInt(form.zahlung_faellig_tag) || 3,
      zahlung_iban: form.zahlung_iban || undefined,
      zahlung_bank: form.zahlung_bank || undefined,
      zahlung_konto_inhaber: form.zahlung_konto_inhaber || undefined,
      haustiere_erlaubt: form.haustiere_erlaubt,
      haustiere_details: form.haustiere_details || undefined,
      untervermietung_erlaubt: form.untervermietung_erlaubt,
      rauchen_erlaubt: form.rauchen_erlaubt,
      schoenheitsrep: form.schoenheitsrep,
      besondere_vereinbarungen: form.besondere_vereinbarungen || undefined,
      anzahl_schlussel: parseInt(form.anzahl_schlussel) || 2,
      nk_positionen: form.nk_positionen,
      erstelldatum: new Date().toISOString(),
    })
    setPreviewText(text)
    setStep(4)
    await saveVertrag("fertig")
  }

  // ── LIST VIEW ─────────────────────────────────────────────────

  if (view === "list") {
    return (
      <div style={{ background: "#F8F7F4", minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ padding: "28px 32px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={18} color="#A07830" />
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "#101418", letterSpacing: "-0.02em" }}>Mietverträge</h1>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>{mietvertraege.length} Vertrag{mietvertraege.length !== 1 ? "svorlagen" : "svorlage"}</p>
              </div>
            </div>
            <button
              onClick={() => { setView("wizard"); setStep(1) }}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "white", background: "#A07830", padding: "9px 18px", borderRadius: 10, boxShadow: "0 4px 12px rgba(160,120,48,0.25)", cursor: "pointer" }}
            >
              <Plus size={14} weight="bold" />
              Neuer Mietvertrag
            </button>
          </div>
        </div>

        <div style={{ padding: "0 32px 32px" }}>
          {mietvertraege.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 32px", background: "white", borderRadius: 16, border: "1px solid rgba(0,0,0,0.07)" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(160,120,48,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <FileText size={26} color="#A07830" />
              </div>
              <p style={{ fontSize: 17, fontWeight: 600, color: "#101418", marginBottom: 6 }}>Noch kein Mietvertrag</p>
              <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>Erstelle rechtssichere Vertragsvorlagen in wenigen Minuten</p>
              <button
                onClick={() => { setView("wizard"); setStep(1) }}
                style={{ fontSize: 13, fontWeight: 600, color: "white", background: "#A07830", padding: "10px 20px", borderRadius: 10, cursor: "pointer" }}
              >
                Mietvertrag erstellen
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {mietvertraege.map(v => {
                const sc = STATUS_CONFIG[v.status]
                return (
                  <div
                    key={v.id}
                    style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 20, transition: "all 0.2s", position: "relative" }}
                    className="hover:border-[rgba(160,120,48,0.2)] hover:-translate-y-px"
                  >
                    {/* Card header */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: "#101418" }}>{v.mieter_name}</p>
                        <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                          {v.properties?.name ?? v.objekt_adresse}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: sc.bg, color: sc.color }}>
                          {sc.label}
                        </span>
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={() => setOpenMenu(openMenu === v.id ? null : v.id)}
                            style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          >
                            <DotsThreeVertical size={14} color="#9CA3AF" />
                          </button>
                          {openMenu === v.id && (
                            <div style={{ position: "absolute", right: 0, top: 34, background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, padding: "4px 0", zIndex: 10, width: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
                              {[
                                { label: "Bearbeiten", action: () => { setOpenMenu(null) } },
                                { label: "Als unterzeichnet markieren", action: async () => {
                                  const sb = createClient()
                                  await sb.from("mietvertraege").update({ status: "unterzeichnet" }).eq("id", v.id)
                                  setOpenMenu(null)
                                  router.refresh()
                                }},
                                { label: "Archivieren", action: async () => {
                                  const sb = createClient()
                                  await sb.from("mietvertraege").update({ status: "archiviert" }).eq("id", v.id)
                                  setOpenMenu(null)
                                  router.refresh()
                                }},
                              ].map(item => (
                                <button key={item.label} onClick={item.action}
                                  style={{ width: "100%", textAlign: "left", padding: "8px 14px", fontSize: 13, color: "#101418", cursor: "pointer" }}
                                  className="hover:bg-[#F8F7F4]"
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Info grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
                      {[
                        { label: "Mietbeginn", val: fmtDate(v.mietbeginn) },
                        { label: "Kaltmiete", val: fmtEur(v.kaltmiete) },
                        { label: "Kaution", val: fmtEur(v.kaution) },
                        { label: "Laufzeit", val: v.befristet && v.mietende ? `bis ${fmtDate(v.mietende)}` : "Unbefristet" },
                      ].map(item => (
                        <div key={item.label} style={{ background: "#F8F7F4", borderRadius: 10, padding: "10px 12px" }}>
                          <p style={{ fontSize: 9, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{item.label}</p>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#101418", fontVariantNumeric: "tabular-nums" }}>{item.val}</p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                      <button style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer" }}>
                        Vorschau
                      </button>
                      <button style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color: "#A07830", padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(160,120,48,0.2)", background: "rgba(160,120,48,0.04)", cursor: "pointer" }}>
                        <FilePdf size={13} />
                        PDF herunterladen
                      </button>
                      {v.status === "fertig" && (
                        <button
                          onClick={async () => {
                            const sb = createClient()
                            await sb.from("mietvertraege").update({ status: "unterzeichnet" }).eq("id", v.id)
                            router.refresh()
                          }}
                          style={{ fontSize: 12, fontWeight: 600, color: "white", background: "#2D6A2D", padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}
                        >
                          Als unterzeichnet markieren
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Close menu on outside click */}
        {openMenu && (
          <div style={{ position: "fixed", inset: 0, zIndex: 5 }} onClick={() => setOpenMenu(null)} />
        )}
      </div>
    )
  }

  // ── WIZARD VIEW ───────────────────────────────────────────────

  return (
    <div style={{ background: "#F8F7F4", minHeight: "100vh", padding: "28px 32px" }}>
      {/* Back + Steps */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <button
          onClick={step === 1 ? resetWizard : () => setStep(s => Math.max(1, s - 1) as typeof step)}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6B7280", padding: "7px 12px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer", flexShrink: 0 }}
        >
          <ArrowLeft size={14} />
          {step === 1 ? "Abbrechen" : "Zurück"}
        </button>
        <div style={{ flex: 1 }}>
          <StepIndicator step={step} />
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1: PARTEIEN ── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#101418", marginBottom: 4, letterSpacing: "-0.02em" }}>Vertragsparteien</h2>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>Vermieter- und Mieter-Daten eingeben.</p>
            <Disclaimer />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Vermieter */}
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(160,120,48,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Buildings size={14} color="#A07830" />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#101418" }}>Vermieter</p>
                </div>
                <Field label="Name *">
                  <input value={form.vermieter_name} onChange={e => setForm(f => ({ ...f, vermieter_name: e.target.value }))} style={inputStyle} placeholder="Max Mustermann" />
                </Field>
                <Field label="Adresse">
                  <input value={form.vermieter_adresse} onChange={e => setForm(f => ({ ...f, vermieter_adresse: e.target.value }))} style={inputStyle} placeholder="Musterstraße 1, 12345 Berlin" />
                </Field>
                <Field label="E-Mail">
                  <input value={form.vermieter_email} onChange={e => setForm(f => ({ ...f, vermieter_email: e.target.value }))} style={inputStyle} />
                </Field>
                <Field label="Telefon">
                  <input value={form.vermieter_telefon} onChange={e => setForm(f => ({ ...f, vermieter_telefon: e.target.value }))} style={inputStyle} placeholder="+49 ..." />
                </Field>
              </div>

              {/* Mieter */}
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(45,106,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <UsersFour size={14} color="#2D6A2D" />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#101418" }}>Mieter</p>
                </div>

                {/* Quick-fill from existing tenants */}
                <Field label="Aus vorhandenen Mietern wählen">
                  <select
                    value={form.tenant_id}
                    onChange={e => { setForm(f => ({ ...f, tenant_id: e.target.value })); if (e.target.value) autofillTenant(e.target.value) }}
                    style={{ ...inputStyle, color: form.tenant_id ? "#101418" : "#9CA3AF" }}
                  >
                    <option value="">— Mieter wählen oder manuell eingeben —</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Name *">
                  <input value={form.mieter_name} onChange={e => setForm(f => ({ ...f, mieter_name: e.target.value }))} style={inputStyle} placeholder="Erika Musterfrau" />
                </Field>
                <Field label="E-Mail">
                  <input value={form.mieter_email} onChange={e => setForm(f => ({ ...f, mieter_email: e.target.value }))} style={inputStyle} />
                </Field>
                <Field label="Telefon">
                  <input value={form.mieter_telefon} onChange={e => setForm(f => ({ ...f, mieter_telefon: e.target.value }))} style={inputStyle} />
                </Field>
                <Field label="Bisherige Adresse (optional)">
                  <input value={form.mieter_vorherige_adresse} onChange={e => setForm(f => ({ ...f, mieter_vorherige_adresse: e.target.value }))} style={inputStyle} placeholder="Alte Straße 1, 10000 Berlin" />
                </Field>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button
                onClick={() => setStep(2)}
                disabled={!form.vermieter_name || !form.mieter_name}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "white", background: "#A07830", padding: "11px 24px", borderRadius: 10, cursor: "pointer", opacity: (!form.vermieter_name || !form.mieter_name) ? 0.4 : 1 }}
              >
                Weiter <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: KONDITIONEN ── */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#101418", marginBottom: 4, letterSpacing: "-0.02em" }}>Objekt & Konditionen</h2>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>Mietobjekt und Zahlungskonditionen festlegen.</p>
            <Disclaimer />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Objekt */}
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#101418", marginBottom: 16 }}>Mietobjekt</p>

                <Field label="Aus Portfolio wählen">
                  <select
                    value={form.property_id}
                    onChange={e => {
                      const prop = properties.find(p => p.id === e.target.value)
                      setForm(f => ({ ...f, property_id: e.target.value, objekt_adresse: prop?.address ?? f.objekt_adresse }))
                    }}
                    style={{ ...inputStyle, color: form.property_id ? "#101418" : "#9CA3AF" }}
                  >
                    <option value="">— Objekt wählen —</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Adresse *">
                  <input value={form.objekt_adresse} onChange={e => setForm(f => ({ ...f, objekt_adresse: e.target.value }))} style={inputStyle} placeholder="Hauptstraße 12, 10115 Berlin" />
                </Field>
                <Field label="Lage (Etage/Seite)">
                  <input value={form.objekt_lage} onChange={e => setForm(f => ({ ...f, objekt_lage: e.target.value }))} style={inputStyle} placeholder="2. OG links" />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Field label="Wohnfläche (m²)">
                    <input type="number" value={form.wohnflaeche} onChange={e => setForm(f => ({ ...f, wohnflaeche: e.target.value }))} style={inputStyle} placeholder="65" />
                  </Field>
                  <Field label="Zimmeranzahl">
                    <input type="number" step="0.5" value={form.zimmer_anzahl} onChange={e => setForm(f => ({ ...f, zimmer_anzahl: e.target.value }))} style={inputStyle} placeholder="2.5" />
                  </Field>
                </div>
                <Field label="Anzahl Schlüssel">
                  <input type="number" min="1" value={form.anzahl_schlussel} onChange={e => setForm(f => ({ ...f, anzahl_schlussel: e.target.value }))} style={inputStyle} />
                </Field>
              </div>

              {/* Konditionen */}
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#101418", marginBottom: 16 }}>Mietkonditionen</p>

                <Field label="Mietbeginn *">
                  <input type="date" value={form.mietbeginn} onChange={e => setForm(f => ({ ...f, mietbeginn: e.target.value }))} style={inputStyle} />
                </Field>

                {/* Laufzeit toggle */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 5 }}>Laufzeit</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[{ label: "Unbefristet", val: false }, { label: "Befristet", val: true }].map(opt => (
                      <button
                        key={String(opt.val)}
                        onClick={() => setForm(f => ({ ...f, befristet: opt.val }))}
                        style={{
                          flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
                          background: form.befristet === opt.val ? "#A07830" : "white",
                          color: form.befristet === opt.val ? "white" : "#6B7280",
                          border: `1px solid ${form.befristet === opt.val ? "#A07830" : "rgba(0,0,0,0.1)"}`,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {form.befristet && (
                  <>
                    <Field label="Mietende">
                      <input type="date" value={form.mietende} onChange={e => setForm(f => ({ ...f, mietende: e.target.value }))} style={inputStyle} />
                    </Field>
                    <Field label="Befristungsgrund (§575 BGB)">
                      <input value={form.befristung_grund} onChange={e => setForm(f => ({ ...f, befristung_grund: e.target.value }))} style={inputStyle} placeholder="Eigenbedarf" />
                    </Field>
                  </>
                )}

                <Field label="Kaltmiete (€) *">
                  <input type="number" step="0.01" value={form.kaltmiete} onChange={e => setKaltmiete(e.target.value)} style={inputStyle} placeholder="800.00" />
                </Field>

                <Field label="NK-Vorauszahlung (€/Mo)">
                  <input type="number" step="0.01" value={form.nk_vorauszahlung} onChange={e => setForm(f => ({ ...f, nk_vorauszahlung: e.target.value }))} style={inputStyle} placeholder="150.00" />
                </Field>

                {/* Warmmiete live */}
                {warmmiete > 0 && (
                  <div style={{ background: "rgba(160,120,48,0.06)", border: "1px solid rgba(160,120,48,0.15)", borderRadius: 9, padding: "10px 14px", marginBottom: 12 }}>
                    <p style={{ fontSize: 11, color: "#A07830" }}>
                      Gesamtmiete: <strong>{warmmiete.toFixed(2).replace(".", ",")} €</strong>
                    </p>
                  </div>
                )}

                <Field label="Kaution (€)" hint="Max. 3 Nettokaltmieten (§551 BGB)">
                  <input type="number" step="0.01" value={form.kaution} onChange={e => setForm(f => ({ ...f, kaution: e.target.value }))} style={{ ...inputStyle, border: kautionUeber3 ? "1px solid #B91C1C" : "1px solid rgba(0,0,0,0.12)" }} placeholder="2400.00" />
                </Field>
                {kautionUeber3 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: -8, marginBottom: 12 }}>
                    <Warning size={12} color="#B91C1C" />
                    <p style={{ fontSize: 11, color: "#B91C1C" }}>Kaution überschreitet gesetzliches Maximum!</p>
                  </div>
                )}

                <Field label="Zahltag des Monats">
                  <select value={form.zahlung_faellig_tag} onChange={e => setForm(f => ({ ...f, zahlung_faellig_tag: e.target.value }))} style={inputStyle}>
                    {[1, 2, 3, 5, 15].map(d => <option key={d} value={d}>{d}. Werktag</option>)}
                  </select>
                </Field>

                <Field label="IBAN">
                  <input value={form.zahlung_iban} onChange={e => setForm(f => ({ ...f, zahlung_iban: e.target.value }))} style={inputStyle} placeholder="DE00 1234 5678 ..." />
                </Field>
                <Field label="Bank">
                  <input value={form.zahlung_bank} onChange={e => setForm(f => ({ ...f, zahlung_bank: e.target.value }))} style={inputStyle} placeholder="Sparkasse Berlin" />
                </Field>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button
                onClick={() => setStep(3)}
                disabled={!form.objekt_adresse || !form.mietbeginn || !form.kaltmiete}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "white", background: "#A07830", padding: "11px 24px", borderRadius: 10, cursor: "pointer", opacity: (!form.objekt_adresse || !form.mietbeginn || !form.kaltmiete) ? 0.4 : 1 }}
              >
                Weiter <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: DETAILS ── */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#101418", marginBottom: 4, letterSpacing: "-0.02em" }}>Vertragsdetails</h2>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>Nebenkosten, Regelungen und besondere Vereinbarungen.</p>
            <Disclaimer />

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* NK-Positionen */}
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#101418", marginBottom: 4 }}>Umlagefähige Nebenkosten</p>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 14 }}>BetrKV §2 — Welche Positionen werden umgelegt?</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {ALL_NK_POSITIONEN.map(pos => {
                    const checked = form.nk_positionen.includes(pos)
                    return (
                      <button
                        key={pos}
                        onClick={() => setForm(f => ({
                          ...f,
                          nk_positionen: checked
                            ? f.nk_positionen.filter(p => p !== pos)
                            : [...f.nk_positionen, pos],
                        }))}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: `1px solid ${checked ? "rgba(160,120,48,0.25)" : "rgba(0,0,0,0.08)"}`, background: checked ? "rgba(160,120,48,0.05)" : "white", cursor: "pointer", textAlign: "left" }}
                      >
                        <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? "#A07830" : "rgba(0,0,0,0.15)"}`, background: checked ? "#A07830" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {checked && <Check size={10} color="white" weight="bold" />}
                        </div>
                        <span style={{ fontSize: 12, color: "#101418" }}>{pos}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Regelungen */}
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#101418", marginBottom: 14 }}>Regelungen</p>
                <Toggle checked={form.haustiere_erlaubt} onChange={v => setForm(f => ({ ...f, haustiere_erlaubt: v }))} label="Haustiere erlaubt" />
                {form.haustiere_erlaubt && (
                  <div style={{ paddingLeft: 12, paddingBottom: 8, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <Field label="Details / Einschränkungen">
                      <input value={form.haustiere_details} onChange={e => setForm(f => ({ ...f, haustiere_details: e.target.value }))} style={inputStyle} placeholder="z.B. Nur Kleintiere bis 5 kg" />
                    </Field>
                  </div>
                )}
                <Toggle checked={form.untervermietung_erlaubt} onChange={v => setForm(f => ({ ...f, untervermietung_erlaubt: v }))} label="Untervermietung erlaubt" />
                <Toggle checked={form.rauchen_erlaubt} onChange={v => setForm(f => ({ ...f, rauchen_erlaubt: v }))} label="Rauchen erlaubt" />
                <Toggle checked={form.schoenheitsrep} onChange={v => setForm(f => ({ ...f, schoenheitsrep: v }))} label="Schönheitsreparaturen durch Mieter" />
              </div>

              {/* Sonstiges */}
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#101418", marginBottom: 12 }}>Besondere Vereinbarungen</p>
                <textarea
                  value={form.besondere_vereinbarungen}
                  onChange={e => setForm(f => ({ ...f, besondere_vereinbarungen: e.target.value }))}
                  rows={4}
                  placeholder="z.B. Gartennutzung gestattet, Stellplatz Nr. 5 inklusive, Schönheitsreparaturen nach Auszug..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button
                onClick={goToStep4}
                disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "white", background: "#A07830", padding: "11px 24px", borderRadius: 10, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, boxShadow: "0 4px 14px rgba(160,120,48,0.3)" }}
              >
                {saving ? (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                ) : <Check size={14} weight="bold" />}
                Vertrag generieren
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 4: VORSCHAU ── */}
        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 18 }}
                style={{ width: 36, height: 36, borderRadius: 99, background: "rgba(45,106,45,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle size={20} color="#2D6A2D" weight="fill" />
              </motion.div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#101418", letterSpacing: "-0.02em" }}>Mietvertrag generiert</h2>
                <p style={{ fontSize: 12, color: "#9CA3AF" }}>{form.mieter_name} · {form.objekt_adresse}</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, alignItems: "start" }}>
              {/* Preview text */}
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 24, maxHeight: 600, overflowY: "auto" }}>
                <pre style={{ fontFamily: "monospace", fontSize: 11.5, color: "#101418", whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>
                  {previewText}
                </pre>
              </div>

              {/* Actions */}
              <div style={{ position: "sticky", top: 20 }}>
                {/* Summary */}
                <div style={{ background: "rgba(160,120,48,0.04)", border: "1px solid rgba(160,120,48,0.15)", borderRadius: 14, padding: 20, marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#A07830", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Zusammenfassung</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Mieter", val: form.mieter_name },
                      { label: "Objekt", val: form.objekt_adresse.slice(0, 20) + (form.objekt_adresse.length > 20 ? "…" : "") },
                      { label: "Mietbeginn", val: fmtDate(form.mietbeginn) },
                      { label: "Kaltmiete", val: fmtEur(parseFloat(form.kaltmiete) || 0) },
                      { label: "Kaution", val: fmtEur(parseFloat(form.kaution) || 0) },
                      { label: "Laufzeit", val: form.befristet ? `Bis ${fmtDate(form.mietende)}` : "Unbefristet" },
                    ].map(item => (
                      <div key={item.label}>
                        <p style={{ fontSize: 9, color: "#A07830", textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</p>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#101418", marginTop: 2 }}>{item.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    onClick={downloadPdf}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px", borderRadius: 10, background: "#A07830", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(160,120,48,0.3)" }}
                  >
                    <Printer size={15} />
                    PDF herunterladen / Drucken
                  </button>
                  <button
                    onClick={() => {
                      const subject = encodeURIComponent(`Mietvertrag — ${form.objekt_adresse}`)
                      const body = encodeURIComponent(`Sehr geehrte/r ${form.mieter_name},\n\nim Anhang finden Sie Ihren Mietvertrag.\n\nMit freundlichen Grüßen\n${form.vermieter_name}`)
                      window.open(`mailto:${form.mieter_email}?subject=${subject}&body=${body}`)
                    }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "10px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", background: "white", color: "#101418", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
                  >
                    <Envelope size={15} color="#6B7280" />
                    E-Mail vorbereiten
                  </button>
                  <button
                    onClick={() => { setStep(3) }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "9px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "white", color: "#6B7280", fontSize: 12, cursor: "pointer" }}
                  >
                    Bearbeiten
                  </button>
                </div>

                <p style={{ fontSize: 10, color: "#A89A7A", marginTop: 16, lineHeight: 1.5, textAlign: "center" }}>
                  Rechtssichere Prüfung empfohlen. Imvestra haftet nicht für rechtliche Mängel in Vertragsvorlagen.
                </p>

                <button
                  onClick={resetWizard}
                  style={{ marginTop: 16, width: "100%", padding: "8px", fontSize: 12, color: "#9CA3AF", borderRadius: 8, border: "1px solid rgba(0,0,0,0.07)", cursor: "pointer" }}
                >
                  Zur Übersicht
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
