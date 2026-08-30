/**
 * Centralized formatting - Intl with the pt-BR locale.
 * No screen formats a number, currency, percentage or date on its own.
 */
const LOCALE = "pt-BR";
const cache = new Map<string, Intl.NumberFormat>();

function nf(options: Intl.NumberFormatOptions) {
  const key = JSON.stringify(options);
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE, options);
    cache.set(key, f);
  }
  return f;
}

export function formatNumber(value: number, decimals = 0) {
  return nf({ minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

export function formatCurrency(value: number, decimals = 0) {
  return nf({
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Takes the value already in percentage points (e.g. 19.2 -> "19,2%"). */
export function formatPercent(value: number, decimals = 1) {
  return `${formatNumber(value, decimals)}%`;
}

export function formatCompact(value: number) {
  return nf({ notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit" },
) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(LOCALE, options).format(date);
}

/**
 * Normalizes every number inside a string to the pt-BR convention
 * (dot as thousands separator, decimal comma, no stray spaces).
 */
export function formatPtNumbers(value: string) {
  return value
    .replace(/(\d{1,3}(?:\.\d{3})+|\d+)\s*,\s*(\d+)/g, (_m, intPart: string, dec: string) => {
      const n = Number(`${intPart.replace(/\./g, "")}.${dec}`);
      return Number.isFinite(n) ? formatNumber(n, dec.length) : `${intPart},${dec}`;
    })
    .replace(/\b\d{1,3}(?:\.\d{3})+\b/g, (m) => {
      const n = Number(m.replace(/\./g, ""));
      return Number.isFinite(n) ? formatNumber(n, 0) : m;
    });
}
