import { pgTable, uuid, varchar, numeric, date, timestamp, index } from "drizzle-orm/pg-core";
import { materials } from "./materials";
import { inboundLots } from "./inbound";
import { userProfiles } from "./user-profiles";

export const productionOrders = pgTable("production_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: varchar("order_number", { length: 30 }).unique().notNull(),
  productName: varchar("product_name", { length: 200 }).notNull(),
  productLot: varchar("product_lot", { length: 50 }),
  plannedDate: date("planned_date").notNull(),
  status: varchar("status", { length: 20 }).default("planned"),
  createdBy: uuid("created_by").references(() => userProfiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const productionOrderMaterials = pgTable("production_order_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => productionOrders.id),
  materialId: uuid("material_id").notNull().references(() => materials.id),
  requiredQty: numeric("required_qty", { precision: 12, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const productionInputs = pgTable("production_inputs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => productionOrders.id),
  lotId: uuid("lot_id").notNull().references(() => inboundLots.id),
  materialId: uuid("material_id").notNull().references(() => materials.id),
  inputQuantity: numeric("input_quantity", { precision: 12, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  productLot: varchar("product_lot", { length: 50 }),
  scannedBarcode: varchar("scanned_barcode", { length: 100 }),
  inputBy: uuid("input_by").references(() => userProfiles.id),
  inputAt: timestamp("input_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_prod_inputs_lot").on(table.lotId),
  index("idx_prod_inputs_order").on(table.orderId),
  index("idx_prod_inputs_product_lot").on(table.productLot),
  index("idx_prod_inputs_material").on(table.materialId),
]);
