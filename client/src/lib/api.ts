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
      totalOrganisations: number;
      totalUsers: number;
      totalServiceUsers: number;
      totalStaffMembers: number;
      totalLocations: number;
      activeSubscriptions: number;
      trialSubscriptions: number;
      openSupportTickets: number;
    }>('/stats/overview'),
};

// Organisations
export interface Organisation {
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

export interface OrganisationDetails extends Organisation {
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

export const organisations = {
  list: () => fetchAPI<Organisation[]>('/organisations'),
  get: (id: number) => fetchAPI<OrganisationDetails>(`/organisations/${id}`),
  update: (id: number, data: Partial<Organisation>) =>
    fetchAPI<{ success: boolean }>(`/organisations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  suspend: (id: number, isSuspended: boolean) =>
    fetchAPI<{ success: boolean }>(`/organisations/${id}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ isSuspended }),
    }),
  delete: (id: number) =>
    fetchAPI<{ success: boolean }>(`/organisations/${id}`, {
      method: 'DELETE',
    }),
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
  update: (id: number, data: Partial<User>) =>
    fetchAPI<{ success: boolean }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchAPI<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    }),
  resetPassword: (id: number, newPassword: string) =>
    fetchAPI<{ success: boolean }>(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    }),
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
      recentOrganisations: { id: number; name: string; email: string | null; createdAt: string }[];
      recentUsers: { id: number; name: string | null; email: string; tenantId: number | null; createdAt: string }[];
    }>('/activity/recent-signups'),
};

// Support Tickets
export interface SupportTicket {
  id: number;
  tenantId: number | null;
  userId: number | null;
  ticketNumber: string;
  name: string;
  email: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  response: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketDetails extends SupportTicket {
  tenant: { id: number; name: string } | null;
  user: { id: number; name: string; email: string } | null;
}

export const supportTickets = {
  list: () => fetchAPI<SupportTicket[]>('/support-tickets'),
  get: (id: number) => fetchAPI<SupportTicketDetails>(`/support-tickets/${id}`),
  updateStatus: (id: number, status: string) =>
    fetchAPI<{ success: boolean }>(`/support-tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  updatePriority: (id: number, priority: string) =>
    fetchAPI<{ success: boolean }>(`/support-tickets/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority }),
    }),
  respond: (id: number, response: string) =>
    fetchAPI<{ success: boolean }>(`/support-tickets/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    }),
  close: (id: number) =>
    fetchAPI<{ success: boolean }>(`/support-tickets/${id}/close`, {
      method: 'PATCH',
    }),
  delete: (id: number) =>
    fetchAPI<{ success: boolean }>(`/support-tickets/${id}`, {
      method: 'DELETE',
    }),
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
