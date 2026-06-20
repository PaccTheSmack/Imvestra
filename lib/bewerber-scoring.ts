export interface Selbstauskunft {
  nettoeinkommen: number | null
  beschaeftigungsart: string | null
  beschaeftigt_seit: string | null
  arbeitgeber: string | null
  aktuelle_adresse: string | null
  schufa_sauber: boolean | null
  insolvenz: boolean | null
  mietschulden: boolean | null
  haustiere: boolean | null
  raucher: boolean | null
  einverstaendnis_datenschutz: boolean | null
}

export interface ScoreResult {
  gesamt: number
  details: {
    einkommen: number
    beschaeftigung: number
    schufa: number
    haushalt: number
    vollstaendigkeit: number
  }
  empfehlung: "stark" | "gut" | "pruefen" | "ablehnen"
  hinweise: string[]
}

export function berechneScore(auskunft: Selbstauskunft, kaltmiete: number): ScoreResult {
  const details = { einkommen: 0, beschaeftigung: 0, schufa: 0, haushalt: 0, vollstaendigkeit: 0 }
  const hinweise: string[] = []

  // 1. Einkommen (max 35)
  if (auskunft.nettoeinkommen) {
    const mietquote = kaltmiete / auskunft.nettoeinkommen
    if (mietquote <= 0.25) details.einkommen = 35
    else if (mietquote <= 0.33) { details.einkommen = 28; hinweise.push("Mietquote leicht erhöht (>25%)") }
    else if (mietquote <= 0.40) { details.einkommen = 18; hinweise.push("Mietquote erhöht (>33%) — Risiko") }
    else { details.einkommen = 5; hinweise.push("⚠ Mietquote sehr hoch (>40%) — Hohe Zahlungsausfallgefahr") }
  }

  // 2. Beschäftigung (max 25)
  switch (auskunft.beschaeftigungsart) {
    case "beamter":
      details.beschaeftigung = 25
      break
    case "angestellt": {
      const monate = auskunft.beschaeftigt_seit
        ? Math.floor((Date.now() - new Date(auskunft.beschaeftigt_seit).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : 0
      if (monate >= 24) details.beschaeftigung = 22
      else if (monate >= 6) details.beschaeftigung = 18
      else { details.beschaeftigung = 10; hinweise.push("Beschäftigt seit weniger als 6 Monaten") }
      break
    }
    case "selbstaendig":
      details.beschaeftigung = 15
      hinweise.push("Selbstständig — Einkommensnachweise besonders wichtig")
      break
    case "rentner":
      details.beschaeftigung = 20
      break
    case "student":
      details.beschaeftigung = 8
      hinweise.push("Student — Bürgschaft empfohlen")
      break
    default:
      details.beschaeftigung = 5
  }

  // 3. Schufa (max 25)
  if (auskunft.schufa_sauber === true) details.schufa = 25
  else if (auskunft.schufa_sauber === false) { details.schufa = 0; hinweise.push("⚠ Schufa-Einträge vorhanden — Ablehnung empfohlen") }
  else { details.schufa = 12; hinweise.push("Schufa-Status nicht angegeben") }

  if (auskunft.insolvenz) { details.schufa = Math.max(0, details.schufa - 15); hinweise.push("⚠ Insolvenz angegeben") }
  if (auskunft.mietschulden) { details.schufa = Math.max(0, details.schufa - 10); hinweise.push("⚠ Mietschulden angegeben") }

  // 4. Haushalt (max 10)
  details.haushalt = 10
  if (auskunft.haustiere) { details.haushalt -= 3; hinweise.push("Haustiere — vertraglich regeln") }
  if (auskunft.raucher) { details.haushalt -= 3; hinweise.push("Raucher") }

  // 5. Vollständigkeit (max 5)
  const pflicht = [auskunft.nettoeinkommen, auskunft.beschaeftigungsart, auskunft.arbeitgeber, auskunft.aktuelle_adresse, auskunft.einverstaendnis_datenschutz]
  details.vollstaendigkeit = Math.round((pflicht.filter(Boolean).length / pflicht.length) * 5)

  const gesamt = Math.min(100, Object.values(details).reduce((a, b) => a + b, 0))

  let empfehlung: ScoreResult["empfehlung"]
  if (gesamt >= 80) empfehlung = "stark"
  else if (gesamt >= 60) empfehlung = "gut"
  else if (gesamt >= 40) empfehlung = "pruefen"
  else empfehlung = "ablehnen"

  return { gesamt, details, empfehlung, hinweise }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "#2D6A2D"
  if (score >= 60) return "#A07830"
  if (score >= 40) return "#D97706"
  return "#B91C1C"
}

export function getScoreBg(score: number): string {
  if (score >= 80) return "rgba(45,106,45,0.08)"
  if (score >= 60) return "rgba(160,120,48,0.08)"
  if (score >= 40) return "rgba(217,119,6,0.08)"
  return "rgba(185,28,28,0.08)"
}

export function getEmpfehlungLabel(empfehlung: ScoreResult["empfehlung"]): { label: string; color: string; bg: string } {
  switch (empfehlung) {
    case "stark": return { label: "Sehr empfohlen", color: "#2D6A2D", bg: "rgba(45,106,45,0.08)" }
    case "gut": return { label: "Empfohlen", color: "#A07830", bg: "rgba(160,120,48,0.08)" }
    case "pruefen": return { label: "Genau prüfen", color: "#D97706", bg: "rgba(217,119,6,0.08)" }
    case "ablehnen": return { label: "Nicht empfohlen", color: "#B91C1C", bg: "rgba(185,28,28,0.08)" }
  }
}
