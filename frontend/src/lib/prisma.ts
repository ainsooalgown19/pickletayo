import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalDatabase = globalThis as typeof globalThis & {
  pickleTayoPrisma?: PrismaClient;
};

export function getPrismaClient(): PrismaClient {
  if (globalDatabase.pickleTayoPrisma) {
    return globalDatabase.pickleTayoPrisma;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Database is not configured. Set the server-only DATABASE_URL environment variable.",
    );
  }

  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  if (process.env.NODE_ENV !== "production") {
    globalDatabase.pickleTayoPrisma = client;
  }

  return client;
}
