"use server";

import { db } from "@/lib/db";
import { materials } from "@ssc/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getMaterials() {
  return db.query.materials.findMany({
    with: { supplier: true },
    orderBy: (m, { desc }) => [desc(m.createdAt)],
  });
}

export async function createMaterial(data: {
  code: string;
  name: string;
  category?: string;
  unit: string;
  supplierId?: string;
  storageType?: string;
  shelfLifeDays?: string;
  safetyStock?: string;
}) {
  await db.insert(materials).values({
    code: data.code,
    name: data.name,
    category: data.category || null,
    unit: data.unit,
    supplierId: data.supplierId || null,
    storageType: data.storageType || "ambient",
    shelfLifeDays: data.shelfLifeDays ? parseInt(data.shelfLifeDays) : null,
    safetyStock: data.safetyStock || null,
  });
  revalidatePath("/master/materials");
}

export async function updateMaterial(
  id: string,
  data: Record<string, string | null | undefined>
) {
  await db.update(materials).set({
    ...data,
    shelfLifeDays: data.shelfLifeDays ? parseInt(data.shelfLifeDays) : null,
    supplierId: data.supplierId || null,
    updatedAt: new Date(),
  }).where(eq(materials.id, id));
  revalidatePath("/master/materials");
}

export async function deleteMaterial(id: string) {
  await db.update(materials).set({ isActive: false, updatedAt: new Date() }).where(eq(materials.id, id));
  revalidatePath("/master/materials");
}
