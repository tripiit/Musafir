import { z } from "zod";
import {
  EMAIL_DOMAIN,
  REQUEST_NOTE_MAX,
  MAX_TRIP_IMAGES,
  MIN_TRIP_IMAGES,
  OTP_LENGTH,
  TRAVEL_MODES,
} from "./constants";

/** The login form collects only the local part; the domain is pinned in the UI. */
export const emailLocalPartSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your institute email ID")
  .max(64, "That ID looks too long")
  .regex(/^[a-z0-9]+([._-][a-z0-9]+)*$/, "Use letters and digits only, e.g. b24304");

export const requestOtpSchema = z.object({
  emailLocalPart: emailLocalPartSchema,
});

export const verifyOtpSchema = z.object({
  email: z.string().email().endsWith(EMAIL_DOMAIN, "Institute email required"),
  code: z
    .string()
    .trim()
    .length(OTP_LENGTH, `Enter the ${OTP_LENGTH}-digit code`)
    .regex(/^\d+$/, `Enter the ${OTP_LENGTH}-digit code`),
});

export const tripImageSchema = z.object({
  url: z.string().min(1),
  alt: z.string().trim().min(1, "Describe the photo").max(160),
});

export const createTripSchema = z
  .object({
    title: z.string().trim().min(3, "Give the trip a title").max(80),
    // --- The Plan: departure -> destination -> return. ---
    // Duration is deliberately absent: it is derived from the two dates, so
    // there is nothing here that could contradict them.
    departureDate: z.string().trim().optional().or(z.literal("")),
    departureLocation: z.string().trim().max(120).optional().or(z.literal("")),
    // stops[0] is the primary destination and is required; extra stops are the
    // §12 repeater. Order is visit order.
    stops: z
      .array(
        z.object({
          location: z.string().trim().min(2, "Name the stop").max(80),
          arrivalDate: z.string().trim().optional().or(z.literal("")),
        }),
      )
      .min(1, "Add at least one stop")
      .max(8, "Up to 8 stops"),
    returnDate: z.string().trim().optional().or(z.literal("")),
    returnLocation: z.string().trim().max(120).optional().or(z.literal("")),
    images: z
      .array(tripImageSchema)
      .min(MIN_TRIP_IMAGES, `Add at least ${MIN_TRIP_IMAGES} photos`)
      .max(MAX_TRIP_IMAGES, `Up to ${MAX_TRIP_IMAGES} photos`),
    groupSizeFlexible: z.boolean(),
    groupSizeMax: z.number().int().min(1).max(10).nullable(),
    travelModes: z.array(z.enum(TRAVEL_MODES)).min(1, "Pick at least one mode of travel"),
    description: z.string().trim().min(20, "Add a few details about the plan").max(2000),
  })
  // A null group size is only meaningful when the organizer marked it flexible,
  // otherwise the trip card has nothing to show.
  .refine((v) => v.groupSizeFlexible || v.groupSizeMax !== null, {
    message: "Set a group size or mark it flexible",
    path: ["groupSizeMax"],
  })
  // A return date without a departure date cannot produce a duration.
  .refine((v) => !v.returnDate || Boolean(v.departureDate), {
    message: "Set a departure date first",
    path: ["returnDate"],
  })
  // Coming back before you leave would yield a negative duration.
  .refine(
    (v) =>
      !v.returnDate ||
      !v.departureDate ||
      new Date(v.returnDate).getTime() >= new Date(v.departureDate).getTime(),
    { message: "The return date cannot be before departure", path: ["returnDate"] },
  )
  // A dated stop has to fall inside the trip. Whichever end is TBD is skipped,
  // so a half-planned trip is not blocked from saving.
  .superRefine((v, ctx) => {
    v.stops.forEach((stop, index) => {
      if (!stop.arrivalDate) return;
      const at = new Date(stop.arrivalDate).getTime();

      if (v.departureDate && at < new Date(v.departureDate).getTime()) {
        ctx.addIssue({
          code: "custom",
          message: "This stop is before the trip departs",
          path: ["stops", index, "arrivalDate"],
        });
      }
      if (v.returnDate && at > new Date(v.returnDate).getTime()) {
        ctx.addIssue({
          code: "custom",
          message: "This stop is after the trip returns",
          path: ["stops", index, "arrivalDate"],
        });
      }
    });
  });

export type CreateTripInput = z.infer<typeof createTripSchema>;

export const swipeSchema = z.object({
  tripId: z.string().min(1),
  action: z.enum(["interested", "pass"]),
  /** Optional note carried with a join request, like a LinkedIn connect note. */
  message: z.string().trim().max(REQUEST_NOTE_MAX).optional(),
});

export const respondToRequestSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

export const markNotificationsSchema = z.object({
  ids: z.array(z.string().min(1)).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "Type a message").max(2000),
});

export const nudgeSchema = z.object({
  action: z.enum(["dismiss", "suggest"]),
});

/**
 * Profile edit. Email is deliberately absent: it is the anchor for the whole
 * institute-domain restriction, so changing it would mean re-running OTP
 * verification. The form renders it locked.
 */
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Add your name").max(60),
  age: z.number().int().min(16, "That age looks wrong").max(80).nullable(),
  branch: z.string().trim().max(60).nullable(),
  batchYear: z
    .number()
    .int()
    .min(1990, "That batch year looks wrong")
    .max(new Date().getFullYear() + 6)
    .nullable(),
  bio: z.string().trim().max(500, "Keep the bio under 500 characters").nullable(),
  photoUrl: z.string().trim().min(1).nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Editing a trip takes the same shape as creating one. */
export const updateTripSchema = createTripSchema;
