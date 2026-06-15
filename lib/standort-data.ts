export interface StadtDaten {
  city: string
  state: string
  region: "grossstadt" | "mittelstadt" | "kleinstadt" | "laendlich"
  einwohner: number
  bevoelkerungstrend: "wachsend" | "stabil" | "schrumpfend"
  kaufpreis_etw_qm: number
  kaufpreis_haus_qm: number
  miete_qm: number
  kaufpreisfaktor: number
  leerstandsrisiko: "niedrig" | "mittel" | "hoch"
  mietrendite_markt: number
  investoren_score: number
  infrastruktur: "sehr gut" | "gut" | "mittel" | "eingeschränkt"
  wirtschaft: "stark" | "mittel" | "schwach"
  notes: string
}

const PLZ_MAP: Record<string, { city: string; state: string; region: "grossstadt" | "mittelstadt" | "kleinstadt" | "laendlich" }> = {
  // Bayern
  "80331": { city: "München", state: "Bayern", region: "grossstadt" },
  "80333": { city: "München", state: "Bayern", region: "grossstadt" },
  "80335": { city: "München", state: "Bayern", region: "grossstadt" },
  "80336": { city: "München", state: "Bayern", region: "grossstadt" },
  "80337": { city: "München", state: "Bayern", region: "grossstadt" },
  "80339": { city: "München", state: "Bayern", region: "grossstadt" },
  "81241": { city: "München", state: "Bayern", region: "grossstadt" },
  "90402": { city: "Nürnberg", state: "Bayern", region: "grossstadt" },
  "90403": { city: "Nürnberg", state: "Bayern", region: "grossstadt" },
  "86150": { city: "Augsburg", state: "Bayern", region: "grossstadt" },
  "93047": { city: "Regensburg", state: "Bayern", region: "mittelstadt" },
  "85049": { city: "Ingolstadt", state: "Bayern", region: "mittelstadt" },
  "91052": { city: "Erlangen", state: "Bayern", region: "mittelstadt" },
  "97070": { city: "Würzburg", state: "Bayern", region: "mittelstadt" },
  "87435": { city: "Kempten", state: "Bayern", region: "mittelstadt" },
  "83022": { city: "Rosenheim", state: "Bayern", region: "mittelstadt" },
  "82362": { city: "Weilheim", state: "Bayern", region: "kleinstadt" },

  // Berlin
  "10115": { city: "Berlin", state: "Berlin", region: "grossstadt" },
  "10117": { city: "Berlin", state: "Berlin", region: "grossstadt" },
  "10119": { city: "Berlin", state: "Berlin", region: "grossstadt" },
  "10178": { city: "Berlin", state: "Berlin", region: "grossstadt" },
  "10179": { city: "Berlin", state: "Berlin", region: "grossstadt" },
  "10243": { city: "Berlin", state: "Berlin", region: "grossstadt" },
  "12043": { city: "Berlin", state: "Berlin", region: "grossstadt" },
  "13347": { city: "Berlin", state: "Berlin", region: "grossstadt" },

  // Hamburg
  "20095": { city: "Hamburg", state: "Hamburg", region: "grossstadt" },
  "20097": { city: "Hamburg", state: "Hamburg", region: "grossstadt" },
  "20099": { city: "Hamburg", state: "Hamburg", region: "grossstadt" },
  "20144": { city: "Hamburg", state: "Hamburg", region: "grossstadt" },
  "22301": { city: "Hamburg", state: "Hamburg", region: "grossstadt" },
  "22767": { city: "Hamburg", state: "Hamburg", region: "grossstadt" },

  // NRW
  "50667": { city: "Köln", state: "NRW", region: "grossstadt" },
  "50668": { city: "Köln", state: "NRW", region: "grossstadt" },
  "50670": { city: "Köln", state: "NRW", region: "grossstadt" },
  "40210": { city: "Düsseldorf", state: "NRW", region: "grossstadt" },
  "40211": { city: "Düsseldorf", state: "NRW", region: "grossstadt" },
  "44135": { city: "Dortmund", state: "NRW", region: "grossstadt" },
  "45127": { city: "Essen", state: "NRW", region: "grossstadt" },
  "48143": { city: "Münster", state: "NRW", region: "grossstadt" },
  "52062": { city: "Aachen", state: "NRW", region: "grossstadt" },
  "42103": { city: "Wuppertal", state: "NRW", region: "grossstadt" },
  "47051": { city: "Duisburg", state: "NRW", region: "grossstadt" },
  "44787": { city: "Bochum", state: "NRW", region: "grossstadt" },
  "41061": { city: "Mönchengladbach", state: "NRW", region: "mittelstadt" },
  "59065": { city: "Hamm", state: "NRW", region: "mittelstadt" },
  "57072": { city: "Siegen", state: "NRW", region: "mittelstadt" },
  "32052": { city: "Herford", state: "NRW", region: "mittelstadt" },
  "33602": { city: "Bielefeld", state: "NRW", region: "grossstadt" },
  "46045": { city: "Oberhausen", state: "NRW", region: "grossstadt" },

  // Baden-Württemberg
  "70173": { city: "Stuttgart", state: "Baden-Württemberg", region: "grossstadt" },
  "70174": { city: "Stuttgart", state: "Baden-Württemberg", region: "grossstadt" },
  "76131": { city: "Karlsruhe", state: "Baden-Württemberg", region: "grossstadt" },
  "79098": { city: "Freiburg", state: "Baden-Württemberg", region: "grossstadt" },
  "89073": { city: "Ulm", state: "Baden-Württemberg", region: "mittelstadt" },
  "68159": { city: "Mannheim", state: "Baden-Württemberg", region: "grossstadt" },
  "69115": { city: "Heidelberg", state: "Baden-Württemberg", region: "mittelstadt" },
  "72070": { city: "Tübingen", state: "Baden-Württemberg", region: "mittelstadt" },

  // Hessen
  "60306": { city: "Frankfurt am Main", state: "Hessen", region: "grossstadt" },
  "60308": { city: "Frankfurt am Main", state: "Hessen", region: "grossstadt" },
  "60311": { city: "Frankfurt am Main", state: "Hessen", region: "grossstadt" },
  "65183": { city: "Wiesbaden", state: "Hessen", region: "grossstadt" },
  "34117": { city: "Kassel", state: "Hessen", region: "mittelstadt" },
  "64283": { city: "Darmstadt", state: "Hessen", region: "mittelstadt" },

  // Niedersachsen
  "30159": { city: "Hannover", state: "Niedersachsen", region: "grossstadt" },
  "30161": { city: "Hannover", state: "Niedersachsen", region: "grossstadt" },
  "38100": { city: "Braunschweig", state: "Niedersachsen", region: "grossstadt" },
  "26121": { city: "Oldenburg", state: "Niedersachsen", region: "mittelstadt" },
  "49074": { city: "Osnabrück", state: "Niedersachsen", region: "mittelstadt" },
  "38640": { city: "Goslar", state: "Niedersachsen", region: "kleinstadt" },
  "38642": { city: "Goslar", state: "Niedersachsen", region: "kleinstadt" },
  "38644": { city: "Goslar", state: "Niedersachsen", region: "kleinstadt" },
  "31134": { city: "Hildesheim", state: "Niedersachsen", region: "mittelstadt" },
  "21335": { city: "Lüneburg", state: "Niedersachsen", region: "mittelstadt" },

  // Sachsen
  "04103": { city: "Leipzig", state: "Sachsen", region: "grossstadt" },
  "04105": { city: "Leipzig", state: "Sachsen", region: "grossstadt" },
  "04107": { city: "Leipzig", state: "Sachsen", region: "grossstadt" },
  "01067": { city: "Dresden", state: "Sachsen", region: "grossstadt" },
  "01069": { city: "Dresden", state: "Sachsen", region: "grossstadt" },
  "09111": { city: "Chemnitz", state: "Sachsen", region: "grossstadt" },

  // Sachsen-Anhalt
  "06108": { city: "Halle (Saale)", state: "Sachsen-Anhalt", region: "grossstadt" },
  "39104": { city: "Magdeburg", state: "Sachsen-Anhalt", region: "grossstadt" },

  // Thüringen
  "99084": { city: "Erfurt", state: "Thüringen", region: "grossstadt" },
  "07743": { city: "Jena", state: "Thüringen", region: "mittelstadt" },

  // Brandenburg
  "14467": { city: "Potsdam", state: "Brandenburg", region: "grossstadt" },
  "03046": { city: "Cottbus", state: "Brandenburg", region: "mittelstadt" },

  // Mecklenburg-Vorpommern
  "18055": { city: "Rostock", state: "Mecklenburg-Vorpommern", region: "grossstadt" },
  "19053": { city: "Schwerin", state: "Mecklenburg-Vorpommern", region: "mittelstadt" },

  // Schleswig-Holstein
  "24103": { city: "Kiel", state: "Schleswig-Holstein", region: "grossstadt" },
  "23552": { city: "Lübeck", state: "Schleswig-Holstein", region: "grossstadt" },
  "25746": { city: "Heide", state: "Schleswig-Holstein", region: "kleinstadt" },

  // Rheinland-Pfalz
  "55116": { city: "Mainz", state: "Rheinland-Pfalz", region: "grossstadt" },
  "67059": { city: "Ludwigshafen", state: "Rheinland-Pfalz", region: "grossstadt" },
  "54290": { city: "Trier", state: "Rheinland-Pfalz", region: "mittelstadt" },

  // Saarland
  "66111": { city: "Saarbrücken", state: "Saarland", region: "grossstadt" },

  // Bremen
  "28195": { city: "Bremen", state: "Bremen", region: "grossstadt" },
  "28199": { city: "Bremen", state: "Bremen", region: "grossstadt" },
}

