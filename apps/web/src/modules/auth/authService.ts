import type { AuthUser, LoginInput, LoginResponse } from "@ecommerce/contracts/auth";
import { ApiRequestError, apiFetch } from "@/shared/dependencies/apiClient";
import { appSession } from "@/shared/dependencies/session";

export type LoginResult = { ok: true; user: AuthUser } | { ok: false; message: string };

export async function signIn(input: LoginInput): Promise<LoginResult> {
  try {
    const { user, tokens } = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: input,
      auth: false,
    });
    const session = await appSession();
    await session.update({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    });
    return { ok: true, user };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status < 500) {
      return { ok: false, message: error.body.message };
    }
    console.error(error);
    return { ok: false, message: "Não foi possível entrar agora. Tente novamente." };
  }
}

export async function signOut(): Promise<void> {
  const session = await appSession();
  const refreshToken = session.data.refreshToken;
  if (refreshToken) {
    await apiFetch("/auth/logout", { method: "POST", body: { refreshToken }, auth: false }).catch(
      () => undefined,
    );
  }
  await session.clear();
}

export async function sessionUser(): Promise<AuthUser | null> {
  const session = await appSession();
  return session.data.user ?? null;
}
