"use server";

import { db } from "@/lib/db";
import { locations } from "@ssc/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getLocations() {
  return db.query.locations.findMany({
    orderBy: (l, { asc }) => [asc(l.code)],
  });
}

export async function createLocation(data: {
  code: string;
  warehouse: string;
  zone?: string;
  rack?: string;
  level?: string;
  storageType?: string;
  qrCode?: string;
}) {
  await db.insert(locations).values({
    code: data.code,
    warehouse: data.warehouse,
    zone: data.zone || null,
    rack: data.rack || null,
    level: data.level || null,
    storageType: data.storageType || "ambient",
    qrCode: data.qrCode || null,
  });
  revalidatePath("/master/locations");
}

export async function updateLocation(id: string, data: Record<string, string | null | undefined>) {
  await db.update(locations).set({
    code: data.code ?? undefined,
    warehouse: data.warehouse ?? undefined,
    zone: data.zone || null,
    rack: data.rack || null,
    level: data.level || null,
    storageType: data.storageType || "ambient",
    qrCode: data.qrCode || null,
  }).where(eq(locations.id, id));
  revalidatePath("/master/locations");
}

export async function deleteLocation(id: string) {
  await db.update(locations).set({ isActive: false }).where(eq(locations.id, id));
  revalidatePath("/master/locations");
}
