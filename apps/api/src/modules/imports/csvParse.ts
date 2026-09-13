export type CsvTable = { header: string[]; rows: string[][]; delimiter: string };

export type CsvLimits = { maxRows: number; budgetMs: number; now?: () => number };

export class CsvLimitError extends Error {
  readonly reason: "rows" | "time";

  constructor(reason: "rows" | "time", message: string) {
    super(message);
    this.reason = reason;
  }
}

const CHECK_EVERY_ROWS = 500;
const BOM = String.fromCharCode(0xfeff);

export function detectDelimiter(firstLine: string): string {
  const candidates = [";", ",", "\t"];
  let best = ";";
  let bestCount = -1;
  for (const candidate of candidates) {
    const count = firstLine.split(candidate).length - 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

export function decodeCsvBuffer(buffer: Buffer): string {
  const utf8 = new TextDecoder("utf-8", { fatal: true });
  try {
    const text = utf8.decode(buffer);
    return text.startsWith(BOM) ? text.slice(1) : text;
  } catch {
    return new TextDecoder("latin1").decode(buffer);
  }
}

export function hasBinaryContent(buffer: Buffer): boolean {
  const head = buffer.subarray(0, 8192);
  return head.includes(0);
}

function rowCollector(limits: CsvLimits) {
  const now = limits.now ?? Date.now;
  const started = now();
  const rows: string[][] = [];
  const push = (row: string[]) => {
    if (row.length === 1 && row[0] === "") return;
    rows.push(row);
    if (rows.length > limits.maxRows) {
      throw new CsvLimitError("rows", `O arquivo passa de ${limits.maxRows} linhas.`);
    }
    if (rows.length % CHECK_EVERY_ROWS === 0 && now() - started > limits.budgetMs) {
      throw new CsvLimitError("time", "O arquivo demorou demais para ser lido.");
    }
  };
  return { rows, push };
}

export function parseCsv(text: string, limits: CsvLimits): CsvTable {
  const firstBreak = text.search(/\r?\n/);
  const delimiter = detectDelimiter(firstBreak < 0 ? text : text.slice(0, firstBreak));
  const { rows, push } = rowCollector(limits);
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let index = 0;

  const endRow = () => {
    row.push(field);
    field = "";
    push(row);
    row = [];
  };

  while (index < text.length) {
    const char = text[index]!;
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        quoted = false;
        index += 1;
        continue;
      }
      field += char;
      index += 1;
      continue;
    }
    if (char === '"' && field === "") {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      endRow();
    } else if (char !== "\r") {
      field += char;
    }
    index += 1;
  }
  if (field !== "" || row.length > 0) endRow();

  const [header = [], ...body] = rows;
  return { header: header.map((h) => h.trim()), rows: body, delimiter };
}
