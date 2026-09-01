import { NextResponse } from "next/server";
import { createOtp, toInstituteEmail } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/mailer";
import { requestOtpSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestOtpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // The domain is appended server-side, so signup cannot be pointed at another
  // institution by editing the request.
  const email = toInstituteEmail(parsed.data.emailLocalPart);
  const code = await createOtp(email);

  try {
    await sendOtpEmail(email, code);
  } catch (error) {
    console.error("Failed to send OTP email", error);
    return NextResponse.json(
      { error: "Could not send the code. Try again in a moment." },
      { status: 502 },
    );
  }

  return NextResponse.json({ email });
}
