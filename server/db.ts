import { and, eq, gt, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertLead, InsertLeadFeedback, InsertUser, leadFeedback, leads, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    const assignNullable = (field: (typeof textFields)[number]) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ LOCAL AUTH (username/password) ============

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLocalUser(data: {
  username: string;
  passwordHash: string;
  name?: string | null;
  role?: typeof users.role.enumValues[number];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  const result = await db.insert(users).values({
    username: data.username,
    passwordHash: data.passwordHash,
    name: data.name ?? data.username,
    role: data.role ?? "user",
    lastSignedIn: now,
  });
  return result[0].insertId;
}

export async function updateUserPassword(id: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, id));
}

export async function touchUserLastSignedIn(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

// ============ LEADS ============

export async function getLeads({ assignedTo, autoCategory, search }: {
  assignedTo?: number;
  autoCategory?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (assignedTo !== undefined && assignedTo !== null) {
    conditions.push(eq(leads.assignedTo, assignedTo));
  } else {
    conditions.push(isNull(leads.assignedTo));
  }
  if (autoCategory) {
    conditions.push(eq(leads.autoCategory, autoCategory as typeof leads.autoCategory.enumValues[number]));
  }
  if (search) {
    conditions.push(
      or(
        sql`JSON_UNQUOTE(JSON_EXTRACT(${leads.ownerName}, '$')) LIKE ${`%${search}%`}`,
        sql`${leads.phone} LIKE ${`%${search}%`}`,
      )
    );
  }
  const result = await db.select().from(leads)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${leads.createdAt} DESC`);
  return result;
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLead(lead: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = Date.now();
  const result = await db.insert(leads).values({
    ...lead,
    createdAt: now,
    updatedAt: now,
  });
  return result[0].insertId;
}

export async function createLeadsBatch(leadsData: InsertLead[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = Date.now();
  const values = leadsData.map(l => ({
    ...l,
    createdAt: now,
    updatedAt: now,
  }));
  const result = await db.insert(leads).values(values);
  return result.length;
}

export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = Date.now();
  await db.update(leads).set({ ...data, updatedAt: now }).where(eq(leads.id, id));
}

export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Also delete associated feedback
  await db.delete(leadFeedback).where(eq(leadFeedback.leadId, id));
  await db.delete(leads).where(eq(leads.id, id));
}

export async function updateLeadAutoCategory(id: number, category: typeof leads.autoCategory.enumValues[number]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set({ autoCategory: category, updatedAt: Date.now() }).where(eq(leads.id, id));
}

// ============ LEAD FEEDBACK ============

export async function getLeadFeedback(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(leadFeedback)
    .where(eq(leadFeedback.leadId, leadId))
    .orderBy(sql`${leadFeedback.createdAt} DESC`);
  return result;
}

export async function createLeadFeedback(feedback: InsertLeadFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leadFeedback).values({
    ...feedback,
    createdAt: Date.now(),
  });
  return result[0].insertId;
}

// ============ LEAD STATS ============

export async function getLeadStats(assignedTo?: number) {
  const db = await getDb();
  if (!db) return { total: 0, available: 0, unavailable: 0, upcoming: 0, contacted: 0, unassigned: 0 };
  const whereCondition = assignedTo !== undefined && assignedTo !== null
    ? eq(leads.assignedTo, assignedTo)
    : isNull(leads.assignedTo);

  const total = await db.select({ count: sql<number>`count(*)` }).from(leads).where(whereCondition);

  const categories = await db.select({
    category: leads.autoCategory,
    count: sql<number>`count(*)`,
  }).from(leads).where(whereCondition).groupBy(leads.autoCategory);

  const stats = { total: total[0]?.count || 0, available: 0, unavailable: 0, upcoming: 0, contacted: 0, unassigned: 0 };
  for (const c of categories) {
    if (c.category) stats[c.category as keyof typeof stats] = c.count;
  }
  return stats;
}

export async function getUpcomingLeads(assignedTo?: number) {
  const db = await getDb();
  if (!db) return [];
  const now = Date.now();
  const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;

  const whereCondition = assignedTo !== undefined && assignedTo !== null
    ? and(eq(leads.assignedTo, assignedTo))
    : undefined;

  // Get leads with upcoming follow-up dates
  const leadsWithFollowUp = await db.select().from(leads).where(
    and(
      whereCondition,
      eq(leads.autoCategory, "upcoming"),
      isNotNull(leadFeedback.followUpDate),
    )
  );

  // Get leads whose followUpDate is within the next week
  const upcoming = await db.select({
    lead: leads,
    followUpDate: leadFeedback.followUpDate,
    notes: leadFeedback.notes,
  }).from(leads)
    .innerJoin(leadFeedback, eq(leads.id, leadFeedback.leadId))
    .where(
      and(
        whereCondition,
        eq(leads.autoCategory, "upcoming"),
        gt(leadFeedback.followUpDate, now),
        lt(leadFeedback.followUpDate, weekFromNow),
      )
    )
    .orderBy(leadFeedback.followUpDate);

  return upcoming;
}

export async function getRecentActivity(assignedTo?: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const whereCondition = assignedTo !== undefined && assignedTo !== null
    ? eq(leads.assignedTo, assignedTo)
    : undefined;

  const result = await db.select({
    id: leadFeedback.id,
    leadId: leadFeedback.leadId,
    ownerName: leads.ownerName,
    phone: leads.phone,
    status: leadFeedback.status,
    notes: leadFeedback.notes,
    createdAt: leadFeedback.createdAt,
  }).from(leadFeedback)
    .innerJoin(leads, eq(leadFeedback.leadId, leads.id))
    .where(whereCondition)
    .orderBy(sql`${leadFeedback.createdAt} DESC`)
    .limit(limit);

  return result;
}

// ============ USER MANAGEMENT ============

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(sql`${users.createdAt} DESC`);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUser(id: number, data: { role?: typeof users.role.enumValues[number]; name?: string | null; email?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, id));
}
