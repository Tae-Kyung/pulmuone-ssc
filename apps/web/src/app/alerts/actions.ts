"use server";

import { db } from "@/lib/db";
import { alerts } from "@ssc/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getAlerts() {
  return db.query.alerts.findMany({
    orderBy: (a, { desc }) => [desc(a.createdAt)],
    limit: 200,
  });
}

export async function markAsRead(id: string) {
  await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, id));
  revalidatePath("/alerts");
}

export async function resolveAlert(id: string) {
  await db.update(alerts).set({ isResolved: true, resolvedAt: new Date() }).where(eq(alerts.id, id));
  revalidatePath("/alerts");
}

export async function markAllRead() {
  await db.update(alerts).set({ isRead: true }).where(eq(alerts.isRead, false));
  revalidatePath("/alerts");
}
