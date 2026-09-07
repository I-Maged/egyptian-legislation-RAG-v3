"use server";

import { redirect } from "next/navigation";

import { prisma } from "@egyptian-law/db";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie, createSessionCookie } from "@/lib/auth/session";

export type AuthState = {
  error: string;
} | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MANDATORY_FIELDS_ERROR = "جميع الحقول مطلوبة.";

function normalizeEmail(formData: FormData): string {
  return String(formData.get("email") ?? "").trim().toLowerCase();
}


export async function signIn(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = normalizeEmail(formData);
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: MANDATORY_FIELDS_ERROR };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "البريد الإلكتروني غير صالح." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSessionCookie(user.id, user.role);

  redirect("/");
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(formData);
  const password = String(formData.get("password") ?? "");
  if (!name || !email || !password) {
    return { error: MANDATORY_FIELDS_ERROR };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "البريد الإلكتروني غير صالح." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return { error: "هذا البريد الإلكتروني مستخدم بالفعل." };
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      name,
      role: "USER",
    },
    select: { id: true, role: true },
  });

  await createSessionCookie(user.id, user.role);

  redirect("/");
}

export async function signOut(): Promise<void> {
  await clearSessionCookie();

  redirect("/");
}
