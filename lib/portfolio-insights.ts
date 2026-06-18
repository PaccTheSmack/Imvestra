import type { PortfolioSummary } from "./portfolio-calculations";

// ─── Types ───────────────────────────────────────────────────────────────────

export type InsightType = "risk" | "warning" | "opportunity" | "info";

export interface PortfolioDimension {
  key: string;
  label: string;
  score: number; // 0-25
  max: 25;
  color: string;
  detail: string;
}

export interface PortfolioHealthScore {
  total: number; // 0-100
  label: "Kritisch" | "Ausbaufähig" | "Gut" | "Sehr gut" | "Exzellent";
  color: string;
  dimensions: PortfolioDimension[];
}

export interface PortfolioInsight {
  type: InsightType;
  title: string;
  body: string;
  href?: string;
  priority: number; // lower = more urgent
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function scoreLTV(ltv: number): PortfolioDimension {
  let score: number;
  let detail: string;
  let color: string;

  if (ltv <= 0.50) { score = 25; detail = "Konservativ"; color = "#22C55E"; }
  else if (ltv <= 0.60) { score = 22; detail = "Solide"; color = "#22C55E"; }
  else if (ltv <= 0.70) { score = 17; detail = "Moderat"; color = "#00E0D7"; }
  else if (ltv <= 0.80) { score = 10; detail = "Erhöht"; color = "#FFB800"; }
  else { score = 3; detail = "Kritisch hoch"; color = "#FF4444"; }

  return { key: "ltv", label: "LTV", score, max: 25, color, detail };
}

function scoreCashflow(monthly: number, roe: number): PortfolioDimension {
  let score: number;
  let detail: string;
  let color: string;

  if (monthly > 0 && roe >= 0.08) { score = 25; detail = "Stark positiv"; color = "#22C55E"; }
  else if (monthly > 0 && roe >= 0.05) { score = 20; detail = "Positiv"; color = "#22C55E"; }
  else if (monthly > 0 && roe >= 0.02) { score = 14; detail = "Knapp positiv"; color = "#00E0D7"; }
  else if (monthly >= -100) { score = 8; detail = "Leicht negativ"; color = "#FFB800"; }
  else { score = 2; detail = "Negativ"; color = "#FF4444"; }

  return { key: "cashflow", label: "Cashflow", score, max: 25, color, detail };
}

function scoreVacancy(leerstandsquote: number): PortfolioDimension {
  let score: number;
  let detail: string;
  let color: string;

  if (leerstandsquote <= 0) { score = 25; detail = "Vollvermietet"; color = "#22C55E"; }
  else if (leerstandsquote <= 0.03) { score = 22; detail = "Minimal"; color = "#22C55E"; }
  else if (leerstandsquote <= 0.07) { score = 15; detail = "Moderat"; color = "#FFB800"; }
  else if (leerstandsquote <= 0.15) { score = 7; detail = "Erhöht"; color = "#FFB800"; }
  else { score = 2; detail = "Kritisch"; color = "#FF4444"; }

  return { key: "vacancy", label: "Leerstand", score, max: 25, color, detail };
}

function scoreROE(roe: number): PortfolioDimension {
  let score: number;
  let detail: string;
  let color: string;

  if (roe >= 0.10) { score = 25; detail = "> 10 %"; color = "#22C55E"; }
  else if (roe >= 0.07) { score = 21; detail = "> 7 %"; color = "#22C55E"; }
  else if (roe >= 0.04) { score = 16; detail = "> 4 %"; color = "#00E0D7"; }
  else if (roe >= 0.01) { score = 9; detail = "< 4 %"; color = "#FFB800"; }
  else { score = 2; detail = "Negativ"; color = "#FF4444"; }

  return { key: "roe", label: "Eigenkapitalrendite", score, max: 25, color, detail };
}

function scoreLabel(total: number): PortfolioHealthScore["label"] {
  if (total >= 90) return "Exzellent";
  if (total >= 75) return "Sehr gut";
  if (total >= 55) return "Gut";
  if (total >= 35) return "Ausbaufähig";
  return "Kritisch";
}

function scoreColor(total: number): string {
  if (total >= 75) return "#22C55E";
  if (total >= 55) return "#00E0D7";
  if (total >= 35) return "#FFB800";
  return "#FF4444";
}

// ─── Insights ────────────────────────────────────────────────────────────────

function generateInsights(
  summary: PortfolioSummary,
  financingAlertCount: number,
): PortfolioInsight[] {
  const insights: PortfolioInsight[] = [];
  const ltv = summary.total_fremdkapital_quote;
  const cf = summary.total_cashflow_monthly;
  const roe = summary.portfolio_roe;
  const vacancy = summary.leerstandsquote;

  // ── Risks
  if (ltv > 0.80) {
    insights.push({
      type: "risk",
      title: "Verschuldungsquote über 80 %",
      body: `LTV von ${(ltv * 100).toFixed(0)} % erhöht dein Zinsrisiko und schränkt die Refinanzierungsfähigkeit ein. Sondertilgungen prüfen.`,
      href: "/finanzen",
      priority: 1,
    });
  }

  if (cf < -500) {
    insights.push({
      type: "risk",
      title: "Negativer Gesamtcashflow",
      body: `${new Intl.NumberFormat("de-DE").format(Math.abs(Math.round(cf)))} € monatliches Defizit — Mietanpassung oder Kostensenkung prüfen.`,
      href: "/finanzen",
      priority: 2,
    });
  }

  if (financingAlertCount > 0) {
    insights.push({
      type: "risk",
      title: `${financingAlertCount} Zinsbindung${financingAlertCount > 1 ? "en laufen" : " läuft"} bald aus`,
      body: "Anschlussfinanzierung jetzt vorbereiten — Konditionen vergleichen solange du noch Zeit hast.",
      href: "/finanzen",
      priority: 3,
    });
  }

  // ── Warnings
  if (ltv > 0.65 && ltv <= 0.80) {
    insights.push({
      type: "warning",
      title: "LTV im gelben Bereich",
      body: `${(ltv * 100).toFixed(0)} % Fremdkapitalquote. Weitere Investitionen erhöhen das Klumpenrisiko.`,
      priority: 5,
    });
  }

  if (vacancy > 0.05) {
    insights.push({
      type: "warning",
      title: "Leerstandsquote über 5 %",
      body: `${(vacancy * 100).toFixed(1)} % Leerstand kostet dich ${new Intl.NumberFormat("de-DE").format(Math.round(summary.total_mieteinnahmen_monthly * vacancy))} € monatlich.`,
      href: "/mieter",
      priority: 6,
    });
  }

  if (cf < 0 && cf >= -500) {
    insights.push({
      type: "warning",
      title: "Leicht negativer Cashflow",
      body: "Das Portfolio trägt sich knapp nicht selbst. Nächsten Kauf erst nach Optimierung bestehender Objekte.",
      priority: 7,
    });
  }

  // ── Opportunities
  if (roe >= 0.08 && summary.total_fremdkapital_quote < 0.65) {
    insights.push({
      type: "opportunity",
      title: "Starke Position für nächsten Deal",
      body: `ROE von ${(roe * 100).toFixed(1)} % und LTV unter 65 % — ideale Ausgangslage für weiteres Leverage.`,
      href: "/calculator",
      priority: 10,
    });
  }

  if (summary.anzahl_objekte >= 3 && cf > 500) {
    insights.push({
      type: "opportunity",
      title: "Portfolio generiert freien Cashflow",
      body: `${new Intl.NumberFormat("de-DE").format(Math.round(cf))} € pro Monat können für Sondertilgungen oder neue Objekte genutzt werden.`,
      priority: 11,
    });
  }

  if (summary.anzahl_objekte === 1) {
    insights.push({
      type: "info",
      title: "Erstes Objekt — Grundstein gelegt",
      body: "Portfolio-Diversifikation beginnt ab Objekt 2. Standortanalyse hilft bei der nächsten Entscheidung.",
      href: "/standort",
      priority: 15,
    });
  }

  return insights.sort((a, b) => a.priority - b.priority).slice(0, 5);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function calculatePortfolioHealth(
  summary: PortfolioSummary,
  financingAlertCount = 0,
): { score: PortfolioHealthScore; insights: PortfolioInsight[] } {
  const ltv   = scoreLTV(summary.total_fremdkapital_quote);
  const cf    = scoreCashflow(summary.total_cashflow_monthly, summary.portfolio_roe);
  const vac   = scoreVacancy(summary.leerstandsquote);
  const roe   = scoreROE(summary.portfolio_roe);

  const total = ltv.score + cf.score + vac.score + roe.score;

  const score: PortfolioHealthScore = {
    total,
    label: scoreLabel(total),
    color: scoreColor(total),
    dimensions: [ltv, cf, vac, roe],
  };

  const insights = generateInsights(summary, financingAlertCount);

  return { score, insights };
}
