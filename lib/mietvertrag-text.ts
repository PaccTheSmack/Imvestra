export interface MietvertragDaten {
  vermieter_name: string
  vermieter_adresse: string
  mieter_name: string
  mieter_vorherige_adresse?: string
  objekt_adresse: string
  objekt_lage?: string
  wohnflaeche?: number
  zimmer_anzahl?: number
  mietbeginn: string
  mietende?: string
  befristet: boolean
  befristung_grund?: string
  kaltmiete: number
  nk_vorauszahlung: number
  kaution: number
  zahlung_faellig_tag: number
  zahlung_iban?: string
  zahlung_bank?: string
  zahlung_konto_inhaber?: string
  haustiere_erlaubt: boolean
  haustiere_details?: string
  untervermietung_erlaubt: boolean
  rauchen_erlaubt: boolean
  schoenheitsrep: boolean
  besondere_vereinbarungen?: string
  anzahl_schlussel: number
  nk_positionen: string[]
  erstelldatum: string
}

export function generateMietvertragText(d: MietvertragDaten): string {
  const warmmiete = d.kaltmiete + d.nk_vorauszahlung
  const kautionMonate = d.kaution / d.kaltmiete
  const mietbeginnFormatted = new Date(d.mietbeginn).toLocaleDateString("de-DE")
  const erstelldatumFormatted = new Date(d.erstelldatum).toLocaleDateString("de-DE")

  return `MIETVERTRAG FÜR WOHNRAUM

Erstellt am ${erstelldatumFormatted}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§ 1 VERTRAGSPARTEIEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VERMIETER:
${d.vermieter_name}
${d.vermieter_adresse}

MIETER:
${d.mieter_name}
${d.mieter_vorherige_adresse ? `Bisherige Anschrift: ${d.mieter_vorherige_adresse}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§ 2 MIETOBJEKT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Die Wohnung befindet sich in:
${d.objekt_adresse}
${d.objekt_lage ? `Lage: ${d.objekt_lage}` : ""}

${d.wohnflaeche ? `Wohnfläche: ca. ${d.wohnflaeche} m²` : ""}
${d.zimmer_anzahl ? `Zimmeranzahl: ${d.zimmer_anzahl}` : ""}

Die Wohnung wird mit ${d.anzahl_schlussel} Schlüsseln übergeben.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§ 3 MIETDAUER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Das Mietverhältnis beginnt am ${mietbeginnFormatted}.

${d.befristet && d.mietende
  ? `Das Mietverhältnis ist befristet bis zum ${new Date(d.mietende).toLocaleDateString("de-DE")}.

Grund der Befristung gemäß §575 BGB:
${d.befristung_grund ?? "Eigenbedarf"}`
  : `Das Mietverhältnis wird auf unbestimmte Zeit geschlossen.

Die gesetzlichen Kündigungsfristen gemäß §573c BGB gelten:
- Mieter: 3 Monate
- Vermieter: 3 Monate (ggf. länger nach Mietdauer)`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§ 4 MIETE UND NEBENKOSTEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Kaltmiete:                    ${d.kaltmiete.toFixed(2)} €
Vorauszahlung Nebenkosten:    ${d.nk_vorauszahlung.toFixed(2)} €
─────────────────────────────────────────────
Gesamtmiete:                  ${warmmiete.toFixed(2)} €

Die Miete ist monatlich im Voraus, spätestens am
${d.zahlung_faellig_tag}. Werktag eines jeden Monats zu zahlen.

Überweisung auf folgendes Konto:
Kontoinhaber: ${d.zahlung_konto_inhaber ?? d.vermieter_name}
IBAN: ${d.zahlung_iban ?? "________________"}
Bank: ${d.zahlung_bank ?? "________________"}

Verwendungszweck: "Miete [Monat/Jahr] ${d.objekt_adresse}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§ 5 NEBENKOSTEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Die Nebenkosten werden gemäß der Betriebskostenverordnung
(BetrKV) nach Verbrauch bzw. Wohnflächenanteil umgelegt.

Umlagefähige Betriebskosten gemäß §2 BetrKV:
${d.nk_positionen.map(p => `• ${p}`).join("\n")}

Über die Vorauszahlungen wird jährlich abgerechnet
(§556 Abs. 3 BGB). Nachzahlungen oder Guthaben werden
mitgeteilt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§ 6 KAUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Der Mieter leistet eine Sicherheitskaution von:
${d.kaution.toFixed(2)} € (${kautionMonate.toFixed(1)} Nettokaltmieten)

Die Kaution ist zu Beginn des Mietverhältnisses
zu zahlen und darf 3 Nettokaltmieten nicht übersteigen
(§551 BGB).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§ 7 TIERHALTUNG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${d.haustiere_erlaubt
  ? `Die Haltung von Haustieren ist${d.haustiere_details ? ` unter folgenden Bedingungen gestattet:\n${d.haustiere_details}` : " gestattet."}`
  : `Die Haltung von Haustieren (ausgenommen Kleintiere
wie Hamster, Vögel, Fische) ist nicht gestattet.`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§ 8 UNTERVERMIETUNG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${d.untervermietung_erlaubt
  ? `Eine Untervermietung ist mit vorheriger schriftlicher
Zustimmung des Vermieters gestattet.`
  : `Eine Untervermietung der Wohnung oder einzelner Zimmer
ist ohne schriftliche Zustimmung des Vermieters
nicht gestattet (§540 BGB).`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§ 9 SCHÖNHEITSREPARATUREN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${d.schoenheitsrep
  ? `Der Mieter führt Schönheitsreparaturen während der
Mietzeit bei Bedarf durch. Dies umfasst das Tapezieren,
Anstreichen oder Kalken der Wände und Decken, das
Streichen der Heizkörper und Versorgungsleitungen sowie
der Türen und Fenster (Innenbereich).

Hinweis: Starre Fristenpläne für Schönheitsreparaturen
sind nach aktueller BGH-Rechtsprechung unwirksam.`
  : `Schönheitsreparaturen trägt der Vermieter.`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§ 10 RAUCHEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${d.rauchen_erlaubt
  ? "Das Rauchen in der Wohnung ist gestattet."
  : `Das Rauchen in der Wohnung und in den
Gemeinschaftsräumen ist nicht gestattet.`}
${d.besondere_vereinbarungen ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§ 11 BESONDERE VEREINBARUNGEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${d.besondere_vereinbarungen}
` : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§ 12 SALVATORISCHE KLAUSEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sollten einzelne Bestimmungen dieses Vertrages unwirksam
sein, so berührt dies die Wirksamkeit der übrigen
Bestimmungen nicht.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§ 13 UNTERSCHRIFTEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ort, Datum: _______________________


_____________________________
${d.vermieter_name} (Vermieter)


_____________________________
${d.mieter_name} (Mieter)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WICHTIGER HINWEIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dieses Dokument wurde mit Imvestra erstellt und dient
als Vorlage. Es ersetzt keine Rechtsberatung.
Für rechtliche Verbindlichkeit empfehlen wir die
Prüfung durch einen Rechtsanwalt oder Mieterverein.

Erstellt mit Imvestra · imvestra.de · ${erstelldatumFormatted}`.trim()
}
