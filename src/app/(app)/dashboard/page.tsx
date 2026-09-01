import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { TripCard } from "@/components/trips/TripCard";
import { requireUser } from "@/lib/auth";
import { REQUEST_STATUS_LABELS } from "@/lib/constants";
import { formatChatTimestamp, initialsOf } from "@/lib/format";
import { getDashboardData } from "@/lib/queries";

export const metadata = { title: "Dashboard · TripMate IITM" };

export default async function DashboardPage() {
  const user = await requireUser();
  const { organized, liked, threads } = await getDashboardData(user.id);

  return (
    <main className="mx-auto max-w-[1440px] space-y-stack-lg p-margin-mobile md:p-margin-desktop">
      <div className="flex flex-col gap-stack-xs">
        <h1 className="font-heading text-headline-lg-mobile text-on-background md:text-headline-lg">
          Dashboard
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          Manage your trips and quick actions.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
        <Link
          href="/trips/new"
          className="group relative flex flex-col items-start overflow-hidden rounded-lg bg-primary p-stack-lg text-left text-on-primary shadow-card transition-shadow duration-200 hover:shadow-card-hover active:scale-[0.98]"
        >
          <div
            aria-hidden
            className="absolute -top-4 -right-4 h-32 w-32 rounded-full bg-primary-fixed opacity-10 blur-2xl transition-transform duration-500 group-hover:scale-150"
          />
          <Icon name="add_circle" size={32} className="mb-stack-md" />
          <span className="mb-stack-xs font-heading text-headline-md">Create Trip</span>
          <span className="text-body-sm opacity-80">
            Organize a new adventure to the Himalayas.
          </span>
        </Link>

        <Link
          href="/browse"
          className="flex flex-col items-start rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-lg text-left text-primary shadow-card transition-shadow duration-200 hover:shadow-card-hover active:scale-[0.98]"
        >
          <Icon name="explore" size={32} className="mb-stack-md text-secondary" />
          <span className="mb-stack-xs font-heading text-headline-md">Browse Trips</span>
          <span className="text-body-sm text-on-surface-variant">
            Find ongoing trips organized by fellow students.
          </span>
        </Link>
      </section>

      <section>
        <div className="mb-stack-md flex items-end justify-between">
          <h2 className="font-heading text-headline-md text-on-background">My Active Trips</h2>
          <Link href="/profile" className="text-label-sm text-primary hover:underline">
            View All
          </Link>
        </div>

        {organized.length === 0 ? (
          <EmptyState
            icon="add_circle"
            title="You have not posted a trip yet"
            body="Organize one and other students can ask to join."
            actionHref="/trips/new"
            actionLabel="Create a trip"
          />
        ) : (
          <div className="flex snap-x snap-mandatory gap-stack-md overflow-x-auto pb-stack-sm md:grid md:grid-cols-3 md:overflow-visible">
            {organized.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                owned
                statusLabel={trip.status === "cancelled" ? "Cancelled" : "Organizing"}
                tone={trip.status === "cancelled" ? "cancelled" : "confirmed"}
                className="min-w-[280px] md:min-w-0"
              />
            ))}
          </div>
        )}
      </section>

      {/* Liked Trips: everything this student has requested to join, with the
          request status. Declined requests are dropped rather than lingering. */}
      <section>
        <div className="mb-stack-md flex items-end justify-between">
          <h2 className="font-heading text-headline-md text-on-background">Liked Trips</h2>
          <Link href="/requests" className="text-label-sm text-primary hover:underline">
            My Requests
          </Link>
        </div>

        {liked.length === 0 ? (
          <EmptyState
            icon="favorite"
            title="No requests yet"
            body="Swipe right on a trip in Browse to ask its organizer if you can join."
            actionHref="/browse"
            actionLabel="Browse trips"
          />
        ) : (
          <div className="flex snap-x snap-mandatory gap-stack-md overflow-x-auto pb-stack-sm md:grid md:grid-cols-3 md:overflow-visible">
            {liked.map(({ trip, status, requestId }) => (
              <TripCard
                key={requestId}
                trip={trip}
                // Accepted requests jump straight into the unlocked thread.
                href={status === "accepted" ? `/chats/${requestId}` : undefined}
                statusLabel={
                  trip.status === "cancelled" ? "Cancelled" : REQUEST_STATUS_LABELS[status]
                }
                tone={
                  trip.status === "cancelled"
                    ? "cancelled"
                    : status === "accepted"
                      ? "confirmed"
                      : "pending"
                }
                className="min-w-[280px] md:min-w-0"
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-stack-md font-heading text-headline-md text-on-background">
          Recent Chats
        </h2>

        {threads.length === 0 ? (
          <EmptyState
            icon="chat_bubble"
            title="No conversations yet"
            body="Chat unlocks once an organizer accepts your request to join."
            actionHref="/browse"
            actionLabel="Find a trip"
          />
        ) : (
          <div className="rounded-lg border border-surface-container-low bg-surface-container-lowest shadow-card">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/chats/${thread.id}`}
                className="flex items-center gap-stack-md border-b border-outline-variant p-stack-md transition-colors last:border-b-0 hover:bg-surface-container-low"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tertiary-container font-heading text-headline-md text-on-tertiary-container">
                  {initialsOf(thread.other.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="truncate text-label-md text-on-background">
                      {thread.trip.title}
                    </span>
                    <span className="shrink-0 text-label-sm text-on-surface-variant">
                      {formatChatTimestamp(thread.updatedAt)}
                    </span>
                  </span>
                  <span className="block truncate text-body-sm text-on-surface-variant">
                    {thread.lastMessage
                      ? `${thread.lastMessage.fromViewer ? "You" : thread.other.name}: ${thread.lastMessage.content}`
                      : `New thread with ${thread.other.name}`}
                  </span>
                </span>
                {thread.unread && (
                  <span
                    aria-label="Unread"
                    className="h-2 w-2 shrink-0 rounded-full bg-secondary-container"
                  />
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function EmptyState({
  icon,
  title,
  body,
  actionHref,
  actionLabel,
}: {
  icon: "explore" | "chat_bubble" | "add_circle" | "favorite";
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest p-stack-lg text-center">
      <Icon name={icon} size={32} className="mb-stack-sm text-outline" />
      <p className="font-heading text-headline-md text-on-background">{title}</p>
      <p className="mt-stack-xs max-w-sm text-body-sm text-on-surface-variant">{body}</p>
      <Link
        href={actionHref}
        className="mt-stack-md rounded-md bg-primary px-4 py-2 text-label-md text-on-primary transition-colors hover:bg-primary-container"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
