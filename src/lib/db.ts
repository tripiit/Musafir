import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * `fileMustExist` is the whole bug fix.
 *
 * `DATABASE_URL=file:./dev.db` is resolved by better-sqlite3 against
 * `process.cwd()`. Launched from anywhere other than the project root, the
 * default behaviour is to silently CREATE a new empty database there and leave
 * the real one untouched — which presents as "all my trips and chats
 * disappeared". With this flag it refuses to open a missing file and throws
 * instead, so a wrong working directory is an immediate, obvious error.
 *
 * (Resolving the path to an absolute one here instead would work too, but
 * `process.cwd()` in bundled server code makes Turbopack trace the entire
 * project on every build.)
 */
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  fileMustExist: true,
});

// Next.js dev server hot-reloads modules, so cache the client on globalThis to
// avoid exhausting connections with a new instance per reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
