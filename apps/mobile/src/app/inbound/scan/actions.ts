"use server";

import { db } from "@/lib/db";
import { inboundLots } from "@ssc/db/schema";
import { eq } from "drizzle-orm";

export async function lookupBarcode(barcode: string) {
  const lot = await db.query.inboundLots.findFirst({
    where: eq(inboundLots.barcodeValue, barcode),
    with: {
      material: true,
      receipt: { with: { supplier: true } },
      location: true,
    },
  });

  if (!lot) return { found: false as const };

  return {
    found: true as const,
    lot: {
      id: lot.id,
      lotNumber: lot.lotNumber,
      supplierLot: lot.supplierLot,
      quantity: lot.quantity,
      unit: lot.unit,
      manufactureDate: lot.manufactureDate,
      expiryDate: lot.expiryDate,
      status: lot.status,
      material: { name: lot.material.name, code: lot.material.code },
      supplier: { name: lot.receipt.supplier.name },
      location: lot.location ? { code: lot.location.code, warehouse: lot.location.warehouse } : null,
    },
  };
}

export async function confirmInbound(lotId: string) {
  await db
    .update(inboundLots)
    .set({ status: "inspection", updatedAt: new Date() })
    .where(eq(inboundLots.id, lotId));
  return { success: true };
}
