import { useAuth } from '@/integrations/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services';
import { Bell, CheckCheck } from 'lucide-react';
import type { NotificationType } from '@/types';

const TYPE_EMOJI: Record<NotificationType, string> = {
  application_received: '📥',
  shortlisted: '🎉',
  rejected: '😔',
  new_match: '⚡',
  listing_approved: '✅',
  listing_flagged: '🚩',
  company_verified: '🏢',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationService.getByUser(user!.id),
    enabled: !!user,
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(user!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-0.5">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            className="flex items-center gap-2 text-sm text-primary-600 font-medium hover:text-primary-700"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-20 bg-gray-50" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-16">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No notifications yet</h3>
          <p className="text-sm text-gray-500">You'll get notified about your applications and new matches here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => { if (!n.read) markOneMutation.mutate(n.id); }}
              className={`card cursor-pointer transition-all hover:shadow-md ${!n.read ? 'border-primary-100 bg-primary-50/30' : ''}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_EMOJI[n.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
