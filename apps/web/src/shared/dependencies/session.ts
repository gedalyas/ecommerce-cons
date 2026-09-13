import { useSession as startSession } from "@tanstack/react-start/server";
import type { AuthUser } from "@ecommerce/contracts/auth";

export type SessionData = { accessToken: string; refreshToken: string; user: AuthUser };

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function appSession() {
  const password = process.env["SESSION_SECRET"];
  if (!password) throw new Error("SESSION_SECRET is not set");
  return startSession<SessionData>({
    password,
    name: "ecommerce_session",
    maxAge: SESSION_MAX_AGE_SECONDS,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env["NODE_ENV"] === "production",
      path: "/",
    },
  });
}
