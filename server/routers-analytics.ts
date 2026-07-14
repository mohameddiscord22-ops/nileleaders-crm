import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { leads, leadFeedback, users } from "../drizzle/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";

export const analyticsRouter = router({
  // Overall dashboard statistics
  getDashboardStats: protectedProcedure
    .input(z.object({
      userId: z.number().optional(),
      dateFrom: z.number().optional(),
      dateTo: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const now = Date.now();
      const dateFrom = input.dateFrom || now - 30 * 24 * 60 * 60 * 1000; // Last 30 days
      const dateTo = input.dateTo || now;

      const conditions = [];
      if (input.userId) {
        conditions.push(eq(leads.assignedTo, input.userId));
      }
      conditions.push(gte(leads.createdAt, dateFrom));
      conditions.push(lte(leads.createdAt, dateTo));

      // Total leads in period
      const totalLeads = await db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(and(...conditions));

      // Leads by category
      const leadsByCategory = await db
        .select({
          category: leads.autoCategory,
          count: sql<number>`count(*)`,
        })
        .from(leads)
        .where(and(...conditions))
        .groupBy(leads.autoCategory);

      // Conversion rate (contacted / total)
      const contacted = leadsByCategory.find(c => c.category === "contacted")?.count || 0;
      const conversionRate = totalLeads[0]?.count ? (contacted / totalLeads[0].count) * 100 : 0;

      return {
        totalLeads: totalLeads[0]?.count || 0,
        contacted,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        byCategory: Object.fromEntries(
          leadsByCategory.map(c => [c.category, c.count])
        ),
        dateRange: { from: dateFrom, to: dateTo },
      };
    }),

  // Performance by user
  getUserPerformance: adminProcedure
    .input(z.object({
      dateFrom: z.number().optional(),
      dateTo: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const now = Date.now();
      const dateFrom = input.dateFrom || now - 30 * 24 * 60 * 60 * 1000;
      const dateTo = input.dateTo || now;

      // Get all users with their lead stats
      const allUsers = await db.select().from(users);

      const performance = await Promise.all(
        allUsers.map(async (user) => {
          const userLeads = await db
            .select({ count: sql<number>`count(*)` })
            .from(leads)
            .where(
              and(
                eq(leads.assignedTo, user.id),
                gte(leads.createdAt, dateFrom),
                lte(leads.createdAt, dateTo)
              )
            );

          const contacted = await db
            .select({ count: sql<number>`count(*)` })
            .from(leads)
            .where(
              and(
                eq(leads.assignedTo, user.id),
                eq(leads.autoCategory, "contacted"),
                gte(leads.createdAt, dateFrom),
                lte(leads.createdAt, dateTo)
              )
            );

          const totalCount = userLeads[0]?.count || 0;
          const contactedCount = contacted[0]?.count || 0;

          return {
            userId: user.id,
            userName: user.name || user.username,
            totalLeads: totalCount,
            contacted: contactedCount,
            conversionRate: totalCount > 0 ? parseFloat(((contactedCount / totalCount) * 100).toFixed(2)) : 0,
          };
        })
      );

      return performance.sort((a, b) => b.conversionRate - a.conversionRate);
    }),

  // Lead source analysis
  getLeadSourceAnalysis: protectedProcedure
    .input(z.object({
      userId: z.number().optional(),
      dateFrom: z.number().optional(),
      dateTo: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const now = Date.now();
      const dateFrom = input.dateFrom || now - 30 * 24 * 60 * 60 * 1000;
      const dateTo = input.dateTo || now;

      const conditions = [];
      if (input.userId) {
        conditions.push(eq(leads.assignedTo, input.userId));
      }
      conditions.push(gte(leads.createdAt, dateFrom));
      conditions.push(lte(leads.createdAt, dateTo));

      // Analyze custom fields for source information
      const leadSources = await db
        .select({
          source: sql`JSON_EXTRACT(${leads.customFields}, '$.source')`,
          count: sql<number>`count(*)`,
        })
        .from(leads)
        .where(and(...conditions))
        .groupBy(sql`JSON_EXTRACT(${leads.customFields}, '$.source')`);

      return leadSources.map(item => ({
        source: item.source ? JSON.parse(String(item.source)) : "Unknown",
        count: item.count,
      }));
    }),

  // Follow-up effectiveness
  getFollowUpEffectiveness: protectedProcedure
    .input(z.object({
      userId: z.number().optional(),
      dateFrom: z.number().optional(),
      dateTo: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const now = Date.now();
      const dateFrom = input.dateFrom || now - 30 * 24 * 60 * 60 * 1000;
      const dateTo = input.dateTo || now;

      const conditions = [];
      if (input.userId) {
        conditions.push(eq(leadFeedback.userId, input.userId));
      }
      conditions.push(gte(leadFeedback.createdAt, dateFrom));
      conditions.push(lte(leadFeedback.createdAt, dateTo));

      // Count follow-ups by status
      const followUpStats = await db
        .select({
          status: leadFeedback.status,
          count: sql<number>`count(*)`,
        })
        .from(leadFeedback)
        .where(and(...conditions))
        .groupBy(leadFeedback.status);

      return Object.fromEntries(
        followUpStats.map(item => [item.status, item.count])
      );
    }),

  // Time series data for charts
  getLeadsTimeSeries: protectedProcedure
    .input(z.object({
      userId: z.number().optional(),
      dateFrom: z.number().optional(),
      dateTo: z.number().optional(),
      interval: z.enum(["day", "week", "month"]).default("day"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const now = Date.now();
      const dateFrom = input.dateFrom || now - 30 * 24 * 60 * 60 * 1000;
      const dateTo = input.dateTo || now;

      const conditions = [];
      if (input.userId) {
        conditions.push(eq(leads.assignedTo, input.userId));
      }
      conditions.push(gte(leads.createdAt, dateFrom));
      conditions.push(lte(leads.createdAt, dateTo));

      // Group by date based on interval
      let dateFormat = "%Y-%m-%d"; // day
      if (input.interval === "week") {
        dateFormat = "%Y-W%w";
      } else if (input.interval === "month") {
        dateFormat = "%Y-%m";
      }

      const timeSeries = await db
        .select({
          date: sql`DATE_FORMAT(FROM_UNIXTIME(${leads.createdAt} / 1000), ${dateFormat})`,
          count: sql<number>`count(*)`,
          contacted: sql<number>`SUM(CASE WHEN ${leads.autoCategory} = 'contacted' THEN 1 ELSE 0 END)`,
        })
        .from(leads)
        .where(and(...conditions))
        .groupBy(sql`DATE_FORMAT(FROM_UNIXTIME(${leads.createdAt} / 1000), ${dateFormat})`)
        .orderBy(sql`DATE_FORMAT(FROM_UNIXTIME(${leads.createdAt} / 1000), ${dateFormat})`);

      return timeSeries;
    }),

  // Conversion funnel
  getConversionFunnel: protectedProcedure
    .input(z.object({
      userId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const conditions = input.userId ? [eq(leads.assignedTo, input.userId)] : [];

      const stages = await Promise.all([
        // Stage 1: Unassigned
        db
          .select({ count: sql<number>`count(*)` })
          .from(leads)
          .where(and(eq(leads.autoCategory, "unassigned"), ...conditions)),

        // Stage 2: Available
        db
          .select({ count: sql<number>`count(*)` })
          .from(leads)
          .where(and(eq(leads.autoCategory, "available"), ...conditions)),

        // Stage 3: Contacted
        db
          .select({ count: sql<number>`count(*)` })
          .from(leads)
          .where(and(eq(leads.autoCategory, "contacted"), ...conditions)),

        // Stage 4: Upcoming
        db
          .select({ count: sql<number>`count(*)` })
          .from(leads)
          .where(and(eq(leads.autoCategory, "upcoming"), ...conditions)),
      ]);

      return {
        unassigned: stages[0][0]?.count || 0,
        available: stages[1][0]?.count || 0,
        contacted: stages[2][0]?.count || 0,
        upcoming: stages[3][0]?.count || 0,
      };
    }),
});
