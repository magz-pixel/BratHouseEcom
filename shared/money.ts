const zarFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "ZAR",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(amount: number) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return zarFormatter.format(safeAmount).replace(/^R[\s\u00a0\u202f]+/, "R");
}
