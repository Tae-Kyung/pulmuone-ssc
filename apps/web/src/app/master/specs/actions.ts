"use server";

import { db } from "@/lib/db";
import { materialSpecs } from "@ssc/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSpecs() {
  return db.query.materialSpecs.findMany({
    with: { material: true },
    orderBy: (s, { asc }) => [asc(s.sortOrder)],
  });
}

export async function getSpecsByMaterial(materialId: string) {
  return db.query.materialSpecs.findMany({
    where: eq(materialSpecs.materialId, materialId),
    orderBy: (s, { asc }) => [asc(s.sortOrder)],
  });
}

export async function createSpec(data: {
  materialId: string;
  testItem: string;
  specType: string;
  specMin?: string;
  specMax?: string;
  specText?: string;
  unit?: string;
  isCritical?: string;
  sortOrder?: string;
}) {
  await db.insert(materialSpecs).values({
    materialId: data.materialId,
    testItem: data.testItem,
    specType: data.specType,
    specMin: data.specMin || null,
    specMax: data.specMax || null,
    specText: data.specText || null,
    unit: data.unit || null,
    isCritical: data.isCritical === "on",
    sortOrder: data.sortOrder ? parseInt(data.sortOrder) : 0,
  });
  revalidatePath("/master/specs");
}

export async function updateSpec(id: string, data: Record<string, string | null | undefined>) {
  await db.update(materialSpecs).set({
    testItem: data.testItem ?? undefined,
    specType: data.specType ?? undefined,
    specMin: data.specMin || null,
    specMax: data.specMax || null,
    specText: data.specText || null,
    unit: data.unit || null,
    isCritical: data.isCritical === "on",
    sortOrder: data.sortOrder ? parseInt(data.sortOrder) : 0,
  }).where(eq(materialSpecs.id, id));
  revalidatePath("/master/specs");
}

export async function deleteSpec(id: string) {
  await db.update(materialSpecs).set({ isActive: false }).where(eq(materialSpecs.id, id));
  revalidatePath("/master/specs");
}
