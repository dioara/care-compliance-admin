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
    // Total organizations
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
      totalOrganizations: orgCount.count,
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

app.get("/api/organizations", authMiddleware, async (c) => {
  try {
    const organizations = await db
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
    
    // Get user counts per organization
    const userCounts = await db
      .select({
        tenantId: schema.users.tenantId,
        count: count(),
      })
      .from(schema.users)
      .where(isNotNull(schema.users.tenantId))
      .groupBy(schema.users.tenantId);
    
    // Get location counts per organization
    const locationCounts = await db
      .select({
        tenantId: schema.locations.tenantId,
        count: count(),
      })
      .from(schema.locations)
      .groupBy(schema.locations.tenantId);
    
    // Get service user counts per organization
    const serviceUserCounts = await db
      .select({
        tenantId: schema.serviceUsers.tenantId,
        count: count(),
      })
      .from(schema.serviceUsers)
      .groupBy(schema.serviceUsers.tenantId);
    
    // Get staff counts per organization
    const staffCounts = await db
      .select({
        tenantId: schema.staffMembers.tenantId,
        count: count(),
      })
      .from(schema.staffMembers)
      .groupBy(schema.staffMembers.tenantId);
    
    // Get subscription status per organization
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
    const enrichedOrgs = organizations.map(org => {
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
    console.error("Error fetching organizations:", error);
    return c.json({ error: "Failed to fetch organizations" }, 500);
  }
});

// Get single organization details
app.get("/api/organizations/:id", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  
  try {
    const [org] = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.id, id));
    
    if (!org) {
      return c.json({ error: "Organization not found" }, 404);
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
    console.error("Error fetching organization:", error);
    return c.json({ error: "Failed to fetch organization" }, 500);
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
      tenantName: user.tenantId ? tenantMap.get(user.tenantId) || "Unknown" : "No Organization",
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
      recentOrganizations: recentOrgs,
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
  const clientPath = path.join(process.cwd(), "dist/client");
  
  app.use("/*", serveStatic({ root: clientPath }));
  
  // SPA fallback
  app.get("*", (c) => {
    const indexPath = path.join(clientPath, "index.html");
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
