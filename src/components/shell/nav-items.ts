import type { IconName } from "@/components/ui/Icon";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Extra path prefixes that should light this tab up. */
  matches?: string[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: "home", matches: ["/home"] },
  { href: "/browse", label: "Browse", icon: "swipe" },
  { href: "/trips/new", label: "Create", icon: "add_circle" },
  { href: "/chats", label: "Chats", icon: "chat_bubble" },
  { href: "/profile", label: "Profile", icon: "account_circle" },
];

export function isActive(pathname: string, item: NavItem) {
  const candidates = [item.href, ...(item.matches ?? [])];
  return candidates.some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}
