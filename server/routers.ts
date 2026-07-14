import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { leads } from "../drizzle/schema";
import {
  LOCAL_COOKIE_NAME,
  createSessionToken,
  getSessionCookieOptions,
  hashPassword,
  verifyPassword,
} from "./localAuth";
import { advancedRouter } from "./routers-advanced";

export const appRouter = router({
  system: systemRouter,
  ...advancedRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    // First account ever created becomes admin automatically. After that,
    // only an existing admin can create new users (see users.create below) —
    // this endpoint stays open only for the very first bootstrap account.
    register: publicProcedure
      .input(z.object({
        username: z.string().min(3, "اليوزرنيم لازم يكون 3 حروف على الأقل"),
        password: z.string().min(6, "الباسورد لازم يكون 6 حروف على الأقل"),
        name: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existingUsersCount = (await db.getAllUsers()).length;
        if (existingUsersCount > 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "التسجيل مقفول، اطلب من الأدمن يعمللك حساب",
          });
        }
        const existing = await db.getUserByUsername(input.username);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "اليوزرنيم ده متسجل قبل كده" });
        }
        const passwordHash = await hashPassword(input.password);
        const userId = await db.createLocalUser({
          username: input.username,
          passwordHash,
          name: input.name,
          role: "admin", // first user is always admin
        });
        const token = await createSessionToken(userId as number);
        ctx.res.cookie(LOCAL_COOKIE_NAME, token, getSessionCookieOptions());
        const user = await db.getUserById(userId as number);
        return user;
      }),

    login: publicProcedure
      .input(z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserByUsername(input.username);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "بيانات الدخول غلط" });
        }
        const valid = await verifyPassword(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "بيانات الدخول غلط" });
        }
        await db.touchUserLastSignedIn(user.id);
        const token = await createSessionToken(user.id);
        ctx.res.cookie(LOCAL_COOKIE_NAME, token, getSessionCookieOptions());
        return user;
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(LOCAL_COOKIE_NAME, { ...getSessionCookieOptions(), maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ LEADS ============
  leads: router({
    list: protectedProcedure
      .input(z.object({
        autoCategory: z.enum(leads.autoCategory.enumValues).optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getLeads({
          assignedTo: ctx.user?.id,
          autoCategory: input?.autoCategory,
          search: input?.search,
        });
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getLeadById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        ownerName: z.string().optional(),
        phone: z.string().min(1, "Phone is required"),
        customFields: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createLead({
          ...input,
          assignedTo: ctx.user.id,
        } as any);
      }),

    batchCreate: protectedProcedure
      .input(z.object({
        leadsData: z.array(z.object({
          ownerName: z.string().optional(),
          phone: z.string().min(1, "Phone is required"),
          customFields: z.record(z.string(), z.unknown()).optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const leadsWithUser = input.leadsData.map(l => ({
          ...l,
          assignedTo: ctx.user.id,
        }));
        return db.createLeadsBatch(leadsWithUser as any);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        ownerName: z.string().optional(),
        phone: z.string().optional(),
        customFields: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ input }) => {
        const updates: Record<string, unknown> = {};
        if (input.ownerName !== undefined) updates.ownerName = input.ownerName;
        if (input.phone !== undefined) updates.phone = input.phone;
        if (input.customFields !== undefined) updates.customFields = input.customFields;
        await db.updateLead(input.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLead(input.id);
        return { success: true };
      }),
  }),

  // ============ FEEDBACK ============
  feedback: router({
    list: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return db.getLeadFeedback(input.leadId);
      }),

    create: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        status: z.enum(["available", "not_available", "will_be_free_later", "do_not_contact"]),
        followUpDate: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const feedbackId = await db.createLeadFeedback({
          leadId: input.leadId,
          status: input.status,
          followUpDate: input.followUpDate ?? null,
          notes: input.notes ?? null,
          userId: ctx.user.id,
          createdAt: Date.now(),
        } as any);

        // Auto-categorize lead based on feedback
        let category: typeof leads.autoCategory.enumValues[number] = "unassigned";
        switch (input.status) {
          case "available":
            category = "available";
            break;
          case "not_available":
            category = "unavailable";
            break;
          case "will_be_free_later":
            category = "upcoming";
            break;
          case "do_not_contact":
            category = "contacted";
            break;
        }
        await db.updateLeadAutoCategory(input.leadId, category);

        return { feedbackId, success: true };
      }),
  }),

  // ============ DASHBOARD ============
  dashboard: router({
    upcoming: protectedProcedure.query(async ({ ctx }) => {
      return db.getUpcomingLeads(ctx.user.id);
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getLeadStats(ctx.user.id);
    }),
    recentActivity: protectedProcedure.query(async ({ ctx }) => {
      return db.getRecentActivity(ctx.user.id);
    }),
  }),

  // ============ USER MANAGEMENT (Admin only) ============
  users: router({
    list: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),

    create: adminProcedure
      .input(z.object({
        username: z.string().min(3, "اليوزرنيم لازم يكون 3 حروف على الأقل"),
        password: z.string().min(6, "الباسورد لازم يكون 6 حروف على الأقل"),
        name: z.string().optional(),
        role: z.enum(["user", "admin"]).default("user"),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getUserByUsername(input.username);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "اليوزرنيم ده متسجل قبل كده" });
        }
        const passwordHash = await hashPassword(input.password);
        const userId = await db.createLocalUser({
          username: input.username,
          passwordHash,
          name: input.name,
          role: input.role,
        });
        return db.getUserById(userId as number);
      }),

    resetPassword: adminProcedure
      .input(z.object({
        id: z.number(),
        password: z.string().min(6, "الباسورد لازم يكون 6 حروف على الأقل"),
      }))
      .mutation(async ({ input }) => {
        const passwordHash = await hashPassword(input.password);
        await db.updateUserPassword(input.id, passwordHash);
        return { success: true };
      }),

    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getUserById(input.id);
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        role: z.enum(["user", "admin"]).optional(),
        name: z.string().optional(),
        email: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateUser(input.id, input);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUser(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
