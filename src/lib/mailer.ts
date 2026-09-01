import nodemailer from "nodemailer";

/**
 * Sends the OTP email. With no SMTP_HOST configured (the default for local
 * development) the code is printed to the server console instead, so the auth
 * flow is testable without a mail provider.
 */
export async function sendOtpEmail(to: string, code: string) {
  const host = process.env.SMTP_HOST;

  if (!host) {
    console.info(
      `\n[TripMate IITM] OTP for ${to}: ${code}\n` +
        `(No SMTP_HOST set — set one in .env to send real mail.)\n`,
    );
    return;
  }

  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? "TripMate IITM <no-reply@students.iitmandi.ac.in>",
    to,
    subject: `${code} is your TripMate IITM code`,
    text: `Your TripMate IITM verification code is ${code}. It expires in 10 minutes.`,
    html:
      `<p>Your TripMate IITM verification code is:</p>` +
      `<p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>` +
      `<p>It expires in 10 minutes. If you didn't request this, ignore this email.</p>`,
  });
}
