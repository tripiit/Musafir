import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { nudgeSchema } from "@/lib/validation";

/**
 * Resolves the meet-up nudge banner. "Dismiss" hides it; "Suggest Meetup"
 * posts a meetup message into the thread so both sides see the proposal.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { id } = await params;
  const thread = await prisma.joinRequest.findUnique({
    where: { id },
    select: { id: true, tripId: true, status: true, organizerId: true, requesterId: true },
  });

  if (
    !thread ||
    thread.status !== "accepted" ||
    (thread.organizerId !== user.id && thread.requesterId !== user.id)
  ) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = nudgeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  if (parsed.data.action === "dismiss") {
    await prisma.joinRequest.update({ where: { id }, data: { nudgeState: "dismissed" } });
    return NextResponse.json({ ok: true, message: null });
  }

  const message = await prisma.message.create({
    data: {
      joinRequestId: id,
      tripId: thread.tripId,
      senderId: user.id,
      kind: "meetup",
      content: "Suggested meeting in person at North Campus to sort out the trip details.",
    },
    include: { sender: { select: { name: true } } },
  });

  await prisma.joinRequest.update({
    where: { id },
    data: { nudgeState: "suggested", updatedAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    message: {
      id: message.id,
      content: message.content,
      kind: message.kind,
      createdAt: message.createdAt.toISOString(),
      senderId: message.senderId,
      senderName: message.sender.name,
    },
  });
}
