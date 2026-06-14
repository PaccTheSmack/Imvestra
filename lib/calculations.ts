import { Property, CalculationResult, Financing, TilgungsplanRow, AfAResult, KfWProgram, SpekuResult } from "@/types";

const ANCILLARY_COSTS_NDS = 0.10;
const MAINTENANCE_PER_SQM = 10;
const VACANCY_RATE = 0.03;
const MANAGEMENT_PER_UNIT_MONTHLY = 30;

export function calculateProperty(
  property: Property,
  financing?: Financing
): CalculationResult {
  const ancillary_costs = property.purchase_price * ANCILLARY_COSTS_NDS;
  const total_investment = property.purchase_price + ancillary_costs;
  const equity = total_investment - (financing?.loan_amount ?? 0);

  const effective_rent_yearly = property.rent_monthly * 12 * (1 - VACANCY_RATE);
  const vacancy_loss = property.rent_monthly * 12 * VACANCY_RATE;
  const maintenance_yearly = property.sqm * MAINTENANCE_PER_SQM;
  const management_yearly = property.units * MANAGEMENT_PER_UNIT_MONTHLY * 12;

  const noi = effective_rent_yearly - maintenance_yearly - management_yearly;
  const annual_rate = (financing?.rate_monthly ?? 0) * 12;
  const cashflow_yearly = noi - annual_rate;
  const cashflow_monthly = cashflow_yearly / 12;

  const gross_yield = (property.rent_monthly * 12) / property.purchase_price;
  const net_yield = noi / total_investment;
  const roe = equity > 0 ? cashflow_yearly / equity : 0;
  const ltv = financing ? financing.loan_amount / property.purchase_price : 0;

  const annual_debt_service = (financing?.rate_monthly ?? 0) * 12;
  const dscr = annual_debt_service > 0 ? noi / annual_debt_service : 0;

  const price_multiplier =
    property.rent_monthly * 12 > 0
      ? property.purchase_price / (property.rent_monthly * 12)
      : 0;

  const price_indicator: CalculationResult["price_indicator"] =
    price_multiplier <= 20
      ? "günstig"
      : price_multiplier <= 25
      ? "fair"
      : price_multiplier <= 30
      ? "teuer"
      : "sehr teuer";

  const fair_value_min = property.rent_monthly * 12 * 20;
  const fair_value_max = property.rent_monthly * 12 * 25;

  return {
    total_investment,
    ancillary_costs,
    gross_yield,
    net_yield,
    noi,
    cashflow_monthly,
    cashflow_yearly,
    roe,
    ltv,
    maintenance_yearly,
    management_yearly,
    vacancy_loss,
    effective_rent_yearly,
    dscr,
    price_multiplier,
    price_indicator,
    fair_value_min,
    fair_value_max,
  };
}

export function calculateTilgungsplan(
  loan_amount: number,
  interest_rate: number,
  repayment_rate: number,
  years: number = 30
): TilgungsplanRow[] {
  const rows: TilgungsplanRow[] = [];
  let restschuld = loan_amount;
  const annual_rate_total = loan_amount * (interest_rate + repayment_rate);
  const rate_monthly = annual_rate_total / 12;

  for (let year = 1; year <= years; year++) {
    if (restschuld <= 0) break;
    const restschuld_start = restschuld;
    let zinsen_year = 0;
    let tilgung_year = 0;

    for (let month = 0; month < 12; month++) {
      if (restschuld <= 0) break;
      const zinsen_month = restschuld * (interest_rate / 12);
      const tilgung_month = Math.min(rate_monthly - zinsen_month, restschuld);
      zinsen_year += zinsen_month;
      tilgung_year += tilgung_month;
      restschuld -= tilgung_month;
    }

    rows.push({
      year,
      restschuld_start,
      zinsen: zinsen_year,
      tilgung: tilgung_year,
      rate_jahres: zinsen_year + tilgung_year,
      restschuld_end: Math.max(0, restschuld),
    });
  }

  return rows;
}

