# TripMate IITM

Trip coordination for IIT Mandi students: post a trip, swipe through what other
students are planning, and chat with the organizer of anything you like.

Built from the Google Stitch export in [`design-ref/`](design-ref/) — the
original `code.html` and `screen.png` files are kept there as the styling
reference for every screen.

## Stack

| Layer    | Choice                                                        |
| -------- | ------------------------------------------------------------- |
| Framework| Next.js 16 (App Router) + React 19 + TypeScript               |
| Styling  | Tailwind v4, tokens in [`src/app/globals.css`](src/app/globals.css) |
| Data     | SQLite via Prisma 7 (`better-sqlite3` driver adapter)          |
| Forms    | react-hook-form + zod                                          |
| Motion   | framer-motion (the swipe deck)                                 |
| Icons    | lucide-react behind [`Icon`](src/components/ui/Icon.tsx)        |
| Mail     | nodemailer (console fallback in development)                   |

## Getting started

```bash
npm install
npm run db:push      # create dev.db from prisma/schema.prisma
npm run db:seed      # 4 students, 6 trips, 1 accepted thread + pending/declined requests
npm run dev
```

Open http://localhost:3000. Sign in with any seeded address — for example
`b24304@students.iitmandi.ac.in`. **With no SMTP configured, the OTP is printed
to the dev server console**, so watch the terminal after submitting the login
form.

To send real mail, fill in the `SMTP_*` values in `.env` (see `.env.example`).

## Product decisions

The Stitch export left several things open or contradictory. What this build settles:

1. **Branding.** Standardized on "TripMate IITM" and the newer *Peak Passage
   IITM* token set. The four older "IITM Share" screens were re-skinned rather
   than ported as a second design system.
2. **Email domain.** `@students.iitmandi.ac.in` everywhere. The mockup's login
   screen showed a shorter `@iitmandi.ac.in`, which was wrong. The domain is
   appended server-side, so signup cannot be pointed at another institution.
3. **No money.** Free coordination, not a paid ride-share: no price per seat, no
   seat booking. "Book a Seat" became **Request to Join**, and "seats left" became
   derived spot counts. `Trip` has no price field at all.
4. **Swipe sends a join request.** Left = pass, right = request to join. The
   ×/heart buttons do exactly the same thing, so the gesture is never the only
   way to act. Swiping right does **not** open a chat — see 5.
5. **Chat is accept-gated and 1:1.** A swipe right creates a `JoinRequest`
   (`pending`). Messaging unlocks only when the organizer accepts, LinkedIn-connect
   style. **The accepted request *is* the thread** — `Message.joinRequestId`
   points at it, so there is no way to message without an acceptance. A thread is
   readable only by its two participants; pending, declined, and third-party
   access all 404 identically.
6. **Two notification channels, because chat is gated.** Accepted members get a
   system message in the thread they are already coordinating in. *Pending*
   requesters have no thread at all, so the notification bell is the only thing
   that reaches them — it carries join requests, accept/decline outcomes, and
   trip edits/cancellations. (This supersedes the Round 2 decision to skip a
   notification centre; gated chat made one unavoidable.)

## Screens

| Route          | What it is                                                      |
| -------------- | --------------------------------------------------------------- |
| `/login`       | Institute email, pinned domain suffix, sends an OTP              |
| `/verify`      | 6 digit boxes — auto-advance, backspace, paste-a-whole-code      |
| `/home`        | The "Create a Trip" vs "Browse Trips" fork                       |
| `/dashboard`   | Quick actions, active trips, recent chats                        |
| `/trips/new`   | Create form with the Plan builder (min 3 photos, each with alt)  |
| `/browse`      | Swipe deck — drag, stacked cards, filter chips, end-state         |
| `/browse?rebrowse=1` | The deck again, with already-decided trips included        |
| `/trips/[id]`  | Swipeable photo carousel, Plan timeline, organizer, Request      |
| `/requests`    | Received / Sent join requests, with Accept and Decline           |
| `/chats`       | Two panes on desktop, one at a time on mobile                    |
| `/chats/[id]`  | Thread with the meet-up nudge banner (accepted requests only)    |
| `/browse/history` | Every trip you have seen, including passed ones                |
| `/trips/[id]/edit` | The create form pre-filled, owner only                       |
| `/profile`     | Avatar, bio, created trips, joined trips, sign out                |
| `/profile/edit`| Photo, name, age, branch, batch, bio — email locked              |

