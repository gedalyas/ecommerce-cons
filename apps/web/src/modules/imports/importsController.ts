import { createServerFn } from "@tanstack/react-start";
import { importKindSchema, type ImportJob, type ImportsScreen } from "@ecommerce/contracts/imports";
import { ApiRequestError, apiFetch } from "@/shared/dependencies/apiClient";

export type UploadResult = { ok: true; job: ImportJob } | { ok: false; message: string };

export const getImportsScreen = createServerFn({ method: "GET" }).handler(async () =>
  apiFetch<ImportsScreen>("/imports"),
);

export const uploadImportFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error("Expected a FormData payload");
    const { kind } = importKindSchema.parse({ kind: input.get("kind") });
    const file = input.get("file");
    if (!(file instanceof File)) throw new Error("Expected a file");
    return { kind, file };
  })
  .handler(async ({ data }): Promise<UploadResult> => {
    const body = new FormData();
    body.append("kind", data.kind);
    body.append("file", data.file, data.file.name);
    try {
      const job = await apiFetch<ImportJob>("/imports", { method: "POST", body });
      return { ok: true, job };
    } catch (error) {
      if (error instanceof ApiRequestError && error.status < 500) {
        return { ok: false, message: error.body.message };
      }
      console.error(error);
      return { ok: false, message: "Não foi possível importar agora. Tente novamente." };
    }
  });
