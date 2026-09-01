import { NextResponse } from "next/server";
import { consumeOtp, startSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyOtpSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = verifyOtpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email, code } = parsed.data;
  const result = await consumeOtp(email, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Checked before startSession, which creates the account on first login.
  const existing = await prisma.user.findUnique({ where: { email } });
  const user = await startSession(email);

  return NextResponse.json({
    isNewUser: !existing,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
