import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "./client";

describe("database connection", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("connects to PostgreSQL", async () => {
    const result = await prisma.$queryRaw<{ value: number }[]>`
      SELECT 1 AS value
    `;

    expect(result[0]?.value).toBe(1);
  });

  it("has pgvector installed", async () => {
    const result = await prisma.$queryRaw<{ extname: string }[]>`
      SELECT extname
      FROM pg_extension
      WHERE extname = 'vector'
    `;

    expect(result).toHaveLength(1);
    expect(result[0]?.extname).toBe("vector");
  });
});
