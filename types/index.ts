export type Plan = "free" | "pro" | "team";

export interface User {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  created_at: string;
}

export type PropertyType = "ETW" | "MFH" | "EFH" | "DHH" | "Gewerbe";

export interface Property {
  id: string;
  user_id: string;
  name: string;
  address: string;
  type: PropertyType;
  build_year: number;
  sqm: number;
  purchase_price: number;
  ancillary_costs_pct: number;
  market_value: number;
  rent_monthly: number;
  monthly_rate: number;
  units: number;
}

export interface CalculationResult {
  total_investment: number;
  ancillary_costs: number;
  gross_yield: number;
  net_yield: number;
  noi: number;
  cashflow_monthly: number;
  cashflow_yearly: number;
  roe: number;
  ltv: number;
  maintenance_yearly: number;
  management_yearly: number;
  vacancy_loss: number;
  effective_rent_yearly: number;
  dscr: number;
  price_multiplier: number;
  price_indicator: "günstig" | "fair" | "teuer" | "sehr teuer";
  fair_value_min: number;
  fair_value_max: number;
}

export interface Financing {
  id: string;
  property_id: string;
  bank: string;
  loan_amount: number;
  interest_rate: number;
  repayment_rate: number;
  rate_monthly: number;
  fixed_until: string;
  current_debt: number;
}

export interface TilgungsplanRow {
  year: number;
  restschuld_start: number;
  zinsen: number;
  tilgung: number;
  rate_jahres: number;
  restschuld_end: number;
}

export interface Szenario {
  id: string;
  label: string;
  kaufpreis: number;
  miete_monthly: number;
  zinssatz: number;
  tilgung: number;
  sqm: number;
  units: number;
}

export interface AfAResult {
  afa_rate: number;
  afa_type: "linear_2" | "linear_3" | "denkmal" | "neu";
  afa_yearly: number;
  afa_monthly: number;
  afa_total_period: number;
  remaining_years: number;
  steuerersparnis_yearly: number;
  steuerersparnis_monthly: number;
}

export interface KfWProgram {
  id: string;
  name: string;
  beschreibung: string;
  max_betrag: string;
  voraussetzung: string;
  applicable: boolean;
  reason?: string;
}

export interface SpekuResult {
  kaufdatum: string;
  speku_frei_ab: string;
  ist_spekulationsfrei: boolean;
  tage_verbleibend: number;
  jahre_verbleibend: number;
  steuer_bei_verkauf_jetzt?: number;
}
