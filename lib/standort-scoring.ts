import type { StadtDaten } from "./standort-data"

export interface StandortScore {
  gesamt: number
  rendite: number
  nachfrage: number
  sicherheit: number
  wachstum: number
  empfehlung: "kaufen" | "prüfen" | "abwarten" | "meiden"
  empfehlung_text: string
  analyse_text: string
  staerken: string[]
  risiken: string[]
}

export function calculateStandortScore(
  stadtDaten: StadtDaten,
  objectKaufpreis?: number,
  objectMiete?: number,
  objectSqm?: number,
): StandortScore {
  // Rendite-Score (0-25)
  const rendite_score = Math.min(25,
    stadtDaten.mietrendite_markt >= 0.06 ? 25 :
    stadtDaten.mietrendite_markt >= 0.05 ? 22 :
    stadtDaten.mietrendite_markt >= 0.04 ? 18 :
    stadtDaten.mietrendite_markt >= 0.03 ? 12 : 6
  )

  // Nachfrage-Score (0-25)
  const nachfrage_score =
    stadtDaten.leerstandsrisiko === "niedrig" ? 23 :
    stadtDaten.leerstandsrisiko === "mittel"  ? 15 : 6

  // Sicherheit-Score (0-25)
  const sicherheit_score =
    (stadtDaten.wirtschaft === "stark"  ? 10 : stadtDaten.wirtschaft === "mittel" ? 6 : 2) +
    (stadtDaten.infrastruktur === "sehr gut" ? 8 :
     stadtDaten.infrastruktur === "gut"      ? 6 :
     stadtDaten.infrastruktur === "mittel"   ? 3 : 1) +
    (stadtDaten.kaufpreisfaktor <= 20 ? 7 :
     stadtDaten.kaufpreisfaktor <= 25 ? 5 :
     stadtDaten.kaufpreisfaktor <= 30 ? 3 : 1)

  // Wachstum-Score (0-25)
  const wachstum_score =
    stadtDaten.bevoelkerungstrend === "wachsend"    ? 23 :
    stadtDaten.bevoelkerungstrend === "stabil"      ? 14 : 4

  const gesamt = Math.min(100, rendite_score + nachfrage_score + sicherheit_score + wachstum_score)

  const empfehlung: StandortScore["empfehlung"] =
    gesamt >= 70 ? "kaufen" :
    gesamt >= 58 ? "prüfen" :
    gesamt >= 45 ? "abwarten" : "meiden"

  const empfehlung_labels: Record<StandortScore["empfehlung"], string> = {
    kaufen:   "Attraktiver Investitionsstandort",
    prüfen:   "Solider Standort mit Potenzial",
    abwarten: "Standort mit gemischtem Bild",
    meiden:   "Erhöhtes Risiko – sorgfältig prüfen",
  }

  let objektVergleich = ""
  if (objectKaufpreis && objectSqm && objectMiete) {
    const objKaufpreisQm = objectKaufpreis / objectSqm
    const objMieteQm = objectMiete / objectSqm
    const kaufpreisDiff = ((objKaufpreisQm - stadtDaten.kaufpreis_etw_qm) / stadtDaten.kaufpreis_etw_qm) * 100
    const mieteDiff = ((objMieteQm - stadtDaten.miete_qm) / stadtDaten.miete_qm) * 100
    objektVergleich = ` Dein Objekt liegt kaufpreisseitig ${
      kaufpreisDiff > 0
        ? `${kaufpreisDiff.toFixed(0)}% über`
        : `${Math.abs(kaufpreisDiff).toFixed(0)}% unter`
    } dem Marktdurchschnitt. Die Miete liegt ${
      mieteDiff > 0
        ? `${mieteDiff.toFixed(0)}% über`
        : `${Math.abs(mieteDiff).toFixed(0)}% unter`
    } dem lokalen Niveau.`
  }

  const regionLabel =
    stadtDaten.region === "grossstadt"  ? "Großstadtstandort" :
    stadtDaten.region === "mittelstadt" ? "Mittelstadtstandort" :
    stadtDaten.region === "kleinstadt"  ? "Kleinstadtstandort" : "ländlicher Standort"

  const trendLabel =
    stadtDaten.bevoelkerungstrend === "wachsend"    ? "wachsender" :
    stadtDaten.bevoelkerungstrend === "stabil"      ? "stabiler" : "schrumpfender"

  const analyse_text = [
    `${stadtDaten.city} (${stadtDaten.state}) ist ein ${regionLabel} mit ${trendLabel} Bevölkerungsentwicklung.`,
    stadtDaten.notes,
    objektVergleich,
  ].filter(Boolean).join(" ")

  const staerken: string[] = []
  if (stadtDaten.bevoelkerungstrend === "wachsend") staerken.push("Wachsende Bevölkerung")
  if (stadtDaten.leerstandsrisiko === "niedrig") staerken.push("Niedriges Leerstandsrisiko")
  if (stadtDaten.wirtschaft === "stark") staerken.push("Starke Wirtschaft")
  if (stadtDaten.mietrendite_markt >= 0.045) staerken.push("Überdurchschnittliche Marktrendite")
  if (stadtDaten.kaufpreisfaktor <= 22) staerken.push("Günstiger Kaufpreisfaktor")
  if (stadtDaten.infrastruktur === "sehr gut") staerken.push("Sehr gute Infrastruktur")

  const risiken: string[] = []
  if (stadtDaten.bevoelkerungstrend === "schrumpfend") risiken.push("Schrumpfende Bevölkerung")
  if (stadtDaten.leerstandsrisiko === "hoch") risiken.push("Hohes Leerstandsrisiko")
  if (stadtDaten.wirtschaft === "schwach") risiken.push("Schwache Wirtschaftslage")
  if (stadtDaten.kaufpreisfaktor >= 30) risiken.push("Hoher Kaufpreisfaktor")
  if (stadtDaten.mietrendite_markt < 0.03) risiken.push("Niedrige Marktrendite")

  return {
    gesamt,
    rendite: rendite_score,
    nachfrage: nachfrage_score,
    sicherheit: sicherheit_score,
    wachstum: wachstum_score,
    empfehlung,
    empfehlung_text: empfehlung_labels[empfehlung],
    analyse_text,
    staerken,
    risiken,
  }
}
