import "server-only";
import { prisma } from "./db";
import { TRAVEL_MODE_LABELS, type TravelMode } from "./constants";
import { formatTripDate, formatTripDuration, planLocation } from "./format";
import { notifyMany } from "./notifications";

type TripSnapshot = {
  departureDate: Date | null;
  departureLocation: string | null;
  returnDate: Date | null;
  returnLocation: string | null;
  travelModes: string;
  stops: { location: string; arrivalDate: Date | null }[];
};

/** Compact comparable form: order matters, and so do each stop's dates. */
function stopsFingerprint(stops: TripSnapshot["stops"]) {
  return stops
    .map((s) => `${s.location}@${s.arrivalDate ? s.arrivalDate.toISOString().slice(0, 10) : ""}`)
    .join(" > ");
}

/**
 * Only changes that affect whether someone can still make the trip count as
 * material. Retitling or rewording the description does not interrupt anyone.
 *
 * Duration is not compared directly — it is derived from the two dates, so a
 * duration change is always already reported as a date change.
 */
export function describeMaterialChanges(before: TripSnapshot, after: TripSnapshot): string[] {
  const changes: string[] = [];

  const beforeDeparture = before.departureDate?.getTime() ?? null;
  const afterDeparture = after.departureDate?.getTime() ?? null;
  if (beforeDeparture !== afterDeparture) {
    changes.push(`departure is now ${formatTripDate(after.departureDate)}`);
  }

  const beforeReturn = before.returnDate?.getTime() ?? null;
  const afterReturn = after.returnDate?.getTime() ?? null;
  if (beforeReturn !== afterReturn) {
    changes.push(
      `the return is now ${formatTripDate(after.returnDate)}` +
        ` (${formatTripDuration(after.departureDate, after.returnDate)})`,
    );
  }

  if ((before.departureLocation ?? "") !== (after.departureLocation ?? "")) {
    changes.push(`departure is now from ${planLocation(after.departureLocation)}`);
  }

  if ((before.returnLocation ?? "") !== (after.returnLocation ?? "")) {
    changes.push(`the return is now to ${planLocation(after.returnLocation)}`);
  }

  if (before.travelModes !== after.travelModes) {
    const labels = after.travelModes
      .split(",")
      .filter(Boolean)
      .map((mode) => TRAVEL_MODE_LABELS[mode as TravelMode] ?? mode)
      .join(", ");
    changes.push(`the mode of travel is now ${labels}`);
  }

  // Where the trip actually goes — a changed, added, removed or reordered stop
  // all matter to someone deciding whether they can still come.
  if (stopsFingerprint(before.stops) !== stopsFingerprint(after.stops)) {
    changes.push(`the route is now ${after.stops.map((s) => s.location).join(" → ")}`);
  }

  return changes;
}

/**
 * Announces a trip change to everyone with a live stake in it.
 *
 * Two channels, because chat is accept-gated: accepted members get a system
 * message in the thread they are already coordinating in, while *pending*
 * requesters have no thread at all and can only be reached through the bell.
 * Everyone with a live request gets a notification either way.
 */
export async function announceTripChange({
  tripId,
  organizerId,
  organizerName,
  tripTitle,
  type,
  summary,
}: {
  tripId: string;
  organizerId: string;
  organizerName: string;
  tripTitle: string;
  type: "trip_updated" | "trip_cancelled";
  summary: string;
}) {
  const requests = await prisma.joinRequest.findMany({
    where: { tripId, status: { in: ["pending", "accepted"] } },
    select: { id: true, status: true, requesterId: true },
  });
  if (requests.length === 0) return { threads: 0, notified: 0 };

  const accepted = requests.filter((r) => r.status === "accepted");

  if (accepted.length > 0) {
    const now = new Date();
    await prisma.$transaction([
      prisma.message.createMany({
        data: accepted.map((request) => ({
          joinRequestId: request.id,
          tripId,
          // Attributed to the organizer, who made the change.
          senderId: organizerId,
          kind: "system",
          content: summary,
        })),
      }),
      // Bumps each thread up the chat list so the change is actually noticed.
      prisma.joinRequest.updateMany({
        where: { id: { in: accepted.map((r) => r.id) } },
        data: { updatedAt: now },
      }),
    ]);
  }

  const notified = await notifyMany(
    requests.map((request) => ({
      userId: request.requesterId,
      actorId: organizerId,
      tripId,
      type,
      title: type === "trip_cancelled" ? "Trip cancelled" : "Trip updated",
      body: summary,
      href:
        request.status === "accepted" ? `/chats/${request.id}` : `/trips/${tripId}`,
    })),
  );

  return { threads: accepted.length, notified, organizerName, tripTitle };
}
