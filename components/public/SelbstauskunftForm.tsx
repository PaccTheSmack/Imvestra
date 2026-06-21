"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Check, CheckCircle, Warning, Buildings } from "@phosphor-icons/react"

interface Props {
  zugangscode: string
  bewerberName: string
  propertyName: string
  propertyAddress: string
  kaltmiete: number | null
}

type Section = "persoenlich" | "beruf" | "haushalt" | "finanzen" | "einverstaendnis"
const SECTIONS: { key: Section; label: string }[] = [
  { key: "persoenlich", label: "Persönliches" },
  { key: "beruf", label: "Beruf & Einkommen" },
  { key: "haushalt", label: "Haushalt" },
  { key: "finanzen", label: "Finanzen" },
  { key: "einverstaendnis", label: "Einverständnis" },
]

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 9,
  border: "1px solid rgba(0,0,0,0.12)", fontSize: 13,
  background: "white", outline: "none", color: "#101418",
  boxSizing: "border-box",
}

const inputErrStyle: React.CSSProperties = {
  ...inputStyle,
  border: "1.5px solid #B91C1C",
  background: "rgba(185,28,28,0.03)",
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "#6B7280",
  display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em",
}

const cardStyle: React.CSSProperties = {
  background: "white", border: "1px solid rgba(0,0,0,0.07)",
  borderRadius: 14, padding: 24, marginBottom: 16,
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ ...labelStyle, color: error ? "#B91C1C" : "#6B7280" }}>
        {label}{required && <span style={{ color: "#B91C1C", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: 11, color: "#B91C1C", margin: "4px 0 0" }}>Pflichtfeld</p>}
    </div>
  )
}

const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"]
const YEARS = Array.from({ length: 90 }, (_, i) => 2008 - i) // 2008 → 1919

function DatePicker({ value, onChange, hasError }: { value: string; onChange: (v: string) => void; hasError: boolean }) {
  const parsed = value ? value.split("-") : ["", "", ""]
  const [year, setYear] = useState(parsed[0] || "")
  const [month, setMonth] = useState(parsed[1] || "")
  const [day, setDay] = useState(parsed[2] || "")

  function commit(y: string, m: string, d: string) {
    if (y && m && d) {
      onChange(`${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`)
    } else {
      onChange("")
    }
  }

  const selectStyle: React.CSSProperties = {
    flex: 1, padding: "10px 8px", borderRadius: 9, fontSize: 13,
    border: hasError ? "1.5px solid #B91C1C" : "1px solid rgba(0,0,0,0.12)",
    background: hasError ? "rgba(185,28,28,0.03)" : "white",
    outline: "none", color: "#101418", cursor: "pointer",
    appearance: "none" as React.CSSProperties["appearance"],
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <select style={{ ...selectStyle, flex: "0 0 80px" }} value={day} onChange={e => { setDay(e.target.value); commit(year, month, e.target.value) }}>
        <option value="">Tag</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
          <option key={d} value={String(d).padStart(2,"0")}>{d}</option>
        ))}
      </select>
      <select style={{ ...selectStyle, flex: "0 0 120px" }} value={month} onChange={e => { setMonth(e.target.value); commit(year, e.target.value, day) }}>
        <option value="">Monat</option>
        {MONTHS.map((m, i) => (
          <option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>
        ))}
      </select>
      <select style={selectStyle} value={year} onChange={e => { setYear(e.target.value); commit(e.target.value, month, day) }}>
        <option value="">Jahr</option>
        {YEARS.map(y => (
          <option key={y} value={String(y)}>{y}</option>
        ))}
      </select>
    </div>
  )
}

