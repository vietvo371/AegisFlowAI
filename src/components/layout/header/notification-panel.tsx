'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, AlertTriangle, Info, Droplets, Cpu, X } from 'lucide-react';
import { useClickOutside } from '@/hooks/use-click-outside';

type NotifType = 'critical' | 'warning' | 'info' | 'success';

interface Notification {
  id: number;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFS: Notification[] = [
  {
    id: 1, type: 'critical',
    title: 'Nguy cơ ngập nghiêm trọng',
    message: 'Liên Chiểu — Mực nước sông Cu Đê vượt ngưỡng cảnh báo cấp 3. Dự kiến ngập trong 28 phút.',
    time: '2 phút trước', read: false,
  },
  {
    id: 2, type: 'warning',
    title: 'Cảnh báo lượng mưa',
    message: 'Hòa Vang — Mưa tích lũy 140mm/6h. Nguy cơ ngập khu vực nông nghiệp.',
    time: '15 phút trước', read: false,
  },
  {
    id: 3, type: 'info',
    title: 'Đội cứu hộ đã triển khai',
    message: 'Đội cứu hộ số 3 đã đến vị trí tại THPT Hòa Vang, sẵn sàng hỗ trợ.',
    time: '32 phút trước', read: false,
  },
  {
    id: 4, type: 'success',
    title: 'AI cập nhật dự báo',
    message: 'Mô hình LSTM hoàn tất cập nhật. Độ chính xác 94.7% — Xem báo cáo chi tiết.',
    time: '1 giờ trước', read: true,
  },
  {
    id: 5, type: 'warning',
    title: 'Sơn Trà — Hệ thống thoát nước quá tải',
    message: 'Phường An Hải Bắc đang theo dõi. Khuyến nghị kiểm tra thực địa trong 30 phút.',
    time: '2 giờ trước', read: true,
  },
];

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  critical: { icon: AlertTriangle, color: '#f04438', bg: '#fef3f2', border: '#fecdca' },
  warning:  { icon: Droplets,      color: '#f79009', bg: '#fffaeb', border: '#fedf89' },
  info:     { icon: Info,          color: '#6938ef', bg: '#f4f3ff', border: '#d9d6fe' },
  success:  { icon: Cpu,           color: '#17b26a', bg: '#ecfdf3', border: '#abefc6' },
};

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFS);

  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside<HTMLDivElement>(close);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const dismiss = (id: number) => setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative', padding: 8, borderRadius: '50%',
          border: '1px solid var(--border-color)',
          background: open ? 'var(--bg-subtle)' : 'transparent',
          color: open ? '#7a5af8' : 'var(--text-muted)',
          cursor: 'pointer', transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Thông báo"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 8, height: 8, borderRadius: '50%',
            background: '#f04438',
            border: '2px solid var(--bg-card)',
          }} />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 10px)',
          width: 380, borderRadius: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
          zIndex: 9999, overflow: 'hidden',
          animation: 'fadeInUp 0.2s ease-out both',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={16} style={{ color: '#7a5af8' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Thông báo</span>
              {unreadCount > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: '#f04438', color: '#fff',
                  borderRadius: 99, padding: '1px 6px',
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 600, color: '#7a5af8',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 8px', borderRadius: 6,
                  transition: 'background 0.15s',
                }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(105,56,239,0.08)')}
                onMouseOut={e => (e.currentTarget.style.background = 'none')}
              >
                <CheckCheck size={12} />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }} className="custom-scroll">
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: 13 }}>Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type];
                const Icon = cfg.icon;
                return (
                  <div
                    key={n.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--border-color)',
                      background: n.read ? 'transparent' : 'rgba(105,56,239,0.03)',
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      transition: 'background 0.15s', cursor: 'pointer',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                    onMouseOut={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(105,56,239,0.03)')}
                    onClick={() => markRead(n.id)}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={15} style={{ color: cfg.color }} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{
                          fontSize: 12.5, fontWeight: n.read ? 500 : 700,
                          color: 'var(--text-primary)', lineHeight: 1.3,
                        }}>
                          {n.title}
                        </span>
                        {!n.read && (
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: '#7a5af8', flexShrink: 0,
                          }} />
                        )}
                      </div>
                      <p style={{
                        fontSize: 11.5, color: 'var(--text-muted)',
                        lineHeight: 1.5, margin: '0 0 6px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                        {n.time}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                      {!n.read && (
                        <button
                          onClick={e => { e.stopPropagation(); markRead(n.id); }}
                          title="Đánh dấu đã đọc"
                          style={{
                            width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border-color)',
                            background: 'var(--bg-subtle)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-muted)', transition: 'all 0.15s',
                          }}
                        >
                          <Check size={11} />
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                        title="Xóa"
                        style={{
                          width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border-color)',
                          background: 'var(--bg-subtle)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text-muted)', transition: 'all 0.15s',
                        }}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              style={{
                fontSize: 12, fontWeight: 600, color: '#7a5af8',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
              }}
            >
              Xem tất cả thông báo →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
