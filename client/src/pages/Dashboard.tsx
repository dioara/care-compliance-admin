import { useQuery } from '@tanstack/react-query';
import { stats, activity, analytics } from '@/lib/api';
import { Link } from 'wouter';
import {
  Building2,
  Users,
  UserCheck,
  MapPin,
  CreditCard,
  Clock,
  TicketIcon,
  TrendingUp,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const content = (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      {href && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const { data: overviewStats, isLoading: loadingStats } = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: stats.overview,
  });

  const { data: recentActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ['activity', 'recent'],
    queryFn: activity.recentSignups,
  });

  const { data: subAnalytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['analytics', 'subscriptions'],
    queryFn: analytics.subscriptions,
  });

  const isLoading = loadingStats || loadingActivity || loadingAnalytics;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statusData = subAnalytics?.statusDistribution.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' '),
    value: item.count,
  })) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of all organisations and system metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Organisations"
          value={overviewStats?.totalOrganisations || 0}
          icon={Building2}
          color="bg-blue-500"
          href="/organisations"
        />
        <StatCard
          title="Total Users"
          value={overviewStats?.totalUsers || 0}
          icon={Users}
          color="bg-green-500"
          href="/users"
        />
        <StatCard
          title="Service Users"
          value={overviewStats?.totalServiceUsers || 0}
          icon={UserCheck}
          color="bg-purple-500"
        />
        <StatCard
          title="Staff Members"
          value={overviewStats?.totalStaffMembers || 0}
          icon={UserCheck}
          color="bg-indigo-500"
        />
        <StatCard
          title="Locations"
          value={overviewStats?.totalLocations || 0}
          icon={MapPin}
          color="bg-orange-500"
        />
        <StatCard
          title="Active Subscriptions"
          value={overviewStats?.activeSubscriptions || 0}
          icon={CreditCard}
          color="bg-emerald-500"
          href="/subscriptions"
        />
        <StatCard
          title="Trial Subscriptions"
          value={overviewStats?.trialSubscriptions || 0}
          icon={Clock}
          color="bg-amber-500"
          href="/subscriptions"
        />
        <StatCard
          title="Open Support Tickets"
          value={overviewStats?.openSupportTickets || 0}
          icon={TicketIcon}
          color="bg-red-500"
          href="/support"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscription Status Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Subscription Status</h2>
          {statusData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No subscription data available
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {statusData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-slate-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Metrics */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Subscription Metrics</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-500">Total Licenses</p>
                <p className="text-2xl font-bold text-slate-900">{subAnalytics?.totalLicenses || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
              <div>
                <p className="text-sm text-amber-700">Trials Expiring Soon</p>
                <p className="text-2xl font-bold text-amber-900">{subAnalytics?.expiringTrialsCount || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {subAnalytics?.intervalDistribution.map((item) => (
                <div key={item.interval} className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 capitalize">{item.interval}</p>
                  <p className="text-xl font-bold text-slate-900">{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Organisations */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Organisations</h2>
            <Link href="/organisations" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity?.recentOrganisations.slice(0, 5).map((org) => (
              <Link
                key={org.id}
                href={`/organisations/${org.id}`}
                className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{org.name}</p>
                    <p className="text-sm text-slate-500">{org.email || 'No email'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            ))}
            {(!recentActivity?.recentOrganisations || recentActivity.recentOrganisations.length === 0) && (
              <p className="text-center text-slate-400 py-4">No recent organisations</p>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Users</h2>
            <Link href="/users" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity?.recentUsers.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{user.name || 'Unnamed'}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
            {(!recentActivity?.recentUsers || recentActivity.recentUsers.length === 0) && (
              <p className="text-center text-slate-400 py-4">No recent users</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