function SignaturePad({ value, onChange, hasError }: { value: string; onChange: (v: string) => void; hasError: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(!value)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  function getPos(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scaleX = canvasRef.current!.width / rect.width
    const scaleY = canvasRef.current!.height / rect.height
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function startDraw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    setIsDrawing(true)
    lastPos.current = getPos(e)
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!isDrawing || !lastPos.current) return
    const ctx = canvasRef.current!.getContext("2d")!
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = "#101418"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()
    lastPos.current = pos
    setIsEmpty(false)
    onChange(canvasRef.current!.toDataURL())
  }

  function stopDraw() {
    setIsDrawing(false)
    lastPos.current = null
  }

  function clear() {
    const canvas = canvasRef.current!
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onChange("")
  }

  return (
    <div>
      <div style={{
        position: "relative", borderRadius: 10, overflow: "hidden",
        border: `1.5px solid ${hasError ? "#B91C1C" : isEmpty ? "rgba(0,0,0,0.12)" : "#A07830"}`,
        background: "white",
      }}>
        <canvas
          ref={canvasRef}
          width={640}
          height={130}
          style={{ width: "100%", height: 130, display: "block", cursor: "crosshair", touchAction: "none" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {isEmpty && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <span style={{ fontSize: 13, color: "#D1D5DB", fontStyle: "italic" }}>Hier unterschreiben …</span>
          </div>
        )}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "rgba(0,0,0,0.08)", margin: "0 16px" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <span style={{ fontSize: 11, color: "#9CA3AF" }}>Mit Maus oder Finger zeichnen</span>
        {!isEmpty && (
          <button onClick={clear} type="button" style={{ fontSize: 11, color: "#B91C1C", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            Löschen
          </button>
        )}
      </div>
      {hasError && <p style={{ fontSize: 11, color: "#B91C1C", margin: "4px 0 0" }}>Bitte unterschreiben</p>}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SelbstauskunftForm({ zugangscode, bewerberName: _bewerberName, propertyAddress: _propertyAddress, propertyName, kaltmiete }: Props) {
  const [activeSection, setActiveSection] = useState<Section>("persoenlich")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [attempted, setAttempted] = useState<Set<Section>>(new Set())

  const [form, setForm] = useState({
    vorname: "", nachname: "", geburtsdatum: "", geburtsort: "",
    nationalitaet: "deutsch", ausweis_typ: "personalausweis", ausweis_nr: "",
    aktuelle_adresse: "", wohnhaft_seit: "", kuendigungsgrund: "",
    beruf: "", arbeitgeber: "", beschaeftigt_seit: "",
    beschaeftigungsart: "" as string,
    nettoeinkommen: "" as string,
    einkommen_nachweise: false,
    anzahl_personen: 1, personen_details: "",
    haustiere: false, haustiere_beschreibung: "",
    raucher: false,
    schufa_sauber: null as boolean | null,
    insolvenz: false, mietschulden: false,
    warum_diese_wohnung: "", sonstiges: "",
    einverstaendnis_datenschutz: false,
    einverstaendnis_schufa: false,
    unterschrift_name: "", // stores canvas data URL
  })

  const set = (key: string, value: unknown) => setForm(p => ({ ...p, [key]: value }))

  function sectionErrors(section: Section): Set<string> {
    const errs = new Set<string>()
    if (section === "persoenlich") {
      if (!form.vorname) errs.add("vorname")
      if (!form.nachname) errs.add("nachname")
      if (!form.geburtsdatum) errs.add("geburtsdatum")
      if (!form.aktuelle_adresse) errs.add("aktuelle_adresse")
    }
    if (section === "beruf") {
      if (!form.beschaeftigungsart) errs.add("beschaeftigungsart")
      if (!form.nettoeinkommen) errs.add("nettoeinkommen")
      if (!form.arbeitgeber) errs.add("arbeitgeber")
    }
    if (section === "einverstaendnis") {
      if (!form.einverstaendnis_datenschutz) errs.add("einverstaendnis_datenschutz")
      if (!form.einverstaendnis_schufa) errs.add("einverstaendnis_schufa")
      if (!form.unterschrift_name) errs.add("unterschrift_name")
    }
    return errs
  }

  function isErr(field: string) {
    return attempted.has(activeSection) && sectionErrors(activeSection).has(field)
  }

  function handleWeiter(next: Section) {
    const errs = sectionErrors(activeSection)
    if (errs.size > 0) {
      setAttempted(prev => { const s = new Set(prev); s.add(activeSection); return s })
      return
    }
    setActiveSection(next)
  }

  const mietquote = form.nettoeinkommen && kaltmiete
    ? kaltmiete / parseFloat(form.nettoeinkommen)
    : null

  const mietquoteColor = mietquote
    ? mietquote <= 0.33 ? "#2D6A2D" : mietquote <= 0.40 ? "#D97706" : "#B91C1C"
    : "#6B7280"

  const finalErrors = sectionErrors("einverstaendnis")
  const canSubmit = finalErrors.size === 0 &&
    sectionErrors("persoenlich").size === 0 &&
    sectionErrors("beruf").size === 0

  async function handleSubmit() {
    setAttempted(prev => { const s = new Set(prev); s.add("einverstaendnis"); return s })
    if (!canSubmit) return
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(`/api/selbstauskunft/${zugangscode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          nettoeinkommen: parseFloat(form.nettoeinkommen) || null,
          einverstaendnis_datum: new Date().toISOString(),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Fehler beim Übermitteln")
      }
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ein Fehler ist aufgetreten.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F7F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ textAlign: "center", padding: 48 }}
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            style={{ width: 80, height: 80, borderRadius: 40, background: "rgba(45,106,45,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}
          >
            <CheckCircle size={48} color="#2D6A2D" weight="fill" />
          </motion.div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#101418", marginBottom: 8 }}>Selbstauskunft eingereicht!</h1>
          <p style={{ color: "#6B7280", fontSize: 15, maxWidth: 360, margin: "0 auto 24px" }}>
            Vielen Dank. Der Vermieter wird Ihre Unterlagen prüfen und sich bei Ihnen melden.
          </p>
          <p style={{ fontSize: 11, color: "#9CA3AF" }}>Imvestra · Digitale Immobilienverwaltung</p>
        </motion.div>
      </div>
    )
  }

  const sectionIndex = SECTIONS.findIndex(s => s.key === activeSection)

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4" }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.07)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#A07830" }}>Imvestra</span>
          <span style={{ color: "rgba(0,0,0,0.15)" }}>·</span>
          <span style={{ fontSize: 13, color: "#6B7280" }}>Mieterselbstauskunft</span>
        </div>
        {propertyName && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(160,120,48,0.08)", borderRadius: 8, padding: "4px 10px" }}>
            <Buildings size={13} color="#A07830" />
            <span style={{ fontSize: 12, color: "#A07830", fontWeight: 500 }}>{propertyName}</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "0 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", gap: 0 }}>
          {SECTIONS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              style={{
                flex: 1, padding: "12px 4px", border: "none", background: "none", cursor: "pointer",
                borderBottom: `2px solid ${s.key === activeSection ? "#A07830" : "transparent"}`,
                fontSize: 11, fontWeight: s.key === activeSection ? 600 : 400,
                color: i < sectionIndex ? "#2D6A2D" : s.key === activeSection ? "#A07830" : "#9CA3AF",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                transition: "all 0.15s",
              }}
            >
              {i < sectionIndex && <Check size={10} weight="bold" />}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 80px" }}>
        {/* Disclaimer */}
        <div style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.15)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Warning size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: "#92400E", margin: 0, lineHeight: 1.5 }}>
            Diese Selbstauskunft wird dem Vermieter zur Prüfung Ihrer Bewerbung übermittelt. Falsche Angaben können zur Anfechtung des Mietvertrages führen.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {activeSection === "persoenlich" && (
            <motion.div key="persoenlich" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <div style={cardStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#101418", marginBottom: 16, marginTop: 0 }}>Persönliche Daten</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Vorname" required error={isErr("vorname")}>
                    <input style={isErr("vorname") ? inputErrStyle : inputStyle} value={form.vorname} onChange={e => set("vorname", e.target.value)} placeholder="Max" />
                  </Field>
                  <Field label="Nachname" required error={isErr("nachname")}>
                    <input style={isErr("nachname") ? inputErrStyle : inputStyle} value={form.nachname} onChange={e => set("nachname", e.target.value)} placeholder="Mustermann" />
                  </Field>
                </div>
                <Field label="Geburtsdatum" required error={isErr("geburtsdatum")}>
                  <DatePicker value={form.geburtsdatum} onChange={v => set("geburtsdatum", v)} hasError={isErr("geburtsdatum")} />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Geburtsort">
                    <input style={inputStyle} value={form.geburtsort} onChange={e => set("geburtsort", e.target.value)} placeholder="Berlin" />
                  </Field>
                  <Field label="Nationalität">
                    <input style={inputStyle} value={form.nationalitaet} onChange={e => set("nationalitaet", e.target.value)} placeholder="Deutsch" />
                  </Field>
                  <Field label="Ausweistyp">
                    <select style={inputStyle} value={form.ausweis_typ} onChange={e => set("ausweis_typ", e.target.value)}>
                      <option value="personalausweis">Personalausweis</option>
                      <option value="reisepass">Reisepass</option>
                      <option value="aufenthaltstitel">Aufenthaltstitel</option>
                    </select>
                  </Field>
                  <Field label="Ausweisnummer">
                    <input style={inputStyle} value={form.ausweis_nr} onChange={e => set("ausweis_nr", e.target.value)} placeholder="L01X00T471" />
                  </Field>
                </div>
                <Field label="Aktuelle Adresse" required error={isErr("aktuelle_adresse")}>
                  <textarea style={{ ...(isErr("aktuelle_adresse") ? inputErrStyle : inputStyle), resize: "vertical", minHeight: 60 }} value={form.aktuelle_adresse} onChange={e => set("aktuelle_adresse", e.target.value)} placeholder="Musterstraße 1, 12345 Berlin" />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Wohnhaft seit">
                    <input type="month" style={inputStyle} value={form.wohnhaft_seit} onChange={e => set("wohnhaft_seit", e.target.value)} />
                  </Field>
                </div>
                <Field label="Kündigungsgrund (optional)">
                  <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} value={form.kuendigungsgrund} onChange={e => set("kuendigungsgrund", e.target.value)} placeholder="Warum verlassen Sie Ihre aktuelle Wohnung?" />
                </Field>
              </div>
              <button
                onClick={() => handleWeiter("beruf")}
                style={{ width: "100%", padding: "12px 0", background: "#A07830", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Weiter →
              </button>
            </motion.div>
          )}

          {activeSection === "beruf" && (
            <motion.div key="beruf" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <div style={cardStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#101418", marginBottom: 16, marginTop: 0 }}>Beruf & Einkommen</h3>
                <Field label="Beschäftigungsart" required error={isErr("beschaeftigungsart")}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {[
                      { val: "angestellt", label: "Angestellt" },
                      { val: "selbstaendig", label: "Selbstständig" },
                      { val: "beamter", label: "Beamter" },
                      { val: "rentner", label: "Rentner" },
                      { val: "student", label: "Student" },
                      { val: "sonstige", label: "Sonstiges" },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => set("beschaeftigungsart", opt.val)}
                        style={{
                          padding: "10px 8px",
                          border: `1.5px solid ${form.beschaeftigungsart === opt.val ? "#A07830" : isErr("beschaeftigungsart") ? "rgba(185,28,28,0.4)" : "rgba(0,0,0,0.1)"}`,
                          borderRadius: 9,
                          background: form.beschaeftigungsart === opt.val ? "rgba(160,120,48,0.08)" : isErr("beschaeftigungsart") ? "rgba(185,28,28,0.02)" : "white",
                          fontSize: 12, fontWeight: form.beschaeftigungsart === opt.val ? 600 : 400,
                          color: form.beschaeftigungsart === opt.val ? "#A07830" : "#6B7280",
                          cursor: "pointer", transition: "all 0.12s",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {isErr("beschaeftigungsart") && <p style={{ fontSize: 11, color: "#B91C1C", margin: "6px 0 0" }}>Bitte Beschäftigungsart auswählen</p>}
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Arbeitgeber" required error={isErr("arbeitgeber")}>
                    <input style={isErr("arbeitgeber") ? inputErrStyle : inputStyle} value={form.arbeitgeber} onChange={e => set("arbeitgeber", e.target.value)} placeholder="Firma GmbH" />
                  </Field>
                  <Field label="Beschäftigt seit">
                    <input type="month" style={inputStyle} value={form.beschaeftigt_seit} onChange={e => set("beschaeftigt_seit", e.target.value)} />
                  </Field>
                  <Field label="Beruf / Position">
                    <input style={inputStyle} value={form.beruf} onChange={e => set("beruf", e.target.value)} placeholder="Softwareentwickler" />
                  </Field>
                  <Field label="Nettoeinkommen (€/Monat)" required error={isErr("nettoeinkommen")}>
                    <input type="number" style={isErr("nettoeinkommen") ? inputErrStyle : inputStyle} value={form.nettoeinkommen} onChange={e => set("nettoeinkommen", e.target.value)} placeholder="2500" />
                  </Field>
                </div>

                {mietquote !== null && (
                  <div style={{ background: "rgba(160,120,48,0.04)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 10, padding: "12px 16px", marginTop: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>Mietquote</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: mietquoteColor }}>
                        {(mietquote * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF", margin: "4px 0 0" }}>
                      Empfehlung: Miete sollte max. 1/3 des Nettoeinkommens betragen
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, padding: "12px 0", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  <button
                    onClick={() => set("einkommen_nachweise", !form.einkommen_nachweise)}
                    style={{
                      width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
                      background: form.einkommen_nachweise ? "#A07830" : "rgba(0,0,0,0.15)",
                      position: "relative", transition: "background 0.2s", flexShrink: 0,
                    }}
                  >
                    <span style={{
                      position: "absolute", top: 2, left: form.einkommen_nachweise ? 18 : 2,
                      width: 16, height: 16, borderRadius: 8, background: "white",
                      transition: "left 0.2s", display: "block",
                    }} />
                  </button>
                  <span style={{ fontSize: 13, color: "#374151" }}>Ich kann Einkommensnachweise vorlegen</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setActiveSection("persoenlich")} style={{ flex: 1, padding: "12px 0", background: "white", color: "#6B7280", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, fontSize: 14, cursor: "pointer" }}>← Zurück</button>
                <button onClick={() => handleWeiter("haushalt")} style={{ flex: 2, padding: "12px 0", background: "#A07830", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Weiter →</button>
              </div>
            </motion.div>
          )}

          {activeSection === "haushalt" && (
            <motion.div key="haushalt" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <div style={cardStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#101418", marginBottom: 16, marginTop: 0 }}>Haushalt</h3>
                <Field label="Anzahl Personen">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => set("anzahl_personen", Math.max(1, form.anzahl_personen - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", background: "white", fontSize: 16, cursor: "pointer", color: "#374151" }}>−</button>
                    <span style={{ fontSize: 18, fontWeight: 600, color: "#101418", minWidth: 24, textAlign: "center" }}>{form.anzahl_personen}</span>
                    <button onClick={() => set("anzahl_personen", Math.min(10, form.anzahl_personen + 1))} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", background: "white", fontSize: 16, cursor: "pointer", color: "#374151" }}>+</button>
                  </div>
                </Field>
                {form.anzahl_personen > 1 && (
                  <Field label="Wer zieht noch ein?">
                    <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} value={form.personen_details} onChange={e => set("personen_details", e.target.value)} placeholder="Partner (36), Kind (8)..." />
                  </Field>
                )}

                {[
                  { key: "haustiere", label: "Haustiere vorhanden" },
                  { key: "raucher", label: "Ich bin Raucher" },
                ].map(item => (
                  <div key={item.key} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                      <button
                        onClick={() => set(item.key, !form[item.key as keyof typeof form])}
                        style={{
                          width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
                          background: form[item.key as keyof typeof form] ? "#A07830" : "rgba(0,0,0,0.15)",
                          position: "relative", transition: "background 0.2s", flexShrink: 0,
                        }}
                      >
                        <span style={{
                          position: "absolute", top: 2, left: form[item.key as keyof typeof form] ? 18 : 2,
                          width: 16, height: 16, borderRadius: 8, background: "white",
                          transition: "left 0.2s", display: "block",
                        }} />
                      </button>
                      <span style={{ fontSize: 13, color: "#374151" }}>{item.label}</span>
                    </div>
                    {item.key === "haustiere" && form.haustiere && (
                      <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 50, marginTop: 8 }} value={form.haustiere_beschreibung} onChange={e => set("haustiere_beschreibung", e.target.value)} placeholder="Katze, kastriert, 3 Jahre alt" />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setActiveSection("beruf")} style={{ flex: 1, padding: "12px 0", background: "white", color: "#6B7280", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, fontSize: 14, cursor: "pointer" }}>← Zurück</button>
                <button onClick={() => handleWeiter("finanzen")} style={{ flex: 2, padding: "12px 0", background: "#A07830", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Weiter →</button>
              </div>
            </motion.div>
          )}

          {activeSection === "finanzen" && (
            <motion.div key="finanzen" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <div style={cardStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#101418", marginBottom: 16, marginTop: 0 }}>Finanzielle Situation</h3>
                {[
                  { label: "Haben Sie Schufa-Einträge?", key: "schufa" },
                  { label: "Bestand oder besteht eine Insolvenz?", key: "insolvenz" },
                  { label: "Haben Sie aktuelle Mietschulden?", key: "mietschulden" },
                ].map(item => (
                  <div key={item.key} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8, marginTop: 0 }}>{item.label}</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      {item.key === "schufa"
                        ? [
                            { val: false, label: "Nein" },
                            { val: true, label: "Ja" },
                            { val: null, label: "Keine Auskunft" },
                          ].map(opt => (
                            <button
                              key={String(opt.val)}
                              onClick={() => set("schufa_sauber", opt.val === true ? false : opt.val === false ? true : null)}
                              style={{
                                flex: 1, padding: "8px 0", border: `1.5px solid ${
                                  (opt.val === null && form.schufa_sauber === null) ? "#A07830"
                                  : (opt.val === false && form.schufa_sauber === true) ? "#A07830"
                                  : (opt.val === true && form.schufa_sauber === false) ? "#A07830"
                                  : "rgba(0,0,0,0.1)"
                                }`,
                                borderRadius: 8, background: "white", fontSize: 12, cursor: "pointer",
                                color: "#374151", fontWeight: 500,
                              }}
                            >
                              {opt.label}
                            </button>
                          ))
                        : [{ val: false, label: "Nein" }, { val: true, label: "Ja" }].map(opt => (
                            <button
                              key={String(opt.val)}
                              onClick={() => set(item.key, opt.val)}
                              style={{
                                flex: 1, padding: "8px 0", border: `1.5px solid ${form[item.key as keyof typeof form] === opt.val ? "#A07830" : "rgba(0,0,0,0.1)"}`,
                                borderRadius: 8, background: form[item.key as keyof typeof form] === opt.val ? "rgba(160,120,48,0.06)" : "white",
                                fontSize: 12, cursor: "pointer", color: "#374151", fontWeight: 500,
                              }}
                            >
                              {opt.label}
                            </button>
                          ))
                      }
                    </div>
                  </div>
                ))}
                <Field label="Warum möchten Sie diese Wohnung? (optional)">
                  <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} value={form.warum_diese_wohnung} onChange={e => set("warum_diese_wohnung", e.target.value)} placeholder="Kurze Vorstellung und Motivation..." />
                </Field>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setActiveSection("haushalt")} style={{ flex: 1, padding: "12px 0", background: "white", color: "#6B7280", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, fontSize: 14, cursor: "pointer" }}>← Zurück</button>
                <button onClick={() => handleWeiter("einverstaendnis")} style={{ flex: 2, padding: "12px 0", background: "#A07830", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Weiter →</button>
              </div>
            </motion.div>
          )}

          {activeSection === "einverstaendnis" && (
            <motion.div key="einverstaendnis" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <div style={cardStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#101418", marginBottom: 16, marginTop: 0 }}>Einverständnis & Unterschrift</h3>
                {[
                  {
                    key: "einverstaendnis_datenschutz",
                    text: "Ich bestätige, dass alle Angaben wahrheitsgemäß sind. Falsche Angaben berechtigen den Vermieter zur Anfechtung des Mietvertrages.",
                  },
                  {
                    key: "einverstaendnis_schufa",
                    text: "Ich stimme der Verarbeitung meiner Daten zur Prüfung meiner Mietbewerbung zu. Die Daten werden nach Abschluss des Verfahrens gelöscht (DSGVO Art. 6).",
                  },
                ].map(item => (
                  <div
                    key={item.key}
                    onClick={() => set(item.key, !form[item.key as keyof typeof form])}
                    style={{
                      display: "flex", gap: 12, padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                      border: `1.5px solid ${
                        form[item.key as keyof typeof form] ? "#A07830"
                        : isErr(item.key) ? "#B91C1C"
                        : "rgba(0,0,0,0.1)"
                      }`,
                      background: form[item.key as keyof typeof form] ? "rgba(160,120,48,0.04)" : isErr(item.key) ? "rgba(185,28,28,0.03)" : "white",
                      marginBottom: 10, transition: "all 0.12s",
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 5,
                      border: `2px solid ${form[item.key as keyof typeof form] ? "#A07830" : isErr(item.key) ? "#B91C1C" : "rgba(0,0,0,0.2)"}`,
                      background: form[item.key as keyof typeof form] ? "#A07830" : "white",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
                      transition: "all 0.12s",
                    }}>
                      {form[item.key as keyof typeof form] && <Check size={10} color="white" weight="bold" />}
                    </div>
                    <p style={{ fontSize: 12, color: "#374151", margin: 0, lineHeight: 1.6 }}>{item.text}</p>
                  </div>
                ))}
                {(isErr("einverstaendnis_datenschutz") || isErr("einverstaendnis_schufa")) && (
                  <p style={{ fontSize: 11, color: "#B91C1C", margin: "0 0 12px" }}>Bitte beide Einverständnisse bestätigen</p>
                )}

                <div style={{ marginTop: 20 }}>
                  <div style={{ background: "rgba(0,0,0,0.02)", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                    <p style={{ fontSize: 11, color: "#6B7280", margin: "0 0 4px" }}>Datum</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#374151", margin: 0 }}>{new Date().toLocaleDateString("de-DE")}</p>
                  </div>
                  <Field label="Digitale Unterschrift" required error={isErr("unterschrift_name")}>
                    <SignaturePad
                      value={form.unterschrift_name}
                      onChange={v => set("unterschrift_name", v)}
                      hasError={isErr("unterschrift_name")}
                    />
                  </Field>
                </div>
              </div>

              {error && (
                <div style={{ background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: "#B91C1C", margin: 0 }}>{error}</p>
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setActiveSection("finanzen")} style={{ flex: 1, padding: "12px 0", background: "white", color: "#6B7280", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, fontSize: 14, cursor: "pointer" }}>← Zurück</button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    flex: 2, padding: "12px 0", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    background: "#A07830",
                    color: "white",
                    opacity: submitting ? 0.7 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  {submitting ? "Wird übermittelt..." : "Selbstauskunft einreichen"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p style={{ textAlign: "center", fontSize: 10, color: "#D1D5DB", marginTop: 32 }}>
          Powered by Imvestra · Ihre Daten werden nach Abschluss des Verfahrens gelöscht
        </p>
      </div>
    </div>
  )
}
