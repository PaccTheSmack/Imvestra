import { getStadtData } from "./standort-data"

export interface WertermittlungResult {
  methode1_ertragswert: number
  methode2_vergleichswert: number
  geschaetzter_marktwert: number
  kaufpreis: number
  wertentwicklung_eur: number
  wertentwicklung_pct: number
  wertentwicklung_pa: number
  jahre_seit_kauf: number
  kaufdatum?: string
  vertrauen: "hoch" | "mittel" | "niedrig"
  hinweis: string
}

const BUNDESLAND_STEIGERUNG: Record<string, number> = {
  "Bayern": 0.035,
  "Baden-Württemberg": 0.032,
  "Berlin": 0.038,
  "Hamburg": 0.030,
  "Hessen": 0.028,
  "NRW": 0.022,
  "Niedersachsen": 0.025,
  "Sachsen": 0.030,
  "Brandenburg": 0.032,
  "default": 0.024,
}

export function calculateWertermittlung(
  kaufpreis: number,
  rent_monthly: number,
  sqm: number,
  plz: string,
  kaufdatum?: string,
): WertermittlungResult {
  const { stadtDaten, plzInfo } = getStadtData(plz)

  const today = new Date()
  const kauf = kaufdatum ? new Date(kaufdatum) : null
  const jahre_seit_kauf = kauf
    ? (today.getTime() - kauf.getTime()) / (1000 * 60 * 60 * 24 * 365)
    : 0

  // Methode 1: Ertragswertverfahren — Jahreskaltmiete × lokaler Kaufpreisfaktor
  const markt_faktor = stadtDaten?.kaufpreisfaktor ?? 23
  const methode1_ertragswert = rent_monthly * 12 * markt_faktor

  // Methode 2: Vergleichswertverfahren — m² × Ø Kaufpreis/m²
  const markt_preis_qm = stadtDaten?.kaufpreis_etw_qm ?? 2500
  const methode2_vergleichswert = sqm * markt_preis_qm

  // Gewichteter Durchschnitt (60% Ertrag, 40% Vergleich)
  const basis_marktwert = methode1_ertragswert * 0.6 + methode2_vergleichswert * 0.4

  const steigerung = plzInfo?.state
    ? (BUNDESLAND_STEIGERUNG[plzInfo.state] ?? BUNDESLAND_STEIGERUNG["default"])
    : BUNDESLAND_STEIGERUNG["default"]

  const geschaetzter_marktwert = kauf && jahre_seit_kauf > 0
    ? kaufpreis * Math.pow(1 + steigerung, jahre_seit_kauf)
    : basis_marktwert

  const wertentwicklung_eur = kaufpreis > 0 ? geschaetzter_marktwert - kaufpreis : 0
  const wertentwicklung_pct = kaufpreis > 0 ? wertentwicklung_eur / kaufpreis : 0
  const wertentwicklung_pa = jahre_seit_kauf > 0 ? steigerung : 0

  const vertrauen = stadtDaten && !plzInfo?.city.includes("Fallback")
    ? "mittel"
    : "niedrig"

  const hinweis = stadtDaten
    ? `Schätzung basiert auf Marktdaten für ${stadtDaten.city}. Ertragswertverfahren (60%) + Vergleichswertverfahren (40%).`
    : "Keine lokalen Marktdaten verfügbar. Bundesland-Durchschnitt verwendet."

  return {
    methode1_ertragswert,
    methode2_vergleichswert,
    geschaetzter_marktwert,
    kaufpreis,
    wertentwicklung_eur,
    wertentwicklung_pct,
    wertentwicklung_pa,
    jahre_seit_kauf,
    kaufdatum,
    vertrauen,
    hinweis,
  }
}
