import { prisma } from "./client";

const result = await prisma.$queryRaw<Array<{ extname: string }>>`
  SELECT extname
  FROM pg_extension
  WHERE extname = 'vector'
`;

console.log(result);

await prisma.$disconnect();
