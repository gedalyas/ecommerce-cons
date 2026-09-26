import { describe, expect, it } from "vitest";
import {
  NOT_A_SPREADSHEET,
  SPREADSHEET_TOO_BIG,
  isSpreadsheetPart,
  zipProblem,
} from "./zipDirectory";

type Entry = { name: string; size: number; stored: number };

function zipOf(entries: Entry[]): Uint8Array {
  const local: number[] = [];
  const central: number[] = [];
  const u16 = (out: number[], v: number) => out.push(v & 0xff, (v >>> 8) & 0xff);
  const u32 = (out: number[], v: number) => {
    u16(out, v & 0xffff);
    u16(out, (v >>> 16) & 0xffff);
  };
  for (const entry of entries) {
    const name = [...Buffer.from(entry.name)];
    const offset = local.length;
    u32(local, 0x04034b50);
    local.push(...new Array<number>(22).fill(0));
    u16(local, name.length);
    u16(local, 0);
    local.push(...name, ...new Array<number>(entry.stored).fill(0));
    u32(central, 0x02014b50);
    central.push(...new Array<number>(16).fill(0));
    u32(central, entry.stored);
    u32(central, entry.size);
    u16(central, name.length);
    central.push(...new Array<number>(12).fill(0));
    u32(central, offset);
    central.push(...name);
  }
  const end: number[] = [];
  u32(end, 0x06054b50);
  end.push(0, 0, 0, 0);
  u16(end, entries.length);
  u16(end, entries.length);
  u32(end, central.length);
  u32(end, local.length);
  u16(end, 0);
  return Uint8Array.from([...local, ...central, ...end]);
}

const limits = { maxEntries: 10, maxUnzippedBytes: 1000, maxRatio: 20 };

describe("zipProblem", () => {
  it("accepts a small archive", () => {
    const zip = zipOf([
      { name: "xl/workbook.xml", size: 300, stored: 40 },
      { name: "xl/worksheets/sheet1.xml", size: 500, stored: 60 },
    ]);
    expect(zipProblem(zip, limits)).toBeNull();
  });

  it("refuses what is not a zip", () => {
    const text = Uint8Array.from(Buffer.from("numero;data\n1;2\n"));
    expect(zipProblem(text, limits)).toBe(NOT_A_SPREADSHEET);
  });

  it("refuses an archive that declares too much once unzipped", () => {
    expect(zipProblem(zipOf([{ name: "a.xml", size: 5000, stored: 400 }]), limits)).toBe(
      SPREADSHEET_TOO_BIG,
    );
    expect(
      zipProblem(zipOf([{ name: "a.xml", size: 900, stored: 1 }]), {
        ...limits,
        maxUnzippedBytes: 10_000,
        maxRatio: 2,
      }),
    ).toBe(SPREADSHEET_TOO_BIG);
  });

  it("refuses too many entries", () => {
    const many = Array.from({ length: 11 }, (_, i) => ({ name: `f${i}`, size: 1, stored: 1 }));
    expect(zipProblem(zipOf(many), limits)).toBe(SPREADSHEET_TOO_BIG);
  });
});

describe("isSpreadsheetPart", () => {
  it("keeps only the XML parts of a workbook", () => {
    expect(isSpreadsheetPart("xl/worksheets/sheet1.xml")).toBe(true);
    expect(isSpreadsheetPart("xl/_rels/workbook.xml.rels")).toBe(true);
    expect(isSpreadsheetPart("xl/media/image1.png")).toBe(false);
    expect(isSpreadsheetPart("xl/vbaProject.bin")).toBe(false);
  });
});
