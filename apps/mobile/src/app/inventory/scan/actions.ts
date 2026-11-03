"use server";

import { db } from "@/lib/db";
import { inboundLots, inventory, locations } from "@ssc/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function lookupLotInventory(barcode: string) {
  const lot = await db.query.inboundLots.findFirst({
    where: eq(inboundLots.barcodeValue, barcode),
    with: { material: true },
  });

  if (!lot) return { found: false as const };

  const invItems = await db.query.inventory.findMany({
    where: and(eq(inventory.lotId, lot.id), sql`${inventory.quantity}::numeric > 0`),
    with: { location: true },
  });

  return {
    found: true as const,
    lot: {
      lotNumber: lot.lotNumber,
      status: lot.status,
      expiryDate: lot.expiryDate,
      material: { name: lot.material.name, code: lot.material.code, unit: lot.material.unit },
    },
    inventory: invItems.map((i) => ({
      quantity: i.quantity,
      status: i.status,
      location: { code: i.location.code, warehouse: i.location.warehouse },
    })),
    totalQuantity: invItems.reduce((sum, i) => sum + parseFloat(i.quantity), 0),
  };
}

export async function registerLocation(data: { lotId: string; locationCode: string }) {
  const lot = await db.query.inboundLots.findFirst({
    where: eq(inboundLots.barcodeValue, data.lotId),
    with: { material: true },
  });
  if (!lot) throw new Error("LOT를 찾을 수 없습니다.");

  const loc = await db.query.locations.findFirst({
    where: eq(locations.qrCode, data.locationCode),
  });
  if (!loc) {
    const locByCode = await db.query.locations.findFirst({
      where: eq(locations.code, data.locationCode),
    });
    if (!locByCode) throw new Error("Location을 찾을 수 없습니다.");
    await db.update(inboundLots).set({ locationId: locByCode.id, updatedAt: new Date() }).where(eq(inboundLots.id, lot.id));
    return { success: true, location: locByCode.code };
  }

  await db.update(inboundLots).set({ locationId: loc.id, updatedAt: new Date() }).where(eq(inboundLots.id, lot.id));
  return { success: true, location: loc.code };
}
