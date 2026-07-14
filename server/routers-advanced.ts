import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { bulkRouter } from "./routers-bulk";
import { analyticsRouter } from "./routers-analytics";
import {
  logActivity,
  getActivityLog,
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  createScheduledTask,
  getScheduledTasks,
  updateScheduledTask,
  completeScheduledTask,
  getOverdueTasksForUser,
  createWhatsappMessage,
  getWhatsappConversation,
} from "./db-activity";
import { updateLead } from "./db";

// ============ ACTIVITY LOG ROUTER ============

export const activityRouter = router({
  getLog: protectedProcedure
    .input(z.object({
      userId: z.number().optional(),
      entityType: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return getActivityLog({
        userId: input.userId,
        entityType: input.entityType,
        limit: input.limit,
        offset: input.offset,
      });
    }),
});

// ============ NOTIFICATIONS ROUTER ============

export const notificationsRouter = router({
  getMyNotifications: protectedProcedure
    .input(z.object({ unreadOnly: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return getUserNotifications(ctx.user.id, input.unreadOnly);
    }),

  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return getUnreadNotificationCount(ctx.user.id);
    }),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      await markNotificationAsRead(input.notificationId);
      return { success: true };
    }),

  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      await markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),

  create: adminProcedure
    .input(z.object({
      userId: z.number(),
      type: z.string(),
      title: z.string(),
      message: z.string().optional(),
      relatedEntityType: z.string().optional(),
      relatedEntityId: z.number().optional(),
      actionUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return createNotification({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        relatedEntityType: input.relatedEntityType,
        relatedEntityId: input.relatedEntityId,
        actionUrl: input.actionUrl,
        isRead: false,
      });
    }),
});

// ============ SCHEDULED TASKS ROUTER ============

export const tasksRouter = router({
  getMyTasks: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "completed", "cancelled"]).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return getScheduledTasks({
        userId: ctx.user.id,
        status: input.status,
        priority: input.priority,
      });
    }),

  getOverdueTasks: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return getOverdueTasksForUser(ctx.user.id);
    }),

  create: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      taskType: z.string(),
      dueDate: z.number(),
      title: z.string(),
      description: z.string().optional(),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return createScheduledTask({
        leadId: input.leadId,
        userId: ctx.user.id,
        taskType: input.taskType,
        dueDate: input.dueDate,
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: "pending",
      });
    }),

  complete: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ input }) => {
      await completeScheduledTask(input.taskId);
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      status: z.enum(["pending", "completed", "cancelled"]).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      dueDate: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await updateScheduledTask(input.taskId, {
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate,
      });
      return { success: true };
    }),
});

// ============ WHATSAPP ROUTER ============

export const whatsappRouter = router({
  getConversation: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      return getWhatsappConversation(input.leadId);
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      phoneNumber: z.string(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      // Log activity
      await logActivity({
        userId: ctx.user.id,
        action: "whatsapp_message_sent",
        entityType: "lead",
        entityId: input.leadId,
        description: `Sent WhatsApp message to ${input.phoneNumber}`,
        changes: { message: input.message },
      });

      // Create message record
      return createWhatsappMessage({
        leadId: input.leadId,
        userId: ctx.user.id,
        phoneNumber: input.phoneNumber,
        message: input.message,
        direction: "outbound",
        status: "sent",
      });
    }),

  getWhatsappLink: protectedProcedure
    .input(z.object({ phoneNumber: z.string(), message: z.string().optional() }))
    .query(({ input }) => {
      // Generate WhatsApp link for quick messaging
      const encodedMessage = encodeURIComponent(input.message || "");
      return {
        url: `https://wa.me/${input.phoneNumber}?text=${encodedMessage}`,
      };
    }),
});

export const advancedRouter = router({
  activity: activityRouter,
  notifications: notificationsRouter,
  tasks: tasksRouter,
  whatsapp: whatsappRouter,
  bulk: bulkRouter,
  analytics: analyticsRouter,
});
