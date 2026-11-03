"use server";

import { db } from "@/lib/db";
import { userProfiles } from "@ssc/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export async function getUsers() {
  return db.query.userProfiles.findMany({
    orderBy: (u, { desc }) => [desc(u.createdAt)],
  });
}

export async function createUser(data: {
  employeeId?: string;
  name: string;
  department?: string;
  role: string;
  phone?: string;
}) {
  await db.insert(userProfiles).values({
    id: randomUUID(),
    employeeId: data.employeeId || null,
    name: data.name,
    department: data.department || null,
    role: data.role,
    phone: data.phone || null,
  });
  revalidatePath("/master/users");
}

export async function updateUser(id: string, data: Record<string, string | null | undefined>) {
  await db.update(userProfiles).set({
    employeeId: data.employeeId || null,
    name: data.name ?? undefined,
    department: data.department || null,
    role: data.role ?? undefined,
    phone: data.phone || null,
    updatedAt: new Date(),
  }).where(eq(userProfiles.id, id));
  revalidatePath("/master/users");
}

export async function deleteUser(id: string) {
  await db.update(userProfiles).set({ isActive: false, updatedAt: new Date() }).where(eq(userProfiles.id, id));
  revalidatePath("/master/users");
}
