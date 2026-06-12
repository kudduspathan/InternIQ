import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/integrations/auth';
import { adminService } from '@/services';
import { Search, UserX, UserCheck, ShieldOff } from 'lucide-react';
import type { Profile, UserStatus } from '@/types';

const STATUS_COLOR: Record<UserStatus, string> = {
  active:    'bg-green-900/30 text-green-400 border-green-800',
  suspended: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  banned:    'bg-red-900/30 text-red-400 border-red-800',
};

export default function AdminUsers() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getAllUsers(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status, previousStatus }: { userId: string; status: UserStatus; previousStatus: UserStatus }) => {
      await adminService.updateUserStatus(userId, status);
      const actionMap: Record<UserStatus, 'suspend_user' | 'ban_user' | 'restore_user'> = {
        suspended: 'suspend_user',
        banned: 'ban_user',
        active: 'restore_user',
      };
      await adminService.logAction(
        user!.id,
        actionMap[status],
        'user',
        userId,
        { status: previousStatus },
        { status },
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const filtered = users.filter((u: Profile) => {
    const matchSearch = !search || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
        <p className="text-gray-400 text-sm">{filtered.length} users</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 pl-9 text-sm focus:outline-none focus:border-accent-500 placeholder:text-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email…"
          />
        </div>
        <select
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="recruiter">Recruiters</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-gray-800 rounded-xl h-14 animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filtered.map((u: Profile) => (
                <tr key={u.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {u.email[0].toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-200">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400 capitalize bg-gray-700 px-2 py-0.5 rounded">{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLOR[u.status]}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(u.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {u.status !== 'suspended' && u.role !== 'admin' && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ userId: u.id, status: 'suspended', previousStatus: u.status })}
                          className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-yellow-900/20 transition-colors"
                        >
                          <ShieldOff className="w-3 h-3" /> Suspend
                        </button>
                      )}
                      {u.status !== 'banned' && u.role !== 'admin' && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ userId: u.id, status: 'banned', previousStatus: u.status })}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
                        >
                          <UserX className="w-3 h-3" /> Ban
                        </button>
                      )}
                      {u.status !== 'active' && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ userId: u.id, status: 'active', previousStatus: u.status })}
                          className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-green-900/20 transition-colors"
                        >
                          <UserCheck className="w-3 h-3" /> Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">No users found</div>
          )}
        </div>
      )}
    </div>
  );
}
