import { pgTable, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  warehouse: varchar("warehouse", { length: 50 }).notNull(),
  zone: varchar("zone", { length: 50 }),
  rack: varchar("rack", { length: 50 }),
  level: varchar("level", { length: 20 }),
  storageType: varchar("storage_type", { length: 20 }).default("ambient"),
  qrCode: varchar("qr_code", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
