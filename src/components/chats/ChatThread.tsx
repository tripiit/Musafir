"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { MEETUP_NUDGE_THRESHOLD } from "@/lib/constants";
import { formatMessageTime, initialsOf } from "@/lib/format";

export type ChatMessage = {
  id: string;
  content: string;
  kind: string;
  createdAt: string;
  senderId: string;
  senderName: string;
};

export function ChatThread({
  conversationId,
  viewerId,
  otherName,
  tripTitle,
  tripId,
  initialMessages,
  initialNudgeState,
}: {
  conversationId: string;
  viewerId: string;
  otherName: string;
  tripTitle: string;
  tripId: string;
  initialMessages: ChatMessage[];
  initialNudgeState: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [nudgeState, setNudgeState] = useState(initialNudgeState);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Poll for the other participant's messages. A student project does not need
  // a websocket layer; swap this for one if the thread ever gets busy.
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/chats/${conversationId}/messages`);
        if (!res.ok) return;
        const data = await res.json();
        setMessages(data.messages);
      } catch {
        // A dropped poll is not worth surfacing; the next tick retries.
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const showNudge = nudgeState === "pending" && messages.length >= MEETUP_NUDGE_THRESHOLD;

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/chats/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send that message.");
        return;
      }
      setMessages((current) => [...current, data.message]);
      setDraft("");
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setSending(false);
    }
  }

  async function resolveNudge(action: "dismiss" | "suggest") {
    setNudgeState(action === "dismiss" ? "dismissed" : "suggested");
    try {
      const res = await fetch(`/api/chats/${conversationId}/nudge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.message) setMessages((current) => [...current, data.message]);
    } catch {
      setNudgeState("pending");
    }
  }

  return (
    <section className="relative z-10 flex h-full w-full flex-1 flex-col bg-surface">
      <div className="z-10 flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest p-margin-mobile shadow-card">
        <div className="flex min-w-0 items-center">
          <Link
            href="/chats"
            aria-label="Back to chats"
            className="mr-4 rounded-full p-1 text-on-surface transition-colors hover:bg-surface-container md:hidden"
          >
            <Icon name="arrow_back" size={24} />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-heading text-headline-md text-primary">{tripTitle}</h1>
            <p className="truncate text-label-sm text-outline">with {otherName}</p>
          </div>
        </div>
        <Link
          href={`/trips/${tripId}`}
          aria-label="Trip details"
          className="rounded-full p-2 text-primary transition-colors hover:bg-surface-container"
        >
          <Icon name="info" size={24} />
        </Link>
      </div>

      {showNudge && (
        <div className="mx-margin-mobile mt-stack-md flex shrink-0 flex-col items-center justify-between rounded-lg border border-secondary-fixed-dim bg-secondary-fixed p-stack-md text-on-secondary-fixed shadow-card sm:flex-row">
          <div className="mb-4 flex items-center sm:mb-0">
            <Icon name="location_on" size={24} filled className="mr-3 shrink-0 text-secondary" />
            <p className="text-body-sm">
              You have been chatting about {tripTitle} — want to suggest meeting up in person at
              North Campus?
            </p>
          </div>
          <div className="flex shrink-0 space-x-2">
            <button
              type="button"
              onClick={() => resolveNudge("dismiss")}
              className="rounded-md bg-surface-container-lowest px-4 py-2 text-label-md text-on-surface shadow-sm transition-colors hover:bg-surface-container"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => resolveNudge("suggest")}
              className="rounded-md bg-primary px-4 py-2 text-label-md text-on-primary shadow-sm transition-colors hover:bg-tertiary"
            >
              Suggest Meetup
            </button>
          </div>
        </div>
      )}

      <div className="no-scrollbar flex-1 space-y-stack-md overflow-y-auto p-margin-mobile">
        {messages.length === 0 && (
          <p className="mt-stack-lg text-center text-body-sm text-on-surface-variant">
            Say hello and ask about the plan.
          </p>
        )}

        {messages.map((message) => {
          if (message.kind === "meetup") {
            return (
              <div key={message.id} className="my-stack-md flex justify-center">
                <span className="flex items-center gap-1 rounded-full bg-secondary-fixed px-3 py-1 text-label-sm text-on-secondary-fixed">
                  <Icon name="location_on" size={14} filled />
                  {message.senderId === viewerId ? "You" : message.senderName} suggested meeting in
                  person
                </span>
              </div>
            );
          }

          const mine = message.senderId === viewerId;
          if (mine) {
            return (
              <div key={message.id} className="flex items-end justify-end">
                <div className="max-w-[80%] sm:max-w-[70%]">
                  <div className="rounded-2xl rounded-tr-none bg-primary p-3 text-on-primary shadow-card">
                    <p className="text-body-sm break-words">{message.content}</p>
                  </div>
                  <span className="mt-1 mr-1 block text-right text-label-sm text-outline">
                    You · {formatMessageTime(new Date(message.createdAt))}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div key={message.id} className="flex items-start">
              <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-label-md text-on-secondary-container">
                {initialsOf(message.senderName)}
              </span>
              <div className="max-w-[80%] sm:max-w-[70%]">
                <div className="rounded-2xl rounded-tl-none bg-surface-container-lowest p-3 text-on-surface shadow-card">
                  <p className="text-body-sm break-words">{message.content}</p>
                </div>
                <span className="mt-1 ml-1 block text-label-sm text-outline">
                  {message.senderName} · {formatMessageTime(new Date(message.createdAt))}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="px-margin-mobile pb-stack-xs text-label-sm text-error">
          {error}
        </p>
      )}

      <form
        onSubmit={send}
        className="shrink-0 border-t border-outline-variant bg-surface-container-lowest p-margin-mobile"
      >
        <div className="flex items-center space-x-2">
          <div className="flex flex-1 items-center rounded-full bg-surface-container-low px-4 py-2 transition-all focus-within:bg-surface-container-lowest focus-within:ring-1 focus-within:ring-primary">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              aria-label="Message"
              className="w-full flex-1 border-none bg-transparent p-0 text-body-sm text-on-surface outline-none focus:ring-0"
            />
          </div>
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            aria-label="Send message"
            className="shrink-0 rounded-full bg-primary p-2 text-on-primary shadow-card transition-colors hover:bg-tertiary disabled:opacity-50"
          >
            <Icon name="send" size={24} filled />
          </button>
        </div>
      </form>
    </section>
  );
}
