const LOCAL_HEADER = 0x04034b50;
const CENTRAL_HEADER = 0x02014b50;
const END_OF_DIRECTORY = 0x06054b50;
const END_RECORD_SIZE = 22;
const MAX_COMMENT_SIZE = 0xffff;
const ZIP64_MARKER = 0xffffffff;

type ZipLimits = { maxEntries: number; maxUnzippedBytes: number; maxRatio: number };

export const NOT_A_SPREADSHEET = "O arquivo não é uma planilha Excel (.xlsx) válida.";
export const SPREADSHEET_TOO_BIG = "A planilha é grande demais para ser lida.";

export const isSpreadsheetPart = (name: string): boolean => /\.(xml|rels)$/i.test(name);

function isZip(buffer: Uint8Array): boolean {
  return buffer.length >= 4 && readUint32(buffer, 0) === LOCAL_HEADER;
}

function readUint32(buffer: Uint8Array, at: number): number {
  return (
    ((buffer[at] ?? 0) |
      ((buffer[at + 1] ?? 0) << 8) |
      ((buffer[at + 2] ?? 0) << 16) |
      ((buffer[at + 3] ?? 0) << 24)) >>>
    0
  );
}

function readUint16(buffer: Uint8Array, at: number): number {
  return (buffer[at] ?? 0) | ((buffer[at + 1] ?? 0) << 8);
}

function endOfDirectoryAt(buffer: Uint8Array): number {
  const lowest = Math.max(0, buffer.length - END_RECORD_SIZE - MAX_COMMENT_SIZE);
  for (let at = buffer.length - END_RECORD_SIZE; at >= lowest; at -= 1) {
    if (readUint32(buffer, at) === END_OF_DIRECTORY) return at;
  }
  return -1;
}

export function zipProblem(buffer: Uint8Array, limits: ZipLimits): string | null {
  const end = endOfDirectoryAt(buffer);
  if (!isZip(buffer) || end < 0) return NOT_A_SPREADSHEET;
  const entries = readUint16(buffer, end + 10);
  if (entries > limits.maxEntries) return SPREADSHEET_TOO_BIG;
  let at = readUint32(buffer, end + 16);
  let unzipped = 0;
  for (let i = 0; i < entries; i += 1) {
    if (readUint32(buffer, at) !== CENTRAL_HEADER) return NOT_A_SPREADSHEET;
    const size = readUint32(buffer, at + 24);
    if (size === ZIP64_MARKER) return SPREADSHEET_TOO_BIG;
    unzipped += size;
    at +=
      46 + readUint16(buffer, at + 28) + readUint16(buffer, at + 30) + readUint16(buffer, at + 32);
  }
  const tooBig = unzipped > limits.maxUnzippedBytes || unzipped > buffer.length * limits.maxRatio;
  return tooBig ? SPREADSHEET_TOO_BIG : null;
}
