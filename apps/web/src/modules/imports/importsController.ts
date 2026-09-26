import { createServerFn } from "@tanstack/react-start";
import {
  importUploadSchema,
  type ImportJob,
  type ImportMappingSuggestion,
  type ImportPreviewResult,
  type ImportsScreen,
} from "@ecommerce/contracts/imports";
import { z } from "zod";
import { ApiRequestError, apiFetch } from "@/shared/dependencies/apiClient";

export type CsvResult<T> = { ok: true; data: T } | { ok: false; message: string };

const csvInput = (input: unknown) => {
  if (!(input instanceof FormData)) throw new Error("Expected a FormData payload");
  const { kind, mapping } = importUploadSchema.parse({
    kind: input.get("kind"),
    mapping: input.get("mapping") ?? undefined,
  });
  const file = input.get("file");
  if (!(file instanceof File)) throw new Error("Expected a file");
  return { kind, file, mapping: mapping ?? null };
};

async function sendCsv<T>(
  path: string,
  data: ReturnType<typeof csvInput>,
  fallback: string,
): Promise<CsvResult<T>> {
  const body = new FormData();
  body.append("kind", data.kind);
  body.append("file", data.file, data.file.name);
  if (data.mapping) body.append("mapping", JSON.stringify(data.mapping));
  try {
    return { ok: true, data: await apiFetch<T>(path, { method: "POST", body }) };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status < 500) {
      return { ok: false, message: error.body.message };
    }
    console.error(error);
    return { ok: false, message: fallback };
  }
}

export const getImportsScreen = createServerFn({ method: "GET" }).handler(async () =>
  apiFetch<ImportsScreen>("/imports"),
);

export const previewImportFn = createServerFn({ method: "POST" })
  .validator(csvInput)
  .handler(({ data }) =>
    sendCsv<ImportPreviewResult>(
      "/imports/preview",
      data,
      "Não foi possível ler o arquivo agora. Tente novamente.",
    ),
  );

const idSchema = z.object({ id: z.string().min(1) });

export const undoImportFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }): Promise<CsvResult<ImportJob>> => {
    try {
      const job = await apiFetch<ImportJob>(`/imports/${encodeURIComponent(data.id)}/undo`, {
        method: "POST",
      });
      return { ok: true, data: job };
    } catch (error) {
      if (error instanceof ApiRequestError && error.status < 500) {
        return { ok: false, message: error.body.message };
      }
      console.error(error);
      return { ok: false, message: "Não foi possível desfazer agora. Tente novamente." };
    }
  });

export const uploadImportFn = createServerFn({ method: "POST" })
  .validator(csvInput)
  .handler(({ data }) =>
    sendCsv<ImportJob>("/imports", data, "Não foi possível importar agora. Tente novamente."),
  );

export const suggestMappingFn = createServerFn({ method: "POST" })
  .validator(csvInput)
  .handler(({ data }) =>
    sendCsv<ImportMappingSuggestion>(
      "/imports/mapping/suggest",
      data,
      "A IA não respondeu agora. Escolha as colunas à mão ou tente de novo.",
    ),
  );
