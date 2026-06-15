import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { CalculationResult, Financing, TilgungsplanRow, AfAResult, VerhandlungsResult } from "@/types";
import { calculateSpekulationsfrist } from "@/lib/calculations";
import { formatCurrency, formatPercent, formatCurrencySigned } from "@/lib/format";

const BLUE = "#1A56DB";
const GREEN = "#16A34A";
const RED = "#DC2626";
const ORANGE = "#D97706";
const GRAY = "#71717A";
const LIGHT = "#F4F4F5";
const BORDER = "#E4E4E7";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#09090B",
    paddingHorizontal: 40,
    paddingVertical: 36,
    backgroundColor: "#FFFFFF",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  brandName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: BLUE },
  brandSub: { fontSize: 7, color: GRAY, marginTop: 2 },
  reportMeta: { alignItems: "flex-end" },
  reportTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#09090B" },
  reportDate: { fontSize: 7, color: GRAY, marginTop: 2 },
  // Section
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT,
  },
  // Grid row
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#F9F9F9",
  },
  rowLabel: { color: GRAY, fontSize: 8 },
  rowValue: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#09090B" },
  // 2-col grid
  grid2: { flexDirection: "row", gap: 8 },
  metricBox: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 8,
  },
  metricLabel: { fontSize: 6.5, color: GRAY, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 },
  metricValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  metricSub: { fontSize: 6.5, color: GRAY, marginTop: 2 },
  // Indicator box
  indicatorBox: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 10,
    marginTop: 6,
  },
  indicatorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  badge: { borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 7, fontFamily: "Helvetica-Bold" },
  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: LIGHT,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F9F9F9",
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#F9F9F9",
  },
  tableCell: { fontSize: 7.5 },
  tableCellBold: { fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  colJahr: { width: 30 },
  colRestschuld: { flex: 1 },
  colZinsen: { flex: 1 },
  colTilgung: { flex: 1 },
  colRate: { flex: 1 },
  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
  footerText: { fontSize: 6.5, color: GRAY },
});

function indicatorColor(ind: CalculationResult["price_indicator"]) {
  if (ind === "günstig") return GREEN;
  if (ind === "fair") return BLUE;
  if (ind === "teuer") return ORANGE;
  return RED;
}

function indicatorBg(ind: CalculationResult["price_indicator"]) {
  if (ind === "günstig") return "#F0FDF4";
  if (ind === "fair") return "#EFF6FF";
  if (ind === "teuer") return "#FFFBEB";
  return "#FEF2F2";
}

function yieldColor(v: number, hi: number, mid: number) {
  if (v >= hi) return GREEN;
  if (v >= mid) return ORANGE;
  return RED;
}

const AFA_TYPE_LABELS: Record<AfAResult["afa_type"], string> = {
  linear_2: "Lineare AfA 2 % / 50 Jahre",
  linear_3: "Lineare AfA 2,5 % / 40 Jahre",
  denkmal:  "Denkmal-AfA 9 % / 8 Jahre",
  neu:      "Neubau-AfA 3 % / 33 Jahre",
};

interface PropertyReportProps {
  propertyName: string;
  address?: string;
  type?: string;
  purchase_price: number;
  rent_monthly: number;
  sqm?: number;
  result: CalculationResult;
  financing?: Financing;
  tilgungsplan?: TilgungsplanRow[];
  afa?: AfAResult;
  kaufdatum?: string;
  steuersatz?: number;
  verhandlungsResult?: VerhandlungsResult;
}

