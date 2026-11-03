"use server";

import { db } from "@/lib/db";
import { productionInputs, inboundLots, productionOrders } from "@ssc/db/schema";
import { eq, sql } from "drizzle-orm";

// 정방향 추적: 원료 LOT → 어떤 제품에 사용되었는가
export async function traceForward(lotNumber: string) {
  const lot = await db.query.inboundLots.findFirst({
    where: eq(inboundLots.lotNumber, lotNumber),
    with: {
      material: true,
      receipt: { with: { supplier: true } },
    },
  });

  if (!lot) return { found: false as const };

  const inputs = await db.query.productionInputs.findMany({
    where: eq(productionInputs.lotId, lot.id),
    with: {
      order: true,
      material: true,
    },
    orderBy: (i, { desc }) => [desc(i.inputAt)],
  });

  return {
    found: true as const,
    lot: {
      lotNumber: lot.lotNumber,
      supplierLot: lot.supplierLot,
      materialName: lot.material.name,
      materialCode: lot.material.code,
      supplierName: lot.receipt.supplier.name,
      manufactureDate: lot.manufactureDate,
      expiryDate: lot.expiryDate,
      status: lot.status,
      quantity: lot.quantity,
      unit: lot.unit,
    },
    products: inputs.map((inp) => ({
      productName: inp.order.productName,
      productLot: inp.productLot,
      orderNumber: inp.order.orderNumber,
      inputQuantity: inp.inputQuantity,
      unit: inp.unit,
      inputAt: inp.inputAt,
      orderStatus: inp.order.status,
    })),
  };
}

// 역방향 추적: 제품 LOT → 어떤 원료가 사용되었는가
export async function traceBackward(productLot: string) {
  const inputs = await db.query.productionInputs.findMany({
    where: eq(productionInputs.productLot, productLot),
    with: {
      lot: {
        with: {
          material: true,
          receipt: { with: { supplier: true } },
        },
      },
      order: true,
      material: true,
    },
    orderBy: (i, { desc }) => [desc(i.inputAt)],
  });

  if (inputs.length === 0) return { found: false as const };

  const order = inputs[0].order;

  return {
    found: true as const,
    product: {
      productName: order.productName,
      productLot,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
    },
    materials: inputs.map((inp) => ({
      materialName: inp.lot.material.name,
      materialCode: inp.lot.material.code,
      lotNumber: inp.lot.lotNumber,
      supplierLot: inp.lot.supplierLot,
      supplierName: inp.lot.receipt.supplier.name,
      manufactureDate: inp.lot.manufactureDate,
      expiryDate: inp.lot.expiryDate,
      lotStatus: inp.lot.status,
      inputQuantity: inp.inputQuantity,
      unit: inp.unit,
      inputAt: inp.inputAt,
    })),
  };
}

// 모의회수: 원료 LOT → 영향받는 모든 제품 + 해당 제품에 사용된 모든 원료
export async function simulateRecall(lotNumber: string) {
  const forwardResult = await traceForward(lotNumber);
  if (!forwardResult.found) return { found: false as const };

  // 영향받는 제품 LOT들
  const affectedProductLots = forwardResult.products
    .map((p) => p.productLot)
    .filter((pl): pl is string => !!pl);

  // 각 제품에 사용된 다른 원료들도 추적
  const affectedProducts: {
    productName: string;
    productLot: string;
    orderNumber: string;
    allMaterials: {
      materialName: string;
      lotNumber: string;
      supplierName: string;
      isRecallTarget: boolean;
    }[];
  }[] = [];

  for (const productLot of [...new Set(affectedProductLots)]) {
    const backward = await traceBackward(productLot);
    if (backward.found) {
      affectedProducts.push({
        productName: backward.product.productName,
        productLot,
        orderNumber: backward.product.orderNumber,
        allMaterials: backward.materials.map((m) => ({
          materialName: m.materialName,
          lotNumber: m.lotNumber,
          supplierName: m.supplierName,
          isRecallTarget: m.lotNumber === lotNumber,
        })),
      });
    }
  }

  return {
    found: true as const,
    recallTarget: forwardResult.lot,
    affectedProductCount: affectedProducts.length,
    affectedProducts,
  };
}

// LOT 번호 검색 (자동완성용)
export async function searchLots(query: string) {
  if (!query || query.length < 2) return [];
  return db.query.inboundLots.findMany({
    where: sql`${inboundLots.lotNumber} ILIKE ${"%" + query + "%"}`,
    with: { material: true },
    limit: 10,
  });
}

// 제품 LOT 검색
export async function searchProductLots(query: string) {
  if (!query || query.length < 2) return [];
  const orders = await db.query.productionOrders.findMany({
    where: sql`${productionOrders.productLot} ILIKE ${"%" + query + "%"}`,
    limit: 10,
  });
  return orders.filter((o) => o.productLot);
}
