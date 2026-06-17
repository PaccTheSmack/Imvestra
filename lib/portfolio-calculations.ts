import type { Property, Financing, RentPayment, Expense } from "@/types"
import { calculateWertermittlung } from "./wertermittlung"

export interface PropertyMetrics {
  property_id: string
  kaufpreis: number
  nebenkosten: number
  gesamtinvestition: number
  marktwert: number
  wertentwicklung_eur: number
  wertentwicklung_pct: number
  restschuld: number
  getilgtes_kapital: number
  eigenkapital_eingesetzt: number
  eigenkapital_aktuell: number
  eigenkapital_gewinn: number
  brutto_rendite: number
  netto_rendite: number
  eigenkapital_rendite: number
  cashflow_monthly: number
  cashflow_yearly: number
  ltv: number
  dscr: number
}

export interface PortfolioSummary {
  total_kaufpreis: number
  total_nebenkosten: number
  total_gesamtinvestition: number
  total_marktwert: number
  total_wertentwicklung_eur: number
  total_wertentwicklung_pct: number
  total_eingesetztes_eigenkapital: number
  total_eigenkapital_aktuell: number
  total_eigenkapital_gewinn: number
  total_eigenkapital_rendite: number
  total_restschuld: number
  total_getilgtes_kapital: number
  total_fremdkapital_quote: number
  total_cashflow_monthly: number
  total_cashflow_yearly: number
  total_mieteinnahmen_monthly: number
  total_mieteinnahmen_yearly: number
  total_kosten_monthly: number
  portfolio_brutto_rendite: number
  portfolio_netto_rendite: number
  portfolio_roe: number
  portfolio_gesamtrendite: number
  anzahl_objekte: number
  anzahl_einheiten: number
  gesamt_flaeche: number
  leerstandsquote: number
  wert_verlauf: { date: string; wert: number; eigenkapital: number }[]
}

export function calculatePropertyMetrics(
  property: Property,
  financings: Financing[],
  _payments: RentPayment[], // eslint-disable-line @typescript-eslint/no-unused-vars
  _expenses: Expense[], // eslint-disable-line @typescript-eslint/no-unused-vars
): PropertyMetrics {
  const financing = financings.find(f => f.property_id === property.id)

  const kaufpreis = property.purchase_price ?? 0
  const nebenkosten = kaufpreis * (property.ancillary_costs_pct ?? 0.10)
  const gesamtinvestition = kaufpreis + nebenkosten

  const plz = property.address?.match(/\d{5}/)?.[0] ?? ""
  const marktwert = property.market_value_estimated
    ?? (kaufpreis > 0
        ? calculateWertermittlung(
            kaufpreis,
            property.rent_monthly ?? 0,
            property.sqm ?? 0,
            plz,
            (property as Property & { kaufdatum?: string }).kaufdatum ?? undefined,
          ).geschaetzter_marktwert
        : 0)

  const wertentwicklung_eur = marktwert - kaufpreis
  const wertentwicklung_pct = kaufpreis > 0 ? wertentwicklung_eur / kaufpreis : 0

  const loanAmount = financing?.loan_amount ?? 0
  const restschuld = financing?.current_debt ?? loanAmount
  const getilgtes_kapital = loanAmount - restschuld

  const eigenkapital_eingesetzt = gesamtinvestition - loanAmount
  const eigenkapital_aktuell = marktwert - restschuld
  const eigenkapital_gewinn = eigenkapital_aktuell - eigenkapital_eingesetzt

  const rate_monthly = financing?.rate_monthly ?? 0
  const hausgeld = property.hausgeld_monthly ?? 0
  const instandhaltung = (property.sqm ?? 0) * (10 / 12)
  const cashflow_monthly = (property.rent_monthly ?? 0) - rate_monthly - hausgeld - instandhaltung
  const cashflow_yearly = cashflow_monthly * 12

  const jahresmiete = (property.rent_monthly ?? 0) * 12
  const brutto_rendite = kaufpreis > 0 ? jahresmiete / kaufpreis : 0
  const netto_rendite = gesamtinvestition > 0 ? (cashflow_yearly + getilgtes_kapital) / gesamtinvestition : 0
  const eigenkapital_rendite = eigenkapital_eingesetzt > 0 ? cashflow_yearly / eigenkapital_eingesetzt : 0

  const ltv = marktwert > 0 ? restschuld / marktwert : 0
  const noi = jahresmiete * 0.85
  const annual_debt = rate_monthly * 12
  const dscr = annual_debt > 0 ? noi / annual_debt : 0

  return {
    property_id: property.id,
    kaufpreis, nebenkosten, gesamtinvestition,
    marktwert, wertentwicklung_eur, wertentwicklung_pct,
    restschuld, getilgtes_kapital,
    eigenkapital_eingesetzt, eigenkapital_aktuell, eigenkapital_gewinn,
    brutto_rendite, netto_rendite, eigenkapital_rendite,
    cashflow_monthly, cashflow_yearly,
    ltv, dscr,
  }
}

