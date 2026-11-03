import { pgTable, uuid, varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { userProfiles } from "./user-profiles";

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  alertType: varchar("alert_type", { length: 30 }).notNull(),
  severity: varchar("severity", { length: 10 }).notNull().default("warning"),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  referenceType: varchar("reference_type", { length: 30 }),
  referenceId: uuid("reference_id"),
  isRead: boolean("is_read").default(false),
  isResolved: boolean("is_resolved").default(false),
  targetUserId: uuid("target_user_id").references(() => userProfiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
}, (table) => [
  index("idx_alerts_type").on(table.alertType),
  index("idx_alerts_unread").on(table.isRead, table.isResolved),
  index("idx_alerts_target").on(table.targetUserId),
]);
