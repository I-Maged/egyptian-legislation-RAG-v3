import { cookies } from "next/headers";

import { prisma } from "@egyptian-law/db";

import { createSessionToken, decodeSessionToken } from "./session-token";
import type { SessionUser, UserRoleName } from "./types";

export const SESSION_COOKIE_NAME = "law_session";

export async function createSessionCookie(
  userId: string,
  role: UserRoleName,
): Promise<void> {
  const store = await cookies();

  store.set(SESSION_COOKIE_NAME, createSessionToken(userId, role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();

  store.delete(SESSION_COOKIE_NAME);
}

export async function getSessionPayload() {
  const store = await cookies();

  return decodeSessionToken(store.get(SESSION_COOKIE_NAME)?.value);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSessionPayload();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });

  return user ?? null;
}
