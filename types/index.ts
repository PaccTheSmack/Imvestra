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

export interface Tenant {
  id: string;
  property_id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  move_in_date: string;
  move_out_date?: string;
  rent_monthly: number;
  deposit: number;
  unit_number?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  property_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  category: string;
  source_type?: string;
  source_id?: string;
  auto_generated?: boolean;
  created_at: string;
}

export type FinanzierungUrgency = "critical" | "warning" | "ok" | "expired";

export interface FinanzierungWithProperty extends Financing {
  property: {
    id: string;
    name: string;
    type: string;
    purchase_price: number;
  };
  daysUntilExpiry: number;
  monthsUntilExpiry: number;
  urgency: FinanzierungUrgency;
}

export interface RentPayment {
  id: string;
  tenant_id: string;
  property_id: string;
  user_id: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: "pending" | "paid" | "late" | "partial";
  notes?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  property_id?: string;
  title: string;
  amount: number;
  category: "maintenance" | "management" | "insurance" | "tax" | "utilities" | "renovation" | "other";
  date: string;
  notes?: string;
  created_at: string;
}

export const EXPENSE_CATEGORIES = {
  maintenance: { label: "Instandhaltung", color: "#FFB800" },
  management:  { label: "Verwaltung",      color: "#00C896" },
  insurance:   { label: "Versicherung",    color: "#4B9EFF" },
  tax:         { label: "Steuern/Abgaben", color: "#FF4444" },
  utilities:   { label: "Nebenkosten",     color: "#A855F7" },
  renovation:  { label: "Renovierung",     color: "#FF8C00" },
  other:       { label: "Sonstiges",       color: "#666"    },
} as const;
