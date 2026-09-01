"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatChatTimestamp, initialsOf } from "@/lib/format";

export type ChatListItem = {
  id: string;
  tripTitle: string;
  otherName: string;
  updatedAt: string;
  preview: string | null;
  fromViewer: boolean;
  unread: boolean;
};

/**
 * Sidebar on md+, full screen on mobile. The parent decides which of the two
 * panes is visible on small screens.
 */
export function ChatList({
  items,
  pendingRequests = 0,
}: {
  items: ChatListItem[];
  /** Drives the Requests tab badge — the entry point to /requests. */
  pendingRequests?: number;
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  // Mobile shows one pane at a time: the list at /chats, the thread at /chats/[id].
  const isIndex = pathname === "/chats";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.tripTitle.toLowerCase().includes(q) || item.otherName.toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <aside
      className={`h-full w-full flex-col border-r border-outline-variant bg-surface-container-low md:flex md:w-80 md:shrink-0 lg:w-96 ${
        isIndex ? "flex" : "hidden"
      }`}
    >
      {/* Entry point to /requests, per the spec: a badge here rather than a
          sixth item in the bottom nav. */}
      <Link
        href="/requests"
        className="flex items-center justify-between gap-2 border-b border-outline-variant bg-surface-container-lowest px-margin-mobile py-3 transition-colors hover:bg-surface-container-low"
      >
        <span className="flex items-center gap-2 text-label-md text-primary">
          <Icon name="person" size={18} />
          Requests
        </span>
        {pendingRequests > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary-container px-1.5 text-label-sm text-on-secondary-container">
            {pendingRequests}
          </span>
        ) : (
          <Icon name="arrow_forward" size={16} className="text-outline" />
        )}
      </Link>

      <div className="border-b border-outline-variant bg-surface-container-lowest p-margin-mobile">
        <div className="flex items-center rounded-full bg-surface-container px-4 py-2 transition-all focus-within:bg-surface-container-lowest focus-within:ring-1 focus-within:ring-primary">
          <Icon name="search" size={20} className="mr-2 text-outline" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats..."
            aria-label="Search chats"
            className="w-full flex-1 border-none bg-transparent p-0 text-body-sm text-on-surface outline-none focus:ring-0"
          />
        </div>
      </div>

      <div className="no-scrollbar flex-1 space-y-stack-xs overflow-y-auto p-stack-sm">
        {filtered.length === 0 && (
          <p className="p-stack-md text-center text-body-sm text-on-surface-variant">
            {items.length === 0
              ? "No chats yet. Chat opens once an organizer accepts your request."
              : "No chats match that search."}
          </p>
        )}

        {filtered.map((item) => {
          const active = pathname === `/chats/${item.id}`;
          return (
            <Link
              key={item.id}
              href={`/chats/${item.id}`}
              aria-current={active ? "page" : undefined}
              className={`block rounded-md p-stack-md transition-shadow ${
                active
                  ? "border-l-4 border-primary bg-surface-container-lowest shadow-card"
                  : "hover:bg-surface-container"
              }`}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3
                  className={`truncate text-label-md ${active ? "text-primary" : "text-on-surface"}`}
                >
                  {item.tripTitle}
                </h3>
                <span className="shrink-0 text-label-sm text-outline">
                  {formatChatTimestamp(new Date(item.updatedAt))}
                </span>
              </div>
              <p className="truncate text-body-sm text-on-surface-variant">
                {item.preview
                  ? `${item.fromViewer ? "You" : item.otherName}: ${item.preview}`
                  : `New thread with ${item.otherName}`}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary-container text-[10px] text-on-secondary-container">
                  {initialsOf(item.otherName)}
                </span>
                <span className="text-label-sm text-outline">{item.otherName}</span>
                {item.unread && (
                  <span
                    aria-label="Unread"
                    className="ml-auto h-2 w-2 rounded-full bg-secondary-container"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
