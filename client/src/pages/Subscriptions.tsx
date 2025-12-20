import { useQuery } from '@tanstack/react-query';
import { subscriptions } from '@/lib/api';
import {
  CreditCard,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { useState } from 'react';
import { format, formatDistanceToNow, isPast, isFuture, addDays } from 'date-fns';

export default function Subscriptions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: subList, isLoading, error } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: subscriptions.list,
  });

  const filteredSubs = subList?.filter((sub) => {
    const matchesSearch = sub.tenantName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ['all', 'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete'];

  const statusConfig: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    active: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    trialing: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    past_due: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
    canceled: { bg: 'bg-slate-100', text: 'text-slate-600', icon: XCircle },
    unpaid: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
    incomplete: { bg: 'bg-slate-100', text: 'text-slate-600', icon: Clock },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">Failed to load subscriptions</p>
      </div>
    );
  }

  // Calculate summary stats
  const activeCount = subList?.filter((s) => s.status === 'active').length || 0;
  const trialCount = subList?.filter((s) => s.status === 'trialing').length || 0;
  const totalLicenses = subList?.reduce((sum, s) => sum + s.licensesCount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
          <p className="text-slate-500 mt-1">{subList?.length || 0} total subscriptions</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none capitalize"
          >
            {statuses.map((status) => (
              <option key={status} value={status} className="capitalize">
                {status === 'all' ? 'All Statuses' : status.replace('_', ' ')}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by organization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active</p>
              <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Trialing</p>
              <p className="text-2xl font-bold text-slate-900">{trialCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Licenses</p>
              <p className="text-2xl font-bold text-slate-900">{totalLicenses}</p>
            </div>
          </div>
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
                  Status
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Licenses
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Billing
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Period End / Trial End
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSubs?.map((sub) => {
                const config = statusConfig[sub.status] || statusConfig.incomplete;
                const Icon = config.icon;
                const endDate = sub.isTrial ? sub.trialEndsAt : sub.currentPeriodEnd;
                const isExpiringSoon = endDate && isFuture(new Date(endDate)) && 
                  isPast(addDays(new Date(), -7));

                return (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{sub.tenantName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 ${config.bg} ${config.text} text-xs font-medium rounded-full capitalize`}>
                        <Icon className="h-3 w-3" />
                        {sub.status.replace('_', ' ')}
                      </span>
                      {sub.cancelAtPeriodEnd === 1 && (
                        <span className="ml-2 text-xs text-red-600">Canceling</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium">{sub.licensesCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-slate-700">{sub.billingInterval}</span>
                    </td>
                    <td className="px-6 py-4">
                      {endDate ? (
                        <div className={isExpiringSoon ? 'text-amber-600' : 'text-slate-500'}>
                          <p className="text-sm">
                            {format(new Date(endDate), 'PP')}
                          </p>
                          <p className="text-xs">
                            {formatDistanceToNow(new Date(endDate), { addSuffix: true })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-500">
                        {format(new Date(sub.createdAt), 'PP')}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSubs?.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No subscriptions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
