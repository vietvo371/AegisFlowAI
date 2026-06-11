'use client';

import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Bell,
  BrainCircuit,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  HeartPulse,
  Info,
  Megaphone,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  X,
  Trash2,
  MailOpen,
  MapPin,
  Calendar,
  Activity,
  Phone,
  BarChart2,
  CheckCircle2,
  Inbox,
  AlertOctagon,
} from 'lucide-react';
import type { Notification } from '@/hooks/useNotifications';

interface TypeConfigItem {
  icon: React.ElementType;
  className: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  glowClass: string;
  label: string;
  color: string;
}

const TYPE_CONFIG: Record<string, TypeConfigItem> = {
  alert: {
    icon: Megaphone,
    className: 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-400',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300',
    borderClass: 'border-rose-500/20 dark:border-rose-500/30',
    bgClass: 'bg-rose-500/10 text-rose-500 dark:text-rose-400',
    glowClass: 'shadow-[0_0_15px_rgba(244,63,94,0.15)] dark:shadow-[0_0_20px_rgba(244,63,94,0.25)]',
    label: 'Cảnh báo',
    color: 'rgb(244, 63, 94)',
  },
  incident: {
    icon: AlertTriangle,
    className: 'border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/20 dark:bg-orange-950/20 dark:text-orange-400',
    badgeClass: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/30 dark:bg-orange-950/30 dark:text-orange-300',
    borderClass: 'border-orange-500/20 dark:border-orange-500/30',
    bgClass: 'bg-orange-500/10 text-orange-500 dark:text-orange-400',
    glowClass: 'shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:shadow-[0_0_20px_rgba(249,115,22,0.25)]',
    label: 'Sự cố',
    color: 'rgb(249, 115, 22)',
  },
  prediction: {
    icon: BrainCircuit,
    className: 'border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-950/20 dark:text-violet-400',
    badgeClass: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/30 dark:bg-violet-950/30 dark:text-violet-300',
    borderClass: 'border-violet-500/20 dark:border-violet-500/30',
    bgClass: 'bg-violet-500/10 text-violet-500 dark:text-violet-400',
    glowClass: 'shadow-[0_0_15px_rgba(139,92,246,0.15)] dark:shadow-[0_0_20px_rgba(139,92,246,0.25)]',
    label: 'AI dự báo',
    color: 'rgb(139, 92, 246)',
  },
  rescue: {
    icon: HeartPulse,
    className: 'border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-500/20 dark:bg-sky-950/20 dark:text-sky-400',
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/30 dark:bg-sky-950/30 dark:text-sky-300',
    borderClass: 'border-sky-500/20 dark:border-sky-500/30',
    bgClass: 'bg-sky-500/10 text-sky-500 dark:text-sky-400',
    glowClass: 'shadow-[0_0_15px_rgba(14,165,233,0.15)] dark:shadow-[0_0_20px_rgba(14,165,233,0.25)]',
    label: 'Cứu hộ',
    color: 'rgb(14, 165, 233)',
  },
  sensor: {
    icon: ShieldAlert,
    className: 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-400',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300',
    borderClass: 'border-amber-500/20 dark:border-amber-500/30',
    bgClass: 'bg-amber-500/10 text-amber-500 dark:text-amber-400',
    glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.15)] dark:shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    label: 'Cảm biến',
    color: 'rgb(245, 158, 11)',
  },
  system: {
    icon: Info,
    className: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/20 dark:bg-slate-950/20 dark:text-slate-400',
    badgeClass: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-900/30 dark:bg-slate-950/30 dark:text-slate-300',
    borderClass: 'border-slate-500/20 dark:border-slate-500/30',
    bgClass: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
    glowClass: 'shadow-[0_0_15px_rgba(100,116,139,0.15)] dark:shadow-[0_0_20px_rgba(100,116,139,0.25)]',
    label: 'Hệ thống',
    color: 'rgb(100, 116, 139)',
  },
};

const DEFAULT_CONFIG = TYPE_CONFIG.system;

const RECOMMENDATION_TYPES = new Set([
  'evacuation',
  'alert',
  'rescue_dispatch',
  'reroute',
  'priority_route',
  'supply_dispatch',
  'signal_control',
  'RecommendationApproved',
]);

