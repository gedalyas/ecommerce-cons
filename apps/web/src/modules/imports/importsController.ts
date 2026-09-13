import { createServerFn } from "@tanstack/react-start";
import {
  importKindSchema,
  type ImportJob,
  type ImportPreview,
  type ImportsScreen,
} from "@ecommerce/contracts/imports";
import { ApiRequestError, apiFetch } from "@/shared/dependencies/apiClient";

export type CsvResult<T> = { ok: true; data: T } | { ok: false; message: string };

const csvInput = (input: unknown) => {
  if (!(input instanceof FormData)) throw new Error("Expected a FormData payload");
  const { kind } = importKindSchema.parse({ kind: input.get("kind") });
  const file = input.get("file");
  if (!(file instanceof File)) throw new Error("Expected a file");
  return { kind, file };
};

async function sendCsv<T>(
  path: string,
  data: ReturnType<typeof csvInput>,
  fallback: string,
): Promise<CsvResult<T>> {
  const body = new FormData();
  body.append("kind", data.kind);
  body.append("file", data.file, data.file.name);
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
    sendCsv<ImportPreview>(
      "/imports/preview",
      data,
      "Não foi possível ler o arquivo agora. Tente novamente.",
    ),
  );

export const uploadImportFn = createServerFn({ method: "POST" })
  .validator(csvInput)
  .handler(({ data }) =>
    sendCsv<ImportJob>("/imports", data, "Não foi possível importar agora. Tente novamente."),
  );
