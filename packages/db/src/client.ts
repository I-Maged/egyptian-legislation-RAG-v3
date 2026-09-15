import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Local DX only: load `.env` files for tsx/vitest CLIs (Next.js loads
// `.env*` itself, and in production/Docker env comes from the container
// runtime, so skip file probing there). Static string literals — no dynamic
// path resolution — keep Next standalone output tracing tight instead of
// pulling the whole project into the Docker image.
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env" });
  dotenv.config({ path: "../../.env" });
}

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