const STADT_DATA: Record<string, StadtDaten> = {
  "München": {
    city: "München", state: "Bayern", region: "grossstadt",
    einwohner: 1550000, bevoelkerungstrend: "wachsend",
    kaufpreis_etw_qm: 9800, kaufpreis_haus_qm: 10200,
    miete_qm: 22.5, kaufpreisfaktor: 36,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.028,
    investoren_score: 55, infrastruktur: "sehr gut", wirtschaft: "stark",
    notes: "Sehr hohe Kaufpreise drücken Rendite. Wertsteigerungspotenzial hoch aber Einstieg teuer.",
  },
  "Berlin": {
    city: "Berlin", state: "Berlin", region: "grossstadt",
    einwohner: 3750000, bevoelkerungstrend: "wachsend",
    kaufpreis_etw_qm: 5200, kaufpreis_haus_qm: 5800,
    miete_qm: 15.8, kaufpreisfaktor: 27,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.036,
    investoren_score: 65, infrastruktur: "sehr gut", wirtschaft: "stark",
    notes: "Dynamischer Markt mit Mietdeckel-Risiko. Nachfrage übersteigt Angebot deutlich.",
  },
  "Hamburg": {
    city: "Hamburg", state: "Hamburg", region: "grossstadt",
    einwohner: 1850000, bevoelkerungstrend: "wachsend",
    kaufpreis_etw_qm: 6100, kaufpreis_haus_qm: 6800,
    miete_qm: 17.2, kaufpreisfaktor: 30,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.034,
    investoren_score: 63, infrastruktur: "sehr gut", wirtschaft: "stark",
    notes: "Starke Wirtschaft, hohe Lebensqualität. Kaufpreise gestiegen aber stabile Renditen möglich.",
  },
  "Köln": {
    city: "Köln", state: "NRW", region: "grossstadt",
    einwohner: 1080000, bevoelkerungstrend: "wachsend",
    kaufpreis_etw_qm: 4800, kaufpreis_haus_qm: 5200,
    miete_qm: 14.5, kaufpreisfaktor: 28,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.036,
    investoren_score: 66, infrastruktur: "sehr gut", wirtschaft: "stark",
    notes: "Wachsende Metropole mit guter Infrastruktur. Kaufpreise moderat gestiegen.",
  },
  "Frankfurt am Main": {
    city: "Frankfurt am Main", state: "Hessen", region: "grossstadt",
    einwohner: 760000, bevoelkerungstrend: "wachsend",
    kaufpreis_etw_qm: 6800, kaufpreis_haus_qm: 7200,
    miete_qm: 18.9, kaufpreisfaktor: 30,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.033,
    investoren_score: 61, infrastruktur: "sehr gut", wirtschaft: "stark",
    notes: "Finanzmetropole mit hohen Preisen. Internationale Nachfrage stützt den Markt.",
  },
  "Stuttgart": {
    city: "Stuttgart", state: "Baden-Württemberg", region: "grossstadt",
    einwohner: 630000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 5900, kaufpreis_haus_qm: 6400,
    miete_qm: 16.8, kaufpreisfaktor: 29,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.034,
    investoren_score: 62, infrastruktur: "sehr gut", wirtschaft: "stark",
    notes: "Starker Wirtschaftsstandort. Automobilindustrie prägt den Markt.",
  },
  "Düsseldorf": {
    city: "Düsseldorf", state: "NRW", region: "grossstadt",
    einwohner: 640000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 5100, kaufpreis_haus_qm: 5600,
    miete_qm: 14.8, kaufpreisfaktor: 29,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.035,
    investoren_score: 64, infrastruktur: "sehr gut", wirtschaft: "stark",
    notes: "Attraktive Landeshauptstadt mit stabilem Markt und guter Infrastruktur.",
  },
  "Leipzig": {
    city: "Leipzig", state: "Sachsen", region: "grossstadt",
    einwohner: 610000, bevoelkerungstrend: "wachsend",
    kaufpreis_etw_qm: 3200, kaufpreis_haus_qm: 3600,
    miete_qm: 10.2, kaufpreisfaktor: 26,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.038,
    investoren_score: 75, infrastruktur: "gut", wirtschaft: "mittel",
    notes: "Boomstadt mit starkem Wachstum. Noch günstige Einstiegspreise bei steigender Nachfrage.",
  },
  "Dresden": {
    city: "Dresden", state: "Sachsen", region: "grossstadt",
    einwohner: 560000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 3000, kaufpreis_haus_qm: 3400,
    miete_qm: 9.8, kaufpreisfaktor: 25,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.039,
    investoren_score: 72, infrastruktur: "gut", wirtschaft: "mittel",
    notes: "Attraktive Kulturstadt mit soliden Renditen und moderaten Kaufpreisen.",
  },
  "Hannover": {
    city: "Hannover", state: "Niedersachsen", region: "grossstadt",
    einwohner: 540000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 3400, kaufpreis_haus_qm: 3800,
    miete_qm: 11.2, kaufpreisfaktor: 25,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.039,
    investoren_score: 71, infrastruktur: "gut", wirtschaft: "mittel",
    notes: "Solider Investitionsstandort mit fairen Preisen und stabiler Nachfrage.",
  },
  "Nürnberg": {
    city: "Nürnberg", state: "Bayern", region: "grossstadt",
    einwohner: 520000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 4200, kaufpreis_haus_qm: 4600,
    miete_qm: 12.8, kaufpreisfaktor: 27,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.037,
    investoren_score: 68, infrastruktur: "sehr gut", wirtschaft: "stark",
    notes: "Zweitgrößte bayerische Stadt mit soliden Fundamentaldaten.",
  },
  "Bremen": {
    city: "Bremen", state: "Bremen", region: "grossstadt",
    einwohner: 570000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 3100, kaufpreis_haus_qm: 3500,
    miete_qm: 10.5, kaufpreisfaktor: 25,
    leerstandsrisiko: "mittel", mietrendite_markt: 0.040,
    investoren_score: 69, infrastruktur: "gut", wirtschaft: "mittel",
    notes: "Hafenstadt mit günstigem Einstiegsniveau und ordentlichen Renditen.",
  },
  "Dortmund": {
    city: "Dortmund", state: "NRW", region: "grossstadt",
    einwohner: 590000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 2800, kaufpreis_haus_qm: 3100,
    miete_qm: 9.5, kaufpreisfaktor: 25,
    leerstandsrisiko: "mittel", mietrendite_markt: 0.040,
    investoren_score: 67, infrastruktur: "gut", wirtschaft: "mittel",
    notes: "Strukturwandel erfolgreich. Günstige Preise mit solider Mieternachfrage.",
  },
  "Essen": {
    city: "Essen", state: "NRW", region: "grossstadt",
    einwohner: 580000, bevoelkerungstrend: "schrumpfend",
    kaufpreis_etw_qm: 2400, kaufpreis_haus_qm: 2700,
    miete_qm: 8.8, kaufpreisfaktor: 23,
    leerstandsrisiko: "mittel", mietrendite_markt: 0.044,
    investoren_score: 61, infrastruktur: "gut", wirtschaft: "mittel",
    notes: "Günstige Kaufpreise aber Bevölkerungsrückgang beachten.",
  },
  "Freiburg": {
    city: "Freiburg", state: "Baden-Württemberg", region: "grossstadt",
    einwohner: 230000, bevoelkerungstrend: "wachsend",
    kaufpreis_etw_qm: 6200, kaufpreis_haus_qm: 6800,
    miete_qm: 17.5, kaufpreisfaktor: 30,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.034,
    investoren_score: 62, infrastruktur: "sehr gut", wirtschaft: "stark",
    notes: "Universitätsstadt mit sehr hoher Nachfrage. Kaufpreise auf Großstadtniveau.",
  },
  "Karlsruhe": {
    city: "Karlsruhe", state: "Baden-Württemberg", region: "grossstadt",
    einwohner: 310000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 4500, kaufpreis_haus_qm: 5000,
    miete_qm: 13.5, kaufpreisfaktor: 28,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.036,
    investoren_score: 66, infrastruktur: "sehr gut", wirtschaft: "stark",
    notes: "Technologiestandort mit stabiler Nachfrage und fairen Preisen.",
  },
  "Augsburg": {
    city: "Augsburg", state: "Bayern", region: "grossstadt",
    einwohner: 300000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 4800, kaufpreis_haus_qm: 5200,
    miete_qm: 13.2, kaufpreisfaktor: 30,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.033,
    investoren_score: 64, infrastruktur: "gut", wirtschaft: "stark",
    notes: "Drittgrößte bayerische Stadt mit guter Anbindung nach München.",
  },
  "Münster": {
    city: "Münster", state: "NRW", region: "grossstadt",
    einwohner: 315000, bevoelkerungstrend: "wachsend",
    kaufpreis_etw_qm: 4200, kaufpreis_haus_qm: 4700,
    miete_qm: 13.0, kaufpreisfaktor: 27,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.037,
    investoren_score: 70, infrastruktur: "sehr gut", wirtschaft: "stark",
    notes: "Universitätsstadt mit konstanter Nachfrage und stabilen Renditen.",
  },
  "Rostock": {
    city: "Rostock", state: "Mecklenburg-Vorpommern", region: "grossstadt",
    einwohner: 210000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 3200, kaufpreis_haus_qm: 3600,
    miete_qm: 10.8, kaufpreisfaktor: 25,
    leerstandsrisiko: "mittel", mietrendite_markt: 0.040,
    investoren_score: 65, infrastruktur: "gut", wirtschaft: "mittel",
    notes: "Wachsende Hafenstadt mit moderaten Preisen und solider Nachfrage.",
  },
  "Kiel": {
    city: "Kiel", state: "Schleswig-Holstein", region: "grossstadt",
    einwohner: 245000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 3100, kaufpreis_haus_qm: 3500,
    miete_qm: 10.5, kaufpreisfaktor: 25,
    leerstandsrisiko: "mittel", mietrendite_markt: 0.040,
    investoren_score: 64, infrastruktur: "gut", wirtschaft: "mittel",
    notes: "Landeshauptstadt mit Universitätsflair und stabiler Mieternachfrage.",
  },
  "Erfurt": {
    city: "Erfurt", state: "Thüringen", region: "grossstadt",
    einwohner: 215000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 2600, kaufpreis_haus_qm: 2900,
    miete_qm: 8.9, kaufpreisfaktor: 24,
    leerstandsrisiko: "mittel", mietrendite_markt: 0.041,
    investoren_score: 66, infrastruktur: "gut", wirtschaft: "mittel",
    notes: "Günstige Thüringer Landeshauptstadt mit soliden Fundamentaldaten.",
  },
  "Potsdam": {
    city: "Potsdam", state: "Brandenburg", region: "grossstadt",
    einwohner: 185000, bevoelkerungstrend: "wachsend",
    kaufpreis_etw_qm: 4800, kaufpreis_haus_qm: 5300,
    miete_qm: 14.2, kaufpreisfaktor: 28,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.036,
    investoren_score: 68, infrastruktur: "gut", wirtschaft: "stark",
    notes: "Berlin-Nähe treibt Nachfrage und Preise. Starkes Wachstum erwartet.",
  },
  "Mainz": {
    city: "Mainz", state: "Rheinland-Pfalz", region: "grossstadt",
    einwohner: 215000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 4600, kaufpreis_haus_qm: 5100,
    miete_qm: 13.8, kaufpreisfaktor: 28,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.036,
    investoren_score: 67, infrastruktur: "sehr gut", wirtschaft: "stark",
    notes: "Rhein-Main-Nähe sorgt für stabile Nachfrage und gute Fundamentaldaten.",
  },
  "Goslar": {
    city: "Goslar", state: "Niedersachsen", region: "kleinstadt",
    einwohner: 49000, bevoelkerungstrend: "schrumpfend",
    kaufpreis_etw_qm: 1650, kaufpreis_haus_qm: 1900,
    miete_qm: 7.2, kaufpreisfaktor: 19,
    leerstandsrisiko: "mittel", mietrendite_markt: 0.052,
    investoren_score: 62, infrastruktur: "mittel", wirtschaft: "mittel",
    notes: "Günstige Kaufpreise mit überdurchschnittlichen Renditen. Bevölkerungsrückgang beachten.",
  },
  "Braunschweig": {
    city: "Braunschweig", state: "Niedersachsen", region: "grossstadt",
    einwohner: 250000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 2900, kaufpreis_haus_qm: 3200,
    miete_qm: 9.8, kaufpreisfaktor: 25,
    leerstandsrisiko: "mittel", mietrendite_markt: 0.040,
    investoren_score: 67, infrastruktur: "gut", wirtschaft: "stark",
    notes: "Solider Forschungsstandort mit stabiler Nachfrage und fairen Preisen.",
  },
  "Magdeburg": {
    city: "Magdeburg", state: "Sachsen-Anhalt", region: "grossstadt",
    einwohner: 238000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 2100, kaufpreis_haus_qm: 2400,
    miete_qm: 7.8, kaufpreisfaktor: 22,
    leerstandsrisiko: "mittel", mietrendite_markt: 0.044,
    investoren_score: 63, infrastruktur: "gut", wirtschaft: "mittel",
    notes: "Günstige Preise mit solider Rendite. Strukturwandel im Gange.",
  },
  "Halle (Saale)": {
    city: "Halle (Saale)", state: "Sachsen-Anhalt", region: "grossstadt",
    einwohner: 240000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 2000, kaufpreis_haus_qm: 2300,
    miete_qm: 7.5, kaufpreisfaktor: 22,
    leerstandsrisiko: "mittel", mietrendite_markt: 0.045,
    investoren_score: 62, infrastruktur: "gut", wirtschaft: "mittel",
    notes: "Universitätsstadt nahe Leipzig. Günstige Preise mit solider Nachfrage.",
  },
  "Saarbrücken": {
    city: "Saarbrücken", state: "Saarland", region: "grossstadt",
    einwohner: 180000, bevoelkerungstrend: "schrumpfend",
    kaufpreis_etw_qm: 2200, kaufpreis_haus_qm: 2500,
    miete_qm: 8.2, kaufpreisfaktor: 22,
    leerstandsrisiko: "hoch", mietrendite_markt: 0.045,
    investoren_score: 54, infrastruktur: "mittel", wirtschaft: "schwach",
    notes: "Günstige Preise aber strukturelle Herausforderungen. Sorgfältige Objektwahl nötig.",
  },
  "Lübeck": {
    city: "Lübeck", state: "Schleswig-Holstein", region: "grossstadt",
    einwohner: 216000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 3400, kaufpreis_haus_qm: 3800,
    miete_qm: 11.2, kaufpreisfaktor: 25,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.040,
    investoren_score: 66, infrastruktur: "gut", wirtschaft: "mittel",
    notes: "Hansestädtisches Flair mit solider Nachfrage. Hamburg-Nähe als Vorteil.",
  },
  "Jena": {
    city: "Jena", state: "Thüringen", region: "mittelstadt",
    einwohner: 112000, bevoelkerungstrend: "wachsend",
    kaufpreis_etw_qm: 3200, kaufpreis_haus_qm: 3600,
    miete_qm: 11.0, kaufpreisfaktor: 24,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.041,
    investoren_score: 72, infrastruktur: "gut", wirtschaft: "stark",
    notes: "Boomende Universitäts- und Technologiestadt. Überdurchschnittliches Wachstum.",
  },
  "Regensburg": {
    city: "Regensburg", state: "Bayern", region: "mittelstadt",
    einwohner: 153000, bevoelkerungstrend: "wachsend",
    kaufpreis_etw_qm: 5100, kaufpreis_haus_qm: 5600,
    miete_qm: 14.2, kaufpreisfaktor: 30,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.033,
    investoren_score: 64, infrastruktur: "gut", wirtschaft: "stark",
    notes: "Wachsende bayerische Universitätsstadt mit hoher Lebensqualität.",
  },
  "Heidelberg": {
    city: "Heidelberg", state: "Baden-Württemberg", region: "mittelstadt",
    einwohner: 160000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 5800, kaufpreis_haus_qm: 6400,
    miete_qm: 16.5, kaufpreisfaktor: 29,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.034,
    investoren_score: 63, infrastruktur: "sehr gut", wirtschaft: "stark",
    notes: "Renommierte Universitätsstadt mit konstant hoher Nachfrage.",
  },
  "Ingolstadt": {
    city: "Ingolstadt", state: "Bayern", region: "mittelstadt",
    einwohner: 140000, bevoelkerungstrend: "wachsend",
    kaufpreis_etw_qm: 5200, kaufpreis_haus_qm: 5700,
    miete_qm: 14.5, kaufpreisfaktor: 30,
    leerstandsrisiko: "niedrig", mietrendite_markt: 0.033,
    investoren_score: 63, infrastruktur: "gut", wirtschaft: "stark",
    notes: "Audi-Standort mit stabiler Wirtschaft und guter Kaufkraft.",
  },
  "Bielefeld": {
    city: "Bielefeld", state: "NRW", region: "grossstadt",
    einwohner: 340000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 2800, kaufpreis_haus_qm: 3100,
    miete_qm: 9.5, kaufpreisfaktor: 25,
    leerstandsrisiko: "mittel", mietrendite_markt: 0.040,
    investoren_score: 67, infrastruktur: "gut", wirtschaft: "mittel",
    notes: "Solide Mittelstadt mit fairen Preisen und stabiler Nachfrage.",
  },
  "Chemnitz": {
    city: "Chemnitz", state: "Sachsen", region: "grossstadt",
    einwohner: 245000, bevoelkerungstrend: "stabil",
    kaufpreis_etw_qm: 1800, kaufpreis_haus_qm: 2100,
    miete_qm: 7.0, kaufpreisfaktor: 21,
    leerstandsrisiko: "mittel", mietrendite_markt: 0.046,
    investoren_score: 64, infrastruktur: "gut", wirtschaft: "mittel",
    notes: "Günstigster Großstadtmarkt Sachsens. Europäische Kulturhauptstadt 2025 bringt Aufmerksamkeit.",
  },
}

