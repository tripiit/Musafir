import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { EDITABLE_STATUSES, type TripStatus } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { serializeModes } from "@/lib/format";
import { announceTripChange, describeMaterialChanges } from "@/lib/trip-changes";
import { updateTripSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

/** Edit a trip. Only its organizer may, and only while it is still live. */
export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.trip.findUnique({
    where: { id },
    include: { stops: { orderBy: { position: "asc" }, select: { location: true, arrivalDate: true } } },
  });

  // Same 404 whether the trip is missing or someone else's, so this cannot be
  // used to probe for trip ids.
  if (!existing || existing.organizerId !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (!EDITABLE_STATUSES.includes(existing.status as TripStatus)) {
    return NextResponse.json(
      { error: `A ${existing.status} trip can no longer be edited.` },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = updateTripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const input = parsed.data;
  const existingStops = existing.stops;
  const departureDate = input.departureDate ? new Date(input.departureDate) : null;
  const returnDate = input.returnDate ? new Date(input.returnDate) : null;
  if (departureDate && Number.isNaN(departureDate.getTime())) {
    return NextResponse.json({ error: "That departure date is not valid." }, { status: 400 });
  }
  if (returnDate && Number.isNaN(returnDate.getTime())) {
    return NextResponse.json({ error: "That return date is not valid." }, { status: 400 });
  }

  const after = {
    departureDate,
    departureLocation: input.departureLocation?.trim() || null,
    returnDate,
    returnLocation: input.returnLocation?.trim() || null,
    travelModes: serializeModes(input.travelModes),
  };
  const changes = describeMaterialChanges(
    { ...existing, stops: existingStops },
    { ...after, stops: input.stops.map((s) => ({ location: s.location, arrivalDate: s.arrivalDate ? new Date(s.arrivalDate) : null })) },
  );

  await prisma.$transaction([
    prisma.trip.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        groupSizeMax: input.groupSizeFlexible ? null : input.groupSizeMax,
        groupSizeFlexible: input.groupSizeFlexible,
        ...after,
      },
    }),
    // Stops and images are replaced wholesale: the form always submits the
    // full ordered set, so position stays in sync with what was shown.
    prisma.tripStop.deleteMany({ where: { tripId: id } }),
    prisma.tripStop.createMany({
      data: input.stops.map((stop, position) => ({
        tripId: id,
        location: stop.location,
        arrivalDate: stop.arrivalDate ? new Date(stop.arrivalDate) : null,
        position,
      })),
    }),
    prisma.tripImage.deleteMany({ where: { tripId: id } }),
    prisma.tripImage.createMany({
      data: input.images.map((image, position) => ({
        tripId: id,
        url: image.url,
        alt: image.alt,
        position,
      })),
    }),
  ]);

  let notified = 0;
  if (changes.length > 0) {
    const result = await announceTripChange({
      tripId: id,
      organizerId: user.id,
      organizerName: user.name,
      tripTitle: input.title,
      type: "trip_updated",
      summary: `${user.name} updated ${input.title}: ${changes.join(", ")}.`,
    });
    notified = result.notified;
  }

  return NextResponse.json({ id, notified, changes });
}

/**
 * Cancel a trip. Sets status rather than deleting, so existing threads and
 * everyone's browse history still resolve to a real trip.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.trip.findUnique({ where: { id } });
  if (!existing || existing.organizerId !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (existing.status === "cancelled") {
    return NextResponse.json({ ok: true, alreadyCancelled: true });
  }
  if (!EDITABLE_STATUSES.includes(existing.status as TripStatus)) {
    return NextResponse.json(
      { error: `A ${existing.status} trip can no longer be cancelled.` },
      { status: 409 },
    );
  }

  await prisma.trip.update({ where: { id }, data: { status: "cancelled" } });

  const result = await announceTripChange({
    tripId: id,
    organizerId: user.id,
    organizerName: user.name,
    tripTitle: existing.title,
    type: "trip_cancelled",
    summary: `${user.name} cancelled ${existing.title}.`,
  });

  return NextResponse.json({ ok: true, notified: result.notified });
}
