import { parentPort } from "node:worker_threads";
import { unzipSync, zipSync } from "fflate";
import { readSheet } from "read-excel-file/node";
import { headerProblem } from "@ecommerce/contracts/imports";
import { cellText, sheetTable, type XlsxReply, type XlsxRequest } from "./sheetCells";
import { NOT_A_SPREADSHEET, isSpreadsheetPart } from "./zipDirectory";

async function sheetOf(buffer: Uint8Array) {
  const parts = unzipSync(buffer, { filter: (file) => isSpreadsheetPart(file.name) });
  return readSheet(Buffer.from(zipSync(parts, { level: 0 })));
}

async function reply({ buffer, maxRows }: XlsxRequest): Promise<XlsxReply> {
  let data;
  try {
    data = await sheetOf(buffer);
  } catch {
    return { ok: false, status: 415, message: NOT_A_SPREADSHEET };
  }
  if (data.length > maxRows + 1) {
    return { ok: false, status: 422, message: `O arquivo passa de ${maxRows} linhas.` };
  }
  const problem = headerProblem((data[0] ?? []).map(cellText));
  if (problem) return { ok: false, status: 422, message: problem };
  return { ok: true, table: sheetTable(data) };
}

parentPort?.once("message", (request: XlsxRequest) => {
  void reply(request).then((answer) => parentPort?.postMessage(answer));
});
