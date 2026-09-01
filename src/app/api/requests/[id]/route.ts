import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { respondToRequestSchema } from "@/lib/validation";

/**
 * The organizer accepts or declines a join request.
 *
 * Accepting is what unlocks the 1:1 chat thread — the accepted request *is*
 * the thread, so no separate conversation record is created.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { id } = await params;
  const joinRequest = await prisma.joinRequest.findUnique({
    where: { id },
    include: {
      trip: { select: { id: true, title: true, status: true } },
      requester: { select: { id: true, name: true } },
    },
  });

  // Same 404 for missing and not-yours, so this cannot probe for request ids.
  if (!joinRequest || joinRequest.organizerId !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (joinRequest.status !== "pending") {
    return NextResponse.json(
      { error: `You already ${joinRequest.status} this request.` },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = respondToRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const accepted = parsed.data.action === "accept";
  await prisma.joinRequest.update({
    where: { id },
    data: {
      status: accepted ? "accepted" : "declined",
      respondedAt: new Date(),
    },
  });

  await notify({
    userId: joinRequest.requesterId,
    actorId: user.id,
    tripId: joinRequest.tripId,
    type: accepted ? "join_request_accepted" : "join_request_declined",
    title: accepted ? "Request accepted" : "Request declined",
    body: accepted
      ? `${user.name} accepted your request for ${joinRequest.trip.title} — you can now chat.`
      : `${user.name} declined your request for ${joinRequest.trip.title}.`,
    // Declined requests have no thread to link to.
    href: accepted ? `/chats/${id}` : `/trips/${joinRequest.tripId}`,
  });

  return NextResponse.json({
    ok: true,
    status: accepted ? "accepted" : "declined",
    threadId: accepted ? id : null,
  });
}
