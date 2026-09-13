const BOM = new RegExp("^\uFEFF");
const BR_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

export function parseImportDate(raw: string): string | null {
  const value = raw.trim();
  const br = BR_DATE.exec(value);
  if (br) {
    const [, d = "", m = "", y = ""] = br;
    return validDay(y, m.padStart(2, "0"), d.padStart(2, "0"));
  }
  const iso = ISO_DATE.exec(value);
  if (iso) {
    const [, y = "", m = "", d = ""] = iso;
    return validDay(y, m, d);
  }
  return null;
}

function validDay(y: string, m: string, d: string): string | null {
  const day = `${y}-${m}-${d}`;
  const date = new Date(`${day}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== day ? null : day;
}

export function parseImportNumber(raw: string): number | null {
  const value = raw
    .trim()
    .replace(/^R\$\s?/, "")
    .replace(/\s/g, "");
  if (value === "") return null;
  const normalized =
    value.includes(",") && value.lastIndexOf(",") > value.lastIndexOf(".")
      ? value.replace(/\./g, "").replace(",", ".")
      : value.replace(/,/g, "");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function parseImportInteger(raw: string): number | null {
  const number = parseImportNumber(raw);
  return number === null || !Number.isInteger(number) ? null : number;
}

export function parseImportOption<T extends string>(raw: string, options: readonly T[]): T | null {
  const value = raw.trim().toLowerCase();
  return options.find((option) => option.toLowerCase() === value) ?? null;
}

export function normalizeHeader(raw: string): string {
  return raw
    .replace(BOM, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s-]+/g, "_");
}
