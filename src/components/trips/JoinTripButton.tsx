"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { REQUEST_NOTE_MAX, type RequestStatus } from "@/lib/constants";

/**
 * "Request to Join" rather than "Book a Seat": free coordination, no money.
 *
 * Sending a request does NOT open a chat — messaging unlocks only once the
 * organizer accepts, so this button never links straight to a thread while the
 * request is still pending.
 */
export function JoinTripButton({
  tripId,
  organizerName,
  status,
  threadId,
}: {
  tripId: string;
  organizerName: string;
  status: RequestStatus | null;
  threadId: string | null;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<RequestStatus | null>(status);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (current === "accepted" && threadId) {
    return (
      <Link
        href={`/chats/${threadId}`}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-secondary-container py-3 text-label-md text-on-secondary-container shadow-card transition-all hover:bg-secondary-fixed-dim active:scale-[0.98]"
      >
        <Icon name="chat_bubble" size={18} />
        Message {organizerName}
      </Link>
    );
  }

  if (current === "pending") {
    return (
      <div className="w-full space-y-stack-sm">
        <p className="flex items-center justify-center gap-2 rounded-md border border-outline-variant bg-surface-container px-4 py-3 text-label-md text-on-surface-variant">
          <Icon name="check_circle" size={18} />
          Request Sent
        </p>
        <p className="text-center text-label-sm text-on-surface-variant">
          You can message {organizerName} once they accept.
        </p>
      </div>
    );
  }

  if (current === "declined") {
    return (
      <p className="w-full rounded-md border border-outline-variant bg-surface-container px-4 py-3 text-center text-label-md text-on-surface-variant">
        {organizerName} declined this request.
      </p>
    );
  }

  async function send() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          action: "interested",
          ...(note.trim() ? { message: note.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send your request.");
        return;
      }
      setCurrent(data.requestStatus ?? "pending");
      setShowNote(false);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full space-y-stack-sm">
      {showNote && (
        <div>
          <label htmlFor="join-note" className="mb-stack-xs block text-label-sm text-on-surface">
            Add a note (optional)
          </label>
          <textarea
            id="join-note"
            rows={3}
            maxLength={REQUEST_NOTE_MAX}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`Tell ${organizerName} a bit about yourself.`}
            className="w-full resize-none rounded-md border border-surface-dim bg-surface px-4 py-3 text-body-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
          <p className="mt-stack-xs text-right text-label-sm text-outline">
            {note.length}/{REQUEST_NOTE_MAX}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={showNote ? send : () => setShowNote(true)}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-secondary-container py-3 text-label-md text-on-secondary-container shadow-card transition-all hover:bg-secondary-fixed-dim active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? (
          <>
            <Icon name="progress_activity" size={18} className="animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Icon name="favorite" size={18} />
            {showNote ? "Send Request" : "Request to Join"}
          </>
        )}
      </button>

      {showNote && !pending && (
        <button
          type="button"
          onClick={() => setShowNote(false)}
          className="w-full rounded-md py-2 text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container"
        >
          Cancel
        </button>
      )}

      {error && (
        <p role="alert" className="text-label-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
