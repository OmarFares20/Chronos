/**
 * Currency formatting utility.
 *
 * Rules:
 * - Always uses ENGLISH (Western) numerals — locale "en-US" forces this.
 * - EGP is displayed as "EGP " prefix (e.g. "EGP 5,000").
 * - Comma-separated thousands, up to 2 decimal places.
 * - Never use "ar-EG" locale — it produces Arabic-Indic numerals.
 */

export type Currency = "EGP" | "USD" | "EUR" | "GBP" | "AED" | "SAR";

/** Currency prefix strings — always a text label, never a special symbol for EGP. */
const SYMBOLS: Record<Currency, string> = {
  EGP: "EGP ",
  USD: "USD ",
  EUR: "EUR ",
  GBP: "GBP ",
  AED: "AED ",
  SAR: "SAR ",
};

/** All currencies use "en-US" locale to guarantee Western (ASCII) numerals. */
const LOCALE = "en-US";

export function getCurrency(): Currency {
  if (typeof window === "undefined") return "EGP";
  return (localStorage.getItem("chronos_currency") as Currency) || "EGP";
}

export function setCurrency(currency: Currency) {
  if (typeof window !== "undefined") {
    localStorage.setItem("chronos_currency", currency);
  }
}

/**
 * Format a monetary amount.
 *
 * @example
 *   formatPrice(5000)          → "EGP 5,000"
 *   formatPrice(5000, "USD")   → "USD 5,000"
 *   formatPrice(1500, "EGP", { compact: true }) → "EGP 1.5k"
 */
export function formatPrice(
  amount: number,
  currency?: Currency,
  opts?: { compact?: boolean }
): string {
  const cur     = currency || getCurrency();
  const symbol  = SYMBOLS[cur];
  const numeral = Math.abs(amount);
  const sign    = amount < 0 ? "-" : "";

  if (opts?.compact && numeral >= 1_000) {
    const compact = (numeral / 1_000).toFixed(1).replace(/\.0$/, "");
    return `${sign}${symbol}${compact}k`;
  }

  const formatted = numeral.toLocaleString(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${sign}${symbol}${formatted}`;
}

/**
 * Format a price range.
 *
 * @example
 *   formatPriceRange(1000, 5000) → "EGP 1,000 – EGP 5,000"
 *   formatPriceRange(3000, 3000) → "EGP 3,000"
 */
export function formatPriceRange(min: number, max: number, currency?: Currency): string {
  if (min === max) return formatPrice(min, currency);
  return `${formatPrice(min, currency)} – ${formatPrice(max, currency)}`;
}
