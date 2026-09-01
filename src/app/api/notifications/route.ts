import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getNotifications, markNotificationsRead } from "@/lib/notifications";
import { markNotificationsSchema } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { items, unreadCount } = await getNotifications(user.id);
  return NextResponse.json({
    unreadCount,
    items: items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
  });
}

/** Marks notifications read — all of them, or just the ids given. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = markNotificationsSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await markNotificationsRead(user.id, parsed.data.ids);
  return NextResponse.json({ ok: true });
}
