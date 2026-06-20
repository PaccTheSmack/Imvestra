export interface BetrkvPosition {
  nr: number
  kostenart: string
  bezeichnung: string
  standard_schluessel: "flaeche" | "personen" | "verbrauch" | "einheiten"
  umlagefaehig: boolean
  hinweis?: string
}

export const BETRKV_POSITIONEN: BetrkvPosition[] = [
  { nr: 1,  kostenart: "grundsteuer",    bezeichnung: "Grundsteuer",                            standard_schluessel: "flaeche",   umlagefaehig: true },
  { nr: 2,  kostenart: "wasser",         bezeichnung: "Wasserversorgung",                       standard_schluessel: "verbrauch", umlagefaehig: true, hinweis: "Verbrauchsabhängig nach Zählerstand" },
  { nr: 3,  kostenart: "entwaesserung",  bezeichnung: "Entwässerung",                           standard_schluessel: "verbrauch", umlagefaehig: true },
  { nr: 4,  kostenart: "heizung",        bezeichnung: "Heizung",                                standard_schluessel: "verbrauch", umlagefaehig: true, hinweis: "Mindestens 50% verbrauchsabhängig (HeizkostenV §7)" },
  { nr: 5,  kostenart: "warmwasser",     bezeichnung: "Warmwasserversorgung",                   standard_schluessel: "verbrauch", umlagefaehig: true },
  { nr: 6,  kostenart: "fahrstuhl",      bezeichnung: "Fahrstuhl",                              standard_schluessel: "einheiten", umlagefaehig: true },
  { nr: 7,  kostenart: "muell",          bezeichnung: "Straßenreinigung + Müllabfuhr",          standard_schluessel: "personen",  umlagefaehig: true },
  { nr: 8,  kostenart: "hausreinigung",  bezeichnung: "Hausreinigung + Ungezieferbekämpfung",   standard_schluessel: "flaeche",   umlagefaehig: true },
  { nr: 9,  kostenart: "gartenpflege",   bezeichnung: "Gartenpflege",                           standard_schluessel: "flaeche",   umlagefaehig: true },
  { nr: 10, kostenart: "beleuchtung",    bezeichnung: "Beleuchtung",                            standard_schluessel: "einheiten", umlagefaehig: true },
  { nr: 11, kostenart: "schornstein",    bezeichnung: "Schornsteinreinigung",                   standard_schluessel: "einheiten", umlagefaehig: true },
  { nr: 12, kostenart: "versicherung",   bezeichnung: "Sach- und Haftpflichtversicherung",      standard_schluessel: "flaeche",   umlagefaehig: true },
  { nr: 13, kostenart: "hauswart",       bezeichnung: "Hauswart",                               standard_schluessel: "flaeche",   umlagefaehig: true },
  { nr: 14, kostenart: "antenne",        bezeichnung: "Gemeinschaftsantenne / Kabelfernsehen",  standard_schluessel: "einheiten", umlagefaehig: true },
  { nr: 15, kostenart: "wascheinrichtung", bezeichnung: "Wascheinrichtungen",                   standard_schluessel: "einheiten", umlagefaehig: true },
  { nr: 16, kostenart: "sonstige",       bezeichnung: "Sonstige Betriebskosten",                standard_schluessel: "flaeche",   umlagefaehig: true, hinweis: "Nur wenn im Mietvertrag vereinbart (§2 Nr. 17 BetrKV)" },
]

export const UMLAGESCHLUESSEL_LABELS: Record<string, string> = {
  flaeche:   "Wohnfläche (m²)",
  personen:  "Personenzahl",
  verbrauch: "Verbrauch (Zähler)",
  einheiten: "Wohneinheiten",
  direkt:    "Direkt (nur 1 Mieter)",
}
