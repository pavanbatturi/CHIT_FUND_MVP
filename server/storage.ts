import { eq, and, desc, count, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  chitFunds,
  memberships,
  payments,
  type User,
  type InsertUser,
  type ChitFund,
  type InsertChitFund,
  type Membership,
  type Payment,
  type InsertPayment,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  getChitFunds(): Promise<ChitFund[]>;
  getChitFund(id: string): Promise<ChitFund | undefined>;
  createChitFund(
    fund: InsertChitFund & { createdBy?: string },
  ): Promise<ChitFund>;
  updateChitFund(
    id: string,
    data: Partial<ChitFund>,
  ): Promise<ChitFund | undefined>;
  deleteChitFund(id: string): Promise<boolean>;

  getUserMemberships(
    userId: string,
  ): Promise<(Membership & { chitFund: ChitFund })[]>;
  getMembershipsByChitFund(
    chitFundId: string,
  ): Promise<(Membership & { user: User })[]>;
  createMembership(userId: string, chitFundId: string): Promise<Membership>;
  getMembership(
    userId: string,
    chitFundId: string,
  ): Promise<Membership | undefined>;

  getPaymentsByUser(
    userId: string,
  ): Promise<(Payment & { chitFundName: string })[]>;
  getPaymentsByMembership(membershipId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(
    id: string,
    status: string,
    paidDate?: Date,
  ): Promise<Payment | undefined>;
  getUpcomingPayments(
    userId: string,
  ): Promise<(Payment & { chitFundName: string })[]>;

  getAdminStats(): Promise<{
    totalUsers: number;
    activeChitFunds: number;
    totalRevenue: number;
    totalPayments: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getChitFunds(): Promise<ChitFund[]> {
    return db.select().from(chitFunds).orderBy(desc(chitFunds.createdAt));
  }

  async getChitFund(id: string): Promise<ChitFund | undefined> {
    const [fund] = await db
      .select()
      .from(chitFunds)
      .where(eq(chitFunds.id, id));
    return fund;
  }

  async createChitFund(
    fund: InsertChitFund & { createdBy?: string },
  ): Promise<ChitFund> {
    const [created] = await db.insert(chitFunds).values(fund).returning();
    return created;
  }

  async updateChitFund(
    id: string,
    data: Partial<ChitFund>,
  ): Promise<ChitFund | undefined> {
    const [updated] = await db
      .update(chitFunds)
      .set(data)
      .where(eq(chitFunds.id, id))
      .returning();
    return updated;
  }

  async deleteChitFund(id: string): Promise<boolean> {
    const result = await db
      .delete(chitFunds)
      .where(eq(chitFunds.id, id))
      .returning();
    return result.length > 0;
  }

  async getUserMemberships(
    userId: string,
  ): Promise<(Membership & { chitFund: ChitFund })[]> {
    const results = await db
      .select()
      .from(memberships)
      .innerJoin(chitFunds, eq(memberships.chitFundId, chitFunds.id))
      .where(eq(memberships.userId, userId));

    return results.map((r) => ({
      ...r.memberships,
      chitFund: r.chit_funds,
    }));
  }

  async getMembershipsByChitFund(
    chitFundId: string,
  ): Promise<(Membership & { user: User })[]> {
    const results = await db
      .select()
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(eq(memberships.chitFundId, chitFundId));

    return results.map((r) => ({
      ...r.memberships,
      user: r.users,
    }));
  }

  async createMembership(
    userId: string,
    chitFundId: string,
  ): Promise<Membership> {
    const fund = await this.getChitFund(chitFundId);
    if (!fund) throw new Error("Chit fund not found");
    if (fund.availableSlots <= 0) throw new Error("No available slots");

    const slotNumber = fund.totalSlots - fund.availableSlots + 1;

    const [membership] = await db
      .insert(memberships)
      .values({
        userId,
        chitFundId,
        slotNumber,
        status: "active",
        distributedMonth: "Feb",
        distributedStatus: "Not_Distributed",
      })
      .returning();

    await db
      .update(chitFunds)
      .set({ availableSlots: fund.availableSlots - 1 })
      .where(eq(chitFunds.id, chitFundId));

    return membership;
  }

  async getMembership(
    userId: string,
    chitFundId: string,
  ): Promise<Membership | undefined> {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.chitFundId, chitFundId),
        ),
      );
    return membership;
  }

  async getPaymentsByUser(
    userId: string,
  ): Promise<(Payment & { chitFundName: string })[]> {
    const results = await db
      .select()
      .from(payments)
      .innerJoin(chitFunds, eq(payments.chitFundId, chitFunds.id))
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.dueDate));

    return results.map((r) => ({
      ...r.payments,
      chitFundName: r.chit_funds.name,
    }));
  }

  async getAllPayments(): Promise<(Payment & { chitFundName: string })[]> {
    const results = await db
      .select()
      .from(payments)
      .innerJoin(chitFunds, eq(payments.chitFundId, chitFunds.id))
      .orderBy(desc(payments.dueDate));

    return results.map((r) => ({
      ...r.payments,
      chitFundName: r.chit_funds.name,
    }));
  }

  async getPaymentsByChitFundId(
    chitFundId: string,
  ): Promise<(Payment & { chitFundName: string })[]> {
    const results = await db
      .select()
      .from(payments)
      .innerJoin(chitFunds, eq(payments.chitFundId, chitFunds.id))
      .where(eq(payments.chitFundId, chitFundId))
      .orderBy(desc(payments.dueDate));

    return results.map((r) => ({
      ...r.payments,
      chitFundName: r.chit_funds.name,
    }));
  }

  async getPaymentsByMembership(membershipId: string): Promise<Payment[]> {
    return db
      .select()
      .from(payments)
      .where(eq(payments.membershipId, membershipId))
      .orderBy(payments.monthNumber);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async updatePaymentStatus(
    id: string,
    status: string,
    paidDate?: Date,
  ): Promise<Payment | undefined> {
    const updateData: any = { status };
    if (paidDate) updateData.paidDate = paidDate;
    const [updated] = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  async updateMembership(
    id: string,
    status: string,
    month: string,
  ): Promise<Membership | undefined> {
    const updateData: any = {
      distributedStatus: status,
      distributedMonth: month,
    };
    const [updated] = await db
      .update(memberships)
      .set(updateData)
      .where(eq(memberships.userId, id))
      .returning();
    return updated;
  }

  async getUpcomingPayments(
    userId: string,
  ): Promise<(Payment & { chitFundName: string })[]> {
    const results = await db
      .select()
      .from(payments)
      .innerJoin(chitFunds, eq(payments.chitFundId, chitFunds.id))
      .where(and(eq(payments.userId, userId), eq(payments.status, "pending")))
      .orderBy(payments.dueDate)
      .limit(10);

    return results.map((r) => ({
      ...r.payments,
      chitFundName: r.chit_funds.name,
    }));
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    activeChitFunds: number;
    totalRevenue: number;
    totalPayments: number;
  }> {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [fundCount] = await db
      .select({ count: count() })
      .from(chitFunds)
      .where(eq(chitFunds.status, "active"));
    const [revenueResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(eq(payments.status, "paid"));
    const [paymentCount] = await db.select({ count: count() }).from(payments);

    return {
      totalUsers: userCount.count,
      activeChitFunds: fundCount.count,
      totalRevenue: Number(revenueResult.total),
      totalPayments: paymentCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
