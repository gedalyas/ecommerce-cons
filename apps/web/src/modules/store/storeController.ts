import { createServerFn } from "@tanstack/react-start";
import type { StoreSummary } from "@ecommerce/contracts/auth";
import { storeProfileSchema, type Store } from "@ecommerce/contracts/store";
import { ApiRequestError, apiFetch } from "@/shared/dependencies/apiClient";
import { refreshSessionUser, selectStore } from "@/modules/auth/contract.server";

export type StoreResult = { ok: true } | { ok: false; message: string };

const failure = (error: unknown, fallback: string): StoreResult => {
  if (error instanceof ApiRequestError && error.status < 500) {
    return { ok: false, message: error.body.message };
  }
  console.error(error);
  return { ok: false, message: fallback };
};

export const createStoreFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => storeProfileSchema.parse(input))
  .handler(async ({ data }): Promise<StoreResult> => {
    try {
      const store = await apiFetch<StoreSummary>("/stores", { method: "POST", body: data });
      await refreshSessionUser();
      await selectStore(store.id);
      return { ok: true };
    } catch (error) {
      return failure(error, "Não foi possível criar a loja agora. Tente novamente.");
    }
  });

export const getStore = createServerFn({ method: "GET" }).handler(async () =>
  apiFetch<Store>("/store"),
);

export const updateStoreFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => storeProfileSchema.parse(input))
  .handler(async ({ data }): Promise<StoreResult> => {
    try {
      await apiFetch<Store>("/store", { method: "PUT", body: data });
      await refreshSessionUser();
      return { ok: true };
    } catch (error) {
      return failure(error, "Não foi possível salvar agora. Tente novamente.");
    }
  });
