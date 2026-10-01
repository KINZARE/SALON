export function formatMoney(cents: number, currency = "EUR", locale = "nl-NL") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}
