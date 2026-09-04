import { render, screen } from "@testing-library/react";

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Navbar from "./navbar";
import { UserProvider } from "./user-provider";
import type { SessionUser } from "@/lib/auth/types";

vi.mock("@/app/actions/auth", () => ({
  signOut: vi.fn(),
}));

const sampleUser: SessionUser = {
  id: "user-1",
  email: "ali@example.com",
  name: "علي",
  role: "ADMIN",
};

function renderNavbar(user: SessionUser | null = null) {
  return render(
    <UserProvider initialUser={user}>
      <Navbar />
    </UserProvider>,
  );
}

describe("Navbar", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a sign-in button linking to /sign-in when logged out", async () => {
    renderNavbar();

    const link = await screen.findByRole("link", { name: "تسجيل الدخول" });

    expect(link).toHaveAttribute("href", "/sign-in");
    expect(screen.queryByText("تسجيل الخروج")).not.toBeInTheDocument();
  });

  it("shows the user name and a sign-out button when logged in", () => {
    renderNavbar(sampleUser);

    expect(screen.getByText("علي")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "تسجيل الخروج" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "تسجيل الدخول" }),
    ).not.toBeInTheDocument();
  });

  it("does not re-fetch the session when an initial user is provided", () => {
    renderNavbar(sampleUser);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
