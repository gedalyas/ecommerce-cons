import { IMPORT_ACCEPTED_EXTENSIONS, type ImportExtension } from "@ecommerce/contracts/imports";

export const ACCEPTED_MIME_TYPES: Record<ImportExtension, readonly string[]> = {
  ".csv": [
    "text/csv",
    "text/plain",
    "application/vnd.ms-excel",
    "application/csv",
    "application/octet-stream",
  ],
  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/octet-stream",
  ],
};

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot < 0 ? "" : fileName.slice(dot).toLowerCase();
}

const isAcceptedExtension = (extension: string): extension is ImportExtension =>
  (IMPORT_ACCEPTED_EXTENSIONS as readonly string[]).includes(extension);

export function fileTypeProblem(fileName: string, mimeType: string | undefined): string | null {
  const extension = extensionOf(fileName);
  if (!isAcceptedExtension(extension)) {
    return `Só arquivos ${IMPORT_ACCEPTED_EXTENSIONS.join(", ")} são aceitos.`;
  }
  const mime = (mimeType ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (mime !== "" && !ACCEPTED_MIME_TYPES[extension].includes(mime)) {
    return `O tipo do arquivo (${mime}) não combina com a extensão ${extension}.`;
  }
  return null;
}
