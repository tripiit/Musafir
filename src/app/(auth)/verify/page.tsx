import { redirect } from "next/navigation";
import { VerifyForm } from "@/components/auth/VerifyForm";
import { EMAIL_DOMAIN } from "@/lib/constants";

export const metadata = { title: "Verify your email · TripMate IITM" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  // Reaching /verify without a pending address means the flow was skipped.
  if (!email || !email.endsWith(EMAIL_DOMAIN)) redirect("/login");

  return <VerifyForm email={email} />;
}
