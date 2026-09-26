import {
  adPlatformOptions,
  normalizeHeader,
  orderStatusOptions,
  processingMethodOptions,
  salesPlatformOptions,
} from "@ecommerce/contracts/imports";

const FULL_DATE =
  /^(\d{4}-\d{2}-\d{2}([ T]\d{1,2}:\d{2}(:\d{2})?)?|\d{1,2}\/\d{1,2}\/\d{2,4}( \d{1,2}:\d{2}(:\d{2})?)?)$/;
const AMOUNT = /^(R\$\s?)?-?[\d.,]+%?$/;
const CODE = /^#?[\p{L}\d][\p{L}\d\-_/.#]*$/u;
const ORDER_REF = /^#\d{1,7}$/;
const EMAIL_LIKE = /@/;
const MAX_SAFE_DIGITS = 7;
const MAX_CODE = 20;
const MAX_CELL = 60;
const MAX_LABEL = 60;

const commonOptions = [
  "sim",
  "nao",
  "true",
  "false",
  "organic",
  "cpc",
  "email",
  "facebook",
  "instagram",
  "direct",
  "referral",
];
const safeWords = new Set(
  [
    ...orderStatusOptions,
    ...salesPlatformOptions,
    ...processingMethodOptions,
    ...adPlatformOptions,
    ...commonOptions,
  ].map(normalizeHeader),
);

const digitCount = (cell: string) => cell.replace(/\D/g, "").length;
const hasLetter = (cell: string) => /\p{L}/u.test(cell);
const hasDigit = (cell: string) => /\d/.test(cell);

const shapeOf = (cell: string) =>
  cell
    .replace(/\p{Lu}/gu, "A")
    .replace(/\p{Ll}/gu, "a")
    .replace(/\d/g, "0");

function isSafeCell(cell: string): boolean {
  if (FULL_DATE.test(cell) || ORDER_REF.test(cell)) return true;
  if (AMOUNT.test(cell)) return digitCount(cell) <= MAX_SAFE_DIGITS;
  if (safeWords.has(normalizeHeader(cell))) return true;
  return (
    cell.length <= MAX_CODE &&
    CODE.test(cell) &&
    hasLetter(cell) &&
    hasDigit(cell) &&
    digitCount(cell) <= MAX_SAFE_DIGITS
  );
}

export function maskCell(raw: string): string {
  const cell = raw.trim().slice(0, MAX_CELL);
  return isSafeCell(cell) ? cell : shapeOf(cell);
}

export function looksLikeData(name: string): boolean {
  const cell = name.trim();
  return (
    EMAIL_LIKE.test(cell) ||
    FULL_DATE.test(cell) ||
    digitCount(cell) >= 8 ||
    (AMOUNT.test(cell) && hasDigit(cell))
  );
}

export const columnLabelOf = (name: string): string => name.trim().slice(0, MAX_LABEL);

export function maskedSample(
  rows: string[][],
  width: number,
  size: number,
  budget: number,
): string[][] {
  const sample = rows.slice(0, size).map((cells) => cells.slice(0, width).map(maskCell));
  while (sample.length > 1 && JSON.stringify(sample).length > budget) sample.pop();
  return sample;
}
