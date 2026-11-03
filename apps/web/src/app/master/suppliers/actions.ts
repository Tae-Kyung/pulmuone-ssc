"use server";

import { db } from "@/lib/db";
import { suppliers } from "@ssc/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSuppliers() {
  return db.query.suppliers.findMany({
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });
}

export async function createSupplier(data: {
  code: string;
  name: string;
  businessNumber?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
}) {
  await db.insert(suppliers).values(data);
  revalidatePath("/master/suppliers");
}

export async function updateSupplier(
  id: string,
  data: {
    code?: string;
    name?: string;
    businessNumber?: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    address?: string | null;
    isActive?: boolean;
  }
) {
  await db.update(suppliers).set({ ...data, updatedAt: new Date() }).where(eq(suppliers.id, id));
  revalidatePath("/master/suppliers");
}

export async function deleteSupplier(id: string) {
  await db.update(suppliers).set({ isActive: false, updatedAt: new Date() }).where(eq(suppliers.id, id));
  revalidatePath("/master/suppliers");
}
