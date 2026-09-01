"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { NAV_ITEMS, isActive } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 z-50 flex w-full items-center justify-around rounded-t-lg bg-surface px-margin-mobile py-stack-sm shadow-nav md:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-150 active:scale-90 ${
              active
                ? "rounded-full bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant hover:bg-surface-container-highest rounded-full"
            }`}
          >
            <Icon name={item.icon} size={24} filled={active} />
            <span className="mt-1 text-label-sm">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
