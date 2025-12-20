import { useQuery } from '@tanstack/react-query';
import { users } from '@/lib/api';
import {
  Users as UsersIcon,
  Search,
  CheckCircle,
  XCircle,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';

export default function Users() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data: userList, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: users.list,
  });

  const filteredUsers = userList?.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.tenantName.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roles = ['all', 'admin', 'quality_officer', 'manager', 'staff'];

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
        <p className="text-red-700">Failed to load users</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 mt-1">{userList?.length || 0} total users across all organizations</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none capitalize"
          >
            {roles.map((role) => (
              <option key={role} value={role} className="capitalize">
                {role === 'all' ? 'All Roles' : role.replace('_', ' ')}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Verified
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Super Admin
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Last Sign In
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers?.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-700 font-medium">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.name || 'Unnamed'}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-700">{user.tenantName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded capitalize">
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user.emailVerified ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user.superAdmin ? (
                      <Shield className="h-5 w-5 text-amber-500 mx-auto" />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-500">
                      {formatDistanceToNow(new Date(user.lastSignedIn), { addSuffix: true })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-500">
                      {format(new Date(user.createdAt), 'PP')}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers?.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}
