import type { Property, RentPayment, Expense, Financing } from "@/types";

export interface MonatsDaten {
  monat: number;
  betrag: number;
  status: "paid" | "pending" | "missing";
}

export interface AusgabeKategorie {
  kategorie: string;
  label: string;
  betrag: number;
  positionen: { titel: string; betrag: number; datum: string }[];
}

export interface PropertyJahresData {
  property_id: string;
  property_name: string;
  address: string;
  mieteinnahmen: MonatsDaten[];
  nk_vorauszahlungen: MonatsDaten[];
  mieteinnahmen_gesamt: number;
  nk_gesamt: number;
  ausgaben: AusgabeKategorie[];
  ausgaben_gesamt: number;
  afa_betrag: number;
  afa_basis: number;
  afa_prozent: number;
  ergebnis: number;
}

export interface JahresabrechnungData {
  jahr: number;
  properties: PropertyJahresData[];
  gesamt: {
    mieteinnahmen: number;
    nk_vorauszahlungen: number;
    ausgaben: number;
    ergebnis: number;
  };
}

export const AUSGABEN_KATEGORIEN: Record<string, string> = {
  maintenance: "Instandhaltung / Reparaturen",
  management: "Hausverwaltung",
  insurance: "Versicherungen",
  tax: "Steuern / Abgaben",
  utilities: "Nebenkosten",
  renovation: "Renovierung",
  other: "Sonstiges",
};

export function berechneJahresabrechnung(
  props: Property[],
  payments: RentPayment[],
  expenses: Expense[],
  _financings: Financing[],
  jahr: number
): JahresabrechnungData {
  const properties: PropertyJahresData[] = props.map((property) => {
    // 12 MonatsDaten for mieteinnahmen
    const mieteinnahmen: MonatsDaten[] = Array.from({ length: 12 }, (_, i) => {
      const monat = i + 1;
      const payment = payments.find((p) => {
        if (p.property_id !== property.id) return false;
        const d = new Date(p.due_date);
        return d.getFullYear() === jahr && d.getMonth() + 1 === monat;
      });

      if (!payment) {
        return { monat, betrag: 0, status: "missing" as const };
      }
      return {
        monat,
        betrag: payment.amount,
        status: payment.status === "paid" ? "paid" : "pending",
      };
    });

    // NK Vorauszahlungen — placeholder (no separate NK payment type in schema)
    const nk_vorauszahlungen: MonatsDaten[] = Array.from({ length: 12 }, (_, i) => ({
      monat: i + 1,
      betrag: 0,
      status: "missing" as const,
    }));

    const mieteinnahmen_gesamt = mieteinnahmen.reduce((s, m) => s + m.betrag, 0);
    const nk_gesamt = 0;

    // Group expenses by category for this property and year
    const propExpenses = expenses.filter((e) => {
      if (e.property_id !== property.id) return false;
      const d = new Date(e.date);
      return d.getFullYear() === jahr;
    });

    const ausgabenMap = new Map<string, AusgabeKategorie>();
    for (const kat of Object.keys(AUSGABEN_KATEGORIEN)) {
      ausgabenMap.set(kat, {
        kategorie: kat,
        label: AUSGABEN_KATEGORIEN[kat],
        betrag: 0,
        positionen: [],
      });
    }

    for (const exp of propExpenses) {
      const kat = ausgabenMap.get(exp.category);
      if (kat) {
        kat.betrag += exp.amount;
        kat.positionen.push({
          titel: exp.title,
          betrag: exp.amount,
          datum: exp.date,
        });
      }
    }

    const ausgaben = Array.from(ausgabenMap.values()).filter(
      (k) => k.betrag > 0
    );
    const ausgaben_gesamt = ausgaben.reduce((s, k) => s + k.betrag, 0);

    // AfA calculation
    const afa_prozent = property.build_year >= 1925 ? 0.02 : 0.025;
    const afa_basis = property.purchase_price;
    const afa_betrag = afa_basis * afa_prozent;

    const ergebnis =
      mieteinnahmen_gesamt + nk_gesamt - ausgaben_gesamt - afa_betrag;

    return {
      property_id: property.id,
      property_name: property.name,
      address: property.address,
      mieteinnahmen,
      nk_vorauszahlungen,
      mieteinnahmen_gesamt,
      nk_gesamt,
      ausgaben,
      ausgaben_gesamt,
      afa_betrag,
      afa_basis,
      afa_prozent,
      ergebnis,
    };
  });

  const gesamt = {
    mieteinnahmen: properties.reduce((s, p) => s + p.mieteinnahmen_gesamt, 0),
    nk_vorauszahlungen: 0,
    ausgaben: properties.reduce((s, p) => s + p.ausgaben_gesamt, 0),
    ergebnis: properties.reduce((s, p) => s + p.ergebnis, 0),
  };

  return { jahr, properties, gesamt };
}

