import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { requireUser } from "@/lib/auth";
import type { BrowseDecision } from "@/lib/constants";
import { formatChatTimestamp, formatTripDate, stopsSummary } from "@/lib/format";
import { getBrowseHistory } from "@/lib/queries";

export const metadata = { title: "Browse history · TripMate IITM" };

const DECISION_LABEL: Record<BrowseDecision, string> = {
  passed: "Passed",
  interested: "Interested",
  viewed: "Viewed",
};

const DECISION_CLASS: Record<BrowseDecision, string> = {
  passed: "bg-surface-container-high text-on-surface-variant",
  interested: "bg-success/10 text-success",
  viewed: "bg-secondary-container/10 text-primary",
};

const STATUS_CLASS: Record<string, string> = {
  open: "text-success",
  full: "text-on-surface-variant",
  completed: "text-outline",
  cancelled: "text-error",
};

/**
 * A plain list, not a deck. Swiping never destroys a trip — it only moves it
 * out of the live deck, and this is where it lands.
 */
export default async function BrowseHistoryPage() {
  const user = await requireUser();
  const rows = await getBrowseHistory(user.id);

  return (
    <main className="mx-auto max-w-3xl space-y-stack-md p-margin-mobile md:p-margin-desktop">
      <Link
        href="/browse"
        className="inline-flex items-center gap-1 text-label-md text-on-surface-variant transition-colors hover:text-primary"
      >
        <Icon name="chevron_left" size={18} />
        Back to browsing
      </Link>

      <div>
        <h1 className="font-heading text-headline-lg-mobile text-on-background md:text-headline-lg">
          Browse History
        </h1>
        <p className="mt-stack-xs text-body-md text-on-surface-variant">
          Every trip you have seen, including the ones you passed on. Nothing is lost by swiping.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest p-stack-lg text-center">
          <Icon name="history" size={32} className="mb-stack-sm text-outline" />
          <p className="font-heading text-headline-md text-on-background">Nothing here yet</p>
          <p className="mt-stack-xs max-w-sm text-body-sm text-on-surface-variant">
            Trips you swipe on in Browse show up here, so you can always find one again.
          </p>
          <Link
            href="/browse"
            className="mt-stack-md rounded-md bg-primary px-4 py-2 text-label-md text-on-primary transition-colors hover:bg-primary-container"
          >
            Start browsing
          </Link>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-surface-container-low bg-surface-container-lowest shadow-card">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/trips/${row.trip.id}`}
                className="flex items-center gap-stack-md border-b border-outline-variant p-stack-md transition-colors last:border-b-0 hover:bg-surface-container-low"
              >
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface-container-high">
                  {row.trip.cover && (
                    <Image
                      src={row.trip.cover.url}
                      alt={row.trip.cover.alt}
                      fill
                      sizes="64px"
                      className={`object-cover ${row.trip.status === "cancelled" ? "grayscale" : ""}`}
                    />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-heading text-headline-md text-on-background">
                      {row.trip.title}
                    </span>
                    <span className="shrink-0 text-label-sm text-outline">
                      {formatChatTimestamp(row.seenAt)}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-body-sm text-on-surface-variant">
                    {stopsSummary(row.trip.stops)} · {row.trip.organizerName} ·{" "}
                    {formatTripDate(row.trip.departureDate)}
                  </span>
                  <span className="mt-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-label-sm ${DECISION_CLASS[row.decision]}`}
                    >
                      {DECISION_LABEL[row.decision]}
                    </span>
                    <span
                      className={`text-label-sm capitalize ${STATUS_CLASS[row.trip.status] ?? "text-on-surface-variant"}`}
                    >
                      {row.trip.status}
                    </span>
                  </span>
                </span>

                <Icon name="arrow_forward" size={18} className="shrink-0 text-outline" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
