"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { TravelModeIcon } from "@/components/ui/TravelModeIcon";
import {
  REQUEST_STATUS_LABELS,
  TRAVEL_MODES,
  TRAVEL_MODE_LABELS,
  type TravelMode,
} from "@/lib/constants";
import {
  formatSpots,
  formatTripDate,
  formatTripDuration,
  initialsOf,
  stopsSummary,
} from "@/lib/format";
import type { DeckTrip } from "@/lib/queries";
import { SWIPE_COMMIT_DISTANCE, swipeDirection } from "@/lib/swipe";

type SwipeAction = "interested" | "pass";
type Filter = "all" | TravelMode;

export function SwipeDeck({
  trips,
  rebrowsing = false,
}: {
  trips: DeckTrip[];
  /** True when showing the re-browse deck, which includes decided trips. */
  rebrowsing?: boolean;
}) {
  const router = useRouter();
  const [deck, setDeck] = useState(trips);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? deck : deck.filter((t) => t.modes.includes(filter))),
    [deck, filter],
  );

  const [active, next] = visible;

  const showToast = useCallback((text: string) => {
    setToast(text);
    // Brief and non-blocking: a modal on every swipe would kill the browsing feel.
    setTimeout(() => setToast(null), 3200);
  }, []);

  const commit = useCallback(
    async (trip: DeckTrip, action: SwipeAction) => {
      // Already-requested cards reappear in re-browse; never fire a duplicate.
      if (action === "interested" && trip.requestStatus) {
        setDeck((current) => current.filter((t) => t.id !== trip.id));
        return;
      }

      // Optimistic: the card leaves immediately, the write follows.
      setDeck((current) => current.filter((t) => t.id !== trip.id));
      setError(null);

      try {
        const res = await fetch("/api/swipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tripId: trip.id, action }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setDeck((current) => [trip, ...current]); // put it back
          setError(data.error ?? "Could not record that. Try again.");
          return;
        }
        if (action === "interested" && !data.duplicate) {
          showToast(`Request sent to ${data.organizerName ?? trip.organizer.name}`);
        }
        router.refresh();
      } catch {
        setDeck((current) => [trip, ...current]);
        setError("Could not reach the server. Check your connection.");
      }
    },
    [router, showToast],
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex shrink-0 items-center gap-stack-sm px-margin-mobile py-stack-xs">
        <div className="no-scrollbar flex flex-1 gap-stack-sm overflow-x-auto">
          <FilterChip
            label="All trips"
            icon="explore"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          {TRAVEL_MODES.map((mode) => (
            <FilterChip
              key={mode}
              label={TRAVEL_MODE_LABELS[mode]}
              mode={mode}
              active={filter === mode}
              onClick={() => setFilter(mode)}
            />
          ))}
        </div>

        {/* Escape hatch from the deck: a swiped trip is never gone for good. */}
        <Link
          href="/browse/history"
          aria-label="Browse history"
          title="Browse history"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant shadow-sm transition-colors hover:bg-surface-container-low"
        >
          <Icon name="history" size={18} />
        </Link>
      </div>

      {rebrowsing && (
        <p className="px-margin-mobile pb-stack-xs text-label-sm text-on-surface-variant">
          Re-browsing every trip, including ones you already decided on.
        </p>
      )}

      {error && (
        <p role="alert" className="px-margin-mobile pb-stack-xs text-label-sm text-error">
          {error}
        </p>
      )}

      <div className="relative mx-auto w-full max-w-md flex-1 px-margin-mobile">
        {active ? (
          <>
            {next && (
              <div
                aria-hidden
                className="absolute inset-x-margin-mobile top-4 bottom-8 origin-bottom scale-95 rounded-xl bg-surface-container-high opacity-60 shadow-sm"
              />
            )}

            <AnimatePresence mode="popLayout">
              <SwipeCard key={active.id} trip={active} onCommit={commit} />
            </AnimatePresence>

            <div className="absolute -bottom-[10px] right-0 left-0 z-20 flex items-center justify-center gap-stack-lg px-8">
              <button
                type="button"
                onClick={() => commit(active, "pass")}
                aria-label={`Pass on ${active.title}`}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-lowest text-outline shadow-card-hover transition-colors hover:bg-surface-variant active:scale-90"
              >
                <Icon name="close" size={32} />
              </button>

              {active.requestStatus ? (
                // Re-browsed card you already acted on: status, not a duplicate request.
                <span className="flex h-20 items-center justify-center rounded-full bg-surface-container-high px-6 text-label-md text-on-surface-variant shadow-card">
                  {REQUEST_STATUS_LABELS[active.requestStatus]}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => commit(active, "interested")}
                  aria-label={`Request to join ${active.title}`}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-on-primary shadow-modal transition-colors hover:bg-primary-container active:scale-90"
                >
                  <Icon name="favorite" size={40} filled />
                </button>
              )}
            </div>
          </>
        ) : (
          <DeckEndState
            filtered={deck.length > 0}
            rebrowsing={rebrowsing}
            onClearFilter={() => setFilter("all")}
          />
        )}
      </div>

      {toast && (
        <div
          role="status"
          className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-inverse-surface px-4 py-2 text-label-md text-inverse-on-surface shadow-modal md:bottom-8"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/**
 * Shown whenever the deck runs out — after re-browsing, after a filter empties
 * it, or genuinely at the end. "Re-browse" only lifts the local exclusion
 * filter; it never deletes history or request records.
 */
function DeckEndState({
  filtered,
  rebrowsing,
  onClearFilter,
}: {
  filtered: boolean;
  rebrowsing: boolean;
  onClearFilter: () => void;
}) {
  if (filtered) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-stack-lg text-center">
        <Icon name="explore" size={40} className="mb-stack-sm text-outline" />
        <h2 className="font-heading text-headline-md text-on-background">
          Nothing matches that filter
        </h2>
        <p className="mt-stack-xs max-w-xs text-body-sm text-on-surface-variant">
          Try a different mode of travel.
        </p>
        <button
          type="button"
          onClick={onClearFilter}
          className="mt-stack-md rounded-md bg-primary px-4 py-2 text-label-md text-on-primary transition-colors hover:bg-primary-container"
        >
          Clear filter
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-stack-lg text-center">
      <Icon name="explore" size={40} className="mb-stack-sm text-outline" />
      <h2 className="font-heading text-headline-md text-on-background">
        You&apos;ve seen every open trip
      </h2>
      <p className="mt-stack-xs max-w-xs text-body-sm text-on-surface-variant">
        Check back later, or post one of your own.
      </p>

      <div className="mt-stack-md flex w-full max-w-xs flex-col gap-stack-sm">
        <Link
          href="/trips/new"
          className="rounded-md bg-primary px-4 py-3 text-label-md text-on-primary transition-colors hover:bg-primary-container"
        >
          Post a Trip
        </Link>
        {!rebrowsing && (
          <Link
            href="/browse?rebrowse=1"
            className="rounded-md border border-outline-variant px-4 py-3 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            Re-browse Trips
          </Link>
        )}
        <Link
          href="/browse/history"
          className="rounded-md py-2 text-label-sm text-primary transition-colors hover:underline"
        >
          See your browse history
        </Link>
      </div>
    </div>
  );
}

function SwipeCard({
  trip,
  onCommit,
}: {
  trip: DeckTrip;
  onCommit: (trip: DeckTrip, action: SwipeAction) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const passOpacity = useTransform(x, [-SWIPE_COMMIT_DISTANCE, -30], [1, 0]);
  const likeOpacity = useTransform(x, [30, SWIPE_COMMIT_DISTANCE], [0, 1]);
  const [exitX, setExitX] = useState(0);

  const cover = trip.images[0];

  function onDragEnd(_: unknown, info: PanInfo) {
    const direction = swipeDirection(info.offset.x, info.velocity.x);
    if (direction === 0) return; // framer-motion springs it back on its own

    const action: SwipeAction = direction > 0 ? "interested" : "pass";
    setExitX(direction > 0 ? 400 : -400);
    onCommit(trip, action);
  }

  return (
    <motion.div
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={onDragEnd}
      exit={{ x: exitX, opacity: 0, transition: { duration: 0.25 } }}
      whileTap={{ cursor: "grabbing" }}
      className="absolute inset-x-margin-mobile top-0 bottom-4 flex cursor-grab flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-modal"
    >
      {/* A real link, so the card can be opened in a new tab and read as a
          navigation target — but a drag must never navigate, hence the
          capture-phase guard below. */}
      <Link
        href={`/trips/${trip.id}`}
        draggable={false}
        onClickCapture={(e) => {
          if (Math.abs(x.get()) > 8) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="flex h-full w-full flex-col text-left"
      >
        <div className="relative h-[75%] w-full">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 448px"
              className="object-cover"
              draggable={false}
            />
          ) : (
            <div className="h-full w-full bg-surface-container-high" />
          )}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10"
          />

          <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
            <span className="rounded-md bg-surface-container-lowest/90 px-3 py-1 text-label-md text-primary shadow-sm backdrop-blur-sm">
              {formatSpots(trip.spots)}
            </span>
            <span className="rounded-md bg-surface-container-lowest/90 px-3 py-1 text-label-sm text-on-surface-variant shadow-sm backdrop-blur-sm">
              {stopsSummary(trip.stops)}
            </span>
            {trip.requestStatus && (
              <span className="rounded-md bg-primary/90 px-3 py-1 text-label-sm text-on-primary shadow-sm backdrop-blur-sm">
                {REQUEST_STATUS_LABELS[trip.requestStatus]}
              </span>
            )}
          </div>

          {/* Direction cues that fade in as the card is dragged. */}
          <motion.span
            style={{ opacity: likeOpacity }}
            className="absolute top-6 right-6 rotate-12 rounded-md border-4 border-success px-3 py-1 font-heading text-headline-md text-success"
          >
            REQUEST
          </motion.span>
          <motion.span
            style={{ opacity: passOpacity }}
            className="absolute top-6 left-6 -rotate-12 rounded-md border-4 border-error px-3 py-1 font-heading text-headline-md text-error"
          >
            PASS
          </motion.span>
        </div>

        <div className="relative z-10 -mt-8 flex h-[25%] w-full flex-col justify-between rounded-t-xl bg-surface-container-lowest p-stack-md">
          <div className="absolute -top-10 left-stack-md flex items-end gap-3">
            <span className="h-14 w-14 overflow-hidden rounded-full border-4 border-surface-container-lowest bg-surface-variant shadow-sm">
              {trip.organizer.photoUrl ? (
                <Image
                  src={trip.organizer.photoUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-primary-container font-heading text-headline-md text-on-primary-container">
                  {initialsOf(trip.organizer.name)}
                </span>
              )}
            </span>
            <span className="mb-1">
              <span className="block text-label-sm text-on-surface-variant">Organized by</span>
              <span className="block text-label-md text-primary">{trip.organizer.name}</span>
            </span>
          </div>

          <div className="mt-4">
            <h2 className="font-heading text-headline-lg-mobile tracking-tight text-primary">
              {trip.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-stack-md text-on-surface-variant">
              <span className="flex items-center gap-1 text-body-sm">
                <Icon name="calendar_today" size={18} />
                {formatTripDate(trip.departureDate)}
              </span>
              <span className="flex items-center gap-1 text-body-sm">
                <Icon name="group" size={18} />
                {formatTripDuration(trip.departureDate, trip.returnDate)}
              </span>
              <span className="flex items-center gap-1">
                {trip.modes.map((mode) => (
                  <TravelModeIcon key={mode} mode={mode} size={18} />
                ))}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function FilterChip({
  label,
  icon,
  mode,
  active,
  onClick,
}: {
  label: string;
  icon?: "explore";
  mode?: TravelMode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1 rounded-full border px-4 py-1.5 text-label-sm whitespace-nowrap shadow-sm transition-colors ${
        active
          ? "border-primary bg-primary text-on-primary"
          : "border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low"
      }`}
    >
      {mode ? <TravelModeIcon mode={mode} size={16} /> : icon ? <Icon name={icon} size={16} /> : null}
      {label}
    </button>
  );
}
