import { pgTable, uuid, varchar, boolean, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { suppliers } from "./suppliers";

export const materials = pgTable("materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 30 }).unique().notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 50 }),
  unit: varchar("unit", { length: 20 }).notNull(),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  storageType: varchar("storage_type", { length: 20 }).default("ambient"),
  shelfLifeDays: integer("shelf_life_days"),
  safetyStock: numeric("safety_stock", { precision: 12, scale: 3 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
