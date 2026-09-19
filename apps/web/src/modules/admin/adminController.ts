import { createServerFn } from "@tanstack/react-start";
import {
  assignConsultantsSchema,
  invitationInputSchema,
  releaseScreensSchema,
  type AdminConnectionRequest,
  type AdminScreen,
  type AdminStore,
  type AdminUsersScreen,
  type ConsultantSummary,
  type Invitation,
} from "@ecommerce/contracts/admin";
import type { LoginResponse } from "@ecommerce/contracts/auth";
import { connectionRequestResolveSchema } from "@ecommerce/contracts/connectors";
import { enterImpersonation } from "@/modules/auth/contract.server";
import { z } from "zod";
import { ApiRequestError, apiFetch } from "@/shared/dependencies/apiClient";

export type AdminResult<T> = { ok: true; data: T } | { ok: false; message: string };

async function attempt<T>(run: () => Promise<T>, fallback: string): Promise<AdminResult<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status < 500) {
      return { ok: false, message: error.body.message };
    }
    console.error(error);
    return { ok: false, message: fallback };
  }
}

const idSchema = z.object({ id: z.string().min(1) });

export const getAdminScreen = createServerFn({ method: "GET" }).handler(async () =>
  apiFetch<AdminScreen>("/admin"),
);

export const getAdminUsers = createServerFn({ method: "GET" }).handler(async () =>
  apiFetch<AdminUsersScreen>("/admin/users"),
);

const userIdSchema = z.object({ userId: z.string().min(1) });

export const impersonateFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => userIdSchema.parse(input))
  .handler(async ({ data }) =>
    attempt(async () => {
      const response = await apiFetch<LoginResponse>(
        `/admin/users/${encodeURIComponent(data.userId)}/impersonate`,
        { method: "POST" },
      );
      await enterImpersonation(response);
    }, "Não foi possível acessar como este usuário."),
  );

export const inviteFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => invitationInputSchema.parse(input))
  .handler(async ({ data }) =>
    attempt(
      () => apiFetch<Invitation>("/admin/invitations", { method: "POST", body: data }),
      "Não foi possível convidar agora.",
    ),
  );

export const revokeInvitationFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }) =>
    attempt(
      () =>
        apiFetch<void>(`/admin/invitations/${encodeURIComponent(data.id)}`, { method: "DELETE" }),
      "Não foi possível revogar o convite.",
    ),
  );

export const resendInvitationFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }) =>
    attempt(
      () =>
        apiFetch<Invitation>(`/admin/invitations/${encodeURIComponent(data.id)}/resend`, {
          method: "POST",
        }),
      "Não foi possível reenviar o convite.",
    ),
  );

const archiveCall = (id: string, verb: "archive" | "restore") =>
  apiFetch<AdminStore>(`/admin/stores/${encodeURIComponent(id)}/${verb}`, { method: "PUT" });

export const archiveStoreFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }) =>
    attempt(() => archiveCall(data.id, "archive"), "Não foi possível arquivar a loja."),
  );

export const restoreStoreFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }) =>
    attempt(() => archiveCall(data.id, "restore"), "Não foi possível reativar a loja."),
  );

export const releaseScreensFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => idSchema.merge(releaseScreensSchema).parse(input))
  .handler(async ({ data }) =>
    attempt(
      () =>
        apiFetch<AdminStore>(`/admin/stores/${encodeURIComponent(data.id)}/screens`, {
          method: "PUT",
          body: { screens: data.screens },
        }),
      "Não foi possível atualizar as telas liberadas.",
    ),
  );

export const assignConsultantsFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => idSchema.merge(assignConsultantsSchema).parse(input))
  .handler(async ({ data }) =>
    attempt(
      () =>
        apiFetch<ConsultantSummary[]>(`/admin/stores/${encodeURIComponent(data.id)}/consultants`, {
          method: "PUT",
          body: { consultantIds: data.consultantIds },
        }),
      "Não foi possível atualizar os consultores.",
    ),
  );

export const resolveRequestFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => idSchema.merge(connectionRequestResolveSchema).parse(input))
  .handler(async ({ data }) =>
    attempt(
      () =>
        apiFetch<AdminConnectionRequest>(
          `/admin/connection-requests/${encodeURIComponent(data.id)}`,
          { method: "PUT", body: { status: data.status, note: data.note } },
        ),
      "Não foi possível atualizar a solicitação.",
    ),
  );
