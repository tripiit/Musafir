"use client";

import { useCallback, useRef, useState } from "react";
import { OTP_LENGTH } from "@/lib/constants";

/**
 * Digit-box behaviour ported from the export's vanilla JS: auto-advance on
 * entry, backspace steps back, and a pasted 6-digit code fills every box.
 */
export function useOtpInputs(onComplete?: (code: string) => void) {
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const setRef = useCallback(
    (index: number) => (el: HTMLInputElement | null) => {
      refs.current[index] = el;
    },
    [],
  );

  const commit = useCallback(
    (next: string[]) => {
      setDigits(next);
      const code = next.join("");
      if (code.length === OTP_LENGTH && !next.includes("")) onComplete?.(code);
    },
    [onComplete],
  );

  const handleChange = useCallback(
    (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value.replace(/\D/g, "");
      if (!value) {
        const next = [...digits];
        next[index] = "";
        commit(next);
        return;
      }

      // Typing over a filled box, or a mobile keyboard delivering several
      // digits at once, spills into the boxes to the right.
      const next = [...digits];
      let cursor = index;
      for (const char of value.split("")) {
        if (cursor >= OTP_LENGTH) break;
        next[cursor] = char;
        cursor += 1;
      }
      commit(next);
      refs.current[Math.min(cursor, OTP_LENGTH - 1)]?.focus();
    },
    [digits, commit],
  );

  const handleKeyDown = useCallback(
    (index: number) => (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Backspace" && !digits[index] && index > 0) {
        event.preventDefault();
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
        refs.current[index - 1]?.focus();
      }
      if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        refs.current[index - 1]?.focus();
      }
      if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
        event.preventDefault();
        refs.current[index + 1]?.focus();
      }
    },
    [digits],
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = event.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, OTP_LENGTH);
      if (!pasted) return;
      event.preventDefault();

      const next: string[] = Array(OTP_LENGTH).fill("");
      pasted.split("").forEach((digit, i) => {
        next[i] = digit;
      });
      commit(next);
      refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    },
    [commit],
  );

  const reset = useCallback(() => {
    setDigits(Array(OTP_LENGTH).fill(""));
    refs.current[0]?.focus();
  }, []);

  return {
    digits,
    code: digits.join(""),
    isComplete: digits.every(Boolean),
    setRef,
    handleChange,
    handleKeyDown,
    handlePaste,
    reset,
  };
}
