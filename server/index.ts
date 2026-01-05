import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { db, schema } from "./db.js";
import { eq, sql, desc, count, and, gte, lte, isNull, isNotNull } from "drizzle-orm";
import { verifyPassword, hashPassword, createToken, verifyToken, type AdminUser } from "./auth.js";
import path from "path";
import fs from "fs";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("/api/*", cors({
  origin: ["http://localhost:5173", "http://localhost:3001"],
  credentials: true,
}));

// Auth middleware for protected routes
async function authMiddleware(c: any, next: () => Promise<void>) {
  const token = getCookie(c, "admin_token");
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const user = await verifyToken(token);
  if (!user) {
    return c.json({ error: "Invalid token" }, 401);
  }
  
  c.set("user", user);
  return next();
}

// ============ AUTH ROUTES ============

// Login
app.post("/api/auth/login", async (c) => {
  const { email, password } = await c.req.json();
  
  // Check for owner credentials (hardcoded for simplicity - you can change this)
  const OWNER_EMAIL = process.env.OWNER_EMAIL || "owner@carecompliancesystem.com";
  const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "OwnerAdmin2024!";
  
  if (email === OWNER_EMAIL && password === OWNER_PASSWORD) {
    const user: AdminUser = {
      id: 1,
      email: OWNER_EMAIL,
      name: "System Owner",
    };
    
    const token = await createToken(user);
    setCookie(c, "admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
    
    return c.json({ user });
  }
  
  return c.json({ error: "Invalid credentials" }, 401);
});

// Logout
app.post("/api/auth/logout", (c) => {
  deleteCookie(c, "admin_token");
  return c.json({ success: true });
});

// Get current user
app.get("/api/auth/me", async (c) => {
  const token = getCookie(c, "admin_token");
  if (!token) {
    return c.json({ user: null });
  }
  
  const user = await verifyToken(token);
  return c.json({ user });
});

// ============ DASHBOARD STATS ============

app.get("/api/stats/overview", authMiddleware, async (c) => {
  try {
    // Total organisations
    const [orgCount] = await db.select({ count: count() }).from(schema.tenants);
    
    // Total users
    const [userCount] = await db.select({ count: count() }).from(schema.users);
    
    // Total service users
    const [serviceUserCount] = await db.select({ count: count() }).from(schema.serviceUsers);
    
    // Total staff members
    const [staffCount] = await db.select({ count: count() }).from(schema.staffMembers);
    
    // Total locations
    const [locationCount] = await db.select({ count: count() }).from(schema.locations);
    
    // Active subscriptions
    const [activeSubCount] = await db.select({ count: count() })
      .from(schema.tenantSubscriptions)
      .where(eq(schema.tenantSubscriptions.status, "active"));
    
    // Trial subscriptions
    const [trialSubCount] = await db.select({ count: count() })
      .from(schema.tenantSubscriptions)
      .where(eq(schema.tenantSubscriptions.status, "trialing"));
    
    // Open support tickets
    const [openTicketCount] = await db.select({ count: count() })
      .from(schema.supportTickets)
      .where(eq(schema.supportTickets.status, "open"));
    
    return c.json({
      totalOrganisations: orgCount.count,
      totalUsers: userCount.count,
      totalServiceUsers: serviceUserCount.count,
      totalStaffMembers: staffCount.count,
      totalLocations: locationCount.count,
      activeSubscriptions: activeSubCount.count,
      trialSubscriptions: trialSubCount.count,
      openSupportTickets: openTicketCount.count,
    });
  } catch (error) {
    console.error("Error fetching overview stats:", error);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

// ============ ORGANIZATIONS ============

app.get("/api/organisations", authMiddleware, async (c) => {
  try {
    const organisations = await db
      .select({
        id: schema.tenants.id,
        name: schema.tenants.name,
        slug: schema.tenants.slug,
        email: schema.tenants.email,
        telephone: schema.tenants.telephone,
        managerName: schema.tenants.managerName,
        serviceType: schema.tenants.serviceType,
        careSettingType: schema.tenants.careSettingType,
        cqcRating: schema.tenants.cqcRating,
        isSuspended: schema.tenants.isSuspended,
        createdAt: schema.tenants.createdAt,
      })
      .from(schema.tenants)
      .orderBy(desc(schema.tenants.createdAt));
    
    // Get user counts per organisation
    const userCounts = await db
      .select({
        tenantId: schema.users.tenantId,
        count: count(),
      })
      .from(schema.users)
      .where(isNotNull(schema.users.tenantId))
      .groupBy(schema.users.tenantId);
    
    // Get location counts per organisation
    const locationCounts = await db
      .select({
        tenantId: schema.locations.tenantId,
        count: count(),
      })
      .from(schema.locations)
      .groupBy(schema.locations.tenantId);
    
    // Get service user counts per organisation
    const serviceUserCounts = await db
      .select({
        tenantId: schema.serviceUsers.tenantId,
        count: count(),
      })
      .from(schema.serviceUsers)
      .groupBy(schema.serviceUsers.tenantId);
    
    // Get staff counts per organisation
    const staffCounts = await db
      .select({
        tenantId: schema.staffMembers.tenantId,
        count: count(),
      })
      .from(schema.staffMembers)
      .groupBy(schema.staffMembers.tenantId);
    
    // Get subscription status per organisation
    const subscriptions = await db
      .select({
        tenantId: schema.tenantSubscriptions.tenantId,
        status: schema.tenantSubscriptions.status,
        licensesCount: schema.tenantSubscriptions.licensesCount,
        billingInterval: schema.tenantSubscriptions.billingInterval,
        isTrial: schema.tenantSubscriptions.isTrial,
        trialEndsAt: schema.tenantSubscriptions.trialEndsAt,
        currentPeriodEnd: schema.tenantSubscriptions.currentPeriodEnd,
      })
      .from(schema.tenantSubscriptions);
    
    // Combine data
    const enrichedOrgs = organisations.map(org => {
      const userCount = userCounts.find(u => u.tenantId === org.id)?.count || 0;
      const locationCount = locationCounts.find(l => l.tenantId === org.id)?.count || 0;
      const serviceUserCount = serviceUserCounts.find(s => s.tenantId === org.id)?.count || 0;
      const staffCount = staffCounts.find(s => s.tenantId === org.id)?.count || 0;
      const subscription = subscriptions.find(s => s.tenantId === org.id);
      
      return {
        ...org,
        userCount,
        locationCount,
        serviceUserCount,
        staffCount,
        subscription: subscription || null,
      };
    });
    
    return c.json(enrichedOrgs);
  } catch (error) {
    console.error("Error fetching organisations:", error);
    return c.json({ error: "Failed to fetch organisations" }, 500);
  }
});

// Get single organisation details
app.get("/api/organisations/:id", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  
  try {
    const [org] = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.id, id));
    
    if (!org) {
      return c.json({ error: "Organisation not found" }, 404);
    }
    
    // Get users for this org
    const users = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        lastSignedIn: schema.users.lastSignedIn,
        createdAt: schema.users.createdAt,
        emailVerified: schema.users.emailVerified,
      })
      .from(schema.users)
      .where(eq(schema.users.tenantId, id))
      .orderBy(desc(schema.users.createdAt));
    
    // Get locations
    const locations = await db
      .select()
      .from(schema.locations)
      .where(eq(schema.locations.tenantId, id));
    
    // Get subscription
    const [subscription] = await db
      .select()
      .from(schema.tenantSubscriptions)
      .where(eq(schema.tenantSubscriptions.tenantId, id));
    
    // Get service user count
    const [serviceUserCount] = await db
      .select({ count: count() })
      .from(schema.serviceUsers)
      .where(eq(schema.serviceUsers.tenantId, id));
    
    // Get staff count
    const [staffCount] = await db
      .select({ count: count() })
      .from(schema.staffMembers)
      .where(eq(schema.staffMembers.tenantId, id));
    
    return c.json({
      ...org,
      users,
      locations,
      subscription,
      serviceUserCount: serviceUserCount.count,
      staffCount: staffCount.count,
    });
  } catch (error) {
    console.error("Error fetching organisation:", error);
    return c.json({ error: "Failed to fetch organisation" }, 500);
  }
});

