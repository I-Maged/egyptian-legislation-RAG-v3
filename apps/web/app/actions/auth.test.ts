import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSessionCookie } from "@/lib/auth/session";

import { signIn, signOut, signUp } from "./auth";

vi.mock("@egyptian-law/db", () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
  recordLastLogin: vi.fn(),
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

import {
  createUser,
  findUserByEmail,
  recordLastLogin,
} from "@egyptian-law/db";

const mockedFindUserByEmail = vi.mocked(findUserByEmail);
const mockedCreateUser = vi.mocked(createUser);
const mockedRecordLastLogin = vi.mocked(recordLastLogin);
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
    expect(mockedFindUserByEmail).not.toHaveBeenCalled();
  });

  it("rejects a malformed email", async () => {
    const result = await signIn(
      null,
      formData({ email: "not-an-email", password: "secret" }),
    );

    expect(result).toEqual({ error: "البريد الإلكتروني غير صالح." });
    expect(mockedFindUserByEmail).not.toHaveBeenCalled();
  });

  it("returns a generic error for an unknown email", async () => {
    mockedFindUserByEmail.mockResolvedValueOnce(null);

    const result = await signIn(
      null,
      formData({ email: "ghost@example.com", password: "secret" }),
    );

    expect(result).toEqual({
      error: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    });
  });

  it("returns a generic error for a wrong password", async () => {
    const { hashPassword } = await import("@/lib/auth/password");

    mockedFindUserByEmail.mockResolvedValueOnce({
      id: "user-1",
      email: "user@example.com",
      name: "User",
      role: "USER",
      passwordHash: await hashPassword("right-password"),
    });

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

    mockedFindUserByEmail.mockResolvedValueOnce({
      id: "user-1",
      email: "admin@example.com",
      name: "Admin",
      role: "ADMIN",
      passwordHash: await hashPassword("right-password"),
    });

    await expect(
      signIn(
        null,
        formData({ email: "admin@example.com", password: "right-password" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockedRecordLastLogin).toHaveBeenCalledWith("user-1");
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
      }),
    );

    expect(result).toEqual({ error: "جميع الحقول مطلوبة." });
    expect(mockedCreateUser).not.toHaveBeenCalled();
  });

  it("cannot self-elevate by submitting an ADMIN role", async () => {
    mockedFindUserByEmail.mockResolvedValueOnce(null);
    mockedCreateUser.mockResolvedValueOnce({ id: "user-3", role: "USER" });

    await expect(
      signUp(
        null,
        formData({
          name: "Ali",
          email: "new@example.com",
          password: "secret",
          role: "ADMIN",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    const createArgs = mockedCreateUser.mock.calls[0]![0];
    expect(createArgs.role).toBe("USER");
  });

  it("rejects an already registered email", async () => {
    mockedFindUserByEmail.mockResolvedValueOnce({ id: "existing" } as never);

    const result = await signUp(
      null,
      formData({
        name: "Ali",
        email: "taken@example.com",
        password: "secret",
      }),
    );

    expect(result).toEqual({
      error: "هذا البريد الإلكتروني مستخدم بالفعل.",
    });
    expect(mockedCreateUser).not.toHaveBeenCalled();
  });

  it("creates the user with a hashed password and signs them in", async () => {
    mockedFindUserByEmail.mockResolvedValueOnce(null);
    mockedCreateUser.mockResolvedValueOnce({ id: "user-2", role: "USER" });

    await expect(
      signUp(
        null,
        formData({
          name: "Ali",
          email: "New@Example.com",
          password: "secret",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    const createArgs = mockedCreateUser.mock.calls[0]![0];

    expect(createArgs.email).toBe("new@example.com");
    expect(createArgs.name).toBe("Ali");
    expect(createArgs.role).toBe("USER");
    expect(createArgs.passwordHash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
    expect(createArgs.passwordHash).not.toContain("secret");
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