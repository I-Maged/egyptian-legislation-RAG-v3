import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSessionCookie } from "@/lib/auth/session";

import { signIn, signOut, signUp } from "./auth";

vi.mock("@egyptian-law/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/session", () => ({
  createSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

import { prisma } from "@egyptian-law/db";

const mockedFindUnique = vi.mocked(prisma.user.findUnique);
const mockedUpdate = vi.mocked(prisma.user.update);
const mockedCreate = vi.mocked(prisma.user.create);
const mockedCreateSessionCookie = vi.mocked(createSessionCookie);

function formData(entries: Record<string, string>) {
  const data = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    data.append(key, value);
  }

  return data;
}

describe("signIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects empty fields", async () => {
    const result = await signIn(null, formData({ email: "", password: "" }));

    expect(result).toEqual({ error: "جميع الحقول مطلوبة." });
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });

  it("rejects a malformed email", async () => {
    const result = await signIn(
      null,
      formData({ email: "not-an-email", password: "secret" }),
    );

    expect(result).toEqual({ error: "البريد الإلكتروني غير صالح." });
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });

  it("returns a generic error for an unknown email", async () => {
    mockedFindUnique.mockResolvedValueOnce(null);

    const result = await signIn(
      null,
      formData({ email: "ghost@example.com", password: "secret" }),
    );

    expect(result).toEqual({
      error: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    });
  });

  it("returns a generic error for a wrong password", async () => {
    mockedFindUnique.mockResolvedValueOnce({
      id: "user-1",
      email: "user@example.com",
      passwordHash: await (async () => {
        const { hashPassword } = await import("@/lib/auth/password");
        return hashPassword("right-password");
      })(),
    } as never);

    const result = await signIn(
      null,
      formData({ email: "user@example.com", password: "wrong-password" }),
    );

    expect(result).toEqual({
      error: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    });
  });

  it("creates a session and redirects on success", async () => {
    const { hashPassword } = await import("@/lib/auth/password");

    mockedFindUnique.mockResolvedValueOnce({
      id: "user-1",
      role: "ADMIN",
      passwordHash: await hashPassword("right-password"),
    } as never);
    mockedUpdate.mockResolvedValueOnce({} as never);

    await expect(
      signIn(
        null,
        formData({ email: "admin@example.com", password: "right-password" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user-1" } }),
    );
    expect(mockedCreateSessionCookie).toHaveBeenCalledWith("user-1", "ADMIN");
  });
});

describe("signUp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when any field is missing", async () => {
    const result = await signUp(
      null,
      formData({
        name: "",
        email: "new@example.com",
        password: "secret",
        role: "USER",
      }),
    );

    expect(result).toEqual({ error: "جميع الحقول مطلوبة." });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects an invalid role value", async () => {
    const result = await signUp(
      null,
      formData({
        name: "Ali",
        email: "new@example.com",
        password: "secret",
        role: "SUPERADMIN",
      }),
    );

    expect(result).toEqual({ error: "جميع الحقول مطلوبة." });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects an already registered email", async () => {
    mockedFindUnique.mockResolvedValueOnce({ id: "existing" } as never);

    const result = await signUp(
      null,
      formData({
        name: "Ali",
        email: "taken@example.com",
        password: "secret",
        role: "USER",
      }),
    );

    expect(result).toEqual({
      error: "هذا البريد الإلكتروني مستخدم بالفعل.",
    });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("creates the user with a hashed password and signs them in", async () => {
    mockedFindUnique.mockResolvedValueOnce(null);
    mockedCreate.mockResolvedValueOnce({ id: "user-2", role: "USER" } as never);

    await expect(
      signUp(
        null,
        formData({
          name: "Ali",
          email: "New@Example.com",
          password: "secret",
          role: "USER",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    const createArgs = mockedCreate.mock.calls[0]![0];

    expect(createArgs.data.email).toBe("new@example.com");
    expect(createArgs.data.name).toBe("Ali");
    expect(createArgs.data.role).toBe("USER");
    expect(createArgs.data.passwordHash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
    expect(createArgs.data.passwordHash).not.toContain("secret");
    expect(mockedCreateSessionCookie).toHaveBeenCalledWith("user-2", "USER");
  });
});

describe("signOut", () => {
  it("clears the cookie and redirects home", async () => {
    const { clearSessionCookie } = await import("@/lib/auth/session");
    const mockedClear = vi.mocked(clearSessionCookie);

    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockedClear).toHaveBeenCalled();
  });
});
