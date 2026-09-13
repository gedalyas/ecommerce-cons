import { IMPORT_ACCEPTED_EXTENSIONS } from "@ecommerce/contracts/imports";

export const ACCEPTED_MIME_TYPES = [
  "text/csv",
  "text/plain",
  "application/vnd.ms-excel",
  "application/csv",
  "application/octet-stream",
] as const;

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot < 0 ? "" : fileName.slice(dot).toLowerCase();
}

export function fileTypeProblem(fileName: string, mimeType: string | undefined): string | null {
  const extension = extensionOf(fileName);
  if (!(IMPORT_ACCEPTED_EXTENSIONS as readonly string[]).includes(extension)) {
    return `Só arquivos ${IMPORT_ACCEPTED_EXTENSIONS.join(", ")} são aceitos.`;
  }
  const mime = (mimeType ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (mime !== "" && !(ACCEPTED_MIME_TYPES as readonly string[]).includes(mime)) {
    return `O tipo do arquivo (${mime}) não é um CSV.`;
  }
  return null;
}