export function calculatePortfolioSummary(
  properties: Property[],
  financings: Financing[],
  payments: RentPayment[],
  expenses: Expense[],
): PortfolioSummary {
  const metrics = properties.map(p =>
    calculatePropertyMetrics(p, financings, payments, expenses)
  )

  const sum = (key: keyof PropertyMetrics) =>
    metrics.reduce((s, m) => s + (m[key] as number), 0)

  const total_kaufpreis = sum("kaufpreis")
  const total_nebenkosten = sum("nebenkosten")
  const total_gesamtinvestition = sum("gesamtinvestition")
  const total_marktwert = sum("marktwert")
  const total_wertentwicklung_eur = total_marktwert - total_kaufpreis
  const total_wertentwicklung_pct = total_kaufpreis > 0 ? total_wertentwicklung_eur / total_kaufpreis : 0
  const total_eingesetztes_eigenkapital = sum("eigenkapital_eingesetzt")
  const total_eigenkapital_aktuell = sum("eigenkapital_aktuell")
  const total_eigenkapital_gewinn = sum("eigenkapital_gewinn")
  const total_restschuld = sum("restschuld")
  const total_getilgtes_kapital = sum("getilgtes_kapital")
  const total_fremdkapital_quote = total_marktwert > 0 ? total_restschuld / total_marktwert : 0
  const total_cashflow_yearly = sum("cashflow_yearly")
  const total_cashflow_monthly = sum("cashflow_monthly")
  const total_eigenkapital_rendite = total_eingesetztes_eigenkapital > 0
    ? total_cashflow_yearly / total_eingesetztes_eigenkapital : 0
  const total_mieteinnahmen_monthly = properties.reduce((s, p) => s + (p.rent_monthly ?? 0), 0)
  const total_mieteinnahmen_yearly = total_mieteinnahmen_monthly * 12
  const total_kosten_monthly = total_mieteinnahmen_monthly - total_cashflow_monthly
  const portfolio_brutto_rendite = total_kaufpreis > 0 ? total_mieteinnahmen_yearly / total_kaufpreis : 0
  const portfolio_netto_rendite = total_gesamtinvestition > 0 ? total_cashflow_yearly / total_gesamtinvestition : 0
  const portfolio_roe = total_eingesetztes_eigenkapital > 0 ? total_cashflow_yearly / total_eingesetztes_eigenkapital : 0
  const portfolio_gesamtrendite = total_eingesetztes_eigenkapital > 0
    ? (total_cashflow_yearly + total_wertentwicklung_eur) / total_eingesetztes_eigenkapital : 0

  const anzahl_objekte = properties.length
  const anzahl_einheiten = properties.reduce((s, p) => s + (p.units ?? 1), 0)
  const gesamt_flaeche = properties.reduce((s, p) => s + (p.sqm ?? 0), 0)

  const wert_verlauf = generateWertVerlauf(
    total_kaufpreis, total_marktwert,
    total_eingesetztes_eigenkapital, total_eigenkapital_aktuell,
    properties,
  )

  return {
    total_kaufpreis, total_nebenkosten, total_gesamtinvestition,
    total_marktwert, total_wertentwicklung_eur, total_wertentwicklung_pct,
    total_eingesetztes_eigenkapital, total_eigenkapital_aktuell,
    total_eigenkapital_gewinn, total_eigenkapital_rendite,
    total_restschuld, total_getilgtes_kapital, total_fremdkapital_quote,
    total_cashflow_monthly, total_cashflow_yearly,
    total_mieteinnahmen_monthly, total_mieteinnahmen_yearly, total_kosten_monthly,
    portfolio_brutto_rendite, portfolio_netto_rendite,
    portfolio_roe, portfolio_gesamtrendite,
    anzahl_objekte, anzahl_einheiten, gesamt_flaeche,
    leerstandsquote: 0,
    wert_verlauf,
  }
}

function generateWertVerlauf(
  kaufpreis: number,
  marktwert_aktuell: number,
  ek_eingesetzt: number,
  ek_aktuell: number,
  properties: Property[],
) {
  const dates = properties
    .filter(p => (p as Property & { kaufdatum?: string }).kaufdatum)
    .map(p => new Date((p as Property & { kaufdatum?: string }).kaufdatum!))

  const startDate = dates.length > 0
    ? new Date(Math.min(...dates.map(d => d.getTime())))
    : new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000)

  const today = new Date()
  const totalMs = today.getTime() - startDate.getTime()
  const points = 24

  return Array.from({ length: points + 1 }, (_, i) => {
    const progress = i / points
    const date = new Date(startDate.getTime() + totalMs * progress)
    return {
      date: date.toISOString().split("T")[0],
      wert: Math.round(kaufpreis + (marktwert_aktuell - kaufpreis) * progress),
      eigenkapital: Math.round(ek_eingesetzt + (ek_aktuell - ek_eingesetzt) * progress),
    }
  })
}
