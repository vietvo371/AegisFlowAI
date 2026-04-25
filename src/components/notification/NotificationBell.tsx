'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, AlertTriangle, Megaphone, HeartPulse, BrainCircuit } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface NotificationBellProps {
  className?: string;
}

const typeConfig: Record<string, { icon: typeof AlertTriangle; color: string; bgColor: string }> = {
  incident: { icon: AlertTriangle, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  alert: { icon: Megaphone, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  rescue: { icon: HeartPulse, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
  prediction: { icon: BrainCircuit, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  sensor: { icon: AlertTriangle, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  system: { icon: Bell, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function getAllLink(role?: string): string {
  if (role === 'citizen') {
    return '/citizen';
  }
  if (role === 'rescue_team') {
    return '/team/requests';
  }
  return '/dashboard/notifications';
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);
  const prevCountRef = useRef(0);

  const userRole = user?.role || user?.roles?.[0];

  // Animate when unread count increases
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 600);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleNotificationClick = (notif: any) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    if (notif.link) {
      setOpen(false);
      router.push(notif.link);
    } else {
      setOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all ${
          animate ? 'animate-bounce' : ''
        }`}
        title="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-rose-500 rounded-full px-1 shadow-lg animate-in zoom-in-50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute z-[100] right-0 top-full mt-2 w-[360px] max-h-[480px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-bold">Thông báo</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Xóa tất cả"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[400px] divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = typeConfig[notif.type] || typeConfig.system;
                const Icon = config.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors ${
                      !notif.read ? 'bg-primary/[0.03]' : ''
                    } ${notif.link ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${config.bgColor} ${config.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm truncate ${!notif.read ? 'font-semibold' : 'font-medium'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                        {timeAgo(notif.timestamp)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer: Xem tất cả */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2.5">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push(getAllLink(userRole));
                }}
                className="w-full text-xs text-center text-primary hover:underline font-semibold"
              >
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
