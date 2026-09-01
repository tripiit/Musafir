import "server-only";
import { prisma } from "./db";
import type { NotificationType } from "./constants";

type CreateNotification = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  actorId?: string;
  tripId?: string;
};

/**
 * The bell in the top app bar is the only channel that reaches someone with a
 * *pending* join request — they have no chat thread yet, so a system message
 * has nowhere to land.
 */
export async function notify(input: CreateNotification) {
  // Never notify someone about their own action.
  if (input.actorId && input.actorId === input.userId) return null;

  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
      actorId: input.actorId ?? null,
      tripId: input.tripId ?? null,
    },
  });
}

export async function notifyMany(inputs: CreateNotification[]) {
  const deliverable = inputs.filter((i) => !i.actorId || i.actorId !== i.userId);
  if (deliverable.length === 0) return 0;

  await prisma.notification.createMany({
    data: deliverable.map((i) => ({
      userId: i.userId,
      type: i.type,
      title: i.title,
      body: i.body,
      href: i.href,
      actorId: i.actorId ?? null,
      tripId: i.tripId ?? null,
    })),
  });
  return deliverable.length;
}

export async function getNotifications(userId: string, take = 20) {
  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      include: { actor: { select: { name: true, photoUrl: true } } },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return {
    unreadCount,
    items: rows.map((row) => ({
      id: row.id,
      type: row.type as NotificationType,
      title: row.title,
      body: row.body,
      href: row.href,
      createdAt: row.createdAt,
      read: row.readAt !== null,
      actorName: row.actor?.name ?? null,
    })),
  };
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  await prisma.notification.updateMany({
    // Scoped to userId so a guessed id cannot mark someone else's row read.
    where: { userId, readAt: null, ...(ids?.length ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });
}
