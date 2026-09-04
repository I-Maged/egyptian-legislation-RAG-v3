// cd packages/db && npx prisma migrate dev

// SELECT extname FROM pg_extension WHERE extname = 'vector';

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

const connectionString = `${env("DATABASE_URL")}`;

console.log("DATABASE_URL:", connectionString.replace(/:[^:@]+@/, ":****@"));
