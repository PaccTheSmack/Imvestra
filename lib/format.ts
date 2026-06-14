export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(n) + " €";
}

export function formatPercent(n: number, decimals = 2): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n * 100) + " %";
}

export function formatCurrencySigned(n: number): string {
  const formatted = formatCurrency(Math.abs(n));
  return n >= 0 ? "+" + formatted : "−" + formatted;
}
