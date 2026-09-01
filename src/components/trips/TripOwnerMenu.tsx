"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * The ⋮ menu on a trip you organize. Rendered only for the owner — trips by
 * other students never get one.
 */
export function TripOwnerMenu({
  tripId,
  tripTitle,
  className = "",
}: {
  tripId: string;
  tripTitle: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape, the way a menu is expected to behave.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!wrapper.current?.contains(event.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setConfirming(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function cancelTrip() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not cancel the trip.");
        return;
      }
      setOpen(false);
      setConfirming(false);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div ref={wrapper} className={`relative ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          // These menus sit on top of clickable trip cards.
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Options for ${tripTitle}`}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-lowest/90 text-on-surface-variant shadow-sm backdrop-blur-sm transition-colors hover:bg-surface-container-high"
      >
        <span aria-hidden className="text-[18px] leading-none font-bold">
          ⋮
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-md border border-outline-variant bg-surface-container-lowest shadow-modal"
        >
          {!confirming ? (
            <>
              <Link
                role="menuitem"
                href={`/trips/${tripId}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 px-4 py-3 text-label-md text-on-surface transition-colors hover:bg-surface-container-low"
              >
                <Icon name="list_alt" size={18} />
                Edit trip
              </Link>
              <button
                role="menuitem"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirming(true);
                }}
                className="flex w-full items-center gap-2 border-t border-outline-variant px-4 py-3 text-left text-label-md text-error transition-colors hover:bg-error-container"
              >
                <Icon name="close" size={18} />
                Cancel trip
              </button>
            </>
          ) : (
            <div className="p-stack-md" onClick={(e) => e.stopPropagation()}>
              <p className="mb-stack-sm text-body-sm text-on-surface">
                Cancel {tripTitle}? Everyone you are chatting with will be told.
              </p>
              {error && (
                <p role="alert" className="mb-stack-sm text-label-sm text-error">
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelTrip}
                  disabled={pending}
                  className="flex-1 rounded-md bg-error px-3 py-2 text-label-md text-on-error transition-colors hover:opacity-90 disabled:opacity-60"
                >
                  {pending ? "Cancelling..." : "Yes, cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="flex-1 rounded-md border border-outline-variant px-3 py-2 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container"
                >
                  Keep it
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
