import { useQuery } from '@tanstack/react-query';
import { organizations } from '@/lib/api';
import { Link } from 'wouter';
import {
  ArrowLeft,
  Building2,
  Users,
  MapPin,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  UserCheck,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function OrganizationDetail({ id }: { id: number }) {
  const { data: org, isLoading, error } = useQuery({
    queryKey: ['organizations', id],
    queryFn: () => organizations.get(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">Failed to load organization</p>
        <Link href="/organizations" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to organizations
        </Link>
      </div>
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

  const subStatus = org.subscription?.status || 'incomplete';
  const subConfig = statusConfig[subStatus] || statusConfig.incomplete;
  const SubIcon = subConfig.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/organizations"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
          <p className="text-slate-500">{org.slug}</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <span className="font-medium text-slate-700">Users</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{org.users?.length || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <span className="font-medium text-slate-700">Locations</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{org.locations?.length || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCheck className="h-5 w-5 text-purple-600" />
            </div>
            <span className="font-medium text-slate-700">Service Users</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{org.serviceUserCount || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserCheck className="h-5 w-5 text-orange-600" />
            </div>
            <span className="font-medium text-slate-700">Staff Members</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{org.staffCount || 0}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Organization Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Organization Details</h2>
          <div className="space-y-4">
            {org.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-400" />
                <span className="text-slate-700">{org.email}</span>
              </div>
            )}
            {org.telephone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-slate-400" />
                <span className="text-slate-700">{org.telephone}</span>
              </div>
            )}
            {org.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                <span className="text-slate-700">{org.address}</span>
              </div>
            )}
            {org.managerName && (
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-slate-400" />
                <span className="text-slate-700">
                  {org.managerName}
                  {org.managerTitle && ` (${org.managerTitle})`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-slate-400" />
              <span className="text-slate-700">
                Created {format(new Date(org.createdAt), 'PPP')}
              </span>
            </div>
            {org.careSettingType && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-sm text-slate-500">Care Setting:</span>
                <span className="ml-2 text-slate-700 capitalize">
                  {org.careSettingType.replace('_', ' ')}
                </span>
              </div>
            )}
            {org.cqcRating && (
              <div>
                <span className="text-sm text-slate-500">CQC Rating:</span>
                <span className="ml-2 text-slate-700">{org.cqcRating}</span>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Subscription</h2>
          {org.subscription ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 ${subConfig.bg} ${subConfig.text} text-sm font-medium rounded-full capitalize`}>
                  <SubIcon className="h-4 w-4" />
                  {org.subscription.status.replace('_', ' ')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Licenses</p>
                  <p className="text-xl font-bold text-slate-900">{org.subscription.licensesCount}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Billing</p>
                  <p className="text-xl font-bold text-slate-900 capitalize">{org.subscription.billingInterval}</p>
                </div>
              </div>
              {org.subscription.currentPeriodEnd && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-sm text-slate-500">Current Period Ends</p>
                  <p className="text-slate-700">
                    {format(new Date(org.subscription.currentPeriodEnd), 'PPP')}
                  </p>
                </div>
              )}
              {org.subscription.isTrial && org.subscription.trialEndsAt && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-700">Trial Ends</p>
                  <p className="font-medium text-amber-900">
                    {format(new Date(org.subscription.trialEndsAt), 'PPP')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No subscription</p>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Users ({org.users?.length || 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Email Verified</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Last Sign In</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {org.users?.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{user.name || 'Unnamed'}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded capitalize">
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.emailVerified ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-slate-300" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {formatDistanceToNow(new Date(user.lastSignedIn), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {format(new Date(user.createdAt), 'PP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!org.users || org.users.length === 0) && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No users</p>
          </div>
        )}
      </div>

      {/* Locations Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Locations ({org.locations?.length || 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Location</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Manager</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {org.locations?.map((location) => (
                <tr key={location.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{location.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-slate-700">{location.managerName || '-'}</p>
                      {location.managerEmail && (
                        <p className="text-sm text-slate-500">{location.managerEmail}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {location.address || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!org.locations || org.locations.length === 0) && (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No locations</p>
          </div>
        )}
      </div>
    </div>
  );
}
