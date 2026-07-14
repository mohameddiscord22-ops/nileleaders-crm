import { and, eq, desc, gte, lte, sql } from "drizzle-orm";
import { activityLog, notifications, scheduledTasks, whatsappMessages } from "../drizzle/schema";
import type { InsertActivityLog, InsertNotification, InsertScheduledTask, InsertWhatsappMessage } from "../drizzle/schema";
import { getDb } from "./db";

// ============ ACTIVITY LOG ============

export async function logActivity(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(activityLog).values(data);
  return result[0].insertId;
}

export async function getActivityLog(filters?: {
  userId?: number;
  entityType?: string;
  entityId?: number;
  action?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.userId) conditions.push(eq(activityLog.userId, filters.userId));
  if (filters?.entityType) conditions.push(eq(activityLog.entityType, filters.entityType));
  if (filters?.entityId) conditions.push(eq(activityLog.entityId, filters.entityId));
  if (filters?.action) conditions.push(eq(activityLog.action, filters.action));

  let query = db.select().from(activityLog);
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  query = query.orderBy(desc(activityLog.createdAt));

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.offset(filters.offset);
  }

  return query;
}

// ============ NOTIFICATIONS ============

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
}

export async function getUserNotifications(userId: number, unreadOnly = false) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(notifications).where(eq(notifications.userId, userId));

  if (unreadOnly) {
    query = query.where(eq(notifications.isRead, false));
  }

  return query.orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count || 0;
}

// ============ SCHEDULED TASKS ============

export async function createScheduledTask(data: InsertScheduledTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scheduledTasks).values(data);
  return result[0].insertId;
}

export async function getScheduledTasks(filters?: {
  userId?: number;
  leadId?: number;
  status?: "pending" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high";
  dueDateFrom?: number;
  dueDateTo?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.userId) conditions.push(eq(scheduledTasks.userId, filters.userId));
  if (filters?.leadId) conditions.push(eq(scheduledTasks.leadId, filters.leadId));
  if (filters?.status) conditions.push(eq(scheduledTasks.status, filters.status));
  if (filters?.priority) conditions.push(eq(scheduledTasks.priority, filters.priority));
  if (filters?.dueDateFrom) conditions.push(gte(scheduledTasks.dueDate, filters.dueDateFrom));
  if (filters?.dueDateTo) conditions.push(lte(scheduledTasks.dueDate, filters.dueDateTo));

  let query = db.select().from(scheduledTasks);
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  return query.orderBy(scheduledTasks.dueDate);
}

export async function updateScheduledTask(id: number, data: Partial<InsertScheduledTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(scheduledTasks).set(data).where(eq(scheduledTasks.id, id));
}

export async function completeScheduledTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(scheduledTasks)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(scheduledTasks.id, id));
}

export async function getOverdueTasksForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const now = Date.now();
  return db.select().from(scheduledTasks)
    .where(and(
      eq(scheduledTasks.userId, userId),
      eq(scheduledTasks.status, "pending"),
      lte(scheduledTasks.dueDate, now)
    ))
    .orderBy(scheduledTasks.dueDate);
}

// ============ WHATSAPP MESSAGES ============

export async function createWhatsappMessage(data: InsertWhatsappMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(whatsappMessages).values(data);
  return result[0].insertId;
}

export async function getWhatsappConversation(leadId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(whatsappMessages)
    .where(eq(whatsappMessages.leadId, leadId))
    .orderBy(desc(whatsappMessages.createdAt))
    .limit(limit);
}

export async function getWhatsappMessagesByPhone(phoneNumber: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(whatsappMessages)
    .where(eq(whatsappMessages.phoneNumber, phoneNumber))
    .orderBy(desc(whatsappMessages.createdAt));
}

export async function updateWhatsappMessageStatus(id: number, status: "sent" | "delivered" | "read" | "failed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(whatsappMessages).set({ status }).where(eq(whatsappMessages.id, id));
}
