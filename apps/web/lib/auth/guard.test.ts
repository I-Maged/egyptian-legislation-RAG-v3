import { describe, expect, it } from "vitest";

import { isAdminPath, resolveAccess } from "./guard";

describe("isAdminPath", () => {
  it("matches the admin root and nested admin routes", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/laws")).toBe(true);
    expect(isAdminPath("/admin/laws/123")).toBe(true);
  });

  it("does not match non-admin paths", () => {
    expect(isAdminPath("/")).toBe(false);
    expect(isAdminPath("/sign-in")).toBe(false);
    expect(isAdminPath("/administrator")).toBe(false);
  });
});

describe("resolveAccess", () => {
  it("redirects unauthenticated visitors from admin pages to sign-in", () => {
    expect(resolveAccess("/admin", null)).toBe("/sign-in");
    expect(resolveAccess("/admin/laws", null)).toBe("/sign-in");
  });

  it("bounces non-admin users away from admin pages", () => {
    expect(resolveAccess("/admin", { role: "USER" })).toBe("/");
    expect(resolveAccess("/admin/laws/1", { role: "USER" })).toBe("/");
  });

  it("lets admins through", () => {
    expect(resolveAccess("/admin", { role: "ADMIN" })).toBeNull();
    expect(resolveAccess("/admin/laws/new", { role: "ADMIN" })).toBeNull();
  });

  it("redirects signed-in users away from the sign-in page", () => {
    expect(resolveAccess("/sign-in", { role: "USER" })).toBe("/");
    expect(resolveAccess("/sign-in", { role: "ADMIN" })).toBe("/");
  });

  it("leaves public pages untouched", () => {
    expect(resolveAccess("/", null)).toBeNull();
    expect(resolveAccess("/sign-in", null)).toBeNull();
  });
});
