"use server";

import { db } from "@/lib/db";
import { alerts } from "@ssc/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getAlerts() {
  return db.query.alerts.findMany({
    where: eq(alerts.isResolved, false),
    orderBy: (a, { desc }) => [desc(a.createdAt)],
    limit: 50,
  });
}

export async function markAsRead(id: string) {
  await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, id));
  revalidatePath("/alerts");
}
