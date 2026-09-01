import { SwipeDeck } from "@/components/browse/SwipeDeck";
import { requireUser } from "@/lib/auth";
import { getBrowseDeck } from "@/lib/queries";

export const metadata = { title: "Browse trips · TripMate IITM" };

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ rebrowse?: string }>;
}) {
  const user = await requireUser();
  const { rebrowse } = await searchParams;

  // "Re-browse" lifts the exclusion filter only. No history or request record
  // is deleted, so passed trips return as fresh cards while already-requested
  // ones come back carrying their status instead of a request button.
  const rebrowsing = rebrowse === "1";
  const trips = await getBrowseDeck(user.id, { includeDecided: rebrowsing });

  return (
    <div className="h-[calc(100dvh-140px)] md:h-[calc(100dvh-40px)] md:py-margin-desktop">
      <SwipeDeck trips={trips} rebrowsing={rebrowsing} />
    </div>
  );
}
