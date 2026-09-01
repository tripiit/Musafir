import { ChatList, type ChatListItem } from "@/components/chats/ChatList";
import { requireUser } from "@/lib/auth";
import { getPendingRequestCount, getThreads } from "@/lib/queries";

/**
 * Two panes on desktop, one at a time on mobile — ChatList hides itself on
 * small screens once a thread is open. Threads are accepted join requests.
 */
export default async function ChatsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [threads, pendingRequests] = await Promise.all([
    getThreads(user.id),
    getPendingRequestCount(user.id),
  ]);

  const items: ChatListItem[] = threads.map((thread) => ({
    id: thread.id,
    tripTitle: thread.trip.title,
    otherName: thread.other.name,
    updatedAt: thread.updatedAt.toISOString(),
    preview: thread.lastMessage?.content ?? null,
    fromViewer: thread.lastMessage?.fromViewer ?? false,
    unread: thread.unread,
  }));

  return (
    <div className="mx-auto flex h-[calc(100dvh-140px)] w-full max-w-[1440px] md:h-screen">
      <ChatList items={items} pendingRequests={pendingRequests} />
      {children}
    </div>
  );
}
