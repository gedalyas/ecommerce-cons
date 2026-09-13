import { createServerFn } from "@tanstack/react-start";
import { invitationLookupSchema, loginSchema, registerSchema } from "@ecommerce/contracts/auth";
import { z } from "zod";
import {
  invitationOf,
  refreshSessionUser,
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
  .handler(async ({ data }) => invitationOf(data.email));

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => signOut());

export const getSessionState = createServerFn({ method: "GET" }).handler(async () =>
  sessionState(),
);

export const refreshSessionFn = createServerFn({ method: "POST" }).handler(async () =>
  refreshSessionUser(),
);

export const selectStoreFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => selectStoreSchema.parse(input))
  .handler(async ({ data }) => selectStore(data.clientId));
