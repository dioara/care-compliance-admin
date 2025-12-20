import { useQuery } from '@tanstack/react-query';
import { organizations, type Organization } from '@/lib/api';
import { Link } from 'wouter';
import {
  Building2,
  Users,
  MapPin,
  UserCheck,
  Search,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';

function SubscriptionBadge({ subscription }: { subscription: Organization['subscription'] }) {
  if (!subscription) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
        <XCircle className="h-3 w-3" />
        No Subscription
      </span>
    );
  }

  const statusConfig: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    active: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    trialing: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    past_due: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
    canceled: { bg: 'bg-slate-100', text: 'text-slate-600', icon: XCircle },
    unpaid: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
    incomplete: { bg: 'bg-slate-100', text: 'text-slate-600', icon: Clock },
  };

  const config = statusConfig[subscription.status] || statusConfig.incomplete;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 ${config.bg} ${config.text} text-xs font-medium rounded-full capitalize`}>
      <Icon className="h-3 w-3" />
      {subscription.status.replace('_', ' ')}
    </span>
  );
}

export default function Organizations() {
  const [search, setSearch] = useState('');

  const { data: orgs, isLoading, error } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizations.list,
  });

  const filteredOrgs = orgs?.filter(
    (org) =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.email?.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">Failed to load organizations</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
          <p className="text-slate-500 mt-1">{orgs?.length || 0} total organizations</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Locations
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Service Users
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Staff
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrgs?.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{org.name}</p>
                        <p className="text-sm text-slate-500">{org.email || org.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <SubscriptionBadge subscription={org.subscription} />
                    {org.subscription?.licensesCount ? (
                      <p className="text-xs text-slate-500 mt-1">
                        {org.subscription.licensesCount} licenses
                      </p>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{org.userCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{org.locationCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-medium">{org.serviceUserCount}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-medium">{org.staffCount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-500">
                      {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/organizations/${org.id}`}
                      className="p-2 hover:bg-slate-100 rounded-lg inline-flex"
                    >
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrgs?.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No organizations found</p>
          </div>
        )}
      </div>
    </div>
  );
}
