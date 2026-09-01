import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeModes } from "@/lib/format";
import { createTripSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createTripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const input = parsed.data;
  const departureDate = input.departureDate ? new Date(input.departureDate) : null;
  const returnDate = input.returnDate ? new Date(input.returnDate) : null;
  if (departureDate && Number.isNaN(departureDate.getTime())) {
    return NextResponse.json({ error: "That departure date is not valid." }, { status: 400 });
  }
  if (returnDate && Number.isNaN(returnDate.getTime())) {
    return NextResponse.json({ error: "That return date is not valid." }, { status: 400 });
  }

  const trip = await prisma.trip.create({
    data: {
      organizerId: user.id,
      title: input.title,
      departureDate,
      departureLocation: input.departureLocation?.trim() || null,
      returnDate,
      returnLocation: input.returnLocation?.trim() || null,
      groupSizeMax: input.groupSizeFlexible ? null : input.groupSizeMax,
      groupSizeFlexible: input.groupSizeFlexible,
      travelModes: serializeModes(input.travelModes),
      description: input.description,
      stops: {
        create: input.stops.map((stop, position) => ({
          location: stop.location,
          arrivalDate: stop.arrivalDate ? new Date(stop.arrivalDate) : null,
          position,
        })),
      },
      images: {
        create: input.images.map((image, position) => ({
          url: image.url,
          alt: image.alt,
          position,
        })),
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: trip.id }, { status: 201 });
}
