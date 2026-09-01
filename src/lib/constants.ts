/**
 * The only email domain allowed to sign up. The Stitch mockup's login screen
 * pinned "@iitmandi.ac.in", but the real requirement (and what the OTP screen
 * shows) is the students subdomain.
 */
export const EMAIL_DOMAIN = "@students.iitmandi.ac.in";

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SECONDS = 59;

export const SESSION_COOKIE = "tripmate_session";
export const SESSION_TTL_DAYS = 30;

/** Messages exchanged in a thread before the meet-up nudge banner appears. */
export const MEETUP_NUDGE_THRESHOLD = 3;

export const TRAVEL_MODES = ["bike", "car", "cab", "bus"] as const;
export type TravelMode = (typeof TRAVEL_MODES)[number];

export const TRAVEL_MODE_LABELS: Record<TravelMode, string> = {
  bike: "Bike",
  car: "Car",
  cab: "Cab",
  bus: "Bus",
};

export const MIN_TRIP_IMAGES = 3;
export const MAX_TRIP_IMAGES = 4;

export const TRIP_STATUSES = ["open", "full", "completed", "cancelled"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

/** A trip can only be edited or cancelled while it is still live. */
export const EDITABLE_STATUSES: TripStatus[] = ["open", "full"];

export type BrowseDecision = "passed" | "interested" | "viewed";

/** Decisions that take a trip out of the live deck (but never out of history). */
export const DECK_EXCLUDING_DECISIONS: BrowseDecision[] = ["passed", "interested"];

export const REQUEST_STATUSES = ["pending", "accepted", "declined"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Request Sent",
  accepted: "Accepted",
  declined: "Declined",
};

export type NotificationType =
  | "join_request_received"
  | "join_request_accepted"
  | "join_request_declined"
  | "trip_updated"
  | "trip_cancelled";

/** Max characters on the optional note attached to a join request. */
export const REQUEST_NOTE_MAX = 300;
