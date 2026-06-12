import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services';
import { ScrollText, Search } from 'lucide-react';
import type { AdminLog, AdminAction } from '@/types';

const ACTION_COLOR: Record<AdminAction, string> = {
  verify_company:  'bg-green-900/30 text-green-400',
  reject_company:  'bg-red-900/30 text-red-400',
  remove_listing:  'bg-red-900/30 text-red-400',
  approve_listing: 'bg-green-900/30 text-green-400',
  reject_listing:  'bg-red-900/30 text-red-400',
  suspend_user:    'bg-yellow-900/30 text-yellow-400',
  ban_user:        'bg-red-900/30 text-red-400',
  restore_user:    'bg-blue-900/30 text-blue-400',
};

const ACTION_LABEL: Record<AdminAction, string> = {
  verify_company:  '✅ Verified company',
  reject_company:  '❌ Rejected company',
  remove_listing:  '🗑 Removed listing',
  approve_listing: '✅ Approved listing',
  reject_listing:  '❌ Rejected listing',
  suspend_user:    '⚠️ Suspended user',
  ban_user:        '🚫 Banned user',
  restore_user:    '🔄 Restored user',
};

export default function AdminLogs() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => adminService.getLogs(),
    refetchInterval: 30000,
  });

  const filtered = logs.filter((log: AdminLog) => {
    const matchSearch = !search || log.target_id.includes(search) || log.admin_id.includes(search);
    const matchAction = !actionFilter || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Audit Logs</h1>
        <p className="text-gray-400 text-sm">Complete record of admin actions</p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 pl-9 text-sm focus:outline-none focus:border-accent-500 placeholder:text-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by target ID or admin ID…"
          />
        </div>
        <select
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">All actions</option>
          {Object.keys(ACTION_LABEL).map((a) => (
            <option key={a} value={a}>{ACTION_LABEL[a as AdminAction]}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl h-14 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl text-center py-16">
          <ScrollText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">No logs found</p>
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Time</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Target</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filtered.map((log: AdminLog) => (
                <tr key={log.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${ACTION_COLOR[log.action] ?? 'bg-gray-700 text-gray-400'}`}>
                      {ACTION_LABEL[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400 capitalize">{log.target_type}</span>
                    <span className="text-xs text-gray-600 ml-2 font-mono">{log.target_id.slice(0, 8)}…</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                    {log.reason ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