const BUNDESLAND_FALLBACK: Record<string, Partial<StadtDaten>> = {
  "Bayern":                   { kaufpreis_etw_qm: 4500, miete_qm: 13.0, kaufpreisfaktor: 29, investoren_score: 62 },
  "Baden-Württemberg":        { kaufpreis_etw_qm: 4200, miete_qm: 12.5, kaufpreisfaktor: 28, investoren_score: 63 },
  "NRW":                      { kaufpreis_etw_qm: 3200, miete_qm: 10.5, kaufpreisfaktor: 25, investoren_score: 64 },
  "Hessen":                   { kaufpreis_etw_qm: 4000, miete_qm: 12.0, kaufpreisfaktor: 28, investoren_score: 63 },
  "Niedersachsen":            { kaufpreis_etw_qm: 2800, miete_qm: 9.5,  kaufpreisfaktor: 25, investoren_score: 63 },
  "Berlin":                   { kaufpreis_etw_qm: 5200, miete_qm: 15.8, kaufpreisfaktor: 27, investoren_score: 65 },
  "Hamburg":                  { kaufpreis_etw_qm: 6100, miete_qm: 17.2, kaufpreisfaktor: 30, investoren_score: 63 },
  "Sachsen":                  { kaufpreis_etw_qm: 2800, miete_qm: 9.5,  kaufpreisfaktor: 25, investoren_score: 68 },
  "Sachsen-Anhalt":           { kaufpreis_etw_qm: 2000, miete_qm: 7.5,  kaufpreisfaktor: 22, investoren_score: 62 },
  "Thüringen":                { kaufpreis_etw_qm: 2400, miete_qm: 8.5,  kaufpreisfaktor: 23, investoren_score: 64 },
  "Brandenburg":              { kaufpreis_etw_qm: 3000, miete_qm: 10.0, kaufpreisfaktor: 25, investoren_score: 63 },
  "Mecklenburg-Vorpommern":   { kaufpreis_etw_qm: 2600, miete_qm: 9.0,  kaufpreisfaktor: 24, investoren_score: 62 },
  "Schleswig-Holstein":       { kaufpreis_etw_qm: 3000, miete_qm: 10.0, kaufpreisfaktor: 25, investoren_score: 63 },
  "Rheinland-Pfalz":          { kaufpreis_etw_qm: 2900, miete_qm: 9.5,  kaufpreisfaktor: 25, investoren_score: 62 },
  "Saarland":                 { kaufpreis_etw_qm: 2200, miete_qm: 8.0,  kaufpreisfaktor: 23, investoren_score: 57 },
  "Bremen":                   { kaufpreis_etw_qm: 3000, miete_qm: 10.0, kaufpreisfaktor: 25, investoren_score: 66 },
  "default":                  { kaufpreis_etw_qm: 2500, miete_qm: 8.5,  kaufpreisfaktor: 23, investoren_score: 60 },
}

