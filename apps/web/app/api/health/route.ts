import { NextResponse } from "next/server";

// Liveness probe for Docker / load balancers. Intentionally does NOT touch
// the database or Ollama: readiness is signaled by the entrypoint finishing
// `prisma migrate deploy` before node starts accepting traffic.
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
