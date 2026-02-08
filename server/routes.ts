import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import {
  signupSchema,
  loginSchema,
  insertChitFundSchema,
} from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "chit-fund-secret-key-2024";

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: "Invalid input", errors: parsed.error.flatten() });
      }

      const { name, email, phone, password } = parsed.data;

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        name,
        email,
        phone,
        password: hashedPassword,
        role: "user",
      });

      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "7d",
      });

      return res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const { email, password } = parsed.data;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "7d",
      });

      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Server error" });
    }
  });

  app.get(
    "/api/auth/me",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const user = await storage.getUser(req.userId!);
        if (!user) return res.status(404).json({ message: "User not found" });

        return res.json({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        });
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
  );

  app.get(
    "/api/chit-funds",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const funds = await storage.getChitFunds();
        return res.json(funds);
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
  );

  app.get(
    "/api/chit-funds/:id",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const fund = await storage.getChitFund(req.params.id);
        if (!fund)
          return res.status(404).json({ message: "Chit fund not found" });

        const members = await storage.getMembershipsByChitFund(fund.id);
        const userMembership = await storage.getMembership(
          req.userId!,
          fund.id,
        );

        return res.json({ ...fund, members, userMembership });
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
  );

  app.post(
    "/api/chit-funds/:id/join",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const existing = await storage.getMembership(
          req.userId!,
          req.params.id,
        );
        if (existing) {
          return res
            .status(409)
            .json({ message: "Already joined this chit fund" });
        }

        const membership = await storage.createMembership(
          req.userId!,
          req.params.id,
        );
        return res.status(201).json(membership);
      } catch (error: any) {
        return res.status(400).json({ message: error.message });
      }
    },
  );

  app.get(
    "/api/my-memberships",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const memberships = await storage.getUserMemberships(req.userId!);
        return res.json(memberships);
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
  );

  app.get(
    "/api/my-payments",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const userPayments = await storage.getPaymentsByUser(req.userId!);
        return res.json(userPayments);
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
  );

  app.get(
    "/api/my-upcoming-payments",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const upcoming = await storage.getUpcomingPayments(req.userId!);
        return res.json(upcoming);
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
  );

  app.get(
    "/api/dashboard",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const user = await storage.getUser(req.userId!);
        if (!user) return res.status(404).json({ message: "User not found" });

        const membershipsData = await storage.getUserMemberships(req.userId!);
        const allPayments = await storage.getPaymentsByUser(req.userId!);
        const upcoming = await storage.getUpcomingPayments(req.userId!);

        const totalInvested = allPayments
          .filter((p) => p.status === "paid")
          .reduce((sum, p) => sum + p.amount, 0);

        const totalPending = allPayments
          .filter((p) => p.status === "pending" || p.status === "overdue")
          .reduce((sum, p) => sum + p.amount, 0);

        const totalReturns = membershipsData.reduce(
          (sum, m) => sum + m.chitFund.totalAmount,
          0,
        );

        return res.json({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
          activeFunds: membershipsData.filter(
            (m) => m.chitFund.status === "active",
          ).length,
          totalMemberships: membershipsData.length,
          totalInvested,
          totalPending,
          totalReturns,
          upcomingPayments: upcoming.slice(0, 5),
          recentPayments: allPayments.slice(0, 5),
          memberships: membershipsData,
        });
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
  );

  // Admin routes
  app.post(
    "/api/admin/chit-funds",
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        let inputObj = {
          ...req.body,
          startDate: req.body.startDate
            ? new Date(req.body.startDate)
            : new Date(),
          status: req.body.status || "upcoming",
          chitFundType: req.body.type || "Increment",
        };
        const parsed = insertChitFundSchema.safeParse(inputObj);
        if (!parsed.success) {
          return res
            .status(400)
            .json({ message: "Invalid input", errors: parsed.error });
        }

        const fund = await storage.createChitFund({
          ...parsed.data,
          createdBy: req.userId!,
        });
        return res.status(201).json(fund);
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
  );

  app.put(
    "/api/admin/chit-funds/:id",
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const updated = await storage.updateChitFund(req.params.id, req.body);
        if (!updated)
          return res.status(404).json({ message: "Chit fund not found" });
        return res.json(updated);
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
  );

  app.delete(
    "/api/admin/chit-funds/:id",
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const deleted = await storage.deleteChitFund(req.params.id);
        if (!deleted)
          return res.status(404).json({ message: "Chit fund not found" });
        return res.json({ message: "Deleted" });
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
  );

  app.get(
    "/api/admin/users",
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const allUsers = await storage.getAllUsers();
        return res.json(
          allUsers.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            createdAt: u.createdAt,
          })),
        );
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
  );

  app.post(
    "/api/admin/assign-user",
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { userId, chitFundId } = req.body;
        if (!userId || !chitFundId) {
          return res
            .status(400)
            .json({ message: "userId and chitFundId are required" });
        }

        const existing = await storage.getMembership(userId, chitFundId);
        if (existing) {
          return res.status(409).json({ message: "User already assigned" });
        }

        const membership = await storage.createMembership(userId, chitFundId);
        return res.status(201).json(membership);
      } catch (error: any) {
        return res.status(400).json({ message: error.message });
      }
    },
  );

  app.post(
    "/api/admin/create-payments",
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { chitFundId } = req.body;
        if (!chitFundId)
          return res.status(400).json({ message: "chitFundId required" });

        const fund = await storage.getChitFund(chitFundId);
        if (!fund)
          return res.status(404).json({ message: "Chit fund not found" });

        const members = await storage.getMembershipsByChitFund(chitFundId);
        const createdPayments = [];

        for (const member of members) {
          for (let month = 1; month <= fund.duration; month++) {
            const dueDate = new Date(fund.startDate || new Date());
            dueDate.setMonth(dueDate.getMonth() + month - 1);

            const payment = await storage.createPayment({
              membershipId: member.id,
              userId: member.userId,
              chitFundId: fund.id,
              amount: fund.monthlyInstallment,
              monthNumber: month,
              dueDate: dueDate,
              status: "pending",
            });
            createdPayments.push(payment);
          }
        }

        return res.status(201).json({ count: createdPayments.length });
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
  );

  app.put(
    "/api/admin/payments/:id/status",
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { status } = req.body;
        const paidDate = status === "paid" ? new Date() : undefined;
        const updated = await storage.updatePaymentStatus(
          req.params.id,
          status,
          paidDate,
        );
        if (!updated)
          return res.status(404).json({ message: "Payment not found" });
        return res.json(updated);
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
  );

  app.get(
    "/api/admin/stats",
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const stats = await storage.getAdminStats();
        return res.json(stats);
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
  );

  app.get(
    "/api/admin/chit-funds/:id/members",
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const members = await storage.getMembershipsByChitFund(req.params.id);
        return res.json(members);
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
  );

  app.post("/api/admin/seed", async (req: Request, res: Response) => {
    try {
      const adminExists = await storage.getUserByEmail("admin@chittrack.com");
      if (adminExists) {
        return res.json({ message: "Seed data already exists" });
      }

      const hashedPassword = await bcrypt.hash("admin123", 10);
      await storage.createUser({
        name: "Admin User",
        email: "admin@chittrack.com",
        phone: "9876543210",
        password: hashedPassword,
        role: "admin",
      });

      const demoPassword = await bcrypt.hash("demo123", 10);
      await storage.createUser({
        name: "Rahul Sharma",
        email: "rahul@demo.com",
        phone: "9876543211",
        password: demoPassword,
        role: "user",
      });

      await storage.createUser({
        name: "Priya Patel",
        email: "priya@demo.com",
        phone: "9876543212",
        password: demoPassword,
        role: "user",
      });

      const startDate = new Date();
      startDate.setDate(1);

      await storage.createChitFund({
        name: "Golden Circle Fund",
        description:
          "Premium monthly chit fund for high-value investments with guaranteed returns.",
        totalAmount: 500000,
        monthlyInstallment: 25000,
        duration: 20,
        totalSlots: 20,
        availableSlots: 15,
        organizerName: "ChitTrack Finance",
        organizerContact: "9876543210",
        status: "active",
        startDate,
      });

      await storage.createChitFund({
        name: "Silver Savings Group",
        description:
          "Affordable monthly chit fund ideal for beginners looking to save regularly.",
        totalAmount: 100000,
        monthlyInstallment: 5000,
        duration: 20,
        totalSlots: 20,
        availableSlots: 12,
        organizerName: "ChitTrack Finance",
        organizerContact: "9876543210",
        status: "active",
        startDate,
      });

      await storage.createChitFund({
        name: "Diamond Growth Plan",
        description:
          "High-yield chit fund with shorter duration for quick returns.",
        totalAmount: 200000,
        monthlyInstallment: 20000,
        duration: 10,
        totalSlots: 10,
        availableSlots: 8,
        organizerName: "ChitTrack Finance",
        organizerContact: "9876543210",
        status: "upcoming",
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      return res.json({ message: "Seed data created successfully" });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
