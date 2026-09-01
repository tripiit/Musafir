import "server-only";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import {
  EMAIL_DOMAIN,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MINUTES,
  SESSION_COOKIE,
  SESSION_TTL_DAYS,
} from "./constants";

export function toInstituteEmail(localPart: string) {
  return `${localPart.trim().toLowerCase()}${EMAIL_DOMAIN}`;
}

function hashCode(email: string, code: string) {
  // Salted with the email so a hash cannot be reused across addresses.
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}

export function generateOtp() {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

export async function createOtp(email: string) {
  const code = generateOtp();
  // Invalidate any outstanding codes so only the newest one works.
  await prisma.otpCode.updateMany({
    where: { email, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  await prisma.otpCode.create({
    data: {
      email,
      codeHash: hashCode(email, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
    },
  });
  return code;
}

type OtpResult = { ok: true } | { ok: false; error: string };

export async function consumeOtp(email: string, code: string): Promise<OtpResult> {
  const record = await prisma.otpCode.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false, error: "Request a new code to continue." };
  if (record.expiresAt < new Date()) {
    return { ok: false, error: "That code expired. Request a new one." };
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, error: "Too many attempts. Request a new code." };
  }

  const expected = Buffer.from(record.codeHash, "hex");
  const actual = Buffer.from(hashCode(email, code), "hex");
  const matches = expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!matches) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "That code isn't right. Check and try again." };
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });
  return { ok: true };
}

/** Derives a display name from the email until the student edits their profile. */
function defaultNameFor(email: string) {
  return email.split("@")[0].toUpperCase();
}

export async function startSession(email: string) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: defaultNameFor(email) },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
  await prisma.session.create({ data: { token, userId: user.id, expiresAt } });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return user;
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { token } });
  jar.delete(SESSION_COOKIE);
}

/** Cached per request so multiple server components share one lookup. */
export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

/** For pages and route handlers that must have a signed-in student. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