// ============ USERS ============

app.get("/api/users", authMiddleware, async (c) => {
  try {
    const users = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        tenantId: schema.users.tenantId,
        lastSignedIn: schema.users.lastSignedIn,
        createdAt: schema.users.createdAt,
        emailVerified: schema.users.emailVerified,
        superAdmin: schema.users.superAdmin,
        loginMethod: schema.users.loginMethod,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt));
    
    // Get tenant names
    const tenants = await db
      .select({ id: schema.tenants.id, name: schema.tenants.name })
      .from(schema.tenants);
    
    const tenantMap = new Map(tenants.map(t => [t.id, t.name]));
    
    const enrichedUsers = users.map(user => ({
      ...user,
      tenantName: user.tenantId ? tenantMap.get(user.tenantId) || "Unknown" : "No Organisation",
    }));
    
    return c.json(enrichedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// ============ SUBSCRIPTIONS ============

app.get("/api/subscriptions", authMiddleware, async (c) => {
  try {
    const subscriptions = await db
      .select({
        id: schema.tenantSubscriptions.id,
        tenantId: schema.tenantSubscriptions.tenantId,
        status: schema.tenantSubscriptions.status,
        licensesCount: schema.tenantSubscriptions.licensesCount,
        billingInterval: schema.tenantSubscriptions.billingInterval,
        currentPeriodStart: schema.tenantSubscriptions.currentPeriodStart,
        currentPeriodEnd: schema.tenantSubscriptions.currentPeriodEnd,
        trialEndsAt: schema.tenantSubscriptions.trialEndsAt,
        isTrial: schema.tenantSubscriptions.isTrial,
        cancelAtPeriodEnd: schema.tenantSubscriptions.cancelAtPeriodEnd,
        createdAt: schema.tenantSubscriptions.createdAt,
      })
      .from(schema.tenantSubscriptions)
      .orderBy(desc(schema.tenantSubscriptions.createdAt));
    
    // Get tenant names
    const tenants = await db
      .select({ id: schema.tenants.id, name: schema.tenants.name })
      .from(schema.tenants);
    
    const tenantMap = new Map(tenants.map(t => [t.id, t.name]));
    
    const enrichedSubs = subscriptions.map(sub => ({
      ...sub,
      tenantName: tenantMap.get(sub.tenantId) || "Unknown",
    }));
    
    return c.json(enrichedSubs);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return c.json({ error: "Failed to fetch subscriptions" }, 500);
  }
});

// ============ ACTIVITY / RECENT SIGNUPS ============

app.get("/api/activity/recent-signups", authMiddleware, async (c) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrgs = await db
      .select({
        id: schema.tenants.id,
        name: schema.tenants.name,
        email: schema.tenants.email,
        createdAt: schema.tenants.createdAt,
      })
      .from(schema.tenants)
      .orderBy(desc(schema.tenants.createdAt))
      .limit(10);
    
    const recentUsers = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        tenantId: schema.users.tenantId,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt))
      .limit(10);
    
    return c.json({
      recentOrganisations: recentOrgs,
      recentUsers: recentUsers,
    });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return c.json({ error: "Failed to fetch activity" }, 500);
  }
});

// ============ SUPPORT TICKETS ============

app.get("/api/support-tickets", authMiddleware, async (c) => {
  try {
    const tickets = await db
      .select()
      .from(schema.supportTickets)
      .orderBy(desc(schema.supportTickets.createdAt));
    
    return c.json(tickets);
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    return c.json({ error: "Failed to fetch support tickets" }, 500);
  }
});

// ============ ORGANIZATION CRUD ============

// Update organisation
app.put("/api/organisations/:id", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  try {
    const [existing] = await db.select().from(schema.tenants).where(eq(schema.tenants.id, id));
    if (!existing) {
      return c.json({ error: "Organisation not found" }, 404);
    }
    
    await db.update(schema.tenants)
      .set({
        name: body.name,
        email: body.email,
        telephone: body.telephone,
        managerName: body.managerName,
        serviceType: body.serviceType,
        careSettingType: body.careSettingType,
        cqcRating: body.cqcRating,
        isSuspended: body.isSuspended,
      })
      .where(eq(schema.tenants.id, id));
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating organisation:", error);
    return c.json({ error: "Failed to update organisation" }, 500);
  }
});

// Suspend/Unsuspend organisation
app.patch("/api/organisations/:id/suspend", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const { isSuspended } = await c.req.json();
  
  try {
    await db.update(schema.tenants)
      .set({ isSuspended })
      .where(eq(schema.tenants.id, id));
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error suspending organisation:", error);
    return c.json({ error: "Failed to suspend organisation" }, 500);
  }
});

// Delete organisation (soft delete by suspending, or hard delete)
app.delete("/api/organisations/:id", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  
  try {
    // First check if org exists
    const [existing] = await db.select().from(schema.tenants).where(eq(schema.tenants.id, id));
    if (!existing) {
      return c.json({ error: "Organisation not found" }, 404);
    }
    
    // Delete related data first (cascade)
    await db.delete(schema.tenantSubscriptions).where(eq(schema.tenantSubscriptions.tenantId, id));
    await db.delete(schema.supportTickets).where(eq(schema.supportTickets.tenantId, String(id)));
    // Update users to remove tenant association
    await db.update(schema.users).set({ tenantId: null }).where(eq(schema.users.tenantId, id));
    // Delete locations
    await db.delete(schema.locations).where(eq(schema.locations.tenantId, id));
    // Delete service users
    await db.delete(schema.serviceUsers).where(eq(schema.serviceUsers.tenantId, id));
    // Delete staff members
    await db.delete(schema.staffMembers).where(eq(schema.staffMembers.tenantId, id));
    // Finally delete the tenant
    await db.delete(schema.tenants).where(eq(schema.tenants.id, id));
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting organisation:", error);
    return c.json({ error: "Failed to delete organisation" }, 500);
  }
});

// ============ USER CRUD ============

// Update user
app.put("/api/users/:id", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  try {
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    if (!existing) {
      return c.json({ error: "User not found" }, 404);
    }
    
    await db.update(schema.users)
      .set({
        name: body.name,
        email: body.email,
        role: body.role,
        superAdmin: body.superAdmin,
      })
      .where(eq(schema.users.id, id));
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return c.json({ error: "Failed to update user" }, 500);
  }
});

// Delete user
app.delete("/api/users/:id", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  
  try {
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    if (!existing) {
      return c.json({ error: "User not found" }, 404);
    }
    
    await db.delete(schema.users).where(eq(schema.users.id, id));
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return c.json({ error: "Failed to delete user" }, 500);
  }
});

// Reset user password (admin action)
app.patch("/api/users/:id/password", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  try {
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    if (!existing) {
      return c.json({ error: "User not found" }, 404);
    }
    
    const { newPassword } = body;
    if (!newPassword || newPassword.length < 8) {
      return c.json({ error: "Password must be at least 8 characters" }, 400);
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    await db.update(schema.users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.users.id, id));
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error resetting user password:", error);
    return c.json({ error: "Failed to reset password" }, 500);
  }
});

// ============ SUPPORT TICKET CRUD ============

// Get single ticket
app.get("/api/support-tickets/:id", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  
  try {
    const [ticket] = await db.select().from(schema.supportTickets).where(eq(schema.supportTickets.id, id));
    if (!ticket) {
      return c.json({ error: "Ticket not found" }, 404);
    }
    
    // Get tenant info if available
    let tenant = null;
    if (ticket.tenantId) {
      const tenantIdNum = parseInt(ticket.tenantId);
      if (!isNaN(tenantIdNum)) {
        const [t] = await db.select({ id: schema.tenants.id, name: schema.tenants.name })
          .from(schema.tenants)
          .where(eq(schema.tenants.id, tenantIdNum));
        tenant = t;
      }
    }
    
    // Get user info if available
    let user = null;
    if (ticket.userId) {
      const userIdNum = parseInt(ticket.userId);
      if (!isNaN(userIdNum)) {
        const [u] = await db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
          .from(schema.users)
          .where(eq(schema.users.id, userIdNum));
        user = u;
      }
    }
    
    return c.json({ ...ticket, tenant, user });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return c.json({ error: "Failed to fetch ticket" }, 500);
  }
});

// Update ticket status
app.patch("/api/support-tickets/:id/status", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const { status } = await c.req.json();
  
  try {
    await db.update(schema.supportTickets)
      .set({ status })
      .where(eq(schema.supportTickets.id, id));
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return c.json({ error: "Failed to update ticket status" }, 500);
  }
});

// Update ticket priority
app.patch("/api/support-tickets/:id/priority", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const { priority } = await c.req.json();
  
  try {
    await db.update(schema.supportTickets)
      .set({ priority })
      .where(eq(schema.supportTickets.id, id));
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating ticket priority:", error);
    return c.json({ error: "Failed to update ticket priority" }, 500);
  }
});

// Add response to ticket
app.post("/api/support-tickets/:id/respond", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const { response } = await c.req.json();
  
  try {
    const [ticket] = await db.select().from(schema.supportTickets).where(eq(schema.supportTickets.id, id));
    if (!ticket) {
      return c.json({ error: "Ticket not found" }, 404);
    }
    
    // Append response to existing response or create new
    const existingResponse = ticket.response || "";
    const timestamp = new Date().toISOString();
    const newResponse = existingResponse 
      ? `${existingResponse}\n\n---\n[${timestamp}] Owner Response:\n${response}`
      : `[${timestamp}] Owner Response:\n${response}`;
    
    await db.update(schema.supportTickets)
      .set({ 
        response: newResponse, 
        status: "in_progress",
      })
      .where(eq(schema.supportTickets.id, id));
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error responding to ticket:", error);
    return c.json({ error: "Failed to respond to ticket" }, 500);
  }
});

// Close ticket
app.patch("/api/support-tickets/:id/close", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  
  try {
    await db.update(schema.supportTickets)
      .set({ status: "closed" })
      .where(eq(schema.supportTickets.id, id));
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error closing ticket:", error);
    return c.json({ error: "Failed to close ticket" }, 500);
  }
});

// Delete ticket
app.delete("/api/support-tickets/:id", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  
  try {
    await db.delete(schema.supportTickets).where(eq(schema.supportTickets.id, id));
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return c.json({ error: "Failed to delete ticket" }, 500);
  }
});

// ============ SUBSCRIPTION ANALYTICS ============

app.get("/api/analytics/subscriptions", authMiddleware, async (c) => {
  try {
    // Status distribution
    const statusDist = await db
      .select({
        status: schema.tenantSubscriptions.status,
        count: count(),
      })
      .from(schema.tenantSubscriptions)
      .groupBy(schema.tenantSubscriptions.status);
    
    // Billing interval distribution
    const intervalDist = await db
      .select({
        interval: schema.tenantSubscriptions.billingInterval,
        count: count(),
      })
      .from(schema.tenantSubscriptions)
      .groupBy(schema.tenantSubscriptions.billingInterval);
    
    // Total licenses
    const [totalLicenses] = await db
      .select({ total: sql<number>`SUM(${schema.tenantSubscriptions.licensesCount})` })
      .from(schema.tenantSubscriptions);
    
    // Trials expiring soon (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const expiringTrials = await db
      .select({
        tenantId: schema.tenantSubscriptions.tenantId,
        trialEndsAt: schema.tenantSubscriptions.trialEndsAt,
      })
      .from(schema.tenantSubscriptions)
      .where(
        and(
          eq(schema.tenantSubscriptions.status, "trialing"),
          isNotNull(schema.tenantSubscriptions.trialEndsAt)
        )
      );
    
    return c.json({
      statusDistribution: statusDist,
      intervalDistribution: intervalDist,
      totalLicenses: totalLicenses.total || 0,
      expiringTrialsCount: expiringTrials.length,
    });
  } catch (error) {
    console.error("Error fetching subscription analytics:", error);
    return c.json({ error: "Failed to fetch analytics" }, 500);
  }
});

// ============ SERVE STATIC FILES ============

// In development, Vite handles static files
// In production, serve from dist/client
if (process.env.NODE_ENV === "production") {
  // Serve static assets from dist/client
  app.use("/assets/*", serveStatic({ root: "./dist/client" }));
  app.use("/favicon.svg", serveStatic({ root: "./dist/client" }));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get("*", (c) => {
    const requestPath = c.req.path;
    // Skip API routes
    if (requestPath.startsWith("/api")) {
      return c.text("Not found", 404);
    }
    const indexPath = path.join(process.cwd(), "dist/client/index.html");
    if (fs.existsSync(indexPath)) {
      return c.html(fs.readFileSync(indexPath, "utf-8"));
    }
    return c.text("Not found", 404);
  });
}

const port = parseInt(process.env.PORT || "3001");

console.log(`🚀 Admin Portal server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
