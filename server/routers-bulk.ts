import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { updateLead, deleteLead, updateLeadAutoCategory, getLeads } from "./db";
import { logActivity } from "./db-activity";

export const bulkRouter = router({
  // Bulk update leads
  updateLeads: protectedProcedure
    .input(z.object({
      leadIds: z.array(z.number()).min(1),
      updates: z.object({
        assignedTo: z.number().optional(),
        autoCategory: z.enum([
          "unassigned",
          "available",
          "unavailable",
          "upcoming",
          "contacted",
        ]).optional(),
        customFields: z.record(z.unknown()).optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      let updated = 0;
      for (const leadId of input.leadIds) {
        try {
          await updateLead(leadId, input.updates);
          updated++;

          // Log activity for each update
          await logActivity({
            userId: ctx.user.id,
            action: "lead_bulk_updated",
            entityType: "lead",
            entityId: leadId,
            description: `Bulk updated lead with ${Object.keys(input.updates).join(", ")}`,
            changes: input.updates,
          });
        } catch (error) {
          console.error(`Failed to update lead ${leadId}:`, error);
        }
      }

      return { success: true, updated, total: input.leadIds.length };
    }),

  // Bulk assign leads
  assignLeads: protectedProcedure
    .input(z.object({
      leadIds: z.array(z.number()).min(1),
      assignTo: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      let assigned = 0;
      for (const leadId of input.leadIds) {
        try {
          await updateLead(leadId, { assignedTo: input.assignTo });
          assigned++;

          await logActivity({
            userId: ctx.user.id,
            action: "lead_assigned_bulk",
            entityType: "lead",
            entityId: leadId,
            description: `Bulk assigned to user ${input.assignTo}`,
            changes: { assignedTo: input.assignTo },
          });
        } catch (error) {
          console.error(`Failed to assign lead ${leadId}:`, error);
        }
      }

      return { success: true, assigned, total: input.leadIds.length };
    }),

  // Bulk categorize leads
  categorizeLeads: protectedProcedure
    .input(z.object({
      leadIds: z.array(z.number()).min(1),
      category: z.enum([
        "unassigned",
        "available",
        "unavailable",
        "upcoming",
        "contacted",
      ]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      let categorized = 0;
      for (const leadId of input.leadIds) {
        try {
          await updateLeadAutoCategory(leadId, input.category);
          categorized++;

          await logActivity({
            userId: ctx.user.id,
            action: "lead_categorized_bulk",
            entityType: "lead",
            entityId: leadId,
            description: `Bulk categorized to ${input.category}`,
            changes: { autoCategory: input.category },
          });
        } catch (error) {
          console.error(`Failed to categorize lead ${leadId}:`, error);
        }
      }

      return { success: true, categorized, total: input.leadIds.length };
    }),

  // Bulk delete leads
  deleteLeads: adminProcedure
    .input(z.object({
      leadIds: z.array(z.number()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      let deleted = 0;
      for (const leadId of input.leadIds) {
        try {
          await deleteLead(leadId);
          deleted++;

          await logActivity({
            userId: ctx.user.id,
            action: "lead_deleted_bulk",
            entityType: "lead",
            entityId: leadId,
            description: `Lead deleted as part of bulk operation`,
          });
        } catch (error) {
          console.error(`Failed to delete lead ${leadId}:`, error);
        }
      }

      return { success: true, deleted, total: input.leadIds.length };
    }),

  // Export leads to CSV/Excel
  exportLeads: protectedProcedure
    .input(z.object({
      filters: z.object({
        assignedTo: z.number().optional(),
        autoCategory: z.string().optional(),
        search: z.string().optional(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const leads = await getLeads({
        assignedTo: input.filters?.assignedTo,
        autoCategory: input.filters?.autoCategory,
        search: input.filters?.search,
      });

      // Log the export activity
      await logActivity({
        userId: ctx.user.id,
        action: "leads_exported",
        entityType: "lead",
        entityId: 0,
        description: `Exported ${leads.length} leads`,
        changes: { count: leads.length, filters: input.filters },
      });

      return {
        success: true,
        data: leads,
        count: leads.length,
        timestamp: new Date().toISOString(),
      };
    }),
});
