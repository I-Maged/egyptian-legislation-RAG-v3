import { render, screen, waitFor } from "@testing-library/react";

import { useEffect, useState } from "react";

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import { UserProvider, useUser } from "./user-provider";
import type { SessionUser } from "@/lib/auth/types";

const sampleUser: SessionUser = {
  id: "user-1",
  email: "ali@example.com",
  name: "علي",
  role: "ADMIN",
};

let currentPathname = "/";
const pathnameSetters = new Set<(path: string) => void>();

function setPathname(path: string) {
  currentPathname = path;

  for (const setter of pathnameSetters) {
    setter(path);
  }
}

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => {
    const [path, setPath] = useState(currentPathname);

    useEffect(() => {
      pathnameSetters.add(setPath);

      return () => {
        pathnameSetters.delete(setPath);
      };
    }, []);

    return path;
  }),
}));

function Consumer() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div>loading</div>;
  }

  return <div>{user ? `user:${user.name}` : "anonymous"}</div>;
}

function jsonResponse(body: unknown) {
  return {
    ok: true,
    json: () => Promise.resolve(body),
  };
}

describe("UserProvider", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setPathname("/");
    pathnameSetters.clear();
    fetchMock = vi.fn(() => Promise.resolve(jsonResponse(null)));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts in a loading state then exposes the fetched user", async () => {
    fetchMock.mockReturnValue(Promise.resolve(jsonResponse(sampleUser)));

    render(
      <UserProvider>
        <Consumer />
      </UserProvider>,
    );

    expect(screen.getByText("loading")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("user:علي")).toBeInTheDocument(),
    );

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/me");
  });

  it("exposes anonymous when the session endpoint returns null", async () => {
    render(
      <UserProvider>
        <Consumer />
      </UserProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("anonymous")).toBeInTheDocument(),
    );
  });

  it("re-fetches when the pathname changes (post sign-in redirect)", async () => {
    const { unmount } = render(
      <UserProvider>
        <Consumer />
      </UserProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("anonymous")).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Simulate the soft navigation after signing in.
    fetchMock.mockReturnValue(Promise.resolve(jsonResponse(sampleUser)));
    setPathname("/home");

    await screen.findByText("user:علي");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Simulate signing out on another route.
    fetchMock.mockReturnValue(Promise.resolve(jsonResponse(null)));
    setPathname("/sign-in");

    await screen.findByText("anonymous");
    expect(fetchMock).toHaveBeenCalledTimes(3);

    unmount();
  });

  it("skips fetching entirely when an initial user is provided", async () => {
    render(
      <UserProvider initialUser={sampleUser}>
        <Consumer />
      </UserProvider>,
    );

    expect(screen.getByText("user:علي")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats a failed request as anonymous and stops loading", async () => {
    fetchMock.mockReturnValue(Promise.reject(new Error("network error")));

    render(
      <UserProvider>
        <Consumer />
      </UserProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("anonymous")).toBeInTheDocument(),
    );
  });
});
