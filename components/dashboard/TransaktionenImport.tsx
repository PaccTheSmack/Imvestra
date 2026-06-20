"use client"

import { useState, useRef, useCallback } from "react"
import {
  FileText,
  Check,
  Warning,
  ArrowRight,
  Question,
} from "@phosphor-icons/react"
import { parseCSV, detectBankFormat, type ParsedTransaction } from "@/lib/csv-import"

interface TransaktionenImportProps {
  onImported?: (count: number) => void
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n)
}

function formatDate(iso: string) {
  if (!iso) return "—"
  return new Intl.DateTimeFormat("de-DE").format(new Date(iso))
}

type ImportState = "idle" | "parsing" | "preview" | "importing" | "done"

export default function TransaktionenImport({ onImported }: TransaktionenImportProps) {
const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [state, setState] = useState<ImportState>("idle")
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bankFormat, setBankFormat] = useState("")
  const [error, setError] = useState("")
  const [importedCount, setImportedCount] = useState(0)
  const [isImporting, setIsImporting] = useState(false)

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setError("Bitte eine CSV-Datei hochladen.")
      return
    }
    setState("parsing")
    setError("")
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const format = detectBankFormat(text)
      setBankFormat(format)
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        setError("Keine Transaktionen erkannt. Bitte prüfe das CSV-Format.")
        setState("idle")
        return
      }
      // Pre-select all incoming (positive) transactions
      const allIdx = new Set(parsed.map((_, i) => i))
      setSelected(allIdx)
      setTransactions(parsed)
      setState("preview")
    }
    reader.onerror = () => {
      setError("Fehler beim Lesen der Datei.")
      setState("idle")
    }
    reader.readAsText(file, "UTF-8")
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleImport = async () => {
    if (selected.size === 0) return
    setIsImporting(true)
    const toImport = transactions.filter((_, i) => selected.has(i))

    try {
      const res = await fetch("/api/bank-transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: toImport }),
      })
      const data = await res.json()
      setImportedCount(data.count ?? toImport.length)
      setState("done")
      onImported?.(data.count ?? toImport.length)
    } catch {
      setError("Import fehlgeschlagen. Bitte erneut versuchen.")
    } finally {
      setIsImporting(false)
    }
  }

  const bankFormatLabels: Record<string, string> = {
    sparkasse: "Sparkasse",
    dkb: "DKB",
    volksbank: "Volksbank / VR Bank",
    deutsche_bank: "Deutsche Bank",
    generic: "Generisches Format",
  }

  if (state === "done") {
    return (
      <div style={{ background: "rgba(45,106,45,0.04)", border: "1px solid rgba(45,106,45,0.15)", borderRadius: 14, padding: "40px 32px", textAlign: "center" }}>
        <div style={{ width: 52, height: 52, background: "rgba(45,106,45,0.1)", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Check size={24} color="#2D6A2D" weight="bold" />
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#2D6A2D" }}>{importedCount} Transaktionen importiert</p>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>Imvestra ordnet sie nun automatisch zu. Prüfe deine Aufgaben.</p>
        <button
          onClick={() => { setState("idle"); setTransactions([]); setSelected(new Set()) }}
          style={{ marginTop: 20, fontSize: 13, fontWeight: 500, color: "#6B7280", padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.1)" }}
        >
          Weiteren Import starten
        </button>
      </div>
    )
  }

  if (state === "preview") {
    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#101418" }}>{transactions.length} Transaktionen erkannt</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>Format: {bankFormatLabels[bankFormat] ?? "Unbekannt"} · Nur Eingänge angezeigt</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelected(new Set(transactions.map((_, i) => i))) }}
              style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)" }}
            >
              Alle
            </button>
            <button
              onClick={handleImport}
              disabled={selected.size === 0}
              className="flex items-center gap-1.5"
              style={{ fontSize: 13, fontWeight: 600, color: "white", background: "#A07830", padding: "8px 16px", borderRadius: 9, boxShadow: "0 4px 12px rgba(160,120,48,0.2)", opacity: selected.size === 0 ? 0.5 : 1 }}
            >
              {isImporting ? (
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
              ) : <ArrowRight size={13} />}
              {selected.size} importieren
            </button>
          </div>
        </div>

        {/* Notice */}
        <div style={{ background: "rgba(160,120,48,0.04)", border: "1px solid rgba(160,120,48,0.12)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: "#A07830" }}>
            Imvestra ordnet Transaktionen zu — Buchungen erfolgen erst nach deiner Bestätigung.
          </p>
        </div>

        {/* Transaction list */}
        <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, overflow: "hidden" }}>
          <div className="grid px-5 py-3" style={{ gridTemplateColumns: "32px 1fr 140px 100px", background: "#F8F7F4", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            {["", "AUFTRAGGEBER / VERWENDUNGSZWECK", "BETRAG", "DATUM"].map(h => (
              <span key={h} style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>{h}</span>
            ))}
          </div>
          {transactions.slice(0, 50).map((tx, i) => (
            <div
              key={i}
              className="grid px-5 items-center cursor-pointer transition-colors hover:bg-[#F8F7F4]"
              style={{ gridTemplateColumns: "32px 1fr 140px 100px", paddingTop: 12, paddingBottom: 12, borderBottom: i < transactions.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}
              onClick={() => {
                setSelected(prev => {
                  const next = new Set(prev)
                  if (next.has(i)) next.delete(i)
                  else next.add(i)
                  return next
                })
              }}
            >
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${selected.has(i) ? "#A07830" : "rgba(0,0,0,0.15)"}`, background: selected.has(i) ? "#A07830" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {selected.has(i) && <Check size={10} color="white" weight="bold" />}
              </div>
              <div className="min-w-0 pr-4">
                <p style={{ fontSize: 12, fontWeight: 500, color: "#101418", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.auftraggeber_name || "—"}</p>
                <p style={{ fontSize: 11, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.verwendungszweck || "—"}</p>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: tx.betrag >= 0 ? "#2D6A2D" : "#B91C1C", fontVariantNumeric: "tabular-nums" }}>
                {tx.betrag >= 0 ? "+" : ""}{formatCurrency(tx.betrag)}
              </p>
              <p style={{ fontSize: 11, color: "#9CA3AF" }}>{formatDate(tx.transaction_date)}</p>
            </div>
          ))}
          {transactions.length > 50 && (
            <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(0,0,0,0.04)", background: "#F8F7F4" }}>
              <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>... und {transactions.length - 50} weitere</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Format info */}
      <div className="flex items-start gap-3 mb-4" style={{ background: "rgba(160,120,48,0.04)", border: "1px solid rgba(160,120,48,0.12)", borderRadius: 12, padding: "12px 16px" }}>
        <Question size={16} color="#A07830" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#A07830", marginBottom: 2 }}>CSV-Export aus deinem Online-Banking</p>
          <p style={{ fontSize: 11, color: "#6B7280" }}>
            Unterstützte Banken: Sparkasse, DKB, Volksbank, Deutsche Bank und generisches Format.
            Gehe zu deinem Online-Banking → Kontoauszug → Export als CSV.
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="transition-all duration-150 cursor-pointer"
        style={{
          border: `2px dashed ${dragging ? "#A07830" : "rgba(160,120,48,0.25)"}`,
          borderRadius: 14,
          background: dragging ? "rgba(160,120,48,0.06)" : "rgba(160,120,48,0.02)",
          padding: "48px 32px",
          textAlign: "center",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".csv,text/csv"
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }}
        />
        {state === "parsing" ? (
          <div>
            <svg className="animate-spin mx-auto mb-3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A07830" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
            <p style={{ fontSize: 14, color: "#A07830" }}>Analysiere CSV...</p>
          </div>
        ) : (
          <>
            <div style={{ width: 56, height: 56, background: "#F0EDE4", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <FileText size={24} color="#A89A7A" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#101418", marginBottom: 6 }}>Kontoauszug importieren (CSV)</p>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>
              Datei hierher ziehen oder klicken<br />
              Sparkasse · DKB · Volksbank · Deutsche Bank
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-3" style={{ background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.15)", borderRadius: 9, padding: "10px 14px" }}>
          <Warning size={14} color="#B91C1C" />
          <p style={{ fontSize: 12, color: "#B91C1C" }}>{error}</p>
        </div>
      )}
    </div>
  )
}
