import { pgTable, uuid, varchar, numeric, boolean, text, timestamp } from "drizzle-orm/pg-core";
import { inboundLots } from "./inbound";
import { materials } from "./materials";
import { materialSpecs } from "./material-specs";
import { userProfiles } from "./user-profiles";

export const coaInspections = pgTable("coa_inspections", {
  id: uuid("id").primaryKey().defaultRandom(),
  lotId: uuid("lot_id").notNull().references(() => inboundLots.id),
  materialId: uuid("material_id").notNull().references(() => materials.id),
  imagePath: text("image_path").notNull(),
  ocrStatus: varchar("ocr_status", { length: 20 }).default("pending"),
  overallResult: varchar("overall_result", { length: 20 }),
  avgConfidence: numeric("avg_confidence", { precision: 5, scale: 2 }),
  reviewedBy: uuid("reviewed_by").references(() => userProfiles.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewComment: text("review_comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const coaInspectionItems = pgTable("coa_inspection_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  inspectionId: uuid("inspection_id").notNull().references(() => coaInspections.id, { onDelete: "cascade" }),
  specId: uuid("spec_id").notNull().references(() => materialSpecs.id),
  testItem: varchar("test_item", { length: 100 }).notNull(),
  specCriteria: varchar("spec_criteria", { length: 100 }),
  coaValue: varchar("coa_value", { length: 100 }),
  coaNumeric: numeric("coa_numeric", { precision: 15, scale: 5 }),
  status: varchar("status", { length: 10 }).notNull(),
  ocrConfidence: numeric("ocr_confidence", { precision: 5, scale: 2 }),
  isAlert: boolean("is_alert").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
