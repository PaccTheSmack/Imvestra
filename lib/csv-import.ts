export interface ParsedTransaction {
  transaction_date: string     // ISO date
  booking_date?: string
  betrag: number               // positive = incoming
  verwendungszweck: string
  auftraggeber_name: string
  auftraggeber_iban?: string
  bank_account_iban?: string
  bank_reference?: string
  waehrung: string
}

export type BankFormat = "sparkasse" | "dkb" | "volksbank" | "deutsche_bank" | "generic"

function parseGermanDate(s: string): string {
  if (!s) return ""
  // DD.MM.YYYY → YYYY-MM-DD
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  return s
}

function parseAmount(s: string): number {
  if (!s) return 0
  // Remove currency symbols, handle German number format
  const cleaned = s.replace(/[€$£\s]/g, "").replace(/\./g, "").replace(",", ".")
  return parseFloat(cleaned) || 0
}

function detectFormat(headers: string[]): BankFormat {
  const h = headers.map(x => x.toLowerCase().trim())
  if (h.some(x => x.includes("buchungstag") && x.includes("glaeubiger"))) return "sparkasse"
  if (h.some(x => x.includes("buchungsdatum") && x.includes("gl.id"))) return "dkb"
  if (h.some(x => x.includes("buchungstag") && x.includes("auftraggeber/beguenstigter"))) return "volksbank"
  if (h.some(x => x.includes("buchungs") && x.includes("empfänger"))) return "deutsche_bank"
  return "generic"
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuote = !inQuote
      }
    } else if ((ch === "," || ch === ";") && !inQuote) {
      result.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export function parseCSV(csvText: string): ParsedTransaction[] {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  // Find header line (skip bank-specific preamble)
  let headerIdx = 0
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const cells = parseCSVLine(lines[i])
    if (cells.some(c => /datum|date|buchung/i.test(c))) {
      headerIdx = i
      break
    }
  }

  const headers = parseCSVLine(lines[headerIdx]).map(h => h.replace(/"/g, "").toLowerCase().trim())
  const format = detectFormat(headers)
  const transactions: ParsedTransaction[] = []

  const getCol = (row: string[], ...keys: string[]): string => {
    for (const key of keys) {
      const idx = headers.findIndex(h => h.includes(key.toLowerCase()))
      if (idx >= 0 && row[idx]) return row[idx].replace(/"/g, "").trim()
    }
    return ""
  }

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i])
    if (row.length < 3) continue

    let tx: ParsedTransaction | null = null

    if (format === "sparkasse") {
      const betragStr = getCol(row, "betrag (eur)", "betrag")
      const betrag = parseAmount(betragStr)
      if (betrag === 0) continue
      tx = {
        transaction_date: parseGermanDate(getCol(row, "buchungstag", "valutadatum")),
        booking_date: parseGermanDate(getCol(row, "buchungstag")),
        betrag,
        verwendungszweck: getCol(row, "verwendungszweck"),
        auftraggeber_name: getCol(row, "beguenstigter/zahlungspflichtiger", "auftraggeber"),
        auftraggeber_iban: getCol(row, "kontonummer", "iban"),
        waehrung: "EUR",
      }
    } else if (format === "dkb") {
      const betragStr = getCol(row, "betrag (eur)", "betrag")
      const betrag = parseAmount(betragStr)
      if (betrag === 0) continue
      tx = {
        transaction_date: parseGermanDate(getCol(row, "wertstellung", "buchungsdatum")),
        betrag,
        verwendungszweck: getCol(row, "verwendungszweck"),
        auftraggeber_name: getCol(row, "auftraggeber / beguenstigter"),
        auftraggeber_iban: getCol(row, "kontonummer"),
        waehrung: "EUR",
      }
    } else {
      // Generic fallback
      const betragStr = getCol(row, "betrag", "amount", "summe")
      const betrag = parseAmount(betragStr)
      if (betrag === 0) continue
      tx = {
        transaction_date: parseGermanDate(getCol(row, "datum", "date", "buchungsdatum", "buchungstag", "wertstellung")),
        betrag,
        verwendungszweck: getCol(row, "verwendungszweck", "beschreibung", "buchungstext", "text"),
        auftraggeber_name: getCol(row, "auftraggeber", "empfaenger", "empfänger", "name", "beguenstigter"),
        auftraggeber_iban: getCol(row, "iban", "kontonummer"),
        waehrung: "EUR",
      }
    }

    if (tx && tx.transaction_date && tx.betrag > 0) {
      transactions.push(tx)
    }
  }

  return transactions
}

export function detectBankFormat(csvText: string): BankFormat {
  const firstLines = csvText.split(/\r?\n/).slice(0, 10).join("\n").toLowerCase()
  if (firstLines.includes("sparkasse")) return "sparkasse"
  if (firstLines.includes("dkb")) return "dkb"
  if (firstLines.includes("volksbank") || firstLines.includes("vr bank")) return "volksbank"
  if (firstLines.includes("deutsche bank")) return "deutsche_bank"
  return "generic"
}
