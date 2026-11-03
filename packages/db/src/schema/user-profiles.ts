import { pgTable, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey(),
  employeeId: varchar("employee_id", { length: 20 }).unique(),
  name: varchar("name", { length: 50 }).notNull(),
  department: varchar("department", { length: 50 }),
  role: varchar("role", { length: 30 }).notNull().default("operator"),
  phone: varchar("phone", { length: 20 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
