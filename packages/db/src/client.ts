import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

for (const candidate of [".env", "../../.env"]) {
  const envPath = path.resolve(process.cwd(), candidate);

  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