function getNavigationLink(n: Notification): string | null {
  if (n.link && n.link !== '/dashboard/notifications') return n.link;

  const data = n.data as Record<string, unknown> | undefined;
  const dtype = data ? String(data.type ?? '') : '';

  if (n.type === 'incident') return '/dashboard/incidents';
  if (n.type === 'alert') return '/dashboard/alerts';
  if (n.type === 'rescue') return '/dashboard/rescue-requests';
  if (n.type === 'prediction') return '/dashboard/recommendations';

  if (RECOMMENDATION_TYPES.has(dtype)) return '/dashboard/recommendations';
  if (dtype === 'IncidentCreated') return '/dashboard/incidents';
  if (dtype === 'AlertCreated') return '/dashboard/alerts';
  if (dtype === 'RescueRequestCreated') return '/dashboard/rescue-requests';

  if (data?.incident_id) return '/dashboard/incidents';
  if (data?.alert_id) return '/dashboard/alerts';
  if (data?.rescue_request_id) return '/dashboard/rescue-requests';

  return null;
}

function timeAgo(date: Date): string {
  const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatFullDate(date: Date): string {
  return `${date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })} lúc ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
}

function getGroupedNotifications(items: Notification[]) {
  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const older: Notification[] = [];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date();
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);

  items.forEach((item) => {
    const d = new Date(item.timestamp);
    if (d >= startOfToday) {
      today.push(item);
    } else if (d >= startOfYesterday) {
      yesterday.push(item);
    } else {
      older.push(item);
    }
  });

  return { today, yesterday, older };
}

function NotificationIcon({ item, size = 'md' }: { item: Notification; size?: 'md' | 'lg' }) {
  const cfg = TYPE_CONFIG[item.type] ?? DEFAULT_CONFIG;
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-2xl border transition-all duration-300',
        size === 'lg' ? 'size-12' : 'size-10',
        cfg.className,
        !item.read && cfg.glowClass,
      )}
    >
      <Icon size={size === 'lg' ? 22 : 18} />
      {!item.read && (
        <span className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full border-2 border-background bg-violet-600 animate-pulse-dot" />
      )}
    </div>
  );
}

function NotificationDetail({
  item,
  onClose,
  onNavigate,
}: {
  item: Notification;
  onClose: () => void;
  onNavigate: (link: string) => void;
}) {
  const cfg = TYPE_CONFIG[item.type] ?? DEFAULT_CONFIG;
  const navLink = getNavigationLink(item);
  const data = item.data as Record<string, unknown> | undefined;
  const idValue = data?.incident_id ?? data?.alert_id ?? data?.rescue_request_id ?? data?.id;

  // Mock values to give a high fidelity feel to different notification types
  const aiConfidence = useMemo(() => {
    if (item.type !== 'prediction') return null;
    const key = String(item.id);
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    return 75 + (Math.abs(hash) % 21); // Random confidence score between 75% and 95%
  }, [item.id, item.type]);

  const sensorReading = useMemo(() => {
    if (item.type !== 'sensor') return null;
    const titleLower = item.title.toLowerCase();
    if (titleLower.includes('mực nước') || titleLower.includes('ngập')) {
      return { value: '2.14 m', threshold: '1.80 m', unit: 'm', label: 'Mực nước hiện tại' };
    }
    return { value: '128 mm/h', threshold: '80 mm/h', unit: 'mm/h', label: 'Lượng mưa lớn' };
  }, [item.title, item.type]);

  return (
    <aside className="flex h-full min-h-0 flex-col bg-card/40 backdrop-blur-md">
      {/* Detail Header */}
      <div className="flex items-start justify-between gap-4 border-b border-border/60 p-5">
        <div className="flex min-w-0 items-center gap-3">
          <NotificationIcon item={item} size="lg" />
          <div className="min-w-0">
            <Badge variant="outline" className={cn('border px-2.5 py-0.5 font-bold tracking-wide uppercase text-[10px]', cfg.badgeClass)}>
              {cfg.label}
            </Badge>
            <p className="mt-1 text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
              <span className={cn('size-1.5 rounded-full', item.read ? 'bg-muted-foreground/45' : 'bg-violet-600 animate-pulse')} />
              {item.read ? 'Đã đọc' : 'Chưa đọc'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-border/40 hover:bg-muted/50" onClick={onClose} aria-label="Đóng chi tiết">
          <X size={15} />
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1 custom-scroll">
        <div className="space-y-6 p-5">
          {/* Main Content */}
          <div className="space-y-3">
            <h2 className="text-lg font-black leading-snug text-foreground tracking-tight">{item.title}</h2>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Clock size={13} className="text-muted-foreground/70" />
              {formatFullDate(item.timestamp)}
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* Description Card */}
          <div className="rounded-2xl border border-border/50 bg-muted/20 p-4 shadow-inner">
            <p className="text-sm leading-relaxed font-medium text-foreground/80 whitespace-pre-line">
              {item.message || 'Không có nội dung chi tiết.'}
            </p>
          </div>

          {/* Dynamic Rich Presentation Blocks depending on Category */}
          {item.type === 'prediction' && (
            <div className="space-y-4 rounded-2xl border border-violet-500/20 bg-violet-500/[0.03] p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-500 dark:text-violet-400">
                <BrainCircuit size={14} className="animate-float" />
                AI Model Insights
              </div>

              {aiConfidence !== null && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Độ tin cậy của thuật toán</span>
                    <span className="text-violet-600 dark:text-violet-400 font-bold">{aiConfidence}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950/40">
                    <div
                      className="h-full rounded-full bg-gradient-to-right bg-violet-600 transition-all duration-1000"
                      style={{ width: `${aiConfidence}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground">Hành động được đề xuất đề nghị xem xét:</span>
                <ul className="list-disc pl-4 space-y-1.5 mt-1 font-medium">
                  <li>Phân tích lưu lượng dòng chảy tại điểm ngập liên đới.</li>
                  <li>Phát động thông điệp hướng dẫn sơ tán qua SMS định vị địa bàn.</li>
                  <li>Dự trù vật tư thiết bị cho khu vực trong 4 giờ tới.</li>
                </ul>
              </div>
            </div>
          )}

          {item.type === 'sensor' && sensorReading !== null && (
            <div className="space-y-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                <Activity size={14} className="animate-pulse" />
                Thông số Quan trắc IoT
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-background/50 border border-border/40 p-3 text-center">
                  <span className="text-[10px] text-muted-foreground font-semibold">{sensorReading.label}</span>
                  <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">{sensorReading.value}</p>
                </div>
                <div className="rounded-xl bg-background/50 border border-border/40 p-3 text-center">
                  <span className="text-[10px] text-muted-foreground font-semibold">Ngưỡng cảnh báo</span>
                  <p className="text-lg font-black text-foreground/80 mt-1">{sensorReading.threshold}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700/80 dark:text-amber-400/80 rounded-lg bg-amber-500/10 p-2.5">
                <AlertOctagon size={14} className="shrink-0" />
                <span>Giá trị vượt ngưỡng quy định. Khuyến cáo kiểm tra trực quan camera.</span>
              </div>
            </div>
          )}

          {(item.type === 'incident' || item.type === 'rescue') && (
            <div className="space-y-4 rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-500 animate-glow-pulse-red">
                <AlertTriangle size={14} />
                Ứng cứu khẩn cấp (Emergency SOS)
              </div>

              {/* Coordinates Mock */}
              <div className="flex items-center justify-between rounded-xl bg-background/50 border border-border/40 p-3">
                <div className="flex items-center gap-2.5">
                  <MapPin size={16} className="text-rose-500" />
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Tọa độ chỉ định</span>
                    <p className="text-xs font-mono font-bold text-foreground mt-0.5">16.0544° N, 108.2022° E</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-rose-200 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                  Khu vực Đà Nẵng
                </Badge>
              </div>

              {/* Contact Button */}
              <div className="flex items-center gap-3">
                <a
                  href="tel:0236113"
                  className="flex-1 flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background hover:bg-muted font-bold text-xs transition-colors"
                >
                  <Phone size={14} className="text-muted-foreground" />
                  Gọi tổng đài cứu hộ
                </a>
              </div>
            </div>
          )}

          {/* Associated Data Block */}
          {data && Object.keys(data).length > 0 && (
            <div className="space-y-3.5 rounded-2xl border border-border/60 bg-background/50 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                <Sparkles size={14} className="text-violet-500" />
                Dữ liệu liên quan
              </div>

              <div className="grid gap-2 text-xs font-semibold">
                {data.type != null && (
                  <div className="flex items-center justify-between gap-4 py-1 border-b border-border/20">
                    <span className="text-muted-foreground">Loại bản ghi</span>
                    <span className="truncate text-foreground font-bold">{String(data.type)}</span>
                  </div>
                )}
                {idValue != null && (
                  <div className="flex items-center justify-between gap-4 py-1 border-b border-border/20">
                    <span className="text-muted-foreground">Mã liên kết</span>
                    <span className="font-mono text-foreground font-black">#{String(idValue)}</span>
                  </div>
                )}
                {data.request_number != null && (
                  <div className="flex items-center justify-between gap-4 py-1 border-b border-border/20">
                    <span className="text-muted-foreground">Mã số yêu cầu</span>
                    <span className="font-mono text-foreground font-bold">{String(data.request_number)}</span>
                  </div>
                )}
                {item.severity && (
                  <div className="flex items-center justify-between gap-4 py-1">
                    <span className="text-muted-foreground">Mức độ cảnh báo</span>
                    <Badge variant="outline" className={cn(
                      'px-2 py-0.5 uppercase text-[9px] font-extrabold',
                      item.severity === 'critical' && 'border-rose-200 bg-rose-500/10 text-rose-500',
                      item.severity === 'high' && 'border-orange-200 bg-orange-500/10 text-orange-500',
                      item.severity === 'medium' && 'border-amber-200 bg-amber-500/10 text-amber-600',
                      item.severity === 'low' && 'border-blue-200 bg-blue-500/10 text-blue-500',
                    )}>
                      {item.severity}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Nav Link */}
      <div className="border-t border-border/60 p-5 bg-muted/10">
        {navLink ? (
          <Button className="shimmer-btn h-11 w-full gap-2 rounded-xl font-bold text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20" onClick={() => onNavigate(navLink)}>
            <ExternalLink size={15} />
            Mở màn hình xử lý thực địa
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-muted/45 px-3 py-3 text-xs font-semibold text-muted-foreground border border-border/30">
            <CheckCircle2 size={15} className="text-emerald-500" />
            Thông báo mang tính thông tin tham khảo
          </div>
        )}
      </div>
    </aside>
  );
}

export default function NotificationsPage() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllRead, deleteNotification, clearAll } = useNotifications();
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Notification | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Type count mapping
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      alert: 0,
      incident: 0,
      prediction: 0,
      rescue: 0,
      sensor: 0,
      system: 0,
    };
    notifications.forEach((item) => {
      if (counts[item.type] !== undefined) {
        counts[item.type]++;
      }
    });
    return counts;
  }, [notifications]);

  // Compute breakdown percentages for horizontal type distribution bar
  const typeBreakdown = useMemo(() => {
    const total = notifications.length;
    if (total === 0) return [];
    return Object.entries(typeCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / total) * 100,
        config: TYPE_CONFIG[type] ?? DEFAULT_CONFIG,
      }))
      .filter((item) => item.count > 0);
  }, [notifications.length, typeCounts]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return notifications.filter((item) => {
      const matchFilter = filter === 'all' || !item.read;
      const matchCategory = categoryFilter === 'all' || item.type === categoryFilter;
      const matchSearch =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.message.toLowerCase().includes(keyword) ||
        (TYPE_CONFIG[item.type]?.label ?? '').toLowerCase().includes(keyword);

      return matchFilter && matchCategory && matchSearch;
    });
  }, [filter, categoryFilter, notifications, search]);

  // Reset page when filters change
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter, categoryFilter]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage]);

  const grouped = useMemo(() => {
    return getGroupedNotifications(paginatedNotifications);
  }, [paginatedNotifications]);

  const readCount = notifications.length - unreadCount;

  // Auto-select first notification on layout mount or when list changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (filtered.length > 0 && !selected) {
      // Find the first notification
      const first = filtered[0];
      setSelected(first);
    }
  }, [filtered, selected]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  async function handleMarkAllRead() {
    setMarkingAll(true);
    await markAllRead();
    setMarkingAll(false);
  }

  function handleClearAll() {
    if (window.confirm(t('notifications.clearAll') || 'Xóa tất cả thông báo?')) {
      clearAll();
      setSelected(null);
    }
  }

  function handleClick(item: Notification) {
    if (!item.read) markAsRead(item.id);
    setSelected({ ...item, read: true });
  }

  function handleToggleRead(e: React.MouseEvent, item: Notification) {
    e.stopPropagation();
    markAsRead(item.id);
    if (selected?.id === item.id) {
      setSelected({ ...selected, read: true });
    }
  }

  function handleDeleteItem(e: React.MouseEvent, item: Notification) {
    e.stopPropagation();
    deleteNotification(item.id);
    if (selected?.id === item.id) {
      setSelected(null);
    }
  }

  function handleNavigate(link: string) {
    router.push(link);
  }

  return (
    <main className="relative flex w-full flex-col gap-6 px-6 py-6 min-h-0 overflow-hidden">
      {/* Aurora Ambient Background Blurs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violet-500/[0.04] dark:bg-violet-500/[0.06] rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-blue-500/[0.03] dark:bg-blue-500/[0.05] rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Container */}
      <section className="relative rounded-3xl border border-border/50 bg-card/45 backdrop-blur-md p-5 shadow-sm md:p-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-600" />

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3.5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-violet-500/20 bg-violet-500/5 px-2.5 py-0.5 text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-wider">
                Trung tâm điều phối
              </Badge>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider animate-glow-pulse-red bg-rose-500">
                  {unreadCount} mới
                </Badge>
              )}
            </div>
            <h1 className="flex items-center gap-3.5 text-2xl font-black tracking-tight text-foreground md:text-3xl">
              <span className={cn(
                "flex size-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/20 transition-all duration-300",
                unreadCount > 0 && "animate-float"
              )}>
                <Bell size={21} className={cn(unreadCount > 0 && "animate-bounce")} />
              </span>
              {t('pages.notifications')}
            </h1>
            <p className="mt-2 text-xs font-semibold text-muted-foreground leading-relaxed">{t('notifications.subtitle')}</p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-2 rounded-xl font-bold border-border/60 hover:bg-muted/50"
              onClick={handleMarkAllRead}
              disabled={markingAll || unreadCount === 0}
            >
              {markingAll ? <RefreshCw size={15} className="animate-spin" /> : <CheckCheck size={15} />}
              {t('notifications.markAllRead')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-2 rounded-xl font-bold border-rose-500/20 bg-rose-500/[0.02] text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-950/20"
              onClick={handleClearAll}
              disabled={notifications.length === 0}
            >
              <Trash2 size={15} />
              {t('notifications.clearAll') || 'Dọn dẹp'}
            </Button>
          </div>
        </div>

        {/* Statistical Metrics Grid */}
        <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-3">
          <Card className="bg-background/40 border-border/40 p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tổng thông báo</p>
            <p className="mt-2 text-2xl font-black text-foreground">{notifications.length}</p>
          </Card>
          <Card className={cn(
            "p-4 shadow-sm hover:shadow-md transition-all duration-300 border",
            unreadCount > 0 ? "border-violet-500/20 bg-violet-500/[0.02]" : "border-border/40 bg-background/40"
          )}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cần xem</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className={cn("text-2xl font-black", unreadCount > 0 ? "text-violet-600 dark:text-violet-400" : "text-foreground")}>
                {unreadCount}
              </p>
              {unreadCount > 0 && <span className="size-2 rounded-full bg-violet-500 animate-ping" />}
            </div>
          </Card>
          <Card className="col-span-2 md:col-span-1 bg-background/40 border-border/40 p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('notifications.readRatio') || 'Tỷ lệ đã đọc'}</p>
            <div className="flex items-baseline justify-between mt-2">
              <p className="text-2xl font-black text-foreground">
                {notifications.length ? Math.round((readCount / notifications.length) * 100) : 0}%
              </p>
              <span className="text-[10px] text-muted-foreground font-bold">{readCount}/{notifications.length}</span>
            </div>
          </Card>
        </div>

        {/* Advanced Horizontal Category Breakdown Bar */}
        {typeBreakdown.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><BarChart2 size={13} /> {t('notifications.typeBreakdown') || 'Phân bổ theo loại'}</span>
              <span>{notifications.length} bản ghi</span>
            </div>

            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted border border-border/45 shadow-inner">
              {typeBreakdown.map((item) => (
                <button
                  key={item.type}
                  className="h-full first:rounded-l-full last:rounded-r-full hover:opacity-85 transition-opacity relative group"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.config.color,
                  }}
                  onClick={() => setCategoryFilter(item.type)}
                  title={`${item.config.label}: ${item.count} (${Math.round(item.percentage)}%)`}
                >
                  <span className="sr-only">{item.config.label}</span>
                </button>
              ))}
            </div>

            {/* Micro legends */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                const count = typeCounts[type] || 0;
                if (count === 0) return null;
                const active = categoryFilter === type;

                return (
                  <button
                    key={type}
                    onClick={() => setCategoryFilter(active ? 'all' : type)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-lg border transition-all duration-200",
                      active
                        ? "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400"
                        : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <span className="size-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span>{cfg.label}</span>
                    <span className="text-[10px] text-muted-foreground/80 font-bold">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Main Multi-Column Panel */}
      <section className="grid min-h-0 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Left Filters Sidebar Card */}
        <Card className="h-fit border-border/50 bg-card/45 backdrop-blur-md p-4 shadow-sm flex flex-col gap-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <Input
              placeholder={t('notifications.searchPlaceholder')}
              className="h-10 rounded-xl pl-9 pr-8 border-border/60 focus-visible:ring-violet-600 bg-background/50 text-xs"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="grid gap-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-2 pb-1">Bộ lọc trạng thái</span>
            {(['all', 'unread'] as const).map((item) => {
              const active = filter === item;
              const count = item === 'all' ? notifications.length : unreadCount;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-xl border px-3 text-left text-xs font-bold transition-all duration-200',
                    active
                      ? 'border-violet-500/20 bg-violet-600 text-white shadow-md shadow-violet-600/10'
                      : 'border-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/40 hover:text-foreground',
                  )}
                >
                  {item === 'all' ? <Bell size={15} /> : <span className="size-2 rounded-full bg-rose-500 animate-pulse-dot shrink-0" />}
                  <span className="flex-1">
                    {item === 'all' ? t('notifications.filterAll') : t('notifications.filterUnread')}
                  </span>
                  <Badge variant="outline" className={cn(
                    'text-[10px] font-bold',
                    active ? 'border-white/20 bg-white/20 text-white' : 'border-border'
                  )}>
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>

          <Separator className="bg-border/60" />

          {/* Category Tabs */}
          <div className="grid gap-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-2 pb-1">
              {t('notifications.category') || 'Danh mục'}
            </span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={cn(
                'flex h-9 items-center gap-2.5 rounded-xl border px-3 text-left text-xs font-bold transition-all duration-150',
                categoryFilter === 'all'
                  ? 'border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-400'
                  : 'border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground',
              )}
            >
              <Inbox size={14} />
              <span className="flex-1">{t('notifications.allTypes') || 'Tất cả các loại'}</span>
              <span className="text-[10px] text-muted-foreground/70 font-bold">{notifications.length}</span>
            </button>

            {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
              const count = typeCounts[type] || 0;
              const active = categoryFilter === type;
              const Icon = cfg.icon;

              return (
                <button
                  key={type}
                  onClick={() => setCategoryFilter(type)}
                  className={cn(
                    'flex h-9 items-center gap-2.5 rounded-xl border px-3 text-left text-xs font-bold transition-all duration-150',
                    active
                      ? 'border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-400'
                      : 'border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                  )}
                >
                  <Icon size={14} className={cn(active ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground')} />
                  <span className="flex-1">{cfg.label}</span>
                  <span className="text-[10px] text-muted-foreground/70 font-bold">{count}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Master-Detail Container Split Grid */}
        <div className="grid min-h-[580px] gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
          {/* Notifications List Card */}
          <Card className="overflow-hidden border-border/50 bg-card/45 backdrop-blur-md shadow-sm flex flex-col">
            {/* List Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 bg-muted/10">
              <div>
                <h2 className="font-black text-sm tracking-tight">Hộp thư cảnh báo</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">
                  Hiển thị {filtered.length} trên {notifications.length} thông tin
                </p>
              </div>
              <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-600 text-[10px] font-bold flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Realtime
              </Badge>
            </div>

            {/* Grouped Notifications List View */}
            <ScrollArea className="flex-1 h-[580px] custom-scroll bg-background/25">
              {filtered.length === 0 ? (
                <div className="flex min-h-[460px] flex-col items-center justify-center p-8 text-center animate-fade-in-up">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-muted bg-muted/45 text-muted-foreground/60 shadow-inner">
                    <Bell size={28} />
                  </div>
                  <h3 className="text-base font-black tracking-tight">{t('notifications.noNotifications')}</h3>
                  <p className="mt-2.5 max-w-xs text-xs font-semibold leading-relaxed text-muted-foreground">
                    {filter === 'unread' ? t('notifications.allReadMsg') : t('notifications.noNotificationsMsg')}
                  </p>
                </div>
              ) : (
                <div className="space-y-6 py-4">
                  {(['today', 'yesterday', 'older'] as const).map((groupKey) => {
                    const groupItems = grouped[groupKey];
                    if (groupItems.length === 0) return null;

                    const groupLabels = {
                      today: t('notifications.today') || 'Hôm nay',
                      yesterday: t('notifications.yesterday') || 'Hôm qua',
                      older: t('notifications.older') || 'Trước đó',
                    };

                    return (
                      <div key={groupKey} className="space-y-2">
                        {/* Group Header */}
                        <div className="flex items-center gap-2 px-5 text-[10px] font-black text-muted-foreground/80 uppercase tracking-widest">
                          <Calendar size={12} className="text-muted-foreground/65" />
                          <span>{groupLabels[groupKey]}</span>
                          <span className="ml-1 text-[9px] rounded-md bg-muted px-1.5 py-0.5 border border-border/40">
                            {groupItems.length}
                          </span>
                        </div>

                        {/* List Items */}
                        <div className="divide-y divide-border/45 border-y border-border/45 bg-card/20">
                          {groupItems.map((item) => {
                            const cfg = TYPE_CONFIG[item.type] ?? DEFAULT_CONFIG;
                            const active = selected?.id === item.id;

                            return (
                              <div
                                key={item.id}
                                onClick={() => handleClick(item)}
                                className={cn(
                                  'group relative flex w-full items-start gap-4 px-5 py-4 text-left transition-all duration-300 cursor-pointer select-none',
                                  active
                                    ? 'bg-violet-500/[0.04] dark:bg-violet-500/[0.08]'
                                    : 'hover:bg-muted/30',
                                  !item.read && !active && 'bg-violet-500/[0.02] dark:bg-violet-500/[0.03]',
                                )}
                              >
                                {/* Active Side Border Indicator */}
                                {active && (
                                  <div className="absolute left-0 top-0 h-full w-1 bg-violet-600 rounded-r" />
                                )}

                                {/* Color Indicator left bar for critical severity */}
                                {item.severity === 'critical' && (
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-0.5 bg-rose-500 rounded-r shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                )}

                                <NotificationIcon item={item} />

                                <div className="min-w-0 flex-1">
                                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className={cn('h-5 border px-2 py-0 text-[10px] font-extrabold uppercase tracking-wide', cfg.badgeClass)}>
                                      {cfg.label}
                                    </Badge>
                                    <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                                      <Clock size={11} className="text-muted-foreground/75" />
                                      {timeAgo(item.timestamp)}
                                    </span>
                                    {item.severity === 'critical' && (
                                      <Badge variant="destructive" className="h-4 px-1.5 text-[8px] font-black uppercase tracking-widest bg-rose-500 animate-pulse">
                                        Urgent
                                      </Badge>
                                    )}
                                  </div>

                                  <h3
                                    className={cn(
                                      'line-clamp-1 text-xs leading-5 transition-colors',
                                      item.read
                                        ? 'font-medium text-foreground/70 group-hover:text-foreground'
                                        : 'font-extrabold text-foreground',
                                    )}
                                  >
                                    {item.title}
                                  </h3>
                                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground mt-0.5 font-medium">
                                    {item.message}
                                  </p>
                                </div>

                                {/* Actions Pane (Triggers on Hover / Active state) */}
                                <div className="flex items-center gap-1.5 shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pl-1 z-10">
                                  {!item.read && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title={t('notifications.markRead') || 'Đánh dấu đã đọc'}
                                      className="size-8 rounded-full border border-border/40 hover:bg-violet-600 hover:text-white"
                                      onClick={(e) => handleToggleRead(e, item)}
                                    >
                                      <MailOpen size={13} />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title={t('notifications.delete') || 'Xóa thông báo'}
                                    className="size-8 rounded-full border border-border/40 hover:bg-rose-500 hover:text-white"
                                    onClick={(e) => handleDeleteItem(e, item)}
                                  >
                                    <Trash2 size={13} />
                                  </Button>
                                </div>

                                <ChevronRight
                                  size={16}
                                  className={cn(
                                    'shrink-0 text-muted-foreground/50 transition-all duration-300 self-center group-hover:opacity-0',
                                    active ? 'translate-x-0 opacity-100 text-violet-600' : 'opacity-70',
                                  )}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/60 px-5 py-3 bg-muted/10 shrink-0">
                <span className="text-xs text-muted-foreground font-semibold">
                  {t('table.showing')} {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filtered.length, currentPage * itemsPerPage)} {t('table.of')} {filtered.length}
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl border-border/60 hover:bg-muted/50"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    <ChevronLeft size={14} />
                  </Button>

                  {getPageNumbers().map((pageNum, idx) => {
                    const active = pageNum === currentPage;
                    const isEllipsis = pageNum === '...';

                    if (isEllipsis) {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 text-xs text-muted-foreground font-bold">
                          ...
                        </span>
                      );
                    }

                    return (
                      <Button
                        key={`page-${pageNum}`}
                        variant={active ? 'default' : 'outline'}
                        size="icon"
                        className={cn(
                          'h-8 w-8 rounded-xl font-bold text-xs transition-all duration-200',
                          active
                            ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20'
                            : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50',
                        )}
                        onClick={() => setCurrentPage(pageNum as number)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl border-border/60 hover:bg-muted/50"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Right Detail Panel Card */}
          <Card className="hidden overflow-hidden border-border/50 bg-card/45 backdrop-blur-md shadow-sm xl:flex flex-col">
            {selected ? (
              <NotificationDetail item={selected} onClose={() => setSelected(null)} onNavigate={handleNavigate} />
            ) : (
              <div className="flex h-full min-h-[580px] flex-col items-center justify-center p-8 text-center animate-fade-in-up">
                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/5 text-violet-600 dark:text-violet-400 shadow-inner">
                  <Bell size={28} className="animate-float" />
                </div>
                <h3 className="text-base font-black tracking-tight">Chọn một thông báo</h3>
                <p className="mt-2 max-w-xs text-xs font-semibold leading-relaxed text-muted-foreground">
                  Xem toàn bộ nội dung chi tiết kỹ thuật, dữ liệu đo đạc liên kết và định hướng xử lý tác vụ tại đây.
                </p>
              </div>
            )}
          </Card>

          {/* Fallback Detail Card for smaller displays (< xl) */}
          {selected && (
            <Card className="overflow-hidden border-border/50 bg-card/45 backdrop-blur-md shadow-sm xl:hidden">
              <NotificationDetail item={selected} onClose={() => setSelected(null)} onNavigate={handleNavigate} />
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