export function generateDatevCsv(data: JahresabrechnungData): string {
  const lines: string[] = [];

  // DATEV Buchungsstapel header
  lines.push(
    `"EXTF";700;21;"Buchungsstapel";7;${data.jahr}0101;${data.jahr}1231;"Jahresabrechnung ${data.jahr}";"";1;0;;13;;0;`
  );
  lines.push(
    `"Umsatz (ohne Soll/Haben-Kz)";"Soll/Haben-Kennzeichen";"WKZ Umsatz";"Kurs";"Basis-Umsatz";"WKZ Basis-Umsatz";"Konto";"Gegenkonto (ohne BU-Schlüssel)";"BU-Schlüssel";"Belegdatum";"Belegfeld 1";"Belegfeld 2";"Skonto";"Buchungstext"`
  );

  for (const prop of data.properties) {
    // Mieteinnahmen
    for (const m of prop.mieteinnahmen) {
      if (m.betrag <= 0) continue;
      const monatStr = String(m.monat).padStart(2, "0");
      lines.push(
        `${m.betrag.toFixed(2).replace(".", ",")};H;EUR;;;;"1200";"8400";;"3101${data.jahr.toString().slice(2)}${monatStr}";"Miete ${monatStr}/${data.jahr}";;;"Mieteinnahmen ${prop.property_name}"`
      );
    }

    // Ausgaben
    for (const kat of prop.ausgaben) {
      for (const pos of kat.positionen) {
        const d = new Date(pos.datum);
        const belegdat = `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}`;
        lines.push(
          `${pos.betrag.toFixed(2).replace(".", ",")};S;EUR;;;;"4900";"1200";;"${belegdat}";"${pos.titel.slice(0, 36)}";;;"${kat.label}"`
        );
      }
    }

    // AfA
    lines.push(
      `${prop.afa_betrag.toFixed(2).replace(".", ",")};S;EUR;;;;"4850";"0400";;"3112${data.jahr.toString().slice(2)}";"AfA ${data.jahr}";;;"Abschreibung ${prop.property_name}"`
    );
  }

  return lines.join("\r\n");
}

export function generateAnlageVText(data: JahresabrechnungData): string {
  const lines: string[] = [];
  const sep = "=".repeat(60);

  lines.push(sep);
  lines.push(`ANLAGE V – EINKÜNFTE AUS VERMIETUNG UND VERPACHTUNG`);
  lines.push(`Veranlagungszeitraum: ${data.jahr}`);
  lines.push(sep);
  lines.push("");

  for (const prop of data.properties) {
    lines.push(`OBJEKT: ${prop.property_name}`);
    lines.push(`Adresse: ${prop.address}`);
    lines.push("-".repeat(50));

    lines.push("\nZeile 7 – Einnahmen aus Vermietung:");
    let mietTotal = 0;
    for (const m of prop.mieteinnahmen) {
      if (m.betrag > 0) {
        const monatNamen = [
          "Jan","Feb","Mär","Apr","Mai","Jun",
          "Jul","Aug","Sep","Okt","Nov","Dez",
        ];
        lines.push(`  ${monatNamen[m.monat - 1]} ${data.jahr}: ${m.betrag.toFixed(2)} EUR`);
        mietTotal += m.betrag;
      }
    }
    lines.push(`  Summe Mieteinnahmen: ${mietTotal.toFixed(2)} EUR`);

    lines.push("\nZeilen 33–58 – Werbungskosten:");
    for (const kat of prop.ausgaben) {
      lines.push(`  ${kat.label}: ${kat.betrag.toFixed(2)} EUR`);
      for (const pos of kat.positionen) {
        lines.push(`    - ${pos.datum} | ${pos.titel}: ${pos.betrag.toFixed(2)} EUR`);
      }
    }

    lines.push(`\nZeile 47 – Absetzung für Abnutzung (AfA):`);
    lines.push(
      `  Bemessungsgrundlage: ${prop.afa_basis.toFixed(2)} EUR`
    );
    lines.push(
      `  AfA-Satz: ${(prop.afa_prozent * 100).toFixed(1)} % (§ 7 Abs. ${prop.afa_prozent === 0.02 ? "4" : "4"} EStG)`
    );
    lines.push(`  AfA-Betrag: ${prop.afa_betrag.toFixed(2)} EUR`);

    lines.push(`\nErgebnis (§ 21 EStG):`);
    lines.push(`  Einnahmen:          ${prop.mieteinnahmen_gesamt.toFixed(2)} EUR`);
    lines.push(`  ./. Werbungskosten: ${prop.ausgaben_gesamt.toFixed(2)} EUR`);
    lines.push(`  ./. AfA:            ${prop.afa_betrag.toFixed(2)} EUR`);
    lines.push(
      `  = Einkünfte:        ${prop.ergebnis.toFixed(2)} EUR${prop.ergebnis < 0 ? "  (steuermindernd)" : ""}`
    );
    lines.push("");
  }

  lines.push(sep);
  lines.push("GESAMTÜBERSICHT");
  lines.push(sep);
  lines.push(`Mieteinnahmen gesamt:  ${data.gesamt.mieteinnahmen.toFixed(2)} EUR`);
  lines.push(`Ausgaben gesamt:       ${data.gesamt.ausgaben.toFixed(2)} EUR`);
  lines.push(
    `Ergebnis § 21 EStG:    ${data.gesamt.ergebnis.toFixed(2)} EUR${data.gesamt.ergebnis < 0 ? "  (steuermindernd)" : ""}`
  );

  return lines.join("\n");
}
