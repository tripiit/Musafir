import { BottomNav } from "./BottomNav";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";

/**
 * One shell for every signed-in screen: mobile top bar + bottom nav, desktop
 * 240px rail. The auth screens deliberately render outside it.
 *
 * /requests is deliberately NOT a nav item — it is reached from the tab at the
 * top of /chats and from the notification bell, per the spec.
 */
export function AppShell({
  user,
  unreadNotifications,
  children,
}: {
  user: { name: string; email: string };
  unreadNotifications: number;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background md:pl-[240px]">
      <TopBar unreadNotifications={unreadNotifications} />
      <SideNav
        userName={user.name}
        userEmail={user.email}
        unreadNotifications={unreadNotifications}
      />
      <div className="pt-[60px] pb-[80px] md:pt-0 md:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}
