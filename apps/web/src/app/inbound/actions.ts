"use server";

import { db } from "@/lib/db";
import { inboundReceipts, inboundLots, materials, suppliers } from "@ssc/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getReceipts() {
  return db.query.inboundReceipts.findMany({
    with: { material: true, supplier: true, lots: true },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });
}

export async function getReceiptById(id: string) {
  return db.query.inboundReceipts.findFirst({
    where: eq(inboundReceipts.id, id),
    with: {
      material: { with: { specs: true } },
      supplier: true,
      lots: {
        with: {
          location: true,
          coaInspection: { with: { items: true } },
        },
      },
    },
  });
}

export async function getLotByBarcode(barcode: string) {
  return db.query.inboundLots.findFirst({
    where: eq(inboundLots.barcodeValue, barcode),
    with: { material: true, receipt: { with: { supplier: true } }, location: true },
  });
}

async function generateReceiptNumber(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `RCV-${today}-`;
  const result = await db
    .select({ maxNum: sql<string>`MAX(SUBSTRING(receipt_number FROM ${prefix.length + 1}))` })
    .from(inboundReceipts)
    .where(sql`receipt_number LIKE ${prefix + "%"}`);
  const next = (parseInt(result[0]?.maxNum || "0") || 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

async function generateLotNumber(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `LOT-${today}-`;
  const result = await db
    .select({ maxNum: sql<string>`MAX(SUBSTRING(lot_number FROM ${prefix.length + 1}))` })
    .from(inboundLots)
    .where(sql`lot_number LIKE ${prefix + "%"}`);
  const next = (parseInt(result[0]?.maxNum || "0") || 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

function generateBarcodeValue(lotNumber: string): string {
  return `PM-${lotNumber}`;
}

export async function createReceipt(data: {
  materialId: string;
  supplierId: string;
  receivedDate: string;
  totalQuantity: string;
  unit: string;
  notes?: string;
}) {
  const receiptNumber = await generateReceiptNumber();
  const [receipt] = await db
    .insert(inboundReceipts)
    .values({
      receiptNumber,
      materialId: data.materialId,
      supplierId: data.supplierId,
      receivedDate: data.receivedDate,
      totalQuantity: data.totalQuantity,
      unit: data.unit,
      status: "pending",
      notes: data.notes || null,
    })
    .returning();
  revalidatePath("/inbound");
  return receipt;
}

export async function createLot(data: {
  receiptId: string;
  materialId: string;
  supplierLot?: string;
  quantity: string;
  unit: string;
  manufactureDate?: string;
  expiryDate?: string;
}) {
  const lotNumber = await generateLotNumber();
  const barcodeValue = generateBarcodeValue(lotNumber);
  const [lot] = await db
    .insert(inboundLots)
    .values({
      receiptId: data.receiptId,
      lotNumber,
      supplierLot: data.supplierLot || null,
      materialId: data.materialId,
      quantity: data.quantity,
      unit: data.unit,
      manufactureDate: data.manufactureDate || null,
      expiryDate: data.expiryDate || null,
      barcodeValue,
      barcodeType: "QR",
      status: "inspection",
    })
    .returning();
  revalidatePath("/inbound");
  return lot;
}

export async function updateReceiptStatus(id: string, status: string) {
  await db
    .update(inboundReceipts)
    .set({ status, updatedAt: new Date() })
    .where(eq(inboundReceipts.id, id));
  revalidatePath("/inbound");
}

export async function updateLotStatus(id: string, status: string) {
  await db
    .update(inboundLots)
    .set({ status, updatedAt: new Date() })
    .where(eq(inboundLots.id, id));
  revalidatePath("/inbound");
}

export async function getMaterialsForSelect() {
  return db.query.materials.findMany({
    where: eq(materials.isActive, true),
    orderBy: (m, { asc }) => [asc(m.name)],
  });
}

export async function getSuppliersForSelect() {
  return db.query.suppliers.findMany({
    where: eq(suppliers.isActive, true),
    orderBy: (s, { asc }) => [asc(s.name)],
  });
}