export function getStadtData(plz: string): {
  stadtDaten: StadtDaten | null
  plzInfo: { city: string; state: string; region: "grossstadt" | "mittelstadt" | "kleinstadt" | "laendlich" } | null
  isFallback: boolean
} {
  const plzInfo = PLZ_MAP[plz] ?? null
  if (!plzInfo) return { stadtDaten: null, plzInfo: null, isFallback: false }

  const stadtDaten = STADT_DATA[plzInfo.city] ?? null
  if (stadtDaten) return { stadtDaten, plzInfo, isFallback: false }

  const fallback = BUNDESLAND_FALLBACK[plzInfo.state] ?? BUNDESLAND_FALLBACK["default"]!
  const kpEtw = fallback.kaufpreis_etw_qm ?? 2500
  const miete = fallback.miete_qm ?? 8.5

  return {
    stadtDaten: {
      city: plzInfo.city,
      state: plzInfo.state,
      region: plzInfo.region,
      einwohner: 0,
      bevoelkerungstrend: "stabil",
      kaufpreis_etw_qm: kpEtw,
      kaufpreis_haus_qm: Math.round(kpEtw * 1.1),
      miete_qm: miete,
      kaufpreisfaktor: fallback.kaufpreisfaktor ?? 23,
      leerstandsrisiko: "mittel",
      mietrendite_markt: (miete * 12) / (kpEtw * 1.1),
      investoren_score: fallback.investoren_score ?? 60,
      infrastruktur: "mittel",
      wirtschaft: "mittel",
      notes: `Für ${plzInfo.city} liegen keine detaillierten Daten vor. Werte basieren auf ${plzInfo.state}-Durchschnitt.`,
    },
    plzInfo,
    isFallback: true,
  }
}
