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
import { eq, and, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// 작업지시 목록
export async function getProductionOrders() {
  return db.query.productionOrders.findMany({
    with: {
      requiredMaterials: { with: { material: true } },
      inputs: { with: { lot: true, material: true } },
    },
    orderBy: (o, { desc }) => [desc(o.createdAt)],
  });
}

// 작업지시 상세
export async function getProductionOrderById(id: string) {
  return db.query.productionOrders.findFirst({
    where: eq(productionOrders.id, id),
    with: {
      requiredMaterials: { with: { material: true } },
      inputs: { with: { lot: true, material: true } },
    },
  });
}

// 작업지시 번호 자동채번
async function generateOrderNumber(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `PO-${today}-`;
  const result = await db
    .select({ maxNum: sql<string>`MAX(SUBSTRING(order_number FROM ${prefix.length + 1}))` })
    .from(productionOrders)
    .where(sql`order_number LIKE ${prefix + "%"}`);
  const next = (parseInt(result[0]?.maxNum || "0") || 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

// 작업지시 등록
export async function createProductionOrder(data: {
  productName: string;
  productLot?: string;
  plannedDate: string;
  materials: { materialId: string; requiredQty: string; unit: string }[];
}) {
  const orderNumber = await generateOrderNumber();

  const [order] = await db
    .insert(productionOrders)
    .values({
      orderNumber,
      productName: data.productName,
      productLot: data.productLot || null,
      plannedDate: data.plannedDate,
      status: "planned",
    })
    .returning();

  if (data.materials.length > 0) {
    await db.insert(productionOrderMaterials).values(
      data.materials.map((m) => ({
        orderId: order.id,
        materialId: m.materialId,
        requiredQty: m.requiredQty,
        unit: m.unit,
      }))
    );
  }

  revalidatePath("/production");
  return order;
}

// 작업지시 상태 변경
export async function updateOrderStatus(id: string, status: string) {
  await db
    .update(productionOrders)
    .set({ status, updatedAt: new Date() })
    .where(eq(productionOrders.id, id));
  revalidatePath("/production");
}

// 생산 투입 — 핵심 로직 (검증 + 차감 + LOT 연결)
export async function processProductionInput(data: {
  orderId: string;
  lotId: string;
  scannedBarcode: string;
  inputQuantity: string;
}): Promise<{ success: boolean; error?: string; errorCode?: string }> {
  // 1. 작업지시 확인
  const order = await db.query.productionOrders.findFirst({
    where: eq(productionOrders.id, data.orderId),
    with: { requiredMaterials: true },
  });
  if (!order) return { success: false, error: "작업지시를 찾을 수 없습니다." };

  // 2. LOT 확인
  const lot = await db.query.inboundLots.findFirst({
    where: eq(inboundLots.id, data.lotId),
    with: { material: true },
  });
  if (!lot) return { success: false, error: "LOT를 찾을 수 없습니다." };

  // 3. ERR-012: Hold/Expired/Rejected LOT 투입 차단
  if (lot.status === "hold" || lot.status === "expired" || lot.status === "rejected") {
    await db.insert(alerts).values({
      alertType: "input_blocked",
      severity: "critical",
      title: "투입 불가 (Input Blocked)",
      message: `해당 LOT는 ${lot.status} 상태입니다. 품질 보류 또는 검사 미정 상태의 원재료로, 현재 생산 투입이 불가능합니다.`,
      referenceType: "lot",
      referenceId: lot.id,
    });
    return {
      success: false,
      error: `해당 LOT는 ${lot.status} 상태입니다. 품질 보류 또는 검사 미정 상태의 원재료로, 현재 생산 투입이 불가능합니다.`,
      errorCode: "ERR-012",
    };
  }

  // 4. ERR-045: 작업지시 원료 불일치 검증
  const requiredMaterialIds = order.requiredMaterials.map((m) => m.materialId);
  if (!requiredMaterialIds.includes(lot.materialId)) {
    await db.insert(alerts).values({
      alertType: "input_blocked",
      severity: "warning",
      title: "원료 불일치 (Material Mismatch)",
      message: `해당 작업지시에 등록되지 않은 원료입니다. 현재 진행 중인 작업지시서와 스캔한 원료 바코드가 일치하지 않습니다.`,
      referenceType: "lot",
      referenceId: lot.id,
    });
    return {
      success: false,
      error: "해당 작업지시에 등록되지 않은 원료입니다. 원료 바코드가 일치하지 않습니다.",
      errorCode: "ERR-045",
    };
  }

  // 5. 재고 확인 및 차감
  const invItems = await db.query.inventory.findMany({
    where: and(
      eq(inventory.lotId, data.lotId),
      eq(inventory.status, "available"),
      sql`${inventory.quantity}::numeric > 0`
    ),
  });

  const totalAvailable = invItems.reduce((sum, i) => sum + parseFloat(i.quantity), 0);
  const inputQty = parseFloat(data.inputQuantity);

  if (totalAvailable < inputQty) {
    return {
      success: false,
      error: `가용 재고 부족: 현재 ${totalAvailable} ${lot.unit}, 필요 ${inputQty} ${lot.unit}`,
    };
  }

  // 재고 차감 (FIFO — 첫번째 location부터)
  let remaining = inputQty;
  for (const inv of invItems) {
    if (remaining <= 0) break;
    const available = parseFloat(inv.quantity);
    const deduct = Math.min(available, remaining);

    await db
      .update(inventory)
      .set({
        quantity: sql`${inventory.quantity}::numeric - ${deduct}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(inventory.id, inv.id));

    await db.insert(inventoryTransactions).values({
      lotId: data.lotId,
      materialId: lot.materialId,
      txType: "consume",
      quantity: String(-deduct),
      fromLocationId: inv.locationId,
      referenceType: "production",
      referenceId: data.orderId,
    });

    remaining -= deduct;
  }

  // 6. 투입 이력 등록 (원료 LOT → 제품 LOT 연결)
  await db.insert(productionInputs).values({
    orderId: data.orderId,
    lotId: data.lotId,
    materialId: lot.materialId,
    inputQuantity: data.inputQuantity,
    unit: lot.unit,
    productLot: order.productLot,
    scannedBarcode: data.scannedBarcode,
  });

  // 작업지시 상태를 in_progress로 변경
  if (order.status === "planned") {
    await db
      .update(productionOrders)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(productionOrders.id, data.orderId));
  }

  revalidatePath("/production");
  revalidatePath("/inventory");

  return { success: true };
}
