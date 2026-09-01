import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }),
});

const SEED_DIR = path.join(process.cwd(), "public", "seed");
const CAMPUS = "IIT Mandi Campus";

/**
 * The Stitch export referenced AI photos on Google's CDN. Those are not ours to
 * ship, so the seed draws its own placeholder ridgelines instead — swap them
 * for real trip photos when you have them.
 */
function ridgelineSvg(topColor: string, bottomColor: string, seed: number) {
  const peaks = Array.from({ length: 5 }, (_, i) => {
    const x = i * 200;
    const height = 180 + ((seed * (i + 3)) % 140);
    return `${x},${420 - height} ${x + 100},420`;
  }).join(" ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${topColor}"/>
      <stop offset="100%" stop-color="${bottomColor}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="420" fill="url(#sky)"/>
  <circle cx="${120 + (seed % 500)}" cy="90" r="38" fill="#fdc003" opacity="0.85"/>
  <polygon points="0,420 ${peaks} 800,420" fill="#000c32" opacity="0.35"/>
  <polygon points="0,420 60,300 190,420 330,270 470,420 610,320 800,420" fill="#000c32" opacity="0.6"/>
  <polygon points="0,420 140,340 300,420 430,350 600,420 760,360 800,420" fill="#000c32"/>
</svg>`;
}

const PALETTES: Array<[string, string]> = [
  ["#dbe1ff", "#b4c5ff"],
  ["#ffdf9e", "#fabd00"],
  ["#c5c6d2", "#7489ce"],
  ["#e1e3e4", "#9fb2e6"],
];

async function writePlaceholder(slug: string, index: number) {
  const [top, bottom] = PALETTES[index % PALETTES.length];
  const file = `${slug}-${index + 1}.svg`;
  await writeFile(path.join(SEED_DIR, file), ridgelineSvg(top, bottom, slug.length * (index + 2)));
  return `/seed/${file}`;
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setHours(6, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

const USERS = [
  {
    email: "b24304@students.iitmandi.ac.in",
    name: "Rahul Sharma",
    branch: "B.Tech CSE",
    batchYear: 2024,
    age: 20,
    bio: "Experienced mountain rider. I head home most long weekends and like an early start.",
  },
  {
    email: "b23117@students.iitmandi.ac.in",
    name: "Anita Rao",
    branch: "B.Tech Mechanical",
    batchYear: 2023,
    age: 21,
    bio: "Trekking club regular. Happiest above 3000m.",
  },
  {
    email: "b25002@students.iitmandi.ac.in",
    name: "Imran Qureshi",
    branch: "B.Tech Civil",
    batchYear: 2025,
    age: 19,
    bio: "First year, always up for a weekend ride.",
  },
  {
    email: "s22461@students.iitmandi.ac.in",
    name: "Devika Nair",
    branch: "M.Sc Physics",
    batchYear: 2022,
    age: 23,
    bio: "Photographer. I plan trips around the light, not the itinerary.",
  },
];

const TRIPS = [
  {
    slug: "prashar",
    title: "Prashar Lake Trek",
    stops: [{ location: "Prashar Lake" }],
    organizer: 0,
    startInDays: 6,
    durationDays: 2,
    groupSizeMax: 6,
    travelModes: "bike,car",
    imageCount: 4,
    description:
      "Overnight trek up to Prashar Lake with a camp near the pagoda temple. Leaving campus at 6am Saturday, back by Sunday evening. We split fuel and food between everyone. Bring a warm layer, it drops close to zero after dark.",
    status: "open",
  },
  {
    slug: "triund",
    title: "Triund Ridge Overnighter",
    stops: [{ location: "Triund, McLeodganj" }],
    organizer: 1,
    startInDays: 13,
    durationDays: 2,
    groupSizeMax: 8,
    travelModes: "bus",
    imageCount: 3,
    description:
      "Bus to McLeodganj Friday night, climb to Triund on Saturday morning, camp on the ridge and come down Sunday. Moderate difficulty but the last kilometre is steep. Tents sorted, you bring your own sleeping bag.",
    status: "open",
  },
  {
    slug: "bir",
    title: "Bir Billing Weekend",
    stops: [{ location: "Bir Billing" }],
    organizer: 3,
    startInDays: 20,
    durationDays: 3,
    groupSizeMax: 4,
    travelModes: "cab",
    imageCount: 3,
    description:
      "Three days in Bir for paragliding and a lot of sitting in cafes. Shared cab from campus. Flights are booked on the spot, budget separately for those. Looking for people who are fine with a loose plan.",
    status: "open",
  },
  {
    slug: "spiti",
    title: "Spiti Valley Circuit",
    stops: [
      { location: "Kaza", offsetDays: 1 },
      { location: "Key Monastery", offsetDays: 3 },
      { location: "Chandratal", offsetDays: 5 },
    ],
    organizer: 1,
    startInDays: 34,
    durationDays: 7,
    groupSizeMax: null,
    groupSizeFlexible: true,
    travelModes: "car,bus",
    imageCount: 4,
    description:
      "The long one. Kaza, Key Monastery, Chandratal if the road is open. Seven days, high altitude, cold nights. Group size is flexible because we will take however many vehicles we need. Previous high-altitude experience strongly preferred.",
    status: "open",
  },
  {
    slug: "kasol",
    title: "Kasol and Kheerganga",
    stops: [{ location: "Kasol" }, { location: "Kheerganga" }],
    organizer: 2,
    startInDays: 9,
    durationDays: null, // no return date -> Duration TBD
    groupSizeMax: 5,
    travelModes: "bike",
    imageCount: 3,
    description:
      "Riding down to Kasol and then up to Kheerganga if the group is up for it. Coming back whenever we feel like it, so the duration is genuinely undecided. You need your own bike and a licence.",
    status: "open",
  },
  {
    slug: "chandigarh",
    title: "Chandigarh Airport Run",
    stops: [{ location: "Chandigarh" }],
    organizer: 0,
    startInDays: -14,
    durationDays: 1,
    groupSizeMax: 4,
    travelModes: "cab",
    imageCount: 3,
    description:
      "Shared cab to Chandigarh for the morning flights. Left campus at 6am, reached ISBT by 1pm with one stop at Sundernagar.",
    status: "completed",
  },
];

const SEEDED_EMAILS = new Set(USERS.map((u) => u.email));
const SEEDED_TITLES = new Set(TRIPS.map((t) => t.title));

/**
 * The seed wipes every table, so running it against a database holding real
 * work destroys it. Look for anything that did not come from this script and
 * refuse unless the caller explicitly asked for a reset.
 */
async function findRealData() {
  const [users, trips] = await Promise.all([
    prisma.user.findMany({ select: { email: true } }),
    prisma.trip.findMany({ select: { title: true } }),
  ]);

  return {
    users: users.filter((u) => !SEEDED_EMAILS.has(u.email)).map((u) => u.email),
    trips: trips.filter((t) => !SEEDED_TITLES.has(t.title)).map((t) => t.title),
  };
}

async function main() {
  await mkdir(SEED_DIR, { recursive: true });

  const force = process.argv.includes("--force") || process.env.SEED_FORCE === "1";
  const real = await findRealData();

  if (!force && (real.users.length > 0 || real.trips.length > 0)) {
    console.error(
      "Refusing to seed: this database contains data that did not come from the seed.\n" +
        (real.users.length ? `  accounts: ${real.users.join(", ")}\n` : "") +
        (real.trips.length ? `  trips:    ${real.trips.join(", ")}\n` : "") +
        "\nSeeding deletes every row in every table. If you really want to wipe\n" +
        "this database and start from the demo data, re-run with:\n" +
        "  npm run db:seed -- --force",
    );
    process.exitCode = 1;
    return;
  }

  // Replaces the demo data rather than stacking a second copy on top of it.
  await prisma.notification.deleteMany();
  await prisma.browseHistory.deleteMany();
  await prisma.message.deleteMany();
  await prisma.joinRequest.deleteMany();
  await prisma.tripImage.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.session.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.user.deleteMany();

  const users = [];
  for (const data of USERS) {
    users.push(await prisma.user.create({ data }));
  }

  const trips = [];
  for (const spec of TRIPS) {
    const images = [];
    for (let i = 0; i < spec.imageCount; i += 1) {
      images.push({
        url: await writePlaceholder(spec.slug, i),
        alt: `Illustrated ridgeline standing in for a photo of ${spec.stops[0].location}`,
        position: i,
      });
    }

    trips.push(
      await prisma.trip.create({
        data: {
          organizerId: users[spec.organizer].id,
          title: spec.title,
          departureDate: daysFromNow(spec.startInDays),
          departureLocation: CAMPUS,
          // Duration is derived, so the seed states the return date instead.
          returnDate:
            spec.durationDays != null
              ? daysFromNow(spec.startInDays + spec.durationDays - 1)
              : null,
          returnLocation: spec.durationDays != null ? CAMPUS : null,
          groupSizeMax: spec.groupSizeMax ?? null,
          groupSizeFlexible: spec.groupSizeFlexible ?? false,
          travelModes: spec.travelModes,
          description: spec.description,
          status: spec.status,
          stops: {
            create: spec.stops.map((stop, position) => ({
              location: stop.location,
              arrivalDate:
                "offsetDays" in stop && stop.offsetDays != null
                  ? daysFromNow(spec.startInDays + stop.offsetDays)
                  : null,
              position,
            })),
          },
          images: { create: images },
        },
      }),
    );
  }

  const prashar = trips[0];
  const [rahul, anita, imran, devika] = users;

  // ACCEPTED: Anita's request on Rahul's Prashar trek. Accepting is what opens
  // the thread, so the conversation hangs off this row.
  const acceptedRequest = await prisma.joinRequest.create({
    data: {
      tripId: prashar.id,
      requesterId: anita.id,
      organizerId: rahul.id,
      status: "accepted",
      message: "I have camped at altitude before and can bring a spare stove.",
      respondedAt: new Date(),
    },
  });
  await prisma.browseHistory.create({
    data: { tripId: prashar.id, userId: anita.id, decision: "interested" },
  });

  const script: Array<[string, string]> = [
    [anita.id, "Thanks for accepting! Is there anything I should bring?"],
    [rahul.id, "Just warm layers and a sleeping bag. I have the tents."],
    [anita.id, "Perfect. What time are we leaving campus?"],
    [rahul.id, "6am sharp from the North Campus gate."],
  ];
  for (const [senderId, content] of script) {
    await prisma.message.create({
      data: { joinRequestId: acceptedRequest.id, tripId: prashar.id, senderId, content },
    });
  }

  // A trip Anita passed on — still reachable from history, gone from her deck.
  await prisma.browseHistory.create({
    data: { tripId: trips[2].id, userId: anita.id, decision: "passed" },
  });

  // PENDING: Imran on Anita's Triund trip. No thread yet — the bell is the
  // only thing that reaches him, which is the point of the gated flow.
  await prisma.joinRequest.create({
    data: {
      tripId: trips[1].id,
      requesterId: imran.id,
      organizerId: anita.id,
      status: "pending",
      message: "First year, but I have done Triund once before. Would love to come along.",
    },
  });
  await prisma.browseHistory.create({
    data: { tripId: trips[1].id, userId: imran.id, decision: "interested" },
  });
  await prisma.notification.create({
    data: {
      userId: anita.id,
      actorId: imran.id,
      tripId: trips[1].id,
      type: "join_request_received",
      title: "New join request",
      body: `${imran.name} wants to join your trip ${trips[1].title}.`,
      href: "/requests",
    },
  });

  // DECLINED: so the Sent tab shows all three states.
  await prisma.joinRequest.create({
    data: {
      tripId: trips[4].id,
      requesterId: devika.id,
      organizerId: imran.id,
      status: "declined",
      respondedAt: new Date(),
    },
  });
  await prisma.browseHistory.create({
    data: { tripId: trips[4].id, userId: devika.id, decision: "interested" },
  });

  console.log(
    `Seeded ${users.length} students, ${trips.length} trips, ` +
      `1 accepted thread, 1 pending request and 1 declined request.\n` +
      `Sign in as any of: ${USERS.map((u) => u.email).join(", ")}\n` +
      `The OTP is printed to the dev server console.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
