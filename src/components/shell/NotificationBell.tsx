"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { NotificationType } from "@/lib/constants";
import { formatChatTimestamp } from "@/lib/format";

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  read: boolean;
};

const TYPE_ICON: Record<NotificationType, IconName> = {
  join_request_received: "person",
  join_request_accepted: "check_circle",
  join_request_declined: "close",
  trip_updated: "edit",
  trip_cancelled: "cancel",
};

/**
 * The bell in the top app bar. This is the only channel that reaches someone
 * with a pending join request, who has no chat thread yet.
 */
export function NotificationBell({ initialUnread = 0 }: { initialUnread?: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items);
      setUnread(data.unreadCount);
    } catch {
      // A failed poll is not worth surfacing; the next one retries.
    } finally {
      setLoading(false);
    }
  }, []);

  // Light polling so a request that arrives while the tab is open still shows.
  useEffect(() => {
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) await load();
  }

  async function markAllRead() {
    setUnread(0);
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {});
    router.refresh();
  }

  async function openItem(item: NotificationItem) {
    setOpen(false);
    if (!item.read) {
      setUnread((n) => Math.max(0, n - 1));
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [item.id] }),
      }).catch(() => {});
    }
    router.push(item.href);
    router.refresh();
  }

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative rounded-full p-2 text-primary transition-colors duration-200 hover:bg-surface-container-high active:scale-95"
      >
        <Icon name="notifications" size={24} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-on-error">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-modal"
        >
          <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
            <span className="font-heading text-headline-md text-primary">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-label-sm text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading && items.length === 0 && (
              <p className="p-4 text-center text-body-sm text-on-surface-variant">Loading…</p>
            )}
            {!loading && items.length === 0 && (
              <p className="p-4 text-center text-body-sm text-on-surface-variant">
                Nothing yet. Join requests and trip changes show up here.
              </p>
            )}

            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={() => openItem(item)}
                className={`flex w-full items-start gap-3 border-b border-outline-variant px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-container-low ${
                  item.read ? "" : "bg-primary-fixed/20"
                }`}
              >
                <span className="mt-0.5 shrink-0 text-primary">
                  <Icon name={TYPE_ICON[item.type] ?? "notifications"} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-label-md text-on-surface">{item.title}</span>
                    <span className="shrink-0 text-label-sm text-outline">
                      {formatChatTimestamp(new Date(item.createdAt))}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-body-sm text-on-surface-variant">
                    {item.body}
                  </span>
                </span>
                {!item.read && (
                  <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary-container" />
                )}
              </button>
            ))}
          </div>

          <Link
            href="/requests"
            onClick={() => setOpen(false)}
            className="block border-t border-outline-variant px-4 py-3 text-center text-label-md text-primary transition-colors hover:bg-surface-container-low"
          >
            View all requests
          </Link>
        </div>
      )}
    </div>
  );
}
