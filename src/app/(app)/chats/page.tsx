import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Chats · TripMate IITM" };

/**
 * The desktop placeholder pane. On mobile the list occupies the whole screen,
 * so this is hidden below md.
 */
export default function ChatsIndexPage() {
  return (
    <section className="hidden flex-1 flex-col items-center justify-center bg-surface p-margin-desktop text-center md:flex">
      <Icon name="forum" size={40} className="mb-stack-sm text-outline" />
      <h1 className="font-heading text-headline-md text-on-background">Pick a conversation</h1>
      <p className="mt-stack-xs max-w-sm text-body-sm text-on-surface-variant">
        Each thread is between you and one organizer about one trip. Chat opens once a join request
        is accepted.
      </p>
    </section>
  );
}
