"use server";

import { db } from "@/lib/db";
import {
  productionOrders,
  productionOrderMaterials,
  productionInputs,
  inboundLots,
  inventory,
  inventoryTransactions,
  alerts,
} from "@ssc/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTodayOrders() {
  const today = new Date().toISOString().slice(0, 10);
  return db.query.productionOrders.findMany({
    where: sql`${productionOrders.status} IN ('planned', 'in_progress')`,
    with: {
      requiredMaterials: { with: { material: true } },
    },
    orderBy: (o, { asc }) => [asc(o.plannedDate)],
  });
}

export async function scanAndInput(data: {
  orderId: string;
  barcode: string;
  inputQuantity: string;
}): Promise<{ success: boolean; error?: string; errorCode?: string; lotNumber?: string }> {
  // 바코드로 LOT 조회
  const lot = await db.query.inboundLots.findFirst({
    where: eq(inboundLots.barcodeValue, data.barcode),
    with: { material: true },
  });

  if (!lot) return { success: false, error: "등록되지 않은 바코드입니다." };

  // 작업지시 조회
  const order = await db.query.productionOrders.findFirst({
    where: eq(productionOrders.id, data.orderId),
    with: { requiredMaterials: true },
  });
  if (!order) return { success: false, error: "작업지시를 찾을 수 없습니다." };

  // ERR-012: Hold/Expired/Rejected 차단
  if (["hold", "expired", "rejected"].includes(lot.status ?? "")) {
    return {
      success: false,
      error: `해당 LOT는 ${lot.status} 상태입니다. 현재 생산 투입이 불가능합니다.`,
      errorCode: "ERR-012",
    };
  }

  // ERR-045: 원료 불일치
  const requiredIds = order.requiredMaterials.map((m) => m.materialId);
  if (!requiredIds.includes(lot.materialId)) {
    return {
      success: false,
      error: "해당 작업지시에 등록되지 않은 원료입니다.",
      errorCode: "ERR-045",
    };
  }

  // 재고 차감
  const invItems = await db.query.inventory.findMany({
    where: and(eq(inventory.lotId, lot.id), eq(inventory.status, "available"), sql`${inventory.quantity}::numeric > 0`),
  });

  const totalAvail = invItems.reduce((s, i) => s + parseFloat(i.quantity), 0);
  const inputQty = parseFloat(data.inputQuantity);

  if (totalAvail < inputQty) {
    return { success: false, error: `가용 재고 부족: ${totalAvail} ${lot.unit}` };
  }

  let remaining = inputQty;
  for (const inv of invItems) {
    if (remaining <= 0) break;
    const deduct = Math.min(parseFloat(inv.quantity), remaining);
    await db.update(inventory).set({ quantity: sql`${inventory.quantity}::numeric - ${deduct}::numeric`, updatedAt: new Date() }).where(eq(inventory.id, inv.id));
    await db.insert(inventoryTransactions).values({ lotId: lot.id, materialId: lot.materialId, txType: "consume", quantity: String(-deduct), fromLocationId: inv.locationId, referenceType: "production", referenceId: data.orderId });
    remaining -= deduct;
  }

  // 투입 기록
  await db.insert(productionInputs).values({
    orderId: data.orderId,
    lotId: lot.id,
    materialId: lot.materialId,
    inputQuantity: data.inputQuantity,
    unit: lot.unit,
    productLot: order.productLot,
    scannedBarcode: data.barcode,
  });

  if (order.status === "planned") {
    await db.update(productionOrders).set({ status: "in_progress", updatedAt: new Date() }).where(eq(productionOrders.id, data.orderId));
  }

  revalidatePath("/production");
  return { success: true, lotNumber: lot.lotNumber };
}
