import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const bookingRequests = mysqlTable("bookingRequests", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  serviceId: varchar("serviceId", { length: 32 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  time: varchar("time", { length: 12 }).notNull(),
  location: mysqlEnum("location", ["studio", "mobile"]).notNull(),
  hairOption: mysqlEnum("hairOption", ["bring-own", "brathouse"]).notNull(),
  addOnsJson: text("addOnsJson").notNull(),
  note: varchar("note", { length: 500 }),
  servicePriceCents: int("servicePriceCents").notNull(),
  depositCents: int("depositCents").notNull(),
  status: mysqlEnum("status", ["awaiting_deposit", "confirmed", "cancelled"]).default("awaiting_deposit").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InsertBookingRequest = typeof bookingRequests.$inferInsert;
export type BookingRequest = typeof bookingRequests.$inferSelect;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here
