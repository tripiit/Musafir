import "server-only";
import { prisma } from "./db";
import { DECK_EXCLUDING_DECISIONS, type BrowseDecision, type RequestStatus } from "./constants";
import { parseModes, spotsLeft } from "./format";

/** Fields every trip card needs, in one shape. */
const tripCardSelect = {
  id: true,
  title: true,
  departureDate: true,
  departureLocation: true,
  returnDate: true,
  returnLocation: true,
  groupSizeMax: true,
  groupSizeFlexible: true,
  travelModes: true,
  description: true,
  status: true,
  organizerId: true,
  organizer: { select: { id: true, name: true, branch: true, batchYear: true, photoUrl: true } },
  images: { orderBy: { position: "asc" }, select: { url: true, alt: true } },
  stops: { orderBy: { position: "asc" }, select: { id: true, location: true, arrivalDate: true } },
  // Only accepted requests count towards the group — pending ones have not
  // been agreed to by the organizer yet.
  joinRequests: { where: { status: "accepted" }, select: { id: true } },
} as const;

type RawTripCard = Awaited<
  ReturnType<typeof prisma.trip.findFirstOrThrow<{ select: typeof tripCardSelect }>>
>;

export type TripCardData = ReturnType<typeof toTripCard>;

function toTripCard(trip: RawTripCard) {
  const accepted = trip.joinRequests.length;
  return {
    id: trip.id,
    title: trip.title,
    stops: trip.stops,
    departureDate: trip.departureDate,
    departureLocation: trip.departureLocation,
    returnDate: trip.returnDate,
    returnLocation: trip.returnLocation,
    description: trip.description,
    status: trip.status,
    organizer: trip.organizer,
    images: trip.images,
    modes: parseModes(trip.travelModes),
    joinedCount: accepted,
    spots: spotsLeft(trip.groupSizeMax, trip.groupSizeFlexible, accepted),
  };
}

