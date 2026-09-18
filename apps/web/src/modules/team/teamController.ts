import { createServerFn } from "@tanstack/react-start";
import {
  teamIdSchema,
  teamInviteSchema,
  teamMemberUpdateSchema,
  type TeamInvitation,
  type TeamMember,
  type TeamScreen,
} from "@ecommerce/contracts/team";
import { ApiRequestError, apiFetch } from "@/shared/dependencies/apiClient";

export type TeamResult<T> = { ok: true; data: T } | { ok: false; message: string };

async function attempt<T>(run: () => Promise<T>, fallback: string): Promise<TeamResult<T>> {
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

const memberUpdateInput = teamIdSchema.merge(teamMemberUpdateSchema);

export const getTeamScreen = createServerFn({ method: "GET" }).handler(async () =>
  apiFetch<TeamScreen>("/team"),
);

export const inviteMemberFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => teamInviteSchema.parse(input))
  .handler(({ data }) =>
    attempt(
      () => apiFetch<TeamInvitation>("/team/invitations", { method: "POST", body: data }),
      "Não foi possível enviar o convite agora. Tente novamente.",
    ),
  );

export const resendTeamInvitationFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => teamIdSchema.parse(input))
  .handler(({ data }) =>
    attempt(
      () =>
        apiFetch<TeamInvitation>(`/team/invitations/${encodeURIComponent(data.id)}/resend`, {
          method: "POST",
        }),
      "Não foi possível reenviar o convite agora.",
    ),
  );

export const revokeTeamInvitationFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => teamIdSchema.parse(input))
  .handler(({ data }) =>
    attempt(
      () =>
        apiFetch<void>(`/team/invitations/${encodeURIComponent(data.id)}`, { method: "DELETE" }),
      "Não foi possível revogar o convite agora.",
    ),
  );

export const updateMemberFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => memberUpdateInput.parse(input))
  .handler(({ data }) =>
    attempt(
      () =>
        apiFetch<TeamMember>(`/team/members/${encodeURIComponent(data.id)}`, {
          method: "PUT",
          body: { grants: data.grants },
        }),
      "Não foi possível salvar o acesso agora.",
    ),
  );

export const removeMemberFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => teamIdSchema.parse(input))
  .handler(({ data }) =>
    attempt(
      () => apiFetch<void>(`/team/members/${encodeURIComponent(data.id)}`, { method: "DELETE" }),
      "Não foi possível remover agora.",
    ),
  );