`/login` and `/verify` render outside the app shell; everything else sits inside
[`AppShell`](src/components/shell/AppShell.tsx) — mobile top bar + bottom nav,
240px desktop sidebar.

## Notable behaviour

- **Meet-up nudge.** Once a thread reaches 3 messages, a dismissible banner
  offers to suggest meeting in person. "Suggest Meetup" posts a `meetup` message
  visible to both sides; the banner state is stored per conversation.
- **OTP security.** Codes are stored SHA-256 hashed and salted with the email,
  expire in 10 minutes, allow 5 attempts, and requesting a new one invalidates
  the last. Verification is a constant-time compare.
- **Sessions** are opaque random tokens in an httpOnly cookie, checked against
  the `Session` table — no JWT to leak or forge.
- **Nothing is destroyed by a swipe.** A decision moves a trip from the live
  deck into `BrowseHistory`, which `/browse/history` lists. Opening a trip's
  detail page records a `viewed` entry, which deliberately does *not* remove it
  from the deck — and never downgrades an existing `passed`/`interested`
  decision back to `viewed`.
- **Cancelling sets status, never deletes.** A cancelled trip still resolves at
  `/trips/[id]` with a banner, so existing chat threads and history rows never
  become dead links. It leaves every deck, and can no longer be edited (409).
- **The hero is a carousel over every photo**, not just the cover. Swipe, or use
  the chevrons / dots / thumbnails / arrow keys. It shares the /browse deck’s
  drag thresholds via [`swipe.ts`](src/lib/swipe.ts) so both gestures feel the
  same, and clamps at both ends rather than looping.
- **The Plan is a stop list, not a single destination.** `Trip.stops` is an
  ordered `TripStop[]`; `stops[0]` is the primary destination that cards and
  filters show, with a "+N more" suffix once there is more than one. The detail
  timeline runs departure -> every stop -> return; a stop with no date renders
  as "Stop N" rather than implying precision the organizer did not give.
- **Duration is derived, never stored.** The Plan holds a departure date and a
  return date; duration is computed from them (inclusive, so same-day = 1 day)
  by `tripDurationDays` in [`format.ts`](src/lib/format.ts). There is no
  duration column and no "To be decided" checkbox — an unset return date *is*
  "Duration TBD". One source of truth, so the two can never disagree.
- **Only material edits interrupt people.** Plan changes (either date, either
  location, or the route — a stop added, removed, renamed or reordered) and
  travel mode post a system message; retitling or
  rewording the description notifies nobody. Duration is not compared directly —
  it derives from the dates, so a duration change always surfaces as a date
  change. See `describeMaterialChanges` in
  [`trip-changes.ts`](src/lib/trip-changes.ts).
- **Ownership checks return 404, not 403**, so the edit, cancel and respond
  endpoints cannot be used to probe whether an id exists.
- **Chat has exactly one gate.** `authorize()` in the messages route requires
  the caller to be one of the two participants AND the request to be
  `accepted`. Pending, declined and outsider access all return the same 404.
- **Re-browse is a local filter, not a reset.** `?rebrowse=1` lifts the deck's
  exclusion clause; it deletes no `BrowseHistory` or `JoinRequest` row. A trip
  you already requested comes back showing its status badge with the request
  button replaced — and the API refuses duplicates regardless.
- **"Liked Trips" drops declined requests** rather than greying them out; a
  rejected request lingering on the dashboard adds nothing. The full record is
  still on `/requests` → Sent.
