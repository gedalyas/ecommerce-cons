import { IMPORT_ACCEPTED_EXTENSIONS, IMPORT_MAX_BYTES } from "@ecommerce/contracts/imports";

export function importFileProblem(name: string, size: number): string | null {
  const extension = name.slice(name.lastIndexOf(".")).toLowerCase();
  if (!(IMPORT_ACCEPTED_EXTENSIONS as readonly string[]).includes(extension)) {
    return `Só arquivos ${IMPORT_ACCEPTED_EXTENSIONS.join(", ")} são aceitos.`;
  }
  if (size > IMPORT_MAX_BYTES) {
    return `O arquivo passa de ${Math.round(IMPORT_MAX_BYTES / 1024 / 1024)} MB.`;
  }
  if (size === 0) return "O arquivo está vazio.";
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}
