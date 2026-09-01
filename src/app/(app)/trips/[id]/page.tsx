import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { TravelModeIcon } from "@/components/ui/TravelModeIcon";
import { ImageCarousel } from "@/components/trips/ImageCarousel";
import { JoinTripButton } from "@/components/trips/JoinTripButton";
import { TripOwnerMenu } from "@/components/trips/TripOwnerMenu";
import { requireUser } from "@/lib/auth";
import { TRAVEL_MODE_LABELS } from "@/lib/constants";
import {
  formatSpots,
  formatTripDate,
  formatTripDuration,
  initialsOf,
  planLocation,
} from "@/lib/format";
import { getTripDetail, recordBrowseHistory } from "@/lib/queries";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const detail = await getTripDetail(id, user.id);
  return { title: detail ? `${detail.trip.title} · TripMate IITM` : "Trip · TripMate IITM" };
}

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const detail = await getTripDetail(id, user.id);
  if (!detail) notFound();

  const { trip, modes, spots, isOrganizer, viewerRequest, previousTrips, threadId, pendingCount } =
    detail;

  // Opening someone else's trip counts as "viewed" in browse history, which
  // records the encounter without taking the trip out of the live deck.
  if (!isOrganizer) await recordBrowseHistory(user.id, trip.id, "viewed");

  const cancelled = trip.status === "cancelled";
  // Derived from the Plan dates, never stored.
  const durationLabel = formatTripDuration(trip.departureDate, trip.returnDate);

  return (
    <>
      <header className="sticky top-[60px] z-40 bg-surface shadow-sm md:top-0">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-margin-mobile md:px-margin-desktop">
          <Link
            href="/browse"
            aria-label="Back to browsing"
            className="rounded-full p-2 text-primary transition-colors hover:bg-surface-container-low"
          >
            <Icon name="arrow_back" size={24} />
          </Link>
          <h1 className="font-heading text-headline-md font-bold text-primary">Trip Details</h1>
          {isOrganizer && !cancelled ? (
            <TripOwnerMenu tripId={trip.id} tripTitle={trip.title} />
          ) : (
            <span className="w-10" />
          )}
        </div>
      </header>

      {cancelled && (
        <div
          role="status"
          className="mx-auto flex max-w-[1200px] items-center gap-2 px-margin-mobile pt-stack-md md:px-margin-desktop"
        >
          <p className="flex w-full items-center gap-2 rounded-md border border-error/30 bg-error-container px-4 py-3 text-body-sm text-on-error-container">
            <Icon name="cancel" size={18} className="shrink-0" />
            This trip was cancelled by its organizer. It is kept here so existing chats still make
            sense.
          </p>
        </div>
      )}

      <main className="mx-auto max-w-[1200px] space-y-stack-lg px-margin-mobile py-stack-lg md:px-margin-desktop">
        {/* Every photo on the trip, swipeable — not just the cover. */}
        <ImageCarousel images={trip.images} />

        <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-3">
          <div className="space-y-stack-lg md:col-span-2">
            {/* Route + stats */}
            <section className="rounded-lg border border-surface-container-highest bg-surface-container-lowest p-gutter shadow-card">
              <div className="mb-stack-md flex items-start justify-between gap-stack-md">
                <div>
                  <h2 className="flex flex-wrap items-center gap-2 font-heading text-headline-lg-mobile font-bold text-primary md:text-headline-lg">
                    {planLocation(trip.departureLocation)}
                    {trip.stops.map((stop) => (
                      <span key={stop.id} className="flex items-center gap-2">
                        <Icon name="arrow_forward" size={24} className="text-outline" />
                        {stop.location}
                      </span>
                    ))}
                  </h2>
                  <p className="mt-1 text-body-md text-on-surface-variant">
                    {formatTripDate(trip.departureDate)} · {durationLabel}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1">
                  {modes.map((mode) => (
                    <span
                      key={mode}
                      className="flex items-center gap-1 rounded-full border border-secondary-container/20 bg-secondary-container/10 px-3 py-1 text-label-md font-bold text-on-surface"
                    >
                      <TravelModeIcon mode={mode} size={16} />
                      {TRAVEL_MODE_LABELS[mode]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-stack-lg border-t border-surface-variant pt-stack-md">
                <div className="flex-1">
                  <p className="text-label-sm text-on-surface-variant">Spots</p>
                  <p className="font-heading text-headline-md text-on-surface">
                    {formatSpots(spots)}
                  </p>
                </div>
                <div className="flex-1 border-l border-surface-variant pl-4">
                  <p className="text-label-sm text-on-surface-variant">Group so far</p>
                  <p className="font-heading text-headline-md text-on-surface">
                    {detail.joinedCount + 1}
                    {trip.groupSizeMax ? (
                      <span className="text-body-md text-on-surface-variant">
                        {" "}
                        / {trip.groupSizeMax}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
            </section>

            {/* Plan: filled navy dot for departure, a small hollow dot per stop
                in visit order, filled amber dot for the return. */}
            <section className="rounded-lg border border-surface-container-highest bg-surface-container-lowest p-gutter shadow-card">
              <h3 className="mb-stack-md font-heading text-headline-md text-primary">Plan</h3>
              <div className="relative space-y-stack-lg pl-6 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-[2px] before:bg-surface-variant before:content-['']">
                <TimelineStep
                  tone="start"
                  title={
                    trip.departureDate
                      ? formatTripDate(trip.departureDate)
                      : "Departure date to be decided"
                  }
                  body={`Departure from ${planLocation(trip.departureLocation)}`}
                />

                {trip.stops.map((stop, index) => (
                  <TimelineStep
                    key={stop.id}
                    tone="mid"
                    // A dated stop leads with its date; an undated one says
                    // "Stop N" rather than implying precision it does not have.
                    title={
                      stop.arrivalDate
                        ? formatTripDate(stop.arrivalDate)
                        : index === 0
                          ? durationLabel
                          : `Stop ${index + 1}`
                    }
                    body={`At ${stop.location}`}
                  />
                ))}

                <TimelineStep
                  tone="end"
                  title={
                    trip.returnDate ? formatTripDate(trip.returnDate) : "Return date to be decided"
                  }
                  body={`Back to ${planLocation(trip.returnLocation)}`}
                />
              </div>
            </section>

            <section className="rounded-lg border border-surface-container-highest bg-surface-container-lowest p-gutter shadow-card">
              <h3 className="mb-stack-md font-heading text-headline-md text-primary">
                About this trip
              </h3>
              <p className="text-body-md whitespace-pre-line text-on-surface">
                {trip.description}
              </p>
            </section>

            <section className="rounded-lg border border-surface-container-highest bg-surface-container-lowest p-gutter shadow-card">
              <h3 className="mb-stack-md font-heading text-headline-md text-primary">Details</h3>
              <div className="flex flex-wrap gap-2">
                <Tag icon="group">
                  {trip.groupSizeFlexible ? "Flexible group size" : `Up to ${trip.groupSizeMax}`}
                </Tag>
                <Tag icon="calendar_today">{durationLabel}</Tag>
                {trip.stops.map((stop) => (
                  <Tag key={stop.id} icon="location_on">
                    {stop.location}
                  </Tag>
                ))}
                {modes.map((mode) => (
                  <Tag key={mode} icon="explore">
                    {TRAVEL_MODE_LABELS[mode]}
                  </Tag>
                ))}
              </div>
            </section>
          </div>

          {/* Organizer column */}
          <div className="space-y-stack-lg">
            <section className="flex flex-col items-center rounded-lg border border-surface-container-highest bg-surface-container-lowest p-gutter text-center shadow-card">
              <div className="relative mb-stack-md h-20 w-20 overflow-hidden rounded-full border-2 border-primary-container bg-surface-variant">
                {trip.organizer.photoUrl ? (
                  <Image
                    src={trip.organizer.photoUrl}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-primary-container font-heading text-headline-lg text-on-primary-container">
                    {initialsOf(trip.organizer.name)}
                  </span>
                )}
              </div>
              <h3 className="font-heading text-headline-md text-primary">{trip.organizer.name}</h3>
              <p className="mb-stack-md text-label-sm text-on-surface-variant">
                {[trip.organizer.branch, trip.organizer.batchYear && `Batch of ${trip.organizer.batchYear}`]
                  .filter(Boolean)
                  .join(" · ") || "IIT Mandi student"}
              </p>
              {trip.organizer.bio && (
                <p className="mb-stack-md text-body-sm text-on-surface">{trip.organizer.bio}</p>
              )}

              {previousTrips.length > 0 && (
                <div className="mt-stack-sm w-full border-t border-surface-variant pt-stack-md text-left">
                  <h4 className="mb-2 text-label-md text-primary">Previous Trips</h4>
                  <ul className="space-y-1 text-body-sm text-on-surface-variant">
                    {previousTrips.map((previous) => (
                      <li key={previous.id} className="flex items-center gap-2">
                        <Icon name="check_circle" size={16} className="shrink-0 text-surface-tint" />
                        {previous.stops[0]?.location ?? previous.title}
                        {previous.departureDate ? ` (${formatTripDate(previous.departureDate)})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* The static half of the coordination nudge; the interactive one
                lives in the chat thread. */}
            <aside className="flex gap-3 rounded-md border border-primary-fixed-dim bg-primary-fixed/30 p-4 shadow-sm">
              <Icon name="forum" size={24} className="shrink-0 text-primary" />
              <p className="text-body-sm text-on-primary-fixed-variant">
                <strong>Suggestion:</strong> once you have chatted a little, meet in person at North
                Campus to sort out the details.
              </p>
            </aside>

            {isOrganizer ? (
              <div className="space-y-stack-sm">
                {!cancelled && (
                  <Link
                    href={`/trips/${trip.id}/edit`}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-secondary-container py-3 text-label-md text-on-secondary-container shadow-card transition-all hover:bg-secondary-fixed-dim active:scale-[0.98]"
                  >
                    <Icon name="edit" size={18} />
                    Edit trip
                  </Link>
                )}
                <Link
                  href="/requests"
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-label-md text-on-primary shadow-card transition-all hover:bg-primary-container active:scale-[0.98]"
                >
                  <Icon name="person" size={18} />
                  {pendingCount > 0
                    ? `Review ${pendingCount} request${pendingCount === 1 ? "" : "s"}`
                    : "View requests"}
                </Link>
              </div>
            ) : cancelled ? (
              <p className="rounded-md border border-outline-variant bg-surface-container px-4 py-3 text-center text-body-sm text-on-surface-variant">
                This trip is no longer running.
              </p>
            ) : (
              <JoinTripButton
                tripId={trip.id}
                organizerName={trip.organizer.name}
                status={viewerRequest?.status ?? null}
                threadId={threadId}
              />
            )}
          </div>
        </div>
      </main>

      {threadId && (
        <Link
          href={`/chats/${threadId}`}
          aria-label="Open chat about this trip"
          className="fixed right-margin-mobile bottom-24 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-modal transition-transform hover:scale-105 md:right-margin-desktop md:bottom-8"
        >
          <Icon name="chat" size={24} />
        </Link>
      )}
    </>
  );
}

function TimelineStep({
  tone,
  title,
  body,
}: {
  tone: "start" | "mid" | "end";
  title: string;
  body: string;
}) {
  // Per the live Stitch Plan card: departure is a filled navy dot, each stop a
  // smaller hollow grey one, the return a filled amber dot.
  const dot =
    tone === "start"
      ? "h-3 w-3 -left-[30px] bg-primary shadow-sm"
      : tone === "end"
        ? "h-3 w-3 -left-[30px] bg-secondary-container shadow-sm"
        : "h-2 w-2 -left-[28px] bg-surface-container-lowest border-outline-variant";

  return (
    <div className="relative">
      <span
        className={`absolute top-1.5 rounded-full border-2 border-surface-container-lowest ${dot}`}
      />
      <h4 className="text-label-md text-on-surface">{title}</h4>
      {/* The location line uses the mid-blue accent from the live design;
          surface-tint is the closest existing token rather than a one-off. */}
      <p className="text-body-md text-surface-tint">{body}</p>
    </div>
  );
}

function Tag({
  icon,
  children,
}: {
  icon: "group" | "calendar_today" | "location_on" | "explore";
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-secondary-container/20 bg-secondary-container/10 px-3 py-1 text-label-sm text-on-surface">
      <Icon name={icon} size={16} />
      {children}
    </span>
  );
}
