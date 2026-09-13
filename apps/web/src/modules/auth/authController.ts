import { createServerFn } from "@tanstack/react-start";
import { loginSchema } from "@ecommerce/contracts/auth";
import { sessionUser, signIn, signOut } from "./authService";

export const loginFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => loginSchema.parse(input))
  .handler(async ({ data }) => signIn(data));

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => signOut());

export const getSessionUser = createServerFn({ method: "GET" }).handler(async () => sessionUser());
