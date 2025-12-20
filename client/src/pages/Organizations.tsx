import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizations, type Organization } from '@/lib/api';
import { Link } from 'wouter';
import {
  Building2,
  Users,
  MapPin,
  Search,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Trash2,
  Ban,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

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

interface EditModalProps {
  org: Organization;
  onClose: () => void;
  onSave: (data: Partial<Organization>) => void;
  isLoading: boolean;
}

function EditModal({ org, onClose, onSave, isLoading }: EditModalProps) {
  const [formData, setFormData] = useState({
    name: org.name,
    email: org.email || '',
    telephone: org.telephone || '',
    managerName: org.managerName || '',
    serviceType: org.serviceType || '',
    careSettingType: org.careSettingType || '',
    cqcRating: org.cqcRating || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Edit Organization</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telephone</label>
            <input
              type="text"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Manager Name</label>
            <input
              type="text"
              value={formData.managerName}
              onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Service Type</label>
              <input
                type="text"
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Care Setting</label>
              <input
                type="text"
                value={formData.careSettingType}
                onChange={(e) => setFormData({ ...formData, careSettingType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CQC Rating</label>
            <select
              value={formData.cqcRating}
              onChange={(e) => setFormData({ ...formData, cqcRating: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select rating</option>
              <option value="outstanding">Outstanding</option>
              <option value="good">Good</option>
              <option value="requires_improvement">Requires Improvement</option>
              <option value="inadequate">Inadequate</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteConfirmProps {
  org: Organization;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function DeleteConfirm({ org, onClose, onConfirm, isLoading }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-center mb-2">Delete Organization</h2>
          <p className="text-slate-600 text-center mb-4">
            Are you sure you want to delete <strong>{org.name}</strong>? This will also delete all associated data including locations, service users, and staff members. This action cannot be undone.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Organizations() {
  const [search, setSearch] = useState('');
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
  const queryClient = useQueryClient();

  const { data: orgs, isLoading, error } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizations.list,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Organization> }) =>
      organizations.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setEditingOrg(null);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, isSuspended }: { id: number; isSuspended: boolean }) =>
      organizations.suspend(id, isSuspended),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => organizations.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setDeletingOrg(null);
    },
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
                  Status
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
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrgs?.map((org) => (
                <tr key={org.id} className={`hover:bg-slate-50 transition-colors ${org.isSuspended ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${org.isSuspended ? 'bg-red-100' : 'bg-blue-100'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Building2 className={`h-5 w-5 ${org.isSuspended ? 'text-red-600' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{org.name}</p>
                        <p className="text-sm text-slate-500">{org.email || org.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {org.isSuspended ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        <Ban className="h-3 w-3" />
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    )}
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
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-500">
                      {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingOrg(org)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => suspendMutation.mutate({ id: org.id, isSuspended: !org.isSuspended })}
                        className={`p-2 hover:bg-slate-100 rounded-lg ${org.isSuspended ? 'text-green-600' : 'text-amber-600'}`}
                        title={org.isSuspended ? 'Unsuspend' : 'Suspend'}
                      >
                        {org.isSuspended ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setDeletingOrg(org)}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/organizations/${org.id}`}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                        title="View Details"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
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

      {editingOrg && (
        <EditModal
          org={editingOrg}
          onClose={() => setEditingOrg(null)}
          onSave={(data) => updateMutation.mutate({ id: editingOrg.id, data })}
          isLoading={updateMutation.isPending}
        />
      )}

      {deletingOrg && (
        <DeleteConfirm
          org={deletingOrg}
          onClose={() => setDeletingOrg(null)}
          onConfirm={() => deleteMutation.mutate(deletingOrg.id)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
