import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { NotificationBell } from "./NotificationBell";

/** Mobile-only app bar; on md+ the SideNav carries the wordmark instead. */
export function TopBar({ unreadNotifications = 0 }: { unreadNotifications?: number }) {
  return (
    <header className="fixed top-0 z-50 flex h-[60px] w-full items-center justify-between bg-surface px-margin-mobile shadow-sm md:hidden">
      <Link href="/dashboard" className="flex items-center gap-stack-sm text-primary">
        <Icon name="mountain" size={24} />
        <span className="font-heading text-headline-md font-bold">TripMate IITM</span>
      </Link>
      <NotificationBell initialUnread={unreadNotifications} />
    </header>
  );
}
