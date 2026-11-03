"use server";

import { db } from "@/lib/db";
import { inboundReceipts, inboundLots, coaInspections, inventory, alerts } from "@ssc/db/schema";
import { eq, sql, and, desc } from "drizzle-orm";

export async function getDashboardData() {
  const today = new Date().toISOString().slice(0, 10);

  // KPI 카드
  const [todayReceipts] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(inboundReceipts)
    .where(sql`${inboundReceipts.receivedDate}::text = ${today}`);

  const [ocrCompleted] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(coaInspections)
    .where(eq(coaInspections.ocrStatus, "completed"));

  const [coaErrors] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(coaInspections)
    .where(eq(coaInspections.overallResult, "fail"));

  const [coaPending] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(coaInspections)
    .where(eq(coaInspections.ocrStatus, "pending"));

  // 최근 입고 원료 + COA 상태
  const recentReceipts = await db.query.inboundReceipts.findMany({
    with: {
      material: true,
      supplier: true,
      lots: {
        with: {
          coaInspection: true,
        },
      },
    },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
    limit: 10,
  });

  // 최근 알림
  const recentAlerts = await db.query.alerts.findMany({
    where: eq(alerts.isResolved, false),
    orderBy: (a, { desc }) => [desc(a.createdAt)],
    limit: 5,
  });

  // 재고 상태 요약
  const inventorySummary = await db
    .select({
      status: inventory.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(inventory)
    .where(sql`${inventory.quantity}::numeric > 0`)
    .groupBy(inventory.status);

  return {
    kpi: {
      todayReceipts: Number(todayReceipts.count),
      ocrCompleted: Number(ocrCompleted.count),
      coaErrors: Number(coaErrors.count),
      coaPending: Number(coaPending.count),
    },
    recentReceipts,
    recentAlerts,
    inventorySummary,
  };
}
