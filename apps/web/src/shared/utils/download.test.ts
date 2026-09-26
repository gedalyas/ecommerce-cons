import { describe, expect, it } from "vitest";
import { bytesOfBase64, fileNameOf } from "./download";

describe("fileNameOf", () => {
  it("reads the file name of an attachment, quoted or not", () => {
    expect(fileNameOf('attachment; filename="relatorio-loja.pdf"')).toBe("relatorio-loja.pdf");
    expect(fileNameOf("attachment; filename=relatorio.pdf")).toBe("relatorio.pdf");
    expect(fileNameOf(null)).toBeNull();
    expect(fileNameOf("inline")).toBeNull();
  });
});

describe("bytesOfBase64", () => {
  it("decodes base64 into bytes", () => {
    expect([...bytesOfBase64("JVBERi0=")]).toEqual([37, 80, 68, 70, 45]);
  });
});
