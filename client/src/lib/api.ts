const API_BASE = '/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Auth
export const auth = {
  login: (email: string, password: string) =>
    fetchAPI<{ user: { id: number; email: string; name: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => fetchAPI<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => fetchAPI<{ user: { id: number; email: string; name: string } | null }>('/auth/me'),
};

// Stats
export const stats = {
  overview: () =>
    fetchAPI<{
      totalOrganizations: number;
      totalUsers: number;
      totalServiceUsers: number;
      totalStaffMembers: number;
      totalLocations: number;
      activeSubscriptions: number;
      trialSubscriptions: number;
      openSupportTickets: number;
    }>('/stats/overview'),
};

// Organizations
export interface Organization {
  id: number;
  name: string;
  slug: string;
  email: string | null;
  telephone: string | null;
  managerName: string | null;
  serviceType: string | null;
  careSettingType: string | null;
  cqcRating: string | null;
  isSuspended: number;
  createdAt: string;
  userCount: number;
  locationCount: number;
  serviceUserCount: number;
  staffCount: number;
  subscription: {
    status: string;
    licensesCount: number;
    billingInterval: string;
    isTrial: number;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
  } | null;
}

export interface OrganizationDetails extends Organization {
  address: string | null;
  managerTitle: string | null;
  specialisms: string | null;
  users: {
    id: number;
    name: string | null;
    email: string;
    role: string;
    lastSignedIn: string;
    createdAt: string;
    emailVerified: number;
  }[];
  locations: {
    id: number;
    name: string;
    address: string | null;
    managerName: string | null;
    managerEmail: string | null;
  }[];
}

export const organizations = {
  list: () => fetchAPI<Organization[]>('/organizations'),
  get: (id: number) => fetchAPI<OrganizationDetails>(`/organizations/${id}`),
};

// Users
export interface User {
  id: number;
  name: string | null;
  email: string;
  role: string;
  tenantId: number | null;
  tenantName: string;
  lastSignedIn: string;
  createdAt: string;
  emailVerified: number;
  superAdmin: number;
  loginMethod: string | null;
}

export const users = {
  list: () => fetchAPI<User[]>('/users'),
};

// Subscriptions
export interface Subscription {
  id: number;
  tenantId: number;
  tenantName: string;
  status: string;
  licensesCount: number;
  billingInterval: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  isTrial: number;
  cancelAtPeriodEnd: number;
  createdAt: string;
}

export const subscriptions = {
  list: () => fetchAPI<Subscription[]>('/subscriptions'),
};

// Activity
export const activity = {
  recentSignups: () =>
    fetchAPI<{
      recentOrganizations: { id: number; name: string; email: string | null; createdAt: string }[];
      recentUsers: { id: number; name: string | null; email: string; tenantId: number | null; createdAt: string }[];
    }>('/activity/recent-signups'),
};

// Support Tickets
export interface SupportTicket {
  id: number;
  tenantId: string;
  userId: string;
  ticketNumber: string;
  name: string;
  email: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const supportTickets = {
  list: () => fetchAPI<SupportTicket[]>('/support-tickets'),
};

// Analytics
export const analytics = {
  subscriptions: () =>
    fetchAPI<{
      statusDistribution: { status: string; count: number }[];
      intervalDistribution: { interval: string; count: number }[];
      totalLicenses: number;
      expiringTrialsCount: number;
    }>('/analytics/subscriptions'),
};
