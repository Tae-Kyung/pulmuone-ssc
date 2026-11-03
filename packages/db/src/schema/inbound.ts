import { pgTable, uuid, varchar, numeric, date, text, timestamp, index } from "drizzle-orm/pg-core";
import { materials } from "./materials";
import { suppliers } from "./suppliers";
import { userProfiles } from "./user-profiles";
import { locations } from "./locations";

export const inboundReceipts = pgTable("inbound_receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  receiptNumber: varchar("receipt_number", { length: 30 }).unique().notNull(),
  materialId: uuid("material_id").notNull().references(() => materials.id),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id),
  receivedDate: date("received_date").notNull(),
  totalQuantity: numeric("total_quantity", { precision: 12, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  receivedBy: uuid("received_by").references(() => userProfiles.id),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const inboundLots = pgTable("inbound_lots", {
  id: uuid("id").primaryKey().defaultRandom(),
  receiptId: uuid("receipt_id").notNull().references(() => inboundReceipts.id),
  lotNumber: varchar("lot_number", { length: 50 }).unique().notNull(),
  supplierLot: varchar("supplier_lot", { length: 100 }),
  materialId: uuid("material_id").notNull().references(() => materials.id),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  manufactureDate: date("manufacture_date"),
  expiryDate: date("expiry_date"),
  barcodeValue: varchar("barcode_value", { length: 100 }).unique(),
  barcodeType: varchar("barcode_type", { length: 10 }).default("QR"),
  status: varchar("status", { length: 20 }).default("inspection"),
  locationId: uuid("location_id").references(() => locations.id),
  coaId: uuid("coa_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_inbound_lots_material").on(table.materialId),
  index("idx_inbound_lots_status").on(table.status),
  index("idx_inbound_lots_expiry").on(table.expiryDate),
  index("idx_inbound_lots_barcode").on(table.barcodeValue),
  index("idx_inbound_lots_location").on(table.locationId),
]);
