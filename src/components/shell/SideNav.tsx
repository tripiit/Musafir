"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { NotificationBell } from "./NotificationBell";
import { NAV_ITEMS, isActive } from "./nav-items";

/** Persistent 240px rail on md+, per the Peak Passage IITM layout spec. */
export function SideNav({
  userName,
  userEmail,
  unreadNotifications = 0,
}: {
  userName: string;
  userEmail: string;
  unreadNotifications?: number;
}) {
  const pathname = usePathname();
  const main = NAV_ITEMS.filter((i) => i.href !== "/profile");
  const profile = NAV_ITEMS.find((i) => i.href === "/profile")!;

  const linkClass = (active: boolean) =>
    `flex items-center gap-stack-md rounded-md px-stack-md py-stack-sm text-label-md transition-all ${
      active
        ? "bg-secondary-container text-on-secondary-container"
        : "text-on-surface-variant hover:bg-surface-container-highest"
    }`;

  return (
    <aside className="fixed top-0 left-0 z-40 hidden h-screen w-[240px] flex-col bg-surface-container-low p-margin-mobile shadow-card md:flex">
      {/* The bell lives here on desktop, where the mobile top bar is hidden. */}
      <div className="mb-stack-lg flex items-center justify-between gap-stack-sm">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-stack-sm text-primary">
          <Icon name="mountain" size={28} />
          <span className="truncate font-heading text-headline-md font-bold">TripMate IITM</span>
        </Link>
        <NotificationBell initialUnread={unreadNotifications} />
      </div>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-stack-sm">
        {main.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item) ? "page" : undefined}
            className={linkClass(isActive(pathname, item))}
          >
            <Icon name={item.icon} size={20} filled={isActive(pathname, item)} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t border-outline-variant pt-stack-sm">
        <Link
          href={profile.href}
          aria-current={isActive(pathname, profile) ? "page" : undefined}
          className={linkClass(isActive(pathname, profile))}
        >
          <Icon name="account_circle" size={20} />
          <span className="min-w-0">
            <span className="block truncate">{userName}</span>
            <span className="block truncate text-label-sm font-normal text-outline">
              {userEmail}
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
