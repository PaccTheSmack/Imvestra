import type { } from "@/types"

const BASISZINSSATZ = 3.37

export function getVerzugszinssatz(): number {
  return BASISZINSSATZ + 5
}

export function calculateVerzugszinsen(
  betrag: number,
  faelligSeit: string,
  mahndatum: string = new Date().toISOString().split("T")[0]
): number {
  const tage = Math.max(0, Math.floor(
    (new Date(mahndatum).getTime() - new Date(faelligSeit).getTime())
    / (1000 * 60 * 60 * 24)
  ))
  const zinssatz = getVerzugszinssatz() / 100
  return Math.round(betrag * zinssatz * tage / 365 * 100) / 100
}

export function getMahnstufe(tageUeberfaellig: number): 1 | 2 | 3 {
  if (tageUeberfaellig >= 28) return 3
  if (tageUeberfaellig >= 7) return 2
  return 1
}

export function getMahngebuehr(mahnstufe: 1 | 2 | 3): number {
  if (mahnstufe === 1) return 0
  if (mahnstufe === 2) return 2.50
  return 5.00
}

export function getZahlungsfrist(
  mahndatum: string,
  mahnstufe: 1 | 2 | 3
): string {
  const days = mahnstufe === 3 ? 7 : 14
  const date = new Date(mahndatum)
  date.setDate(date.getDate() + days)
  return date.toISOString().split("T")[0]
}

export interface MahnungPreview {
  tenant_id: string
  property_id: string
  rent_payment_id: string
  tenantName: string
  propertyName: string
  address: string
  betrag_offen: number
  mahnstufe: 1 | 2 | 3
  mahngebuehr: number
  verzugszinsen: number
  gesamtbetrag: number
  faellig_seit: string
  tage_ueberfaellig: number
  zahlungsfrist: string
  email: string | null
  mahnsperre: boolean
}

export function generateMahnungText(
  mahnung: MahnungPreview,
  vermieterName: string,
  mahndatum: string = new Date().toLocaleDateString("de-DE")
): string {
  const stufeText = [
    "1. Mahnung",
    "2. Mahnung",
    "3. und letzte Mahnung",
  ][mahnung.mahnstufe - 1]

  const fristDate = new Date(mahnung.zahlungsfrist).toLocaleDateString("de-DE")

  return `${mahndatum}

${stufeText} – Offene Mietzahlung

Sehr geehrte/r ${mahnung.tenantName},

leider müssen wir feststellen, dass die Miete für das Objekt
${mahnung.address}
zum Fälligkeitsdatum ${new Date(mahnung.faellig_seit).toLocaleDateString("de-DE")}
noch nicht eingegangen ist.

Offener Betrag:     ${mahnung.betrag_offen.toFixed(2)} €${
  mahnung.mahngebuehr > 0
    ? `\nMahngebühr:         ${mahnung.mahngebuehr.toFixed(2)} €`
    : ""
}${
  mahnung.verzugszinsen > 0
    ? `\nVerzugszinsen:      ${mahnung.verzugszinsen.toFixed(2)} €`
    : ""
}
─────────────────────────────────
Gesamtbetrag:       ${mahnung.gesamtbetrag.toFixed(2)} €

Wir bitten Sie, den Gesamtbetrag bis spätestens
${fristDate}
auf unser Konto zu überweisen.${
  mahnung.mahnstufe === 3
    ? `

WICHTIGER HINWEIS: Dies ist unsere letzte Mahnung.
Bei weiterem Zahlungsverzug sehen wir uns gezwungen,
rechtliche Schritte einzuleiten und das Mietverhältnis
außerordentlich zu kündigen (§543 BGB).`
    : ""
}

Mit freundlichen Grüßen,
${vermieterName}`
}
