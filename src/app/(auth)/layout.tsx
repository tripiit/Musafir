import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/**
 * Auth screens are transactional, so they render with no nav shell at all —
 * matching the export, which suppresses both the bottom nav and the sidebar.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="mountain-bg relative flex min-h-screen items-center justify-center overflow-hidden p-margin-mobile md:p-margin-desktop">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-primary-fixed-dim opacity-20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[10%] bottom-[10%] h-[40%] w-[40%] rounded-full bg-secondary-fixed-dim opacity-20 blur-[100px]"
      />
      <main className="z-10 w-full max-w-md">{children}</main>
    </div>
  );
}
