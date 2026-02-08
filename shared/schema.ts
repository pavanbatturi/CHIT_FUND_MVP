import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const chitStatusEnum = pgEnum("chit_status", [
  "active",
  "upcoming",
  "completed",
  "cancelled",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "overdue",
  "partial",
]);
export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "inactive",
  "removed",
]);

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chitFunds = pgTable("chit_funds", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  totalAmount: integer("total_amount").notNull(),
  monthlyInstallment: integer("monthly_installment").notNull(),
  duration: integer("duration").notNull(),
  totalSlots: integer("total_slots").notNull(),
  availableSlots: integer("available_slots").notNull(),
  organizerName: text("organizer_name").notNull(),
  organizerContact: text("organizer_contact"),
  status: chitStatusEnum("status").notNull().default("upcoming"),
  startDate: timestamp("start_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  chitFundType: text("chit_fund_type"),
});

export const memberships = pgTable("memberships", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  chitFundId: varchar("chit_fund_id")
    .notNull()
    .references(() => chitFunds.id),
  slotNumber: integer("slot_number"),
  status: membershipStatusEnum("status").notNull().default("active"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  membershipId: varchar("membership_id")
    .notNull()
    .references(() => memberships.id),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  chitFundId: varchar("chit_fund_id")
    .notNull()
    .references(() => chitFunds.id),
  amount: integer("amount").notNull(),
  monthNumber: integer("month_number").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const errorLogs = pgTable("errorlogs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  error: jsonb("error").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  phone: true,
  password: true,
  role: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
});

export const insertChitFundSchema = createInsertSchema(chitFunds).pick({
  name: true,
  description: true,
  totalAmount: true,
  monthlyInstallment: true,
  duration: true,
  totalSlots: true,
  availableSlots: true,
  organizerName: true,
  organizerContact: true,
  status: true,
  startDate: true,
  chitFundType: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  membershipId: true,
  userId: true,
  chitFundId: true,
  amount: true,
  monthNumber: true,
  dueDate: true,
  status: true,
});

export const insertErrorSchema = createInsertSchema(errorLogs).pick({
  error: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ChitFund = typeof chitFunds.$inferSelect;
export type InsertChitFund = z.infer<typeof insertChitFundSchema>;
export type Membership = typeof memberships.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Error = typeof errorLogs.$inferSelect;
export type InsertError = z.infer<typeof insertErrorSchema>;
