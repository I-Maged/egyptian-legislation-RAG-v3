import type { SessionPayload } from "./types";

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * Pure RBAC decision: returns a redirect destination or null to continue.
 */
export function resolveAccess(
  pathname: string,
  session: Pick<SessionPayload, "role"> | null,
): string | null {
  if (isAdminPath(pathname)) {
    if (!session) {
      return "/sign-in";
    }

    if (session.role !== "ADMIN") {
      return "/";
    }
  }

  if (pathname === "/sign-in" && session) {
    return "/";
  }

  return null;
}
