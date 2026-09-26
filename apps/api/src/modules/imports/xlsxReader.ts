import { Worker } from "node:worker_threads";
import { HttpError } from "@/shared/http/httpError";
import type { SheetTable, XlsxReply, XlsxRequest } from "./sheetCells";
import { NOT_A_SPREADSHEET, SPREADSHEET_TOO_BIG, zipProblem } from "./zipDirectory";

type XlsxLimits = { maxRows: number; budgetMs: number };

const ZIP_LIMITS = { maxEntries: 500, maxUnzippedBytes: 150 * 1024 * 1024, maxRatio: 100 };
const WORKER_LIMITS = { maxOldGenerationSizeMb: 512, maxYoungGenerationSizeMb: 64 };

const fromSource = import.meta.url.endsWith(".ts");

const sourceBootstrap = (url: URL) =>
  `import("tsx/esm/api").then(({ register }) => { register(); return import(${JSON.stringify(url.href)}); });`;

function startWorker(): Worker {
  const options = { resourceLimits: WORKER_LIMITS };
  if (!fromSource) return new Worker(new URL("./xlsxWorker.mjs", import.meta.url), options);
  const entry = new URL("./xlsxWorker.ts", import.meta.url);
  return new Worker(sourceBootstrap(entry), { ...options, eval: true });
}

const isOutOfMemory = (error: unknown) =>
  error instanceof Error && "code" in error && error.code === "ERR_WORKER_OUT_OF_MEMORY";

const failureOf = (error: unknown) =>
  isOutOfMemory(error) ? new HttpError(422, SPREADSHEET_TOO_BIG) : error;

export function readXlsxTable(
  buffer: Buffer,
  { maxRows, budgetMs }: XlsxLimits,
): Promise<SheetTable> {
  const problem = zipProblem(buffer, ZIP_LIMITS);
  if (problem) {
    return Promise.reject(new HttpError(problem === NOT_A_SPREADSHEET ? 415 : 422, problem));
  }
  const worker = startWorker();
  return new Promise<SheetTable>((resolve, reject) => {
    let settled = false;
    const finish = (settle: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      settle();
    };
    const timer = setTimeout(
      () => finish(() => reject(new HttpError(422, "O arquivo demorou demais para ser lido."))),
      budgetMs,
    );
    worker.once("message", (reply: XlsxReply) =>
      finish(() =>
        reply.ok ? resolve(reply.table) : reject(new HttpError(reply.status, reply.message)),
      ),
    );
    worker.once("error", (error) => finish(() => reject(failureOf(error))));
    worker.once("exit", () => finish(() => reject(new HttpError(415, NOT_A_SPREADSHEET))));
    const request: XlsxRequest = { buffer, maxRows };
    worker.postMessage(request);
  });
}
