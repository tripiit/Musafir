import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { TripForm } from "@/components/trips/TripForm";
import { requireUser } from "@/lib/auth";
import { EDITABLE_STATUSES, type TripStatus } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { parseModes } from "@/lib/format";
import type { CreateTripInput } from "@/lib/validation";

export const metadata = { title: "Edit trip · TripMate IITM" };

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
      stops: { orderBy: { position: "asc" } },
    },
  });

  // Someone else's trip is a 404, not a 403 — the edit route must not confirm
  // that a trip id exists to a non-owner.
  if (!trip || trip.organizerId !== user.id) notFound();
  if (!EDITABLE_STATUSES.includes(trip.status as TripStatus)) redirect(`/trips/${id}`);

  const initialValues: CreateTripInput = {
    title: trip.title,
    stops: trip.stops.map((stop) => ({
      location: stop.location,
      arrivalDate: stop.arrivalDate ? stop.arrivalDate.toISOString().slice(0, 10) : "",
    })),
    // <input type="date"> wants yyyy-mm-dd.
    departureDate: trip.departureDate ? trip.departureDate.toISOString().slice(0, 10) : "",
    departureLocation: trip.departureLocation ?? "",
    returnDate: trip.returnDate ? trip.returnDate.toISOString().slice(0, 10) : "",
    returnLocation: trip.returnLocation ?? "",
    images: trip.images.map((image) => ({ url: image.url, alt: image.alt })),
    groupSizeFlexible: trip.groupSizeFlexible,
    groupSizeMax: trip.groupSizeMax,
    travelModes: parseModes(trip.travelModes),
    description: trip.description,
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      <Link
        href={`/trips/${id}`}
        className="mb-stack-md inline-flex items-center gap-1 text-label-md text-on-surface-variant transition-colors hover:text-primary"
      >
        <Icon name="chevron_left" size={18} />
        Back to trip
      </Link>

      <div className="mb-stack-lg">
        <h1 className="mb-stack-sm font-heading text-headline-lg-mobile text-primary md:text-headline-lg">
          Edit Trip
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Update the details for {trip.title}.
        </p>
      </div>

      <TripForm mode="edit" tripId={id} initialValues={initialValues} />
    </main>
  );
}
