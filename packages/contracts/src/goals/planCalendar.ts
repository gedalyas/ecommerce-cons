const yearOf = (todayIso: string) => Number(todayIso.slice(0, 4));

export function planYearOf(selected: number | null, todayIso: string): number {
  return selected ?? yearOf(todayIso);
}

export function planYearsAround(todayIso: string, selected: number): number[] {
  const current = yearOf(todayIso);
  const years = new Set([current - 1, current, current + 1, selected]);
  return [...years].sort((a, b) => a - b);
}

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

export function trailingTwelveMonths(todayIso: string): { inicio: string; fim: string } {
  const today = new Date(`${todayIso}T00:00:00.000Z`);
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  return {
    inicio: isoDay(new Date(Date.UTC(year, month - 12, 1))),
    fim: isoDay(new Date(Date.UTC(year, month, 0))),
  };
}
