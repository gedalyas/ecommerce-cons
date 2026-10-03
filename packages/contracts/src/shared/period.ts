/**
 * The four global period parameters every data screen shares, kept in the
 * URL (`?inicio=&fim=&por=&comparar=`) so any view is shareable by link.
 * Pure date logic only - no router, no DOM - so both the client and the server
 * queries use the same definitions.
 */
import {
  addDays,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subYears,
  endOfMonth,
} from "date-fns";
import { todayIso } from "./clock";

export const granularities = ["dia", "semana", "mes", "ano"] as const;
export type Granularity = (typeof granularities)[number];

export const comparisons = ["nenhum", "periodo-anterior", "mes-anterior", "ano-anterior"] as const;
export type Comparison = (typeof comparisons)[number];

/** Calendar dates are ISO `YYYY-MM-DD` strings; `fim` is inclusive. */
export type DateRange = { inicio: string; fim: string };

export const channels = ["todos", "ecommerce", "marketplace"] as const;
export type Channel = (typeof channels)[number];

/** The five global params every data screen shares: range, granularity, comparison, channel. */
export type PeriodSearch = DateRange & { por: Granularity; comparar: Comparison; canal: Channel };

export const granularityLabel: Record<Granularity, string> = {
  dia: "Dia",
  semana: "Semana",
  mes: "Mês",
  ano: "Ano",
};

export const channelLabel: Record<Channel, string> = {
  todos: "Todos os canais",
  ecommerce: "E-commerce",
  marketplace: "Marketplace",
};

export const comparisonLabel: Record<Comparison, string> = {
  nenhum: "Desabilitado",
  "periodo-anterior": "Período anterior",
  "mes-anterior": "Mês anterior",
  "ano-anterior": "Ano anterior",
};

const ISO = "yyyy-MM-dd";
export const toIsoDate = (d: Date) => format(d, ISO);
export const fromIsoDate = (s: string) => parseISO(s);

/** Inclusive day count of a range. */
export function rangeLength({ inicio, fim }: DateRange) {
  return Math.round((fromIsoDate(fim).getTime() - fromIsoDate(inicio).getTime()) / 86_400_000) + 1;
}

export type PeriodPreset = { key: string; label: string; range: (today: Date) => DateRange };

/** Same presets the market expects, in the order they are listed. */
export const periodPresets: readonly PeriodPreset[] = [
  { key: "hoje", label: "Hoje", range: (t) => ({ inicio: toIsoDate(t), fim: toIsoDate(t) }) },
  {
    key: "ontem",
    label: "Ontem",
    range: (t) => ({ inicio: toIsoDate(subDays(t, 1)), fim: toIsoDate(subDays(t, 1)) }),
  },
  {
    key: "esta-semana",
    label: "Esta semana",
    range: (t) => ({ inicio: toIsoDate(startOfWeek(t, { weekStartsOn: 1 })), fim: toIsoDate(t) }),
  },
  {
    key: "semana-passada",
    label: "Semana passada",
    range: (t) => {
      const start = subDays(startOfWeek(t, { weekStartsOn: 1 }), 7);
      return { inicio: toIsoDate(start), fim: toIsoDate(addDays(start, 6)) };
    },
  },
  {
    key: "este-mes",
    label: "Este mês",
    range: (t) => ({ inicio: toIsoDate(startOfMonth(t)), fim: toIsoDate(t) }),
  },
  {
    key: "mes-passado",
    label: "Mês passado",
    range: (t) => {
      const start = startOfMonth(subMonths(t, 1));
      return { inicio: toIsoDate(start), fim: toIsoDate(endOfMonth(start)) };
    },
  },
  {
    key: "ultimos-14-dias",
    label: "Últimos 14 dias",
    range: (t) => ({ inicio: toIsoDate(subDays(t, 13)), fim: toIsoDate(t) }),
  },
  {
    key: "ultimos-30-dias",
    label: "Últimos 30 dias",
    range: (t) => ({ inicio: toIsoDate(subDays(t, 29)), fim: toIsoDate(t) }),
  },
  {
    key: "ultimos-90-dias",
    label: "Últimos 90 dias",
    range: (t) => ({ inicio: toIsoDate(subDays(t, 89)), fim: toIsoDate(t) }),
  },
  {
    key: "ultimos-12-meses",
    label: "Últimos 12 meses",
    range: (t) => ({ inicio: toIsoDate(addDays(subMonths(t, 12), 1)), fim: toIsoDate(t) }),
  },
  {
    key: "ano-ate-hoje",
    label: "Janeiro até hoje",
    range: (t) => ({ inicio: toIsoDate(startOfYear(t)), fim: toIsoDate(t) }),
  },
];

export function defaultPeriodSearchFor(today: string): PeriodSearch {
  return {
    ...periodPresets.find((p) => p.key === "ultimos-30-dias")!.range(fromIsoDate(today)),
    por: "dia",
    comparar: "periodo-anterior",
    canal: "todos",
  };
}

export function matchingPreset(range: DateRange, today = fromIsoDate(todayIso())) {
  return periodPresets.find((p) => {
    const r = p.range(today);
    return r.inicio === range.inicio && r.fim === range.fim;
  })?.key;
}

/**
 * The window the current range is compared against. Same length for
 * "período anterior"; calendar shift for month/year.
 */
export function resolveComparison(search: PeriodSearch): DateRange | null {
  const start = fromIsoDate(search.inicio);
  const end = fromIsoDate(search.fim);
  switch (search.comparar) {
    case "nenhum":
      return null;
    case "periodo-anterior": {
      const days = rangeLength(search);
      return { inicio: toIsoDate(subDays(start, days)), fim: toIsoDate(subDays(end, days)) };
    }
    case "mes-anterior":
      return { inicio: toIsoDate(subMonths(start, 1)), fim: toIsoDate(subMonths(end, 1)) };
    case "ano-anterior":
      return { inicio: toIsoDate(subYears(start, 1)), fim: toIsoDate(subYears(end, 1)) };
  }
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    isoDatePattern.test(value) &&
    !Number.isNaN(fromIsoDate(value).getTime())
  );
}

/**
 * Lenient parser for the URL: anything missing or malformed falls back to the
 * default, and an inverted range is swapped instead of rejected.
 */
export function parsePeriodSearch(
  input: Partial<Record<keyof PeriodSearch, unknown>>,
  today: string = todayIso(),
): PeriodSearch {
  const defaults = defaultPeriodSearchFor(today);
  let inicio = isIsoDate(input["inicio"]) ? input["inicio"] : defaults.inicio;
  let fim = isIsoDate(input["fim"]) ? input["fim"] : defaults.fim;
  if (inicio > fim) [inicio, fim] = [fim, inicio];
  const por = granularities.find((g) => g === input["por"]) ?? defaults.por;
  const comparar = comparisons.find((c) => c === input["comparar"]) ?? defaults.comparar;
  const canal = channels.find((c) => c === input["canal"]) ?? defaults.canal;
  return { inicio, fim, por, comparar, canal };
}
