import { notFound } from "next/navigation";
import { ChatThread, type ChatMessage } from "@/components/chats/ChatThread";
import { requireUser } from "@/lib/auth";
import { getThread, markThreadRead } from "@/lib/queries";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const thread = await getThread(id, user.id);
  return { title: thread ? `${thread.trip.title} · Chats` : "Chat · TripMate IITM" };
}

export default async function ChatThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  // getThread returns null for a thread the viewer is not part of AND for a
  // request that is not accepted — so a guessed or pending id is a 404, never
  // a way into someone else's conversation.
  const thread = await getThread(id, user.id);
  if (!thread) notFound();

  await markThreadRead(id, user.id);

  const messages: ChatMessage[] = thread.messages.map((message) => ({
    id: message.id,
    content: message.content,
    kind: message.kind,
    createdAt: message.createdAt.toISOString(),
    senderId: message.senderId,
    senderName: message.sender.name,
  }));

  return (
    <ChatThread
      conversationId={thread.id}
      viewerId={user.id}
      otherName={thread.other.name}
      tripTitle={thread.trip.title}
      tripId={thread.trip.id}
      initialMessages={messages}
      initialNudgeState={thread.nudgeState}
    />
  );
}
