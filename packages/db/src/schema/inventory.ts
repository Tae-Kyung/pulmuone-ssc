import { pgTable, uuid, varchar, numeric, text, timestamp, index, unique } from "drizzle-orm/pg-core";
import { inboundLots } from "./inbound";
import { materials } from "./materials";
import { locations } from "./locations";
import { userProfiles } from "./user-profiles";

export const inventory = pgTable("inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  lotId: uuid("lot_id").notNull().references(() => inboundLots.id),
  materialId: uuid("material_id").notNull().references(() => materials.id),
  locationId: uuid("location_id").notNull().references(() => locations.id),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull().default("0"),
  status: varchar("status", { length: 20 }).notNull().default("available"),
  lastMovedAt: timestamp("last_moved_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  unique("uq_inventory_lot_location").on(table.lotId, table.locationId),
  index("idx_inventory_material").on(table.materialId),
  index("idx_inventory_lot").on(table.lotId),
  index("idx_inventory_location").on(table.locationId),
  index("idx_inventory_status").on(table.status),
]);

export const inventoryTransactions = pgTable("inventory_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  lotId: uuid("lot_id").notNull().references(() => inboundLots.id),
  materialId: uuid("material_id").notNull().references(() => materials.id),
  txType: varchar("tx_type", { length: 20 }).notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  fromLocationId: uuid("from_location_id").references(() => locations.id),
  toLocationId: uuid("to_location_id").references(() => locations.id),
  referenceType: varchar("reference_type", { length: 30 }),
  referenceId: uuid("reference_id"),
  performedBy: uuid("performed_by").references(() => userProfiles.id),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_inventory_tx_lot").on(table.lotId),
  index("idx_inventory_tx_type").on(table.txType),
  index("idx_inventory_tx_created").on(table.createdAt),
]);
