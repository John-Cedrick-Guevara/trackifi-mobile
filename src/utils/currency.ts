/**
 * Currency formatting utility.
 */

const DEFAULT_CURRENCY = "₱";

/**
 * Format a number as a currency string.
 *
 * @example formatCurrency(1500.5)    → "₱1,500.50"
 * @example formatCurrency(-350, '$') → "-$350.00"
 */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = amount < 0 ? "-" : "";

  return `${sign}${currency}${formatted}`;
}

/**
 * Format amount with +/- prefix and currency symbol.
 *
 * @example formatSignedCurrency(1500)  → "+₱1,500.00"
 * @example formatSignedCurrency(-350)  → "-₱350.00"
 */
export function formatSignedCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  const prefix = amount >= 0 ? "+" : "-";
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${prefix}${currency}${formatted}`;
}

/**
 * Format a compact currency string for small UI labels.
 *
 * @example formatCompactCurrency(1500000) → "₱1.5M"
 * @example formatCompactCurrency(2500)    → "₱2.5K"
 */
export function formatCompactCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 1_000_000) {
    return `${sign}${currency}${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${currency}${(abs / 1_000).toFixed(1)}K`;
  }
  return `${sign}${currency}${abs.toFixed(0)}`;
}
