"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/lib/constants";
import { formatChatTimestamp, formatTripDate, initialsOf } from "@/lib/format";

export type RequestItem = {
  id: string;
  status: RequestStatus;
  message: string | null;
  createdAt: string;
  person: {
    id: string;
    name: string;
    age: number | null;
    branch: string | null;
    batchYear: number | null;
    photoUrl: string | null;
    bio: string | null;
  };
  trip: {
    id: string;
    title: string;
    destination: string;
    departureDate: string | null;
    status: string;
  };
};

const STATUS_CLASS: Record<RequestStatus, string> = {
  pending: "bg-secondary-container/15 text-on-secondary-container",
  accepted: "bg-success/10 text-success",
  declined: "bg-surface-container-high text-on-surface-variant",
};

export function RequestList({
  received,
  sent,
}: {
  received: RequestItem[];
  sent: RequestItem[];
}) {
  const [tab, setTab] = useState<"received" | "sent">(
    // Land on whichever tab has something to act on.
    received.some((r) => r.status === "pending") || received.length > 0 ? "received" : "sent",
  );

  const items = tab === "received" ? received : sent;
  const pendingCount = received.filter((r) => r.status === "pending").length;

  return (
    <>
      <div
        role="tablist"
        aria-label="Requests"
        className="flex gap-stack-sm border-b border-outline-variant"
      >
        <TabButton
          active={tab === "received"}
          onClick={() => setTab("received")}
          label="Received"
          count={pendingCount}
        />
        <TabButton active={tab === "sent"} onClick={() => setTab("sent")} label="Sent" />
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest p-stack-lg text-center text-body-sm text-on-surface-variant">
          {tab === "received"
            ? "No one has asked to join your trips yet."
            : "You have not requested to join any trips yet. Swipe right in Browse to send one."}
        </p>
      ) : (
        <ul className="space-y-stack-md">
          {items.map((item) => (
            <RequestRow key={item.id} item={item} incoming={tab === "received"} />
          ))}
        </ul>
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count = 0,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-label-md transition-colors ${
        active
          ? "border-b-2 border-primary text-primary"
          : "text-on-surface-variant hover:text-on-surface"
      }`}
    >
      {label}
      {count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary-container px-1.5 text-label-sm text-on-secondary-container">
          {count}
        </span>
      )}
    </button>
  );
}

function RequestRow({ item, incoming }: { item: RequestItem; incoming: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<RequestStatus>(item.status);
  const [pending, setPending] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(action: "accept" | "decline") {
    setPending(action);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${item.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not respond to that request.");
        return;
      }
      setStatus(data.status);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setPending(null);
    }
  }

  const person = item.person;
  const personLine =
    [person.branch, person.batchYear && `Batch of ${person.batchYear}`, person.age && `${person.age}`]
      .filter(Boolean)
      .join(" · ") || "IIT Mandi student";

  return (
    <li className="rounded-lg border border-surface-container-highest bg-surface-container-lowest p-stack-md shadow-card">
      <div className="flex items-start gap-stack-md">
        <span className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-surface-variant">
          {person.photoUrl ? (
            <Image
              src={person.photoUrl}
              alt=""
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-primary-container font-heading text-headline-md text-on-primary-container">
              {initialsOf(person.name)}
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-heading text-headline-md text-primary">{person.name}</p>
            <span className="text-label-sm text-outline">
              {formatChatTimestamp(new Date(item.createdAt))}
            </span>
          </div>
          <p className="text-label-sm text-on-surface-variant">{personLine}</p>

          <p className="mt-stack-sm text-body-sm text-on-surface">
            {incoming ? "Wants to join" : "You asked to join"}{" "}
            <Link href={`/trips/${item.trip.id}`} className="text-primary hover:underline">
              {item.trip.title}
            </Link>{" "}
            <span className="text-on-surface-variant">
              · {item.trip.destination} · {formatTripDate(item.trip.departureDate ? new Date(item.trip.departureDate) : null)}
            </span>
          </p>

          {item.message && (
            <p className="mt-stack-sm rounded-md bg-surface-container-low p-3 text-body-sm text-on-surface">
              “{item.message}”
            </p>
          )}

          {person.bio && incoming && (
            <p className="mt-stack-sm text-body-sm text-on-surface-variant">{person.bio}</p>
          )}

          {error && (
            <p role="alert" className="mt-stack-sm text-label-sm text-error">
              {error}
            </p>
          )}

          <div className="mt-stack-md flex flex-wrap items-center gap-2">
            {incoming && status === "pending" ? (
              <>
                <button
                  type="button"
                  onClick={() => respond("accept")}
                  disabled={pending !== null}
                  className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-label-md text-on-primary transition-colors hover:bg-primary-container disabled:opacity-60"
                >
                  <Icon name="check_circle" size={16} />
                  {pending === "accept" ? "Accepting…" : "Accept"}
                </button>
                <button
                  type="button"
                  onClick={() => respond("decline")}
                  disabled={pending !== null}
                  className="flex items-center gap-1 rounded-md border border-outline-variant px-4 py-2 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-60"
                >
                  <Icon name="close" size={16} />
                  {pending === "decline" ? "Declining…" : "Decline"}
                </button>
              </>
            ) : (
              <span className={`rounded-full px-3 py-1 text-label-sm ${STATUS_CLASS[status]}`}>
                {incoming
                  ? status === "accepted"
                    ? "Accepted"
                    : "Declined"
                  : REQUEST_STATUS_LABELS[status]}
              </span>
            )}

            {status === "accepted" && (
              <Link
                href={`/chats/${item.id}`}
                className="flex items-center gap-1 rounded-md bg-secondary-container px-4 py-2 text-label-md text-on-secondary-container transition-colors hover:bg-secondary-fixed-dim"
              >
                <Icon name="chat_bubble" size={16} />
                Open chat
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
