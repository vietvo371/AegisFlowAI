'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, CheckCheck, X, AlertTriangle, Shield, Waves, Wind, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  incident: <AlertTriangle size={13} className="text-orange-500" />,
  alert: <Shield size={13} className="text-red-500" />,
  rescue: <Waves size={13} className="text-blue-500" />,
  prediction: <Wind size={13} className="text-purple-500" />,
  sensor: <Zap size={13} className="text-yellow-500" />,
  system: <Bell size={13} className="text-gray-500" />,
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-blue-500',
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins}p trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}gi trước`;
  const days = Math.floor(hours / 24);
  return `${days}ngày trước`;
}

export default function NotificationPanel({ onClose }: { onClose?: () => void }) {
  const t = useTranslations('citizen.notifications');
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);

    if (notification.type === 'alert' && notification.data?.id) {
      router.push(`/citizen/map?alert=${notification.data.id}`);
    } else if (notification.type === 'incident' && notification.data?.id) {
      router.push(`/citizen/map?incident=${notification.data.id}`);
    } else if (notification.link) {
      router.push(notification.link);
    }
    onClose?.();
  };

  return (
    <div
      ref={panelRef}
      className={`w-80 max-h-[480px] flex flex-col rounded-2xl border border-border/50 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden transition-all duration-200 ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-primary" />
          <span className="font-bold text-sm">Thông báo</span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 h-4">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              title="Đánh dấu đã đọc tất cả"
            >
              <CheckCheck size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scroll">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bell size={32} className="text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Không có thông báo</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Bạn sẽ nhận thông báo khi có cảnh báo mới</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {notifications.map(notification => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors border-l-[3px] ${
                  SEVERITY_COLORS[notification.severity ?? ''] ?? 'border-l-transparent'
                } ${!notification.read ? 'bg-muted/30' : ''}`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {TYPE_ICONS[notification.type] ?? <Bell size={13} className="text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs leading-snug ${!notification.read ? 'font-bold' : 'font-medium'}`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                    {notification.message && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {timeAgo(notification.timestamp)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-border/50 shrink-0">
          <Link href="/citizen/alerts" onClick={onClose}>
            <Button variant="ghost" className="w-full text-xs h-8 justify-center">
              Xem tất cả thông báo
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
