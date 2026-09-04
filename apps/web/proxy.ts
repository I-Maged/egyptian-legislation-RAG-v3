import { NextResponse, type NextRequest } from "next/server";

import { resolveAccess } from "@/lib/auth/guard";
import { decodeSessionToken } from "@/lib/auth/session-token";

export function proxy(request: NextRequest) {
  const session = decodeSessionToken(
    request.cookies.get("law_session")?.value,
  );

  const destination = resolveAccess(request.nextUrl.pathname, session);

  if (destination) {
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/sign-in"],
};