- **Notifications are scoped by `userId` on write**, so marking one read cannot
  touch another student's row even with a guessed id.
- **The database refuses to be created by accident.** The adapter opens SQLite
  with `fileMustExist`, so running the server from the wrong working directory
  throws immediately instead of silently creating an empty database — which
  otherwise presents as "all my trips and chats disappeared".
- **The seed refuses to wipe real data.** `npm run db:seed` inspects the
  database first and aborts — naming the accounts and trips it would destroy —
  unless you pass `-- --force`.

## Deviations from the build prompt

- **Tailwind v4, not `tailwind.config.ts`.** `create-next-app` now ships
  Tailwind v4, which replaces the JS config with CSS-native `@theme`. All token
  names from `peak_passage_iitm/DESIGN.md` are preserved; only the file they
  live in changed. v4 has no per-namespace `DEFAULT`, so the export's bare
  `rounded` (0.5rem, on buttons and inputs) is `rounded-md` here.
- **Lucide instead of Material Symbols.** The icon font is ~940KB per fill
  instance for the ~40 glyphs used. [`Icon`](src/components/ui/Icon.tsx) maps the
  export's Material Symbols names onto Lucide SVGs, so call sites still read
  `<Icon name="directions_bike" />` and stay traceable to `design-ref/`.
- **No TanStack Query.** Server components cover the reads; the chat thread
  polls every 5s. Add it if the client-side data layer grows.
- **The itinerary timeline is derived** from the organizer's start date and
  duration, since the create form (per the prompt's 7-section spec) does not
  collect stop-by-stop itineraries. Add an `Itinerary` model if you want the
  mockup's literal departure/pitstop/arrival rows.
- **A destination field was added** to the create form. Without it, Browse and
  the filter chips have nothing to sort or filter on.
- **`JoinRequest` replaced `Interest`, and `Conversation` is gone.** An accepted
  request *is* the thread, so thread state (nudge banner, read receipts) lives
  on `JoinRequest` and `Message.joinRequestId` is the foreign key. That makes
  "no acceptance, no chat" structural rather than a check someone can forget.
- **`BrowseHistory` stayed a separate table.** It carries `viewed`, which has no
  join meaning, and the deck filters on it. Folding `viewed` into `JoinRequest`
  would make merely opening a trip page look like a request.
- **Departure date stayed optional.** The Plan builder would read better with it
  required, but an existing trip had no date, and forcing one on every edit
  would mean inventing data to save an unrelated change. The timeline shows
  "Departure date to be decided" instead.
- **Three dead columns remain in the database.** `durationDays`, `durationTbd`
  and `destination` are superseded by the derived duration and the stop list,
  and are read by nothing — they are kept
  only because dropping them needs `--accept-data-loss`, which would have been a
  destructive operation on a database holding real data. Their values were
  migrated into `returnDate` and `TripStop` first. Drop them whenever convenient:
  `npx prisma db push --accept-data-loss`.
- **`/profile` and `/trips/[id]/edit` are new design work.** Neither exists in
  the Stitch export — the nav bars link to "Profile" but the zip has no such
  folder, and no trip card has an edit affordance. Both were built from the §2
  tokens and the card/button patterns already established elsewhere.

## Before deploying

- **Uploads go to `public/uploads` on local disk.** That works on a single
  server but not on serverless hosts, where the filesystem is ephemeral and
  per-instance. Swap [`/api/upload`](src/app/api/upload/route.ts) for S3/R2 or
  similar before shipping to Vercel.
- **Move off SQLite** for anything multi-instance: change the `datasource`
  provider in `prisma/schema.prisma` and the adapter in
  [`src/lib/db.ts`](src/lib/db.ts).
- **Set `SMTP_*`** so real students actually receive their codes.
- **Replace the seed art.** `public/seed/*.svg` are generated placeholder
  ridgelines, not photographs.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run db:push    # sync schema to the database
npm run db:seed    # reset and re-seed demo data
npm run db:studio  # browse the database
npm run lint
```
