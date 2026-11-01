import { prisma } from "../client";

export type UserRoleName = "USER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRoleName;
  passwordHash?: string;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name: string;
  role?: UserRoleName;
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
    },
  });

  return user as AuthUser | null;
}

export async function findUserById(id: string): Promise<Omit<AuthUser, "passwordHash"> | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return user as Omit<AuthUser, "passwordHash"> | null;
}

export async function createUser(input: CreateUserInput): Promise<{ id: string; role: UserRoleName }> {
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash: input.passwordHash,
      name: input.name,
      role: input.role ?? "USER",
    },
    select: { id: true, role: true },
  }) as Promise<{ id: string; role: UserRoleName }>;
}

export async function recordLastLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

export async function userExistsByEmail(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return user !== null;
}