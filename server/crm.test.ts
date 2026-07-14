import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper to create test context
function createTestContext(user?: any): TrpcContext {
  return {
    user: user || null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("CRM Authentication", () => {
  it("should allow user registration", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Registration should work without authentication
    const result = await caller.auth.register({
      username: "testuser",
      password: "password123",
      name: "Test User",
    });

    expect(result).toBeDefined();
    expect(result.username).toBe("testuser");
    expect(result.name).toBe("Test User");
  });

  it("should return current user when authenticated", async () => {
    const user = {
      id: 1,
      openId: "test-user",
      username: "testuser",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "local",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toEqual(user);
  });

  it("should logout user successfully", async () => {
    const user = {
      id: 1,
      openId: "test-user",
      username: "testuser",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "local",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

describe("Lead Management", () => {
  const adminUser = {
    id: 1,
    openId: "admin-user",
    username: "admin",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "local",
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  it("should list leads with search filter", async () => {
    const ctx = createTestContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.list({
      search: undefined,
      autoCategory: undefined,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a new lead", async () => {
    const ctx = createTestContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.create({
      ownerName: "Test Lead",
      phone: "+201001234567",
    });

    expect(result).toBeDefined();
    expect(result.ownerName).toBe("Test Lead");
    expect(result.phone).toBe("+201001234567");
    expect(result.autoCategory).toBe("unassigned");
  });

  it("should batch create leads from Excel", async () => {
    const ctx = createTestContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.batchCreate({
      leadsData: [
        { ownerName: "Lead 1", phone: "+201001234567" },
        { ownerName: "Lead 2", phone: "+201001234568" },
      ],
    });

    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe("Feedback System", () => {
  const user = {
    id: 1,
    openId: "test-user",
    username: "testuser",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "local",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  it("should create feedback for a lead", async () => {
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.create({
      leadId: 1,
      status: "available",
      notes: "Test feedback",
    });

    expect(result).toBeDefined();
    expect(result.status).toBe("available");
    expect(result.notes).toBe("Test feedback");
  });

  it("should list feedback for a lead", async () => {
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.list({ leadId: 1 });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("User Management (Admin)", () => {
  const adminUser = {
    id: 1,
    openId: "admin-user",
    username: "admin",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "local",
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  it("should list all users for admin", async () => {
    const ctx = createTestContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.users.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a new user as admin", async () => {
    const ctx = createTestContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.users.create({
      username: "newuser",
      password: "password123",
      name: "New User",
    });

    expect(result).toBeDefined();
    expect(result.username).toBe("newuser");
    expect(result.name).toBe("New User");
  });

  it("should reset user password as admin", async () => {
    const ctx = createTestContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.users.resetPassword({
      userId: 2,
      newPassword: "newpassword123",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});

describe("Dashboard", () => {
  const user = {
    id: 1,
    openId: "test-user",
    username: "testuser",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "local",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  it("should get dashboard statistics", async () => {
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.stats();

    expect(result).toBeDefined();
    expect(typeof result.totalLeads).toBe("number");
    expect(typeof result.availableLeads).toBe("number");
    expect(typeof result.unavailableLeads).toBe("number");
    expect(typeof result.upcomingLeads).toBe("number");
  });

  it("should get upcoming follow-ups", async () => {
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.upcoming();

    expect(Array.isArray(result)).toBe(true);
  });
});
