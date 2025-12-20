import { mysqlTable, int, varchar, text, timestamp, tinyint, mysqlEnum, date, json, index } from "drizzle-orm/mysql-core";

// Tenants (Organizations)
export const tenants = mysqlTable("tenants", {
  id: int().autoincrement().notNull().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull(),
  logoUrl: text(),
  address: text(),
  telephone: varchar({ length: 20 }),
  email: varchar({ length: 255 }),
  managerName: varchar({ length: 255 }),
  managerTitle: varchar({ length: 255 }),
  serviceType: varchar({ length: 100 }),
  cqcInspectionDate: date({ mode: 'string' }),
  cqcRating: varchar({ length: 50 }),
  specialisms: text(),
  isSuspended: tinyint().default(0).notNull(),
  suspensionDate: date({ mode: 'string' }),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  createdById: int(),
  updatedById: int(),
  careSettingType: mysqlEnum(['residential', 'nursing', 'domiciliary', 'supported_living']),
});

// Tenant Subscriptions
export const tenantSubscriptions = mysqlTable("tenantSubscriptions", {
  id: int().autoincrement().notNull().primaryKey(),
  tenantId: int().notNull(),
  stripeCustomerId: varchar({ length: 255 }),
  stripeSubscriptionId: varchar({ length: 255 }),
  status: mysqlEnum(['active', 'past_due', 'canceled', 'unpaid', 'trialing', 'incomplete']).default('incomplete').notNull(),
  licensesCount: int().default(0).notNull(),
  billingInterval: mysqlEnum(['monthly', 'annual']).default('monthly').notNull(),
  currentPeriodStart: timestamp({ mode: 'string' }),
  currentPeriodEnd: timestamp({ mode: 'string' }),
  trialEndsAt: timestamp({ mode: 'string' }),
  cancelAtPeriodEnd: tinyint().default(0).notNull(),
  canceledAt: timestamp({ mode: 'string' }),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  isTrial: tinyint().default(0).notNull(),
  trialLicensesCount: int().default(0).notNull(),
});

// Users
export const users = mysqlTable("users", {
  id: int().autoincrement().notNull().primaryKey(),
  name: text(),
  email: varchar({ length: 320 }).notNull(),
  role: mysqlEnum(['admin', 'quality_officer', 'manager', 'staff']).default('staff').notNull(),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  tenantId: int(),
  locationId: int(),
  twoFaEnabled: int().notNull(),
  superAdmin: tinyint().default(0).notNull(),
  emailVerified: tinyint().default(0).notNull(),
  loginMethod: varchar({ length: 50 }),
});

// Locations
export const locations = mysqlTable("locations", {
  id: int().autoincrement().notNull().primaryKey(),
  tenantId: int().notNull(),
  name: varchar({ length: 255 }).notNull(),
  address: text(),
  managerName: varchar({ length: 255 }),
  managerEmail: varchar({ length: 255 }),
  numberOfServiceUsers: int(),
  numberOfStaff: int(),
  serviceType: varchar({ length: 100 }),
  contactPhone: varchar({ length: 20 }),
  contactEmail: varchar({ length: 255 }),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  cqcRating: varchar({ length: 50 }),
});

// Service Users
export const serviceUsers = mysqlTable("serviceUsers", {
  id: int().autoincrement().notNull().primaryKey(),
  tenantId: int().notNull(),
  locationId: int().notNull(),
  name: varchar({ length: 255 }).notNull(),
  dateOfBirth: date({ mode: 'string' }),
  carePackageType: varchar({ length: 100 }),
  admissionDate: date({ mode: 'string' }),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  isActive: tinyint().default(1).notNull(),
  dischargeDate: date({ mode: 'string' }),
});

// Staff Members
export const staffMembers = mysqlTable("staffMembers", {
  id: int().autoincrement().notNull().primaryKey(),
  tenantId: int().notNull(),
  locationId: int().notNull(),
  name: varchar({ length: 255 }).notNull(),
  role: varchar({ length: 100 }),
  employmentDate: date({ mode: 'string' }),
  isActive: tinyint().default(1).notNull(),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  employmentType: mysqlEnum(['permanent_sponsored', 'permanent_not_sponsored', 'agency']).default('permanent_not_sponsored'),
});

// Audit Instances
export const auditInstances = mysqlTable("auditInstances", {
  id: int().autoincrement().notNull().primaryKey(),
  tenantId: int().notNull(),
  locationId: int().notNull(),
  auditType: varchar({ length: 100 }),
  status: mysqlEnum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled').notNull(),
  completedAt: timestamp({ mode: 'string' }),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

// Incidents
export const incidents = mysqlTable("incidents", {
  id: int().autoincrement().notNull().primaryKey(),
  tenantId: int().notNull(),
  locationId: int().notNull(),
  incidentType: varchar({ length: 100 }),
  severity: mysqlEnum(['low', 'medium', 'high', 'critical']),
  status: mysqlEnum(['open', 'investigating', 'resolved', 'closed']).default('open').notNull(),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

// Support Tickets
export const supportTickets = mysqlTable("supportTickets", {
  id: int().autoincrement().primaryKey().notNull(),
  tenantId: varchar({ length: 255 }).notNull(),
  userId: varchar({ length: 255 }).notNull(),
  ticketNumber: varchar({ length: 50 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  subject: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  category: mysqlEnum(['bug', 'feature_request', 'question', 'other']).default('other').notNull(),
  priority: mysqlEnum(['low', 'medium', 'high', 'urgent']).default('medium').notNull(),
  status: mysqlEnum(['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed']).default('open').notNull(),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

// Admin Users table (for this admin portal only)
export const adminUsers = mysqlTable("adminUsers", {
  id: int().autoincrement().notNull().primaryKey(),
  email: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  lastLogin: timestamp({ mode: 'string' }),
});
