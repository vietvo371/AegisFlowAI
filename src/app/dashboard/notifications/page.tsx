'use client';

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Bell, AlertTriangle, Info, Search, CheckCheck,
  Clock, ChevronRight, ShieldAlert, Loader2, RefreshCw,
  Megaphone, BrainCircuit, HeartPulse
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  AlertNotification:  { icon: Megaphone,    color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  IncidentCreated:    { icon: AlertTriangle, color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  PredictionReceived: { icon: BrainCircuit,  color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  RescueRequestCreated: { icon: HeartPulse, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  FloodZoneUpdated:   { icon: ShieldAlert,   color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
};

const DEFAULT_CONFIG = { icon: Info, color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [search, setSearch] = useState('');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      // Notifications dùng custom table schema, fallback về unread alerts
      const res = await api.get('/alerts', { params: { per_page: 20, status: 'active' } });
      const alerts = res.data?.data ?? [];
      // Map alerts → notification format
      const mapped: Notification[] = alerts.map((a: any) => ({
        id: String(a.id),
        type: 'AlertNotification',
        title: a.title,
        body: a.description ?? '',
        data: a,
        read_at: a.status === 'resolved' ? a.updated_at : null,
        created_at: a.created_at,
      }));
      setNotifications(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (id: string) => {
    // Optimistic update only — custom notifications table doesn't support per-user read tracking
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
    );
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setMarkingAll(false);
  };

  useEffect(() => {
    fetchNotifications();
    // Listen for realtime events
    const handler = () => fetchNotifications();
    window.addEventListener('aegis:alert:created', handler);
    window.addEventListener('aegis:incident:created', handler);
    window.addEventListener('aegis:rescue_request:created', handler);
    return () => {
      window.removeEventListener('aegis:alert:created', handler);
      window.removeEventListener('aegis:incident:created', handler);
      window.removeEventListener('aegis:rescue_request:created', handler);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const filtered = notifications.filter(n => {
    const matchFilter = filter === 'all' || !n.read_at;
    const matchSearch = !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Bell className="text-primary" size={28} />
            Thông báo
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-sm px-2">{unreadCount}</Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Cảnh báo và cập nhật hệ thống theo thời gian thực.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            className="rounded-xl h-10 px-4 font-bold"
            onClick={markAllRead}
            disabled={markingAll || unreadCount === 0}
          >
            {markingAll
              ? <RefreshCw size={16} className="mr-2 animate-spin" />
              : <CheckCheck size={16} className="mr-2" />
            }
            Đánh dấu tất cả đã đọc
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10" onClick={fetchNotifications} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar filters */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Tìm thông báo..."
              className="pl-10 h-10 bg-card border-border rounded-xl"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            {(['all', 'unread'] as const).map(f => (
              <Button
                key={f}
                variant={filter === f ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start font-bold rounded-xl h-11',
                  filter === f && 'bg-primary/10 text-primary hover:bg-primary/20'
                )}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? <Bell size={18} className="mr-3" /> : <div className="w-2 h-2 rounded-full bg-primary mr-3.5 ml-1" />}
                {f === 'all' ? 'Tất cả' : 'Chưa đọc'}
                <Badge variant="secondary" className="ml-auto bg-background/50 border-none px-2 shadow-none">
                  {f === 'all' ? notifications.length : unreadCount}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-3">
          <Card className="border-border shadow-sm overflow-hidden bg-card/50">
            <ScrollArea className="h-[calc(100vh-280px)]">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                  <Loader2 className="animate-spin text-primary" size={32} />
                  <p className="text-sm font-bold text-muted-foreground">Đang tải thông báo...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Bell className="text-muted-foreground opacity-20" size={32} />
                  </div>
                  <h3 className="text-lg font-bold">Không có thông báo</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                    {filter === 'unread' ? 'Bạn đã đọc tất cả thông báo.' : 'Chưa có thông báo nào.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filtered.map(item => {
                    const cfg = TYPE_CONFIG[item.type] ?? DEFAULT_CONFIG;
                    const Icon = cfg.icon;
                    const isUnread = !item.read_at;
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'p-6 transition-all hover:bg-muted/30 flex gap-5 group cursor-pointer',
                          isUnread && 'bg-primary/[0.02]'
                        )}
                        onClick={() => isUnread && markAsRead(item.id)}
                      >
                        <div className={cn('shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border', cfg.color)}>
                          <Icon size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <h3 className={cn('text-base truncate', isUnread ? 'font-black text-foreground' : 'font-semibold text-muted-foreground')}>
                              {item.title}
                              {isUnread && <span className="inline-block w-2 h-2 rounded-full bg-primary ml-2 align-middle" />}
                            </h3>
                            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 shrink-0 whitespace-nowrap uppercase tracking-wider">
                              <Clock size={12} />
                              {timeAgo(item.created_at)}
                            </span>
                          </div>
                          <p className={cn('text-sm leading-relaxed line-clamp-2', isUnread ? 'text-muted-foreground' : 'text-muted-foreground/60')}>
                            {item.body}
                          </p>
                          {isUnread && (
                            <div className="mt-3">
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 rounded-lg text-[10px] font-bold uppercase tracking-wider text-primary px-2"
                                onClick={e => { e.stopPropagation(); markAsRead(item.id); }}
                              >
                                Đánh dấu đã đọc
                              </Button>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="opacity-0 group-hover:opacity-100 transition-all text-muted-foreground shrink-0 self-center" size={20} />
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
