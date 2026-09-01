import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { RequestList, type RequestItem } from "@/components/requests/RequestList";
import { requireUser } from "@/lib/auth";
import { getRequests } from "@/lib/queries";

export const metadata = { title: "Requests · TripMate IITM" };

export default async function RequestsPage() {
  const user = await requireUser();
  const { received, sent } = await getRequests(user.id);

  const serialize = (rows: typeof received): RequestItem[] =>
    rows.map((row) => ({
      id: row.id,
      status: row.status,
      message: row.message,
      createdAt: row.createdAt.toISOString(),
      person: row.person,
      trip: {
        id: row.trip.id,
        title: row.trip.title,
        destination: row.trip.stops[0]?.location ?? "Destination to be decided",
        departureDate: row.trip.departureDate ? row.trip.departureDate.toISOString() : null,
        status: row.trip.status,
      },
    }));

  return (
    <main className="mx-auto max-w-3xl space-y-stack-md p-margin-mobile md:p-margin-desktop">
      <Link
        href="/chats"
        className="inline-flex items-center gap-1 text-label-md text-on-surface-variant transition-colors hover:text-primary"
      >
        <Icon name="chevron_left" size={18} />
        Back to chats
      </Link>

      <div>
        <h1 className="font-heading text-headline-lg-mobile text-on-background md:text-headline-lg">
          Requests
        </h1>
        <p className="mt-stack-xs text-body-md text-on-surface-variant">
          Accepting a request opens a chat with that student. Declining does not.
        </p>
      </div>

      <RequestList received={serialize(received)} sent={serialize(sent)} />
    </main>
  );
}
