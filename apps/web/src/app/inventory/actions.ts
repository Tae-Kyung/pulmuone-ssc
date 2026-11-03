"use server";

import { db } from "@/lib/db";
import {
  inventory,
  inventoryTransactions,
  inboundLots,
  materials,
  locations,
  alerts,
} from "@ssc/db/schema";
import { eq, and, sql, desc, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// 현재고 조회 (LOT x Location)
export async function getInventory() {
  return db.query.inventory.findMany({
    with: {
      lot: true,
      material: true,
      location: true,
    },
    orderBy: (i, { desc }) => [desc(i.updatedAt)],
  });
}

// 재고 이력 조회
export async function getTransactions(limit = 100) {
  return db.query.inventoryTransactions.findMany({
    with: {
      lot: true,
      material: true,
      fromLocation: true,
      toLocation: true,
    },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit,
  });
}

// 입고 → 재고 등록 (LOT를 Location에 배치)
export async function registerInventory(data: {
  lotId: string;
  materialId: string;
  locationId: string;
  quantity: string;
}) {
  const qty = data.quantity;

  // upsert: 같은 LOT+Location이면 수량 합산
  const existing = await db.query.inventory.findFirst({
    where: and(eq(inventory.lotId, data.lotId), eq(inventory.locationId, data.locationId)),
  });

  if (existing) {
    await db
      .update(inventory)
      .set({
        quantity: sql`${inventory.quantity}::numeric + ${qty}::numeric`,
        lastMovedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(inventory.id, existing.id));
  } else {
    await db.insert(inventory).values({
      lotId: data.lotId,
      materialId: data.materialId,
      locationId: data.locationId,
      quantity: qty,
      status: "available",
    });
  }

  // LOT의 location 업데이트
  await db
    .update(inboundLots)
    .set({ locationId: data.locationId, updatedAt: new Date() })
    .where(eq(inboundLots.id, data.lotId));

  // 이력 기록
  await db.insert(inventoryTransactions).values({
    lotId: data.lotId,
    materialId: data.materialId,
    txType: "inbound",
    quantity: qty,
    toLocationId: data.locationId,
    referenceType: "receipt",
  });

  revalidatePath("/inventory");
}

// 재고 이동 (Location A → Location B)
export async function moveInventory(data: {
  lotId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: string;
}) {
  const qty = parseFloat(data.quantity);

  // 출발지 재고 확인
  const source = await db.query.inventory.findFirst({
    where: and(eq(inventory.lotId, data.lotId), eq(inventory.locationId, data.fromLocationId)),
  });

  if (!source || parseFloat(source.quantity) < qty) {
    throw new Error("출발지 재고가 부족합니다.");
  }

  // 출발지 차감
  await db
    .update(inventory)
    .set({
      quantity: sql`${inventory.quantity}::numeric - ${qty}::numeric`,
      updatedAt: new Date(),
    })
    .where(eq(inventory.id, source.id));

  // 도착지 추가 (upsert)
  const dest = await db.query.inventory.findFirst({
    where: and(eq(inventory.lotId, data.lotId), eq(inventory.locationId, data.toLocationId)),
  });

  if (dest) {
    await db
      .update(inventory)
      .set({
        quantity: sql`${inventory.quantity}::numeric + ${qty}::numeric`,
        lastMovedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(inventory.id, dest.id));
  } else {
    const lot = await db.query.inboundLots.findFirst({ where: eq(inboundLots.id, data.lotId) });
    await db.insert(inventory).values({
      lotId: data.lotId,
      materialId: lot!.materialId,
      locationId: data.toLocationId,
      quantity: String(qty),
      status: source.status,
    });
  }

  // LOT location 업데이트
  await db
    .update(inboundLots)
    .set({ locationId: data.toLocationId, updatedAt: new Date() })
    .where(eq(inboundLots.id, data.lotId));

  // 이력
  await db.insert(inventoryTransactions).values({
    lotId: data.lotId,
    materialId: source.materialId,
    txType: "move",
    quantity: String(qty),
    fromLocationId: data.fromLocationId,
    toLocationId: data.toLocationId,
  });

  revalidatePath("/inventory");
}

// 재고 상태 변경 (hold, release 등)
export async function updateInventoryStatus(
  inventoryId: string,
  newStatus: string,
  reason?: string
) {
  const item = await db.query.inventory.findFirst({ where: eq(inventory.id, inventoryId) });
  if (!item) throw new Error("재고를 찾을 수 없습니다.");

  await db
    .update(inventory)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(inventory.id, inventoryId));

  // LOT 상태도 동기화
  await db
    .update(inboundLots)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(inboundLots.id, item.lotId));

  const txType = newStatus === "hold" ? "hold" : newStatus === "available" ? "release" : "reject";
  await db.insert(inventoryTransactions).values({
    lotId: item.lotId,
    materialId: item.materialId,
    txType,
    quantity: "0",
    fromLocationId: item.locationId,
    notes: reason || null,
  });

  revalidatePath("/inventory");
}

// 소비기한 임박 LOT 조회
export async function getExpiringLots(daysAhead = 30) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);

  return db.query.inboundLots.findMany({
    where: and(
      sql`${inboundLots.expiryDate}::date <= ${targetDate.toISOString().slice(0, 10)}::date`,
      sql`${inboundLots.expiryDate}::date >= CURRENT_DATE`,
      sql`${inboundLots.status} IN ('available', 'inspection')`
    ),
    with: { material: true, location: true },
    orderBy: (l, { asc }) => [asc(l.expiryDate)],
  });
}

// LOT로 재고 조회 (모바일용)
export async function getInventoryByLot(lotId: string) {
  return db.query.inventory.findMany({
    where: and(eq(inventory.lotId, lotId), gt(inventory.quantity, "0")),
    with: { material: true, location: true, lot: true },
  });
}
