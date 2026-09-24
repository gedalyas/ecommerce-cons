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

export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return minutes === 0 ? `${rest} s` : `${minutes} min ${String(rest).padStart(2, "0")} s`;
}

export function formatPercent(value: number, decimals = 1) {
  return `${formatNumber(value, decimals)}%`;
}

export function formatCompact(value: number) {
  return nf({ notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatMultiplier(value: number, decimals = 2) {
  return `${formatNumber(value, decimals)}x`;
}

export function formatVariation(value: number, decimals = 1) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatNumber(Math.abs(value), decimals)}%`;
}

export function formatPeriodLabel(inicio: string, fim: string, withYear = false) {
  const sameYear = inicio.slice(0, 4) === fim.slice(0, 4);
  const options: Intl.DateTimeFormatOptions =
    sameYear && !withYear
      ? { day: "2-digit", month: "2-digit" }
      : { day: "2-digit", month: "2-digit", year: "2-digit" };
  const start = formatDate(`${inicio}T00:00:00`, options);
  const end = formatDate(`${fim}T00:00:00`, options);
  return start === end ? start : `${start} – ${end}`;
}

export function formatDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit" },
) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(LOCALE, options).format(date);
}

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
