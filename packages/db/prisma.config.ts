// cd packages/db && npx prisma migrate dev

// SELECT extname FROM pg_extension WHERE extname = 'vector';

import { createRequire } from "node:module";
import { defineConfig, env } from "prisma/config";

// Local DX only: load `.env` files for `prisma migrate dev` etc. In
// production/Docker the env comes from the container runtime, and the Next
// standalone output only traces a `dotenv` stub (no `dotenv/config`
// subpath), so a static `import "dotenv/config"` crashes `migrate deploy`
// in the web container. Optional load keeps both working.
const require = createRequire(import.meta.url);

try {
  require("dotenv/config");
} catch {
  // dotenv not installed or no .env file — env is already provided.
}

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
