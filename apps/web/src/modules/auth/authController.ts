import { createServerFn } from "@tanstack/react-start";
import {
  forgotPasswordSchema,
  invitationLookupSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@ecommerce/contracts/auth";
import { z } from "zod";
import {
  forgotPassword,
  invitationOf,
  leaveImpersonation,
  refreshSessionUser,
  resetPassword,
  selectStore,
  sessionState,
  signIn,
  signOut,
  signUp,
} from "./authService";

const selectStoreSchema = z.object({ clientId: z.string().min(1) });

export const loginFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => loginSchema.parse(input))
  .handler(async ({ data }) => signIn(data));

export const registerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => registerSchema.parse(input))
  .handler(async ({ data }) => signUp(data));

export const getInvitation = createServerFn({ method: "GET" })
  .validator((input: unknown) => invitationLookupSchema.parse(input))
  .handler(async ({ data }) => invitationOf(data.token));

export const forgotPasswordFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => forgotPasswordSchema.parse(input))
  .handler(async ({ data }) => forgotPassword(data.email));

export const resetPasswordFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => resetPasswordSchema.parse(input))
  .handler(async ({ data }) => resetPassword(data));

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => signOut());

export const getSessionState = createServerFn({ method: "GET" }).handler(async () =>
  sessionState(),
);

export const refreshSessionFn = createServerFn({ method: "POST" }).handler(async () =>
  refreshSessionUser(),
);

export const leaveImpersonationFn = createServerFn({ method: "POST" }).handler(async () =>
  leaveImpersonation(),
);

export const selectStoreFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => selectStoreSchema.parse(input))
  .handler(async ({ data }) => selectStore(data.clientId));
