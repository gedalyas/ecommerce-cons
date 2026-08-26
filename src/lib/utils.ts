import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatters = new Map<number, Intl.NumberFormat>();

function nf(decimals: number) {
  let f = formatters.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatters.set(decimals, f);
  }
  return f;
}

/**
 * Normaliza qualquer número presente numa string para o padrão pt-BR
 * (ponto como separador de milhar, vírgula decimal, sem espaços parasitas).
 */
export function formatPtNumbers(value: string) {
  return value
    .replace(/(\d{1,3}(?:\.\d{3})+|\d+)\s*,\s*(\d+)/g, (_m, intPart: string, dec: string) => {
      const n = Number(`${intPart.replace(/\./g, "")}.${dec}`);
      return Number.isFinite(n) ? nf(dec.length).format(n) : `${intPart},${dec}`;
    })
    .replace(/\b\d{1,3}(?:\.\d{3})+\b/g, (m) => {
      const n = Number(m.replace(/\./g, ""));
      return Number.isFinite(n) ? nf(0).format(n) : m;
    });
}
