"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { EMAIL_DOMAIN, OTP_LENGTH, RESEND_COOLDOWN_SECONDS } from "@/lib/constants";
import { useOtpInputs } from "./useOtpInputs";

export function VerifyForm({ email }: { email: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
  // Guards against auto-submit firing twice when the last digit lands while a
  // request is already in flight.
  const submitting = useRef(false);

  const submit = useCallback(
    async (code: string) => {
      if (submitting.current) return;
      submitting.current = true;
      setPending(true);
      setError(null);

      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Could not verify that code.");
          return;
        }
        // A fresh account lands on the create/browse fork; a returning one goes
        // straight to the dashboard.
        router.replace(data.isNewUser ? "/home" : "/dashboard");
        router.refresh();
      } catch {
        setError("Could not reach the server. Check your connection.");
      } finally {
        setPending(false);
        submitting.current = false;
      }
    },
    [email, router],
  );

  const otp = useOtpInputs(submit);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  async function resend() {
    setError(null);
    setNotice(null);
    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailLocalPart: email.replace(EMAIL_DOMAIN, "") }),
    });

    if (res.ok) {
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      otp.reset();
      setNotice("We sent a new code.");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not resend the code.");
    }
  }

  return (
    <div className="flex flex-col items-center rounded-lg border border-surface-variant bg-surface-container-lowest p-stack-lg shadow-modal">
      <div className="mb-stack-md flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed">
        <Icon name="mark_email_read" size={32} className="text-primary" />
      </div>

      <h1 className="mb-stack-xs text-center font-heading text-headline-lg-mobile text-primary md:text-headline-lg">
        Verify your email
      </h1>
      <p className="mb-stack-lg text-center text-body-md text-on-surface-variant">
        Enter the {OTP_LENGTH}-digit verification code we sent to
        <br />
        <strong className="text-on-surface">{email}</strong>
      </p>

      <form
        className="flex w-full flex-col items-center"
        onSubmit={(e) => {
          e.preventDefault();
          if (otp.isComplete) submit(otp.code);
        }}
      >
        <div className="mb-stack-md flex w-full justify-center gap-2" dir="ltr">
          {otp.digits.map((digit, index) => (
            <input
              key={index}
              ref={otp.setRef(index)}
              value={digit}
              onChange={otp.handleChange(index)}
              onKeyDown={otp.handleKeyDown(index)}
              onPaste={otp.handlePaste}
              onFocus={(e) => e.target.select()}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              // Deliberately no maxLength: an autofilled or pasted code needs to
              // land in one box and spill across the rest.
              aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
              autoFocus={index === 0}
              className="h-14 w-12 rounded-md border-2 border-transparent bg-surface-container-low text-center font-heading text-headline-lg text-on-surface transition-colors outline-none focus:border-primary focus:bg-surface-container-lowest md:h-16 md:w-14"
            />
          ))}
        </div>

        <div className="mb-stack-lg flex w-full justify-center">
          <span className="flex items-center gap-1 rounded-full bg-surface-container px-3 py-1.5 text-label-sm text-on-surface-variant">
            <Icon name="info" size={16} />
            Check your {EMAIL_DOMAIN} inbox
          </span>
        </div>

        {error && (
          <p role="alert" className="mb-stack-sm flex items-center gap-1 text-label-sm text-error">
            <Icon name="warning" size={14} />
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mb-stack-sm text-label-sm text-success">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={!otp.isComplete || pending}
          className="w-full rounded-md bg-primary px-4 py-3 text-label-md text-on-primary shadow-card transition-all duration-200 hover:bg-tertiary active:scale-95 disabled:opacity-50"
        >
          {pending ? "Verifying..." : "Verify Code"}
        </button>
      </form>

      <div className="mt-stack-md flex flex-col items-center gap-stack-xs">
        <p className="text-body-sm text-on-surface-variant">Did not receive the code?</p>
        <button
          type="button"
          onClick={resend}
          disabled={secondsLeft > 0}
          className="text-label-md text-primary transition-colors hover:text-tertiary-container disabled:opacity-50"
        >
          {secondsLeft > 0 ? `Resend Code (${secondsLeft}s)` : "Resend Code"}
        </button>
      </div>

      <Link
        href="/login"
        className="mt-stack-lg flex items-center gap-1 text-label-md text-on-surface-variant transition-colors hover:text-primary"
      >
        <Icon name="chevron_left" size={18} />
        Back to Login
      </Link>
    </div>
  );
}
