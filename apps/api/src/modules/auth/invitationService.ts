import type { UserRole } from "@ecommerce/contracts/auth";
import type { AccessArea, ClientMembership } from "@ecommerce/database/enums";
import { prismaClient } from "@ecommerce/database/client";
import { HttpError } from "@/shared/http/httpError";
import type { Mailer } from "@/shared/mail/mailer.types";
import { invitationLink, invitationMail } from "./authMail";
import { INVITATION_TOKEN_SECONDS, hashToken, invitationExpiry, newOpaqueToken } from "./tokens";

export type InvitationDelivery = { now: () => Date; mailer: Mailer; appUrl: string };

export type IssueInvitationInput = {
  email: string;
  role: UserRole;
  clientId: string | null;
  membership: ClientMembership;
  viewAreas: AccessArea[];
  editAreas: AccessArea[];
};

export const issuedInvitationSelect = {
  id: true,
  email: true,
  role: true,
  membership: true,
  viewAreas: true,
  editAreas: true,
  clientId: true,
  createdAt: true,
  expiresAt: true,
  acceptedAt: true,
  client: { select: { name: true } },
  invitedBy: { select: { name: true } },
} as const;

export type IssuedInvitationRow = {
  id: string;
  email: string;
  role: UserRole;
  membership: ClientMembership;
  viewAreas: AccessArea[];
  editAreas: AccessArea[];
  clientId: string | null;
  createdAt: Date;
  expiresAt: Date | null;
  acceptedAt: Date | null;
  client: { name: string } | null;
  invitedBy: { name: string } | null;
};

async function deliverInvitation(
  row: IssuedInvitationRow,
  token: string,
  delivery: InvitationDelivery,
): Promise<void> {
  try {
    await delivery.mailer.send(
      invitationMail({
        to: row.email,
        inviterName: row.invitedBy?.name ?? "Sua consultoria",
        role: row.role,
        membership: row.membership,
        storeName: row.client?.name ?? null,
        link: invitationLink(delivery.appUrl, token),
        expiresInDays: INVITATION_TOKEN_SECONDS / 86_400,
      }),
    );
  } catch (error) {
    console.error(error);
    throw new HttpError(
      502,
      "O convite foi registrado, mas o e-mail não pôde ser enviado. Tente reenviar.",
    );
  }
}

export async function issueInvitation(
  input: IssueInvitationInput,
  invitedById: string | null,
  delivery: InvitationDelivery,
): Promise<IssuedInvitationRow> {
  const now = delivery.now();
  const token = newOpaqueToken();
  const stamp = { tokenHash: hashToken(token), expiresAt: invitationExpiry(now), acceptedAt: null };
  const row = await prismaClient.invitation.upsert({
    where: { email: input.email },
    create: { ...input, invitedById, ...stamp },
    update: { ...input, invitedById, ...stamp },
    select: issuedInvitationSelect,
  });
  await deliverInvitation(row, token, delivery);
  return row;
}

export async function reissueInvitation(
  id: string,
  delivery: InvitationDelivery,
): Promise<IssuedInvitationRow> {
  const now = delivery.now();
  const token = newOpaqueToken();
  const row = await prismaClient.invitation.update({
    where: { id },
    data: { tokenHash: hashToken(token), expiresAt: invitationExpiry(now) },
    select: issuedInvitationSelect,
  });
  await deliverInvitation(row, token, delivery);
  return row;
}