export default function PropertyReport({
  propertyName,
  address,
  type,
  purchase_price,
  rent_monthly,
  sqm,
  result,
  financing,
  tilgungsplan,
  afa,
  kaufdatum,
  steuersatz = 42,
  verhandlungsResult,
}: PropertyReportProps) {
  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const dscrColor =
    result.dscr >= 1.5 ? GREEN : result.dscr >= 1.2 ? ORANGE : RED;
  const dscrLabel =
    result.dscr >= 1.5 ? "Sehr gut" : result.dscr >= 1.2 ? "Ausreichend" : "Kritisch";

  const tilgungRows = tilgungsplan?.slice(0, 10) ?? [];

  const speku = kaufdatum
    ? calculateSpekulationsfrist(kaufdatum, undefined, purchase_price, steuersatz / 100)
    : null;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brandName}>Imvestra</Text>
            <Text style={s.brandSub}>Bankpräsentation · Objektanalyse</Text>
          </View>
          <View style={s.reportMeta}>
            <Text style={s.reportTitle}>{propertyName}</Text>
            {address ? <Text style={s.reportDate}>{address}</Text> : null}
            <Text style={[s.reportDate, { marginTop: 4 }]}>Erstellt: {today}</Text>
          </View>
        </View>

        {/* Grunddaten */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Grunddaten</Text>
          {[
            { label: "Kaufpreis", value: formatCurrency(purchase_price) },
            { label: "Kaltmiete / Monat", value: formatCurrency(rent_monthly) },
            { label: "Objekttyp", value: type ?? "—" },
            { label: "Wohnfläche", value: sqm ? `${sqm} m²` : "—" },
            { label: "Nebenkosten (10 %)", value: formatCurrency(result.ancillary_costs) },
            { label: "Gesamtinvestition", value: formatCurrency(result.total_investment) },
          ].map(({ label, value }) => (
            <View key={label} style={s.row}>
              <Text style={s.rowLabel}>{label}</Text>
              <Text style={s.rowValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Finanzkennzahlen */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Finanzkennzahlen</Text>
          <View style={s.grid2}>
            <View style={s.metricBox}>
              <Text style={s.metricLabel}>Bruttorendite</Text>
              <Text style={[s.metricValue, { color: yieldColor(result.gross_yield, 0.05, 0.03) }]}>
                {formatPercent(result.gross_yield)}
              </Text>
              <Text style={s.metricSub}>Kaufpreis-basiert</Text>
            </View>
            <View style={s.metricBox}>
              <Text style={s.metricLabel}>Nettomietrendite</Text>
              <Text style={[s.metricValue, { color: yieldColor(result.net_yield, 0.04, 0.02) }]}>
                {formatPercent(result.net_yield)}
              </Text>
              <Text style={s.metricSub}>Gesamtinvestition</Text>
            </View>
            <View style={s.metricBox}>
              <Text style={s.metricLabel}>Cashflow / Mo.</Text>
              <Text style={[s.metricValue, { color: result.cashflow_monthly >= 0 ? GREEN : RED }]}>
                {formatCurrencySigned(result.cashflow_monthly)}
              </Text>
              <Text style={s.metricSub}>Nach Kosten & Rate</Text>
            </View>
            <View style={s.metricBox}>
              <Text style={s.metricLabel}>ROE</Text>
              <Text style={[s.metricValue, { color: "#09090B" }]}>
                {formatPercent(result.roe)}
              </Text>
              <Text style={s.metricSub}>Eigenkapitalrendite</Text>
            </View>
          </View>
          <View style={{ marginTop: 6 }}>
            {[
              { label: "NOI", value: formatCurrency(result.noi) },
              { label: "Cashflow / Jahr", value: formatCurrencySigned(result.cashflow_yearly), color: result.cashflow_yearly >= 0 ? GREEN : RED },
              { label: "Instandhaltung / Jahr", value: formatCurrency(result.maintenance_yearly) },
              { label: "Verwaltung / Jahr", value: formatCurrency(result.management_yearly) },
            ].map(({ label, value, color }) => (
              <View key={label} style={s.row}>
                <Text style={s.rowLabel}>{label}</Text>
                <Text style={[s.rowValue, color ? { color } : {}]}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Finanzierung */}
        {financing && financing.loan_amount > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Finanzierung</Text>
            {[
              { label: "Darlehensbetrag", value: formatCurrency(financing.loan_amount) },
              { label: "Zinssatz", value: formatPercent(financing.interest_rate) },
              { label: "Tilgung", value: formatPercent(financing.repayment_rate) },
              { label: "Rate / Monat", value: formatCurrency(financing.rate_monthly) },
              { label: "LTV", value: formatPercent(result.ltv, 0) },
              { label: "Zinslast / Jahr", value: formatCurrency(financing.loan_amount * financing.interest_rate) },
            ].map(({ label, value }) => (
              <View key={label} style={s.row}>
                <Text style={s.rowLabel}>{label}</Text>
                <Text style={s.rowValue}>{value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Kaufpreis-Analyse */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Kaufpreis-Analyse</Text>
          <View style={s.indicatorBox}>
            <View style={s.indicatorHeader}>
              <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#09090B" }}>
                Kaufpreisfaktor
              </Text>
              <View style={[s.badge, { backgroundColor: indicatorBg(result.price_indicator) }]}>
                <Text style={[s.badgeText, { color: indicatorColor(result.price_indicator) }]}>
                  {result.price_indicator.charAt(0).toUpperCase() + result.price_indicator.slice(1)}
                </Text>
              </View>
            </View>
            {[
              { label: "Kaufpreisfaktor", value: `${result.price_multiplier.toFixed(1)}x Jahreskaltmiete` },
              { label: "Fairer Wertebereich (20–25x)", value: `${formatCurrency(result.fair_value_min)} – ${formatCurrency(result.fair_value_max)}` },
            ].map(({ label, value }) => (
              <View key={label} style={s.row}>
                <Text style={s.rowLabel}>{label}</Text>
                <Text style={s.rowValue}>{value}</Text>
              </View>
            ))}
            {result.dscr > 0 && (
              <View style={s.row}>
                <Text style={s.rowLabel}>DSCR (Debt Service Coverage)</Text>
                <Text style={[s.rowValue, { color: dscrColor }]}>
                  {result.dscr.toFixed(2)} – {dscrLabel}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Steuer & AfA */}
        {afa && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Steuer &amp; AfA</Text>
            {[
              { label: "AfA-Typ",           value: AFA_TYPE_LABELS[afa.afa_type] },
              { label: "AfA / Jahr",        value: formatCurrency(afa.afa_yearly) },
              { label: "Steuersparnis / J.", value: formatCurrency(afa.steuerersparnis_yearly) },
              { label: "Restlaufzeit",      value: `${afa.remaining_years} Jahre` },
            ].map(({ label, value }) => (
              <View key={label} style={s.row}>
                <Text style={s.rowLabel}>{label}</Text>
                <Text style={[s.rowValue, label === "Steuersparnis / J." ? { color: GREEN } : {}]}>{value}</Text>
              </View>
            ))}
            {speku && (
              <>
                <View style={s.row}>
                  <Text style={s.rowLabel}>Spekulationsfrei ab</Text>
                  <Text style={s.rowValue}>{speku.speku_frei_ab}</Text>
                </View>
                <View style={s.row}>
                  <Text style={s.rowLabel}>Spekulationsfrist</Text>
                  <Text style={[s.rowValue, { color: speku.ist_spekulationsfrei ? GREEN : ORANGE }]}>
                    {speku.ist_spekulationsfrei
                      ? "Steuerfrei"
                      : `${speku.jahre_verbleibend.toFixed(1)} Jahre verbleibend`}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Tilgungsplan */}
        {tilgungRows.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Tilgungsplan (Auszug 10 Jahre)</Text>
            <View style={s.tableHeader}>
              <Text style={[s.tableCell, s.colJahr, { color: GRAY }]}>Jahr</Text>
              <Text style={[s.tableCell, s.colRestschuld, { color: GRAY, textAlign: "right" }]}>Restschuld</Text>
              <Text style={[s.tableCell, s.colZinsen, { color: GRAY, textAlign: "right" }]}>Zinsen</Text>
              <Text style={[s.tableCell, s.colTilgung, { color: GRAY, textAlign: "right" }]}>Tilgung</Text>
              <Text style={[s.tableCell, s.colRate, { color: GRAY, textAlign: "right" }]}>Rate/Jahr</Text>
            </View>
            {tilgungRows.map((row, i) => (
              <View key={row.year} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCellBold, s.colJahr, { color: GRAY }]}>{row.year}</Text>
                <Text style={[s.tableCell, s.colRestschuld, { textAlign: "right" }]}>
                  {formatCurrency(row.restschuld_end)}
                </Text>
                <Text style={[s.tableCell, s.colZinsen, { color: RED, textAlign: "right" }]}>
                  {formatCurrency(row.zinsen)}
                </Text>
                <Text style={[s.tableCell, s.colTilgung, { color: BLUE, textAlign: "right" }]}>
                  {formatCurrency(row.tilgung)}
                </Text>
                <Text style={[s.tableCellBold, s.colRate, { textAlign: "right" }]}>
                  {formatCurrency(row.rate_jahres)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Kaufpreisanalyse */}
        {verhandlungsResult && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Kaufpreisanalyse</Text>
            {[
              { label: "Zielrendite (Brutto)",        value: formatPercent(verhandlungsResult.target_yield) },
              { label: "Jahreskaltmiete",             value: formatCurrency(verhandlungsResult.rent_yearly) },
              { label: "Max. Kaufpreis",              value: formatCurrency(Math.round(verhandlungsResult.max_kaufpreis)) },
              { label: "Max. Kaufpreis inkl. 10% NK", value: formatCurrency(Math.round(verhandlungsResult.max_kaufpreis_mit_nk)) },
              { label: "Zielgebot (−10%)",            value: formatCurrency(Math.round(verhandlungsResult.verhandlungspuffer_10)) },
              { label: "Ausgangsgebot (−15%)",        value: formatCurrency(Math.round(verhandlungsResult.verhandlungspuffer_15)) },
            ].map(({ label, value }) => (
              <View key={label} style={s.row}>
                <Text style={s.rowLabel}>{label}</Text>
                <Text style={label === "Max. Kaufpreis" ? [s.rowValue, { color: GREEN }] : s.rowValue}>{value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Imvestra · Renditebericht · {propertyName}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) =>
            `Seite ${pageNumber} / ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  );
}