export async function getDashboardData(userId: string) {
  const [organized, liked, threads] = await Promise.all([
    prisma.trip.findMany({
      where: { organizerId: userId, status: { not: "completed" } },
      select: tripCardSelect,
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    // "Liked Trips" = everything this student has requested to join. Declined
    // requests are dropped rather than lingering greyed-out (§10.2).
    prisma.joinRequest.findMany({
      where: { requesterId: userId, status: { in: ["pending", "accepted"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, status: true, trip: { select: tripCardSelect } },
    }),
    getThreads(userId, 4),
  ]);

  return {
    organized: organized.map(toTripCard),
    liked: liked.map((request) => ({
      requestId: request.id,
      status: request.status as RequestStatus,
      trip: toTripCard(request.trip),
    })),
    threads,
  };
}

export type DeckTrip = TripCardData & {
  /** Set when the viewer has already requested this trip (re-browse mode). */
  requestStatus: RequestStatus | null;
};

/**
 * The browse deck: every open trip by anyone other than the viewer — never
 * scoped to branch, batch or any social graph (§9.4).
 *
 * `includeDecided` powers "Re-browse Trips": it lifts the exclusion filter so
 * previously passed/requested trips reappear, without deleting any history or
 * request records. Already-requested trips come back carrying their status so
 * the UI can show a badge instead of letting a duplicate request through.
 */
export async function getBrowseDeck(
  userId: string,
  { includeDecided = false, limit = 30 }: { includeDecided?: boolean; limit?: number } = {},
) {
  const trips = await prisma.trip.findMany({
    where: {
      status: "open",
      organizerId: { not: userId },
      ...(includeDecided
        ? {}
        : {
            // A decision moves a trip out of the live deck; it stays reachable
            // in /browse/history. A plain 'viewed' entry does not remove it.
            browseHistory: { none: { userId, decision: { in: DECK_EXCLUDING_DECISIONS } } },
          }),
    },
    select: tripCardSelect,
    orderBy: [{ departureDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    take: limit,
  });

  // Fetched separately: Prisma cannot filter a relation by the viewer inside a
  // shared `select` constant without duplicating the whole shape.
  const requests = await prisma.joinRequest.findMany({
    where: { requesterId: userId, tripId: { in: trips.map((t) => t.id) } },
    select: { tripId: true, status: true },
  });
  const byTrip = new Map(requests.map((r) => [r.tripId, r.status as RequestStatus]));

  return trips.map((trip): DeckTrip => ({
    ...toTripCard(trip),
    requestStatus: byTrip.get(trip.id) ?? null,
  }));
}

export async function getTripDetail(tripId: string, viewerId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      organizer: true,
      images: { orderBy: { position: "asc" } },
      stops: { orderBy: { position: "asc" } },
      joinRequests: { select: { id: true, requesterId: true, status: true } },
    },
  });

  if (!trip) return null;

  const accepted = trip.joinRequests.filter((r) => r.status === "accepted").length;
  const viewerRequest = trip.joinRequests.find((r) => r.requesterId === viewerId) ?? null;

  const previousTrips = await prisma.trip.findMany({
    where: { organizerId: trip.organizerId, status: "completed" },
    select: {
      id: true,
      title: true,
      departureDate: true,
      stops: { orderBy: { position: "asc" }, take: 1, select: { location: true } },
    },
    orderBy: { departureDate: "desc" },
    take: 3,
  });

  return {
    trip,
    modes: parseModes(trip.travelModes),
    joinedCount: accepted,
    spots: spotsLeft(trip.groupSizeMax, trip.groupSizeFlexible, accepted),
    isOrganizer: trip.organizerId === viewerId,
    viewerRequest: viewerRequest
      ? { id: viewerRequest.id, status: viewerRequest.status as RequestStatus }
      : null,
    previousTrips,
    // Chat is gated: a thread id is only handed out once the request is accepted.
    threadId: viewerRequest?.status === "accepted" ? viewerRequest.id : null,
    pendingCount: trip.joinRequests.filter((r) => r.status === "pending").length,
  };
}

export type ThreadSummary = Awaited<ReturnType<typeof getThreads>>[number];

/** Chat threads = accepted join requests the viewer is one half of. */
export async function getThreads(userId: string, take?: number) {
  const rows = await prisma.joinRequest.findMany({
    where: {
      status: "accepted",
      OR: [{ organizerId: userId }, { requesterId: userId }],
    },
    orderBy: { updatedAt: "desc" },
    take,
    include: {
      trip: {
        select: {
          id: true,
          title: true,
          status: true,
          stops: { orderBy: { position: "asc" }, select: { location: true } },
        },
      },
      organizer: { select: { id: true, name: true, photoUrl: true } },
      requester: { select: { id: true, name: true, photoUrl: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return rows.map((row) => {
    const viewerIsOrganizer = row.organizerId === userId;
    const other = viewerIsOrganizer ? row.requester : row.organizer;
    const lastMessage = row.messages[0] ?? null;
    const lastReadAt = viewerIsOrganizer ? row.organizerLastReadAt : row.requesterLastReadAt;

    return {
      id: row.id,
      trip: row.trip,
      other,
      viewerIsOrganizer,
      updatedAt: row.updatedAt,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            fromViewer: lastMessage.senderId === userId,
            kind: lastMessage.kind,
          }
        : null,
      unread: Boolean(
        lastMessage &&
          lastMessage.senderId !== userId &&
          (!lastReadAt || lastMessage.createdAt > lastReadAt),
      ),
    };
  });
}

/**
 * A thread is readable only by its two participants, and only once the request
 * behind it is accepted — a pending or declined request has no chat.
 */
export async function getThread(threadId: string, userId: string) {
  const request = await prisma.joinRequest.findUnique({
    where: { id: threadId },
    include: {
      trip: {
        select: {
          id: true,
          title: true,
          status: true,
          stops: { orderBy: { position: "asc" }, select: { location: true } },
        },
      },
      organizer: { select: { id: true, name: true, branch: true, photoUrl: true } },
      requester: { select: { id: true, name: true, branch: true, photoUrl: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { name: true } } } },
    },
  });

  if (!request) return null;
  if (request.status !== "accepted") return null;
  if (request.organizerId !== userId && request.requesterId !== userId) return null;

  const viewerIsOrganizer = request.organizerId === userId;
  return {
    ...request,
    viewerIsOrganizer,
    other: viewerIsOrganizer ? request.requester : request.organizer,
  };
}

/** Clears the unread dot for whichever side of the thread is reading it. */
export async function markThreadRead(threadId: string, userId: string) {
  const request = await prisma.joinRequest.findUnique({
    where: { id: threadId },
    select: { organizerId: true, requesterId: true },
  });
  if (!request) return;

  const field =
    request.organizerId === userId
      ? "organizerLastReadAt"
      : request.requesterId === userId
        ? "requesterLastReadAt"
        : null;
  if (!field) return;

  await prisma.joinRequest.update({
    where: { id: threadId },
    data: { [field]: new Date() },
  });
}

const requestPersonSelect = {
  id: true,
  name: true,
  age: true,
  branch: true,
  batchYear: true,
  photoUrl: true,
  bio: true,
} as const;

export type RequestRow = Awaited<ReturnType<typeof getRequests>>["received"][number];

/** The /requests screen: Received (to act on) and Sent (to track). */
export async function getRequests(userId: string) {
  const [received, sent] = await Promise.all([
    prisma.joinRequest.findMany({
      where: { organizerId: userId },
      // Pending first so there is always something to act on at the top.
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        requester: { select: requestPersonSelect },
        trip: {
          select: {
            id: true,
            title: true,
            departureDate: true,
            status: true,
            stops: { orderBy: { position: "asc" }, select: { location: true } },
          },
        },
      },
    }),
    prisma.joinRequest.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        organizer: { select: requestPersonSelect },
        trip: {
          select: {
            id: true,
            title: true,
            departureDate: true,
            status: true,
            stops: { orderBy: { position: "asc" }, select: { location: true } },
          },
        },
      },
    }),
  ]);

  return {
    received: received.map((r) => ({
      id: r.id,
      status: r.status as RequestStatus,
      message: r.message,
      createdAt: r.createdAt,
      respondedAt: r.respondedAt,
      person: r.requester,
      trip: r.trip,
    })),
    sent: sent.map((r) => ({
      id: r.id,
      status: r.status as RequestStatus,
      message: r.message,
      createdAt: r.createdAt,
      respondedAt: r.respondedAt,
      person: r.organizer,
      trip: r.trip,
    })),
  };
}

export async function getPendingRequestCount(userId: string) {
  return prisma.joinRequest.count({ where: { organizerId: userId, status: "pending" } });
}

/**
 * Records that a student encountered a trip. A decision ("passed"/"interested")
 * always wins: re-viewing the detail page later must not downgrade it back to
 * "viewed" and quietly return the trip to the live deck.
 */
export async function recordBrowseHistory(
  userId: string,
  tripId: string,
  decision: BrowseDecision,
) {
  const existing = await prisma.browseHistory.findUnique({
    where: { userId_tripId: { userId, tripId } },
    select: { id: true, decision: true },
  });

  if (!existing) {
    await prisma.browseHistory.create({ data: { userId, tripId, decision } });
    return;
  }

  const isDowngrade =
    decision === "viewed" && DECK_EXCLUDING_DECISIONS.includes(existing.decision as BrowseDecision);
  if (isDowngrade) return;

  await prisma.browseHistory.update({
    where: { id: existing.id },
    data: { decision, seenAt: new Date() },
  });
}

export type BrowseHistoryRow = Awaited<ReturnType<typeof getBrowseHistory>>[number];

/** Everything the student has seen in Browse, most recent first. */
export async function getBrowseHistory(userId: string) {
  const rows = await prisma.browseHistory.findMany({
    where: { userId },
    orderBy: { seenAt: "desc" },
    include: {
      trip: {
        select: {
          id: true,
          title: true,
          departureDate: true,
          status: true,
          organizer: { select: { name: true } },
          stops: { orderBy: { position: "asc" }, select: { location: true } },
          images: { orderBy: { position: "asc" }, take: 1, select: { url: true, alt: true } },
          joinRequests: { where: { requesterId: userId }, select: { status: true } },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    decision: row.decision as BrowseDecision,
    seenAt: row.seenAt,
    requestStatus: (row.trip.joinRequests[0]?.status as RequestStatus | undefined) ?? null,
    trip: {
      id: row.trip.id,
      title: row.trip.title,
      stops: row.trip.stops,
      departureDate: row.trip.departureDate,
      status: row.trip.status,
      organizerName: row.trip.organizer.name,
      cover: row.trip.images[0] ?? null,
    },
  }));
}

/** The full profile screen: who you are, what you organize, what you requested. */
export async function getProfileData(userId: string) {
  const [created, requests] = await Promise.all([
    prisma.trip.findMany({
      where: { organizerId: userId },
      select: tripCardSelect,
      orderBy: { createdAt: "desc" },
    }),
    prisma.joinRequest.findMany({
      where: { requesterId: userId, status: { in: ["pending", "accepted"] } },
      orderBy: { createdAt: "desc" },
      select: { status: true, trip: { select: tripCardSelect } },
    }),
  ]);

  return {
    created: created.map(toTripCard),
    joined: requests.map((request) => ({
      status: request.status as RequestStatus,
      trip: toTripCard(request.trip),
    })),
  };
}