export function calculateAfA(
  purchase_price: number,
  build_year: number,
  is_denkmal: boolean = false,
  is_neubau: boolean = false,
  grundstueck_anteil: number = 0.2,
  steuersatz: number = 0.42
): AfAResult {
  const gebaeude_wert = purchase_price * (1 - grundstueck_anteil);

  let afa_rate: number;
  let afa_type: AfAResult["afa_type"];

  if (is_denkmal) {
    afa_rate = 0.09;
    afa_type = "denkmal";
  } else if (is_neubau || build_year >= 2023) {
    afa_rate = 0.03;
    afa_type = "neu";
  } else if (build_year >= 1925) {
    afa_rate = 0.02;
    afa_type = "linear_2";
  } else {
    afa_rate = 0.025;
    afa_type = "linear_3";
  }

  const afa_yearly = gebaeude_wert * afa_rate;
  const afa_monthly = afa_yearly / 12;
  const remaining_years = Math.ceil(1 / afa_rate);
  const afa_total_period = afa_yearly * remaining_years;
  const steuerersparnis_yearly = afa_yearly * steuersatz;
  const steuerersparnis_monthly = steuerersparnis_yearly / 12;

  return {
    afa_rate,
    afa_type,
    afa_yearly,
    afa_monthly,
    afa_total_period,
    remaining_years,
    steuerersparnis_yearly,
    steuerersparnis_monthly,
  };
}

export function checkKfWPrograms(
  build_year: number,
  is_sanierung: boolean,
  is_neubau: boolean,
  energieeffizienz_klasse?: string
): KfWProgram[] {
  return [
    {
      id: "261",
      name: "KfW 261 – Wohngebäude Kredit",
      beschreibung: "Kredit für energieeffizientes Sanieren oder Bauen",
      max_betrag: "Bis zu 150.000 € pro WE",
      voraussetzung: "Sanierung auf KfW-Effizienzhaus-Standard",
      applicable: is_sanierung || is_neubau,
      reason: !is_sanierung && !is_neubau ? "Nur bei Neubau oder Sanierung anwendbar" : undefined,
    },
    {
      id: "300",
      name: "KfW 300 – Wohneigentum",
      beschreibung: "Kredit für selbst genutztes Wohneigentum",
      max_betrag: "Bis zu 100.000 €",
      voraussetzung: "Selbstnutzung der Immobilie",
      applicable: false,
      reason: "Nur für Selbstnutzer, nicht für Kapitalanleger",
    },
    {
      id: "358",
      name: "KfW 358/359 – Serielles Sanieren",
      beschreibung: "Förderung für seriell vorgefertigte Sanierungslösungen",
      max_betrag: "Bis zu 150.000 € pro WE",
      voraussetzung: "Seriell vorgefertigte Gebäudehülle",
      applicable: is_sanierung && build_year < 1990,
      reason: !is_sanierung ? "Nur bei geplanter Sanierung" : build_year >= 1990 ? "Besonders geeignet für Altbauten vor 1990" : undefined,
    },
    {
      id: "134",
      name: "KfW 134 – Wohngebäude Kredit Kauf",
      beschreibung: "Kredit für Kauf eines zertifizierten Effizienzhauses",
      max_betrag: "Bis zu 100.000 € pro WE",
      voraussetzung: "Kauf eines zertifizierten Effizienzhauses",
      applicable: energieeffizienz_klasse ? ["A+", "A", "B"].includes(energieeffizienz_klasse) : false,
      reason: !energieeffizienz_klasse ? "Energieeffizienzklasse angeben um zu prüfen" : undefined,
    },
    {
      id: "424",
      name: "KfW 424 – Altersgerecht Umbauen",
      beschreibung: "Zuschuss für barrierefreien Umbau",
      max_betrag: "Bis zu 6.250 € Zuschuss",
      voraussetzung: "Barrierefreie Maßnahmen nach DIN 18040-2",
      applicable: is_sanierung,
      reason: !is_sanierung ? "Nur bei Sanierungsmaßnahmen" : undefined,
    },
  ];
}

export function calculateSpekulationsfrist(
  kaufdatum: string,
  verkaufspreis?: number,
  purchase_price?: number,
  steuersatz: number = 0.42
): SpekuResult {
  const kauf = new Date(kaufdatum);
  const speku_frei = new Date(kauf);
  speku_frei.setFullYear(speku_frei.getFullYear() + 10);

  const heute = new Date();
  const ist_spekulationsfrei = heute >= speku_frei;

  const diff_ms = speku_frei.getTime() - heute.getTime();
  const tage_verbleibend = Math.max(0, Math.ceil(diff_ms / (1000 * 60 * 60 * 24)));
  const jahre_verbleibend = Math.max(0, tage_verbleibend / 365);

  let steuer_bei_verkauf_jetzt: number | undefined;
  if (!ist_spekulationsfrei && verkaufspreis && purchase_price) {
    const gewinn = verkaufspreis - purchase_price;
    steuer_bei_verkauf_jetzt = gewinn > 0 ? gewinn * steuersatz : 0;
  }

  return {
    kaufdatum,
    speku_frei_ab: speku_frei.toLocaleDateString("de-DE"),
    ist_spekulationsfrei,
    tage_verbleibend,
    jahre_verbleibend,
    steuer_bei_verkauf_jetzt,
  };
}
