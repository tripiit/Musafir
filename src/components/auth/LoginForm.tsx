"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { EMAIL_DOMAIN } from "@/lib/constants";
import { emailLocalPartSchema } from "@/lib/validation";

export function LoginForm() {
  const router = useRouter();
  const [localPart, setLocalPart] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Client-side shape check only; the server re-validates and owns the domain.
    const parsed = emailLocalPartSchema.safeParse(localPart);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailLocalPart: parsed.data }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      router.push(`/verify?email=${encodeURIComponent(data.email)}`);
    } catch {
      setError("Couldn't reach the server. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border border-surface-variant bg-surface-container-lowest p-stack-lg shadow-modal">
      <div className="mb-stack-lg text-center">
        <div className="mb-stack-md inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container transition-transform duration-300 group-hover:scale-105">
          <Icon name="mountain" size={32} />
        </div>
        <h1 className="mb-stack-sm font-heading text-headline-lg-mobile tracking-tight text-primary md:text-headline-lg">
          TripMate IITM
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Connect with fellow campus travellers
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-stack-md" noValidate>
        <div className="space-y-stack-sm">
          <label htmlFor="email" className="block text-label-md text-on-surface">
            Institute Email
          </label>
          <div className="relative rounded-md transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
              <Icon name="mail" size={20} />
            </div>
            <input
              id="email"
              name="email"
              type="text"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              placeholder="b24304"
              value={localPart}
              onChange={(e) => setLocalPart(e.target.value)}
              aria-describedby="email-hint"
              aria-invalid={error ? true : undefined}
              className="block w-full rounded-md border border-outline-variant bg-surface py-3 pr-[190px] pl-10 text-body-md text-on-surface transition-colors duration-200 placeholder:text-outline-variant focus:border-primary focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none"
            />
            {/* The domain is fixed, not typed — signup is restricted to it. */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-[14px] text-outline select-none">{EMAIL_DOMAIN}</span>
            </div>
          </div>
          <p id="email-hint" className="mt-1 flex items-center gap-1 text-label-sm text-outline">
            <Icon name="info" size={14} />
            Use your institute email only.
          </p>
          {error && (
            <p role="alert" className="flex items-center gap-1 text-label-sm text-error">
              <Icon name="warning" size={14} />
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex w-full transform items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-label-md text-on-primary transition-all duration-200 hover:bg-primary-container hover:shadow-card-hover active:scale-95 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Icon name="progress_activity" size={18} className="animate-spin" />
              Sending code…
            </>
          ) : (
            <>
              <span>Login / Create Account</span>
              <Icon name="arrow_forward" size={18} />
            </>
          )}
        </button>
      </form>

      <div
        aria-hidden
        className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-primary via-surface-tint to-secondary-container"
      />
    </div>
  );
}
