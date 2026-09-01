import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { recordBrowseHistory } from "@/lib/queries";
import { swipeSchema } from "@/lib/validation";

/**
 * Records a swipe.
 *
 * Right/heart sends a **join request** (status `pending`) — it deliberately
 * does NOT open a chat. Messaging unlocks only when the organizer accepts.
 * Left/x records a pass so the trip leaves this student's live deck.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = swipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { tripId, action, message } = parsed.data;
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      title: true,
      status: true,
      organizerId: true,
      organizer: { select: { name: true } },
    },
  });

  if (!trip) return NextResponse.json({ error: "That trip no longer exists." }, { status: 404 });
  if (trip.organizerId === user.id) {
    return NextResponse.json({ error: "You organize this trip." }, { status: 400 });
  }

  if (action === "pass") {
    await recordBrowseHistory(user.id, tripId, "passed");
    return NextResponse.json({ ok: true, requestStatus: null });
  }

  if (trip.status !== "open") {
    return NextResponse.json(
      { error: `This trip is ${trip.status} and is not taking requests.` },
      { status: 409 },
    );
  }

  const existing = await prisma.joinRequest.findUnique({
    where: { tripId_requesterId: { tripId, requesterId: user.id } },
    select: { id: true, status: true },
  });

  // Re-browse surfaces already-requested trips again; never let that fire a
  // duplicate request or silently reopen one the organizer declined.
  if (existing) {
    await recordBrowseHistory(user.id, tripId, "interested");
    return NextResponse.json({
      ok: true,
      duplicate: true,
      requestId: existing.id,
      requestStatus: existing.status,
    });
  }

  const joinRequest = await prisma.joinRequest.create({
    data: {
      tripId,
      requesterId: user.id,
      organizerId: trip.organizerId,
      status: "pending",
      message: message?.trim() ? message.trim() : null,
    },
    select: { id: true },
  });

  await recordBrowseHistory(user.id, tripId, "interested");

  await notify({
    userId: trip.organizerId,
    actorId: user.id,
    tripId: trip.id,
    type: "join_request_received",
    title: "New join request",
    body: `${user.name} wants to join your trip ${trip.title}.`,
    href: "/requests",
  });

  return NextResponse.json({
    ok: true,
    requestId: joinRequest.id,
    requestStatus: "pending",
    organizerName: trip.organizer.name,
  });
}
