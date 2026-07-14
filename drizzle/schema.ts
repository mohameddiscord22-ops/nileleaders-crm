import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, json, index, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  // openId is kept for backward compatibility with the old OAuth flow, but is
  // no longer required — local accounts don't have one.
  openId: varchar("openId", { length: 64 }).unique(),
  username: varchar("username", { length: 64 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  usernameIdx: index("username_idx").on(table.username),
  roleIdx: index("role_idx").on(table.role),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Leads table - stores contact information and imported data.
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  ownerName: text("ownerName"),
  phone: varchar("phone", { length: 32 }).notNull(),
  customFields: json("customFields").$type<Record<string, unknown>>(),
  assignedTo: int("assignedTo"),
  autoCategory: mysqlEnum("autoCategory", [
    "unassigned",
    "available",
    "unavailable",
    "upcoming",
    "contacted",
  ]).default("unassigned").notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
}, (table) => ({
  phoneIdx: index("phone_idx").on(table.phone),
  assignedToIdx: index("assignedTo_idx").on(table.assignedTo),
  autoCategoryIdx: index("autoCategory_idx").on(table.autoCategory),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Lead feedback history - tracks all interactions per lead.
 */
export const leadFeedback = mysqlTable("lead_feedback", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  status: mysqlEnum("status", [
    "available",
    "not_available",
    "will_be_free_later",
    "do_not_contact",
  ]).notNull(),
  followUpDate: bigint("followUpDate", { mode: "number" }),
  notes: text("notes"),
  userId: int("userId"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
}, (table) => ({
  leadIdIdx: index("leadId_idx").on(table.leadId),
  userIdIdx: index("userId_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
  followUpDateIdx: index("followUpDate_idx").on(table.followUpDate),
  createdAtIdx: index("feedback_createdAt_idx").on(table.createdAt),
}));

export type LeadFeedback = typeof leadFeedback.$inferSelect;
export type InsertLeadFeedback = typeof leadFeedback.$inferInsert;

/**
 * Activity Log - tracks all user actions in the system
 */
export const activityLog = mysqlTable("activity_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  entityId: int("entityId").notNull(),
  changes: json("changes").$type<Record<string, unknown>>(),
  description: text("description"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("activity_userId_idx").on(table.userId),
  entityTypeIdx: index("activity_entityType_idx").on(table.entityType),
  entityIdIdx: index("activity_entityId_idx").on(table.entityId),
  actionIdx: index("activity_action_idx").on(table.action),
  createdAtIdx: index("activity_createdAt_idx").on(table.createdAt),
}));

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;

/**
 * Notifications - internal notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  relatedEntityType: varchar("relatedEntityType", { length: 64 }),
  relatedEntityId: int("relatedEntityId"),
  isRead: boolean("isRead").default(false).notNull(),
  actionUrl: varchar("actionUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
}, (table) => ({
  userIdIdx: index("notif_userId_idx").on(table.userId),
  isReadIdx: index("notif_isRead_idx").on(table.isRead),
  createdAtIdx: index("notif_createdAt_idx").on(table.createdAt),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Scheduled Tasks - for follow-ups and reminders
 */
export const scheduledTasks = mysqlTable("scheduled_tasks", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  userId: int("userId"),
  taskType: varchar("taskType", { length: 64 }).notNull(),
  dueDate: bigint("dueDate", { mode: "number" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  leadIdIdx: index("task_leadId_idx").on(table.leadId),
  userIdIdx: index("task_userId_idx").on(table.userId),
  dueDateIdx: index("task_dueDate_idx").on(table.dueDate),
  statusIdx: index("task_status_idx").on(table.status),
  createdAtIdx: index("task_createdAt_idx").on(table.createdAt),
}));

export type ScheduledTask = typeof scheduledTasks.$inferSelect;
export type InsertScheduledTask = typeof scheduledTasks.$inferInsert;

/**
 * WhatsApp Messages - tracks WhatsApp interactions
 */
export const whatsappMessages = mysqlTable("whatsapp_messages", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  userId: int("userId"),
  phoneNumber: varchar("phoneNumber", { length: 32 }).notNull(),
  message: text("message").notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  status: mysqlEnum("status", ["sent", "delivered", "read", "failed"]).default("sent").notNull(),
  externalId: varchar("externalId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  leadIdIdx: index("wa_leadId_idx").on(table.leadId),
  userIdIdx: index("wa_userId_idx").on(table.userId),
  phoneIdx: index("wa_phone_idx").on(table.phoneNumber),
  createdAtIdx: index("wa_createdAt_idx").on(table.createdAt),
}));

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = typeof whatsappMessages.$inferInsert;
