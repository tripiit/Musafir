import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { markThreadRead } from "@/lib/queries";
import { sendMessageSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

/**
 * A thread id is an accepted JoinRequest id. This is the single gate for chat
 * access: the caller must be one of the two participants AND the request must
 * be accepted. Pending and declined requests have no chat.
 */
async function authorize(threadId: string, userId: string) {
  const request = await prisma.joinRequest.findUnique({
    where: { id: threadId },
    select: { id: true, tripId: true, status: true, organizerId: true, requesterId: true },
  });
  if (!request) return null;
  if (request.status !== "accepted") return null;
  if (request.organizerId !== userId && request.requesterId !== userId) return null;
  return request;
}

export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { id } = await params;
  const thread = await authorize(id, user.id);
  if (!thread) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { joinRequestId: id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true } } },
  });

  await markThreadRead(id, user.id);

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      kind: m.kind,
      createdAt: m.createdAt.toISOString(),
      senderId: m.senderId,
      senderName: m.sender.name,
    })),
  });
}

export async function POST(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { id } = await params;
  const thread = await authorize(id, user.id);
  if (!thread) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      joinRequestId: id,
      tripId: thread.tripId,
      senderId: user.id,
      content: parsed.data.content,
    },
    include: { sender: { select: { name: true } } },
  });

  // Keeps the chat list ordered by real activity.
  await prisma.joinRequest.update({ where: { id }, data: { updatedAt: new Date() } });
  await markThreadRead(id, user.id);

  return NextResponse.json(
    {
      message: {
        id: message.id,
        content: message.content,
        kind: message.kind,
        createdAt: message.createdAt.toISOString(),
        senderId: message.senderId,
        senderName: message.sender.name,
      },
    },
    { status: 201 },
  );
}
