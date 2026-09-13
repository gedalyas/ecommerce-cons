import type {
  AuthUser,
  InvitationCheck,
  LoginInput,
  LoginResponse,
  MeResponse,
  RegisterInput,
  ResetPasswordInput,
  StoreSummary,
} from "@ecommerce/contracts/auth";
import { ApiRequestError, apiFetch } from "@/shared/dependencies/apiClient";
import { appSession, type SessionData } from "@/shared/dependencies/session";
import { activeStoreOf } from "./activeStore";

export type AuthResult = { ok: true; user: AuthUser } | { ok: false; message: string };

const USER_STALE_MS = 5 * 60_000;
export type SessionState = { user: AuthUser; activeStore: StoreSummary | null };

function failure(error: unknown, fallback: string): AuthResult {
  if (error instanceof ApiRequestError && error.status < 500) {
    return { ok: false, message: error.body.message };
  }
  console.error(error);
  return { ok: false, message: fallback };
}

async function storeSession(response: LoginResponse): Promise<AuthUser> {
  const session = await appSession();
  const data: SessionData = {
    accessToken: response.tokens.accessToken,
    refreshToken: response.tokens.refreshToken,
    user: response.user,
    userRefreshedAt: Date.now(),
    activeClientId: activeStoreOf(response.user.stores, null)?.id ?? null,
  };
  await session.update(data);
  return response.user;
}

export async function signIn(input: LoginInput): Promise<AuthResult> {
  try {
    const response = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: input,
      auth: false,
    });
    return { ok: true, user: await storeSession(response) };
  } catch (error) {
    return failure(error, "Não foi possível entrar agora. Tente novamente.");
  }
}

export async function signUp(input: RegisterInput): Promise<AuthResult> {
  try {
    const response = await apiFetch<LoginResponse>("/auth/register", {
      method: "POST",
      body: input,
      auth: false,
    });
    return { ok: true, user: await storeSession(response) };
  } catch (error) {
    return failure(error, "Não foi possível criar sua conta agora. Tente novamente.");
  }
}

export type InvitationLookup =
  { ok: true; invitation: InvitationCheck } | { ok: false; message: string };

export async function invitationOf(token: string): Promise<InvitationLookup> {
  try {
    const invitation = await apiFetch<InvitationCheck>("/auth/invitation", {
      query: { token },
      auth: false,
    });
    return { ok: true, invitation };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status < 500) {
      return { ok: false, message: error.body.message };
    }
    throw error;
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

type SessionManager = Awaited<ReturnType<typeof appSession>>;

async function refreshUserInto(session: SessionManager): Promise<AuthUser> {
  const { user } = await apiFetch<MeResponse>("/me");
  const active = activeStoreOf(user.stores, session.data.activeClientId ?? null);
  await session.update({ user, userRefreshedAt: Date.now(), activeClientId: active?.id ?? null });
  return user;
}

export async function refreshSessionUser(): Promise<AuthUser | null> {
  const session = await appSession();
  if (!session.data.accessToken) return null;
  return refreshUserInto(session);
}

function isStale(session: {
  user?: AuthUser;
  userRefreshedAt?: number;
  activeClientId?: string | null;
}): boolean {
  const age = Date.now() - (session.userRefreshedAt ?? 0);
  const active = activeStoreOf(session.user?.stores ?? [], session.activeClientId ?? null);
  return (
    age > USER_STALE_MS || (session.user?.stores.length ?? 0) === 0 || Boolean(active?.archivedAt)
  );
}

export async function sessionState(): Promise<SessionState | null> {
  const session = await appSession();
  if (!session.data.user) return null;
  const user = isStale(session.data) ? await refreshUserInto(session) : session.data.user;
  const active = activeStoreOf(user.stores, session.data.activeClientId ?? null);
  if ((active?.id ?? null) !== (session.data.activeClientId ?? null)) {
    await session.update({ activeClientId: active?.id ?? null });
  }
  return { user, activeStore: active };
}

export async function selectStore(clientId: string): Promise<StoreSummary | null> {
  const session = await appSession();
  const store = session.data.user?.stores.find((s) => s.id === clientId) ?? null;
  if (!store) return null;
  await session.update({ activeClientId: store.id });
  return store;
}

export type PlainResult = { ok: true } | { ok: false; message: string };

export async function forgotPassword(email: string): Promise<PlainResult> {
  try {
    await apiFetch<void>("/auth/password/forgot", { method: "POST", body: { email }, auth: false });
    return { ok: true };
  } catch (error) {
    return failure(error, "Não foi possível enviar o e-mail agora. Tente novamente.");
  }
}

export async function resetPassword(input: ResetPasswordInput): Promise<PlainResult> {
  try {
    await apiFetch<void>("/auth/password/reset", { method: "POST", body: input, auth: false });
    return { ok: true };
  } catch (error) {
    return failure(error, "Não foi possível redefinir a senha agora. Tente novamente.");
  }
}
