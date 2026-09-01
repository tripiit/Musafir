import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { TravelModeIcon } from "@/components/ui/TravelModeIcon";
import { TripOwnerMenu } from "./TripOwnerMenu";
import { formatSpots, formatTripDate, formatTripDuration, stopsSummary } from "@/lib/format";
import type { TripCardData } from "@/lib/queries";

type StatusTone = "pending" | "confirmed" | "full" | "cancelled";

const TONE_CLASS: Record<StatusTone, string> = {
  // Status chip tones from the Peak Passage IITM spec: 10% tints, never solid.
  pending: "bg-secondary-container/10 text-primary",
  confirmed: "bg-success/10 text-success",
  full: "bg-outline text-surface-container-lowest",
  cancelled: "bg-error-container text-on-error-container",
};

export function TripCard({
  trip,
  statusLabel,
  tone = "pending",
  owned = false,
  href,
  className = "",
}: {
  trip: TripCardData;
  statusLabel: string;
  tone?: StatusTone;
  /** Renders the ⋮ Edit / Cancel menu. Only ever true for the organizer. */
  owned?: boolean;
  /** Overrides the default link to the trip page (e.g. straight to a chat). */
  href?: string;
  className?: string;
}) {
  const cover = trip.images[0];
  const cancelled = trip.status === "cancelled";

  return (
    // The owner menu must be a sibling of the card link, not a child: it
    // contains its own link, and nesting anchors is invalid.
    <article
      className={`relative flex snap-center flex-col overflow-hidden rounded-lg border border-surface-container-low bg-surface-container-lowest shadow-card transition-shadow hover:shadow-card-hover ${className}`}
    >
      <Link href={href ?? `/trips/${trip.id}`} className="flex flex-1 flex-col">
        <div className="relative h-32 bg-surface-container-highest">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt}
              fill
              sizes="(max-width: 768px) 280px, 33vw"
              className={`object-cover ${cancelled ? "grayscale" : ""}`}
            />
          ) : null}
          <span
            className={`absolute top-2 right-2 rounded-sm px-2 py-1 text-label-sm backdrop-blur-sm ${TONE_CLASS[tone]}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-stack-md">
          <h3 className="mb-stack-xs font-heading text-headline-md text-on-background">
            {trip.title}
          </h3>
          <p className="mb-stack-md line-clamp-2 text-body-sm text-on-surface-variant">
            {trip.description}
          </p>

          <div className="mt-auto flex items-center justify-between gap-stack-sm">
            <span className="text-label-sm text-on-surface-variant">
              {cancelled ? "Cancelled" : formatSpots(trip.spots)}
            </span>
            <span className="flex items-center gap-stack-sm text-on-surface-variant">
              <span className="flex items-center gap-1 text-label-sm">
                <Icon name="calendar_today" size={14} />
                {formatTripDate(trip.departureDate)}
              </span>
              {trip.modes.map((mode) => (
                <TravelModeIcon key={mode} mode={mode} size={16} className="text-primary" />
              ))}
            </span>
          </div>

          <p className="mt-stack-xs text-label-sm text-outline">
            {stopsSummary(trip.stops)} · {formatTripDuration(trip.departureDate, trip.returnDate)}
          </p>
        </div>
      </Link>

      {owned && !cancelled && (
        <TripOwnerMenu tripId={trip.id} tripTitle={trip.title} className="absolute top-2 left-2 z-20" />
      )}
    </article>
  );
}
