import { pgTable, uuid, varchar, numeric, boolean, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { materials } from "./materials";

export const materialSpecs = pgTable("material_specs", {
  id: uuid("id").primaryKey().defaultRandom(),
  materialId: uuid("material_id").notNull().references(() => materials.id),
  testItem: varchar("test_item", { length: 100 }).notNull(),
  specType: varchar("spec_type", { length: 20 }).notNull(),
  specMin: numeric("spec_min", { precision: 15, scale: 5 }),
  specMax: numeric("spec_max", { precision: 15, scale: 5 }),
  specText: varchar("spec_text", { length: 100 }),
  unit: varchar("unit", { length: 30 }),
  isCritical: boolean("is_critical").default(false),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  unique("uq_material_test_item").on(table.materialId, table.testItem),
]);
