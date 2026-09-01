import { AppShell } from "@/components/shell/AppShell";
import { requireUser } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/notifications";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unreadNotifications = await getUnreadNotificationCount(user.id);

  return (
    <AppShell user={user} unreadNotifications={unreadNotifications}>
      {children}
    </AppShell>
  );
}
