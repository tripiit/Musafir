import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { TripCard } from "@/components/trips/TripCard";
import { requireUser } from "@/lib/auth";
import { initialsOf } from "@/lib/format";
import { getProfileData } from "@/lib/queries";

export const metadata = { title: "Profile · TripMate IITM" };

export default async function ProfilePage() {
  const user = await requireUser();
  const { created, joined } = await getProfileData(user.id);

  const subtitle =
    [user.branch, user.batchYear && `Batch of ${user.batchYear}`, user.age && `${user.age}`]
      .filter(Boolean)
      .join(" · ") || "IIT Mandi student";

  return (
    <main className="mx-auto max-w-4xl space-y-stack-lg p-margin-mobile md:p-margin-desktop">
      <h1 className="font-heading text-headline-lg-mobile text-on-background md:text-headline-lg">
        Profile
      </h1>

      <section className="relative rounded-lg border border-surface-container-highest bg-surface-container-lowest p-stack-lg shadow-card">
        <Link
          href="/profile/edit"
          className="absolute top-stack-md right-stack-md flex items-center gap-1 rounded-md border border-outline-variant px-3 py-2 text-label-md text-primary transition-colors hover:bg-surface-container-low"
        >
          <Icon name="edit" size={16} />
          Edit Profile
        </Link>

        <div className="flex flex-col items-center text-center">
          <div className="mb-stack-md h-20 w-20 overflow-hidden rounded-full">
            {user.photoUrl ? (
              <Image
                src={user.photoUrl}
                alt=""
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-primary-container font-heading text-headline-lg text-on-primary-container">
                {initialsOf(user.name)}
              </span>
            )}
          </div>
          <h2 className="font-heading text-headline-md text-primary">{user.name}</h2>
          <p className="text-label-sm text-on-surface-variant">{subtitle}</p>
          <p className="mt-stack-xs text-label-sm text-outline">{user.email}</p>
          {user.bio && (
            <p className="mt-stack-md max-w-prose text-body-sm text-on-surface">{user.bio}</p>
          )}

          <dl className="mt-stack-lg grid w-full max-w-sm grid-cols-2 gap-stack-md border-t border-surface-variant pt-stack-md">
            <div>
              <dt className="text-label-sm text-on-surface-variant">Trips created</dt>
              <dd className="font-heading text-headline-md text-on-surface">{created.length}</dd>
            </div>
            <div className="border-l border-surface-variant">
              <dt className="text-label-sm text-on-surface-variant">Trips joined</dt>
              <dd className="font-heading text-headline-md text-on-surface">{joined.length}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section>
        <div className="mb-stack-md flex items-end justify-between">
          <h2 className="font-heading text-headline-md text-on-background">My Created Trips</h2>
          <Link href="/trips/new" className="text-label-sm text-primary hover:underline">
            Create new
          </Link>
        </div>
        {created.length === 0 ? (
          <EmptyRow body="You have not posted a trip yet." />
        ) : (
          <div className="grid grid-cols-1 gap-stack-md sm:grid-cols-2 lg:grid-cols-3">
            {created.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                owned
                statusLabel={
                  trip.status === "cancelled"
                    ? "Cancelled"
                    : trip.status === "completed"
                      ? "Completed"
                      : "Organizing"
                }
                tone={
                  trip.status === "cancelled"
                    ? "cancelled"
                    : trip.status === "completed"
                      ? "full"
                      : "confirmed"
                }
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-stack-md font-heading text-headline-md text-on-background">
          My Interests &amp; Joined Trips
        </h2>
        {joined.length === 0 ? (
          <EmptyRow body="Swipe right on a trip in Browse and it will show up here." />
        ) : (
          <div className="grid grid-cols-1 gap-stack-md sm:grid-cols-2 lg:grid-cols-3">
            {joined.map(({ trip, status }) => (
              <TripCard
                key={trip.id}
                trip={trip}
                statusLabel={
                  trip.status === "cancelled"
                    ? "Cancelled"
                    : status === "accepted"
                      ? "Accepted"
                      : "Interested"
                }
                tone={
                  trip.status === "cancelled"
                    ? "cancelled"
                    : status === "accepted"
                      ? "confirmed"
                      : "pending"
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-surface-container-highest bg-surface-container-lowest shadow-card">
        <Link
          href="/browse/history"
          className="flex items-center gap-stack-md border-b border-outline-variant p-stack-md text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <Icon name="history" size={20} className="text-primary" />
          <span className="text-label-md">Browse history</span>
        </Link>
        <Link
          href="/chats"
          className="flex items-center gap-stack-md border-b border-outline-variant p-stack-md text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <Icon name="chat_bubble" size={20} className="text-primary" />
          <span className="text-label-md">Your conversations</span>
        </Link>
        <div className="flex items-center gap-stack-md p-stack-md text-on-surface-variant">
          <Icon name="shield" size={20} />
          <span className="text-body-sm">
            Only verified {"@students.iitmandi.ac.in"} accounts can see your trips.
          </span>
        </div>
      </section>

      {/* A POST form, so signing out cannot be triggered by a link prefetch. */}
      <form action="/api/auth/logout" method="post">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-md border border-error/30 bg-error-container py-3 text-label-md text-on-error-container transition-colors hover:bg-error hover:text-on-error"
        >
          <Icon name="logout" size={18} />
          Sign out
        </button>
      </form>
    </main>
  );
}

function EmptyRow({ body }: { body: string }) {
  return (
    <p className="rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest p-stack-lg text-center text-body-sm text-on-surface-variant">
      {body}
    </p>
  );
}
