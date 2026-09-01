import { TRAVEL_MODES, type TravelMode } from "./constants";

export function parseModes(csv: string): TravelMode[] {
  return csv
    .split(",")
    .map((m) => m.trim())
    .filter((m): m is TravelMode => (TRAVEL_MODES as readonly string[]).includes(m));
}

export function serializeModes(modes: TravelMode[]) {
  return modes.join(",");
}

export function formatTripDate(date: Date | null) {
  if (!date) return "Dates flexible";
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

/**
 * Duration is DERIVED from the Plan's two dates, never stored — so it can never
 * contradict them. Inclusive of the departure day: leaving and returning on the
 * same date is a 1-day trip. Returns null when either date is unset.
 */
export function tripDurationDays(departureDate: Date | null, returnDate: Date | null) {
  if (!departureDate || !returnDate) return null;
  const start = Date.UTC(
    departureDate.getFullYear(),
    departureDate.getMonth(),
    departureDate.getDate(),
  );
  const end = Date.UTC(returnDate.getFullYear(), returnDate.getMonth(), returnDate.getDate());
  const days = Math.round((end - start) / 86_400_000) + 1;
  return days > 0 ? days : null;
}

export function formatDuration(days: number | null) {
  if (days === null) return "Duration TBD";
  return days === 1 ? "1 day" : `${days} days`;
}

/** Convenience for call sites that hold the two dates rather than a day count. */
export function formatTripDuration(departureDate: Date | null, returnDate: Date | null) {
  return formatDuration(tripDurationDays(departureDate, returnDate));
}

/** Falls back to the campus for trips created before the Plan builder existed. */
export function planLocation(value: string | null | undefined) {
  return value?.trim() || "IIT Mandi Campus";
}

/**
 * Spots are derived, not stored: group size minus the organizer minus everyone
 * already joined. Returns null when the organizer marked the size flexible.
 */
export function spotsLeft(
  groupSizeMax: number | null,
  groupSizeFlexible: boolean,
  joinedCount: number,
) {
  if (groupSizeFlexible || groupSizeMax === null) return null;
  return Math.max(0, groupSizeMax - 1 - joinedCount);
}

export function formatSpots(spots: number | null) {
  if (spots === null) return "Flexible group";
  if (spots === 0) return "Group full";
  return spots === 1 ? "1 spot left" : `${spots} spots left`;
}

export function initialsOf(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

/** "10:42 AM" for today, "Yesterday", weekday within a week, else a date. */
export function formatChatTimestamp(date: Date) {
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  const daysAgo = (now.getTime() - date.getTime()) / 86_400_000;
  if (daysAgo < 7) {
    return new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date);
  }
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(date);
}

export function formatMessageTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export type StopLike = { location: string; arrivalDate?: Date | null };

/** stops[0] is the primary destination — what cards and filters show. */
export function primaryStop(stops: StopLike[]) {
  return stops[0]?.location ?? "Destination to be decided";
}

/** "Prashar Lake +2 more" once a trip has more than one stop. */
export function stopsSummary(stops: StopLike[]) {
  const first = primaryStop(stops);
  return stops.length > 1 ? `${first} +${stops.length - 1} more` : first;
}
