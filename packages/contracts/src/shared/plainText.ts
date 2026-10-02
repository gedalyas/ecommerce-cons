const DEL = 127;
const FIRST_PRINTABLE = 32;
const invisibleRanges: readonly [number, number][] = [
  [0x80, 0x9f],
  [0x200b, 0x200f],
  [0x202a, 0x202e],
  [0x2066, 0x2069],
  [0xfeff, 0xfeff],
];

const isInvisible = (code: number) =>
  code < FIRST_PRINTABLE ||
  code === DEL ||
  invisibleRanges.some(([from, to]) => code >= from && code <= to);

export const hasControlCharacter = (text: string): boolean =>
  [...text].some((char) => isInvisible(char.charCodeAt(0)));
