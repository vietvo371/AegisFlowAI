'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Bell, AlertTriangle, Info, Droplets, Cpu, CheckCheck,
  Check, X, Search, Filter, ArrowLeft, Trash2,
  Clock, MapPin, Users, Radio, Shield, Activity,
  ChevronDown
} from 'lucide-react';

type NotifType = 'critical' | 'warning' | 'info' | 'success';

interface Notification {
  id: number;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  read: boolean;
  district?: string;
  action?: string;
}

const ALL_NOTIFICATIONS: Notification[] = [
  {
    id: 1, type: 'critical',
    title: 'Nguy cơ ngập nghiêm trọng — Liên Chiểu',
    message: 'Mực nước sông Cu Đê vượt ngưỡng cảnh báo cấp 3. Dự kiến ngập diện rộng khu dân cư thấp trũng trong 28 phút. Khuyến nghị sơ tán ngay lập tức.',
    time: '2 phút trước', timestamp: Date.now() - 2 * 60 * 1000,
    read: false, district: 'Liên Chiểu', action: 'Xem bản đồ',
  },
  {
    id: 2, type: 'warning',
    title: 'Cảnh báo lượng mưa tích lũy — Hòa Vang',
    message: 'Mưa tích lũy 140mm/6h tại xã Hòa Phong. Nguy cơ ngập khu vực nông nghiệp và vùng trũng thấp. Theo dõi sát trong 2 giờ tới.',
    time: '15 phút trước', timestamp: Date.now() - 15 * 60 * 1000,
    read: false, district: 'Hòa Vang', action: 'Xem chi tiết',
  },
  {
    id: 3, type: 'info',
    title: 'Đội cứu hộ số 3 đã triển khai',
    message: 'Đội cứu hộ số 3 gồm 12 thành viên đã đến vị trí tại THPT Hòa Vang, sẵn sàng hỗ trợ sơ tán dân cư khu vực lân cận.',
    time: '32 phút trước', timestamp: Date.now() - 32 * 60 * 1000,
    read: false, district: 'Hòa Vang', action: 'Theo dõi đội',
  },
  {
    id: 4, type: 'success',
    title: 'AI hoàn tất cập nhật dự báo',
    message: 'Mô hình LSTM đã hoàn tất chu kỳ cập nhật lần thứ 47. Độ chính xác dự báo đạt 94.7% — cao hơn 1.2% so với chu kỳ trước.',
    time: '1 giờ trước', timestamp: Date.now() - 60 * 60 * 1000,
    read: true, action: 'Xem báo cáo',
  },
  {
    id: 5, type: 'warning',
    title: 'Hệ thống thoát nước quá tải — Sơn Trà',
    message: 'Phường An Hải Bắc ghi nhận tình trạng hệ thống thoát nước quá tải sau mưa lớn kéo dài. Khuyến nghị kiểm tra thực địa trong 30 phút.',
    time: '2 giờ trước', timestamp: Date.now() - 2 * 60 * 60 * 1000,
    read: true, district: 'Sơn Trà', action: 'Điều phối kiểm tra',
  },
  {
    id: 6, type: 'critical',
    title: 'Vỡ đập nhỏ tại thượng nguồn — Hòa Vang',
    message: 'Hệ thống cảm biến phát hiện sự cố đập tràn tại thượng nguồn sông Túy Loan. Lũ nhỏ có thể ảnh hưởng hạ lưu trong 45 phút.',
    time: '3 giờ trước', timestamp: Date.now() - 3 * 60 * 60 * 1000,
    read: true, district: 'Hòa Vang', action: 'Kích hoạt khẩn cấp',
  },
  {
    id: 7, type: 'info',
    title: 'Phát cảnh báo SMS đến 1,200 cư dân',
    message: 'Hệ thống đã gửi thành công cảnh báo SMS đến 1,200 hộ dân trong vùng nguy hiểm tại khu vực Hòa Khánh Bắc, Liên Chiểu.',
    time: '3 giờ trước', timestamp: Date.now() - 3.2 * 60 * 60 * 1000,
    read: true, district: 'Liên Chiểu',
  },
  {
    id: 8, type: 'success',
    title: 'Sơ tán thành công 450 người',
    message: 'Đã hoàn thành sơ tán 450 người từ khu vực nguy hiểm tại Liên Chiểu đến điểm an toàn THPT Hòa Vang. Không có thương vong.',
    time: '5 giờ trước', timestamp: Date.now() - 5 * 60 * 60 * 1000,
    read: true, district: 'Liên Chiểu',
  },
  {
    id: 9, type: 'warning',
    title: 'Mực nước tăng nhanh — Hải Châu',
    message: 'Trạm đo tự động báo mực nước tăng 15cm/giờ tại kênh thoát nước nội thành Hải Châu. Dự kiến đạt ngưỡng cảnh báo sau 90 phút.',
    time: '6 giờ trước', timestamp: Date.now() - 6 * 60 * 60 * 1000,
    read: true, district: 'Hải Châu',
  },
  {
    id: 10, type: 'info',
    title: 'Kết nối API khí tượng thủy văn đã phục hồi',
    message: 'Kết nối đến hệ thống dữ liệu Trung tâm Khí tượng Thủy văn quốc gia đã được khôi phục sau 12 phút gián đoạn.',
    time: 'Hôm qua, 23:15', timestamp: Date.now() - 14 * 60 * 60 * 1000,
    read: true,
  },
  {
    id: 11, type: 'critical',
    title: 'Cảnh báo bão cấp 8 tiếp cận',
    message: 'Bão số 4 dự kiến đổ bộ vào khu vực Đà Nẵng trong 18-24 giờ tới với cường độ cấp 8-9. Kích hoạt phương án ứng phó khẩn cấp cấp độ 2.',
    time: 'Hôm qua, 18:00', timestamp: Date.now() - 20 * 60 * 60 * 1000,
    read: true,
  },
  {
    id: 12, type: 'success',
    title: 'Cơ sở dữ liệu lịch sử đã đồng bộ',
    message: 'Đã đồng bộ thành công 15,847 bản ghi dữ liệu lịch sử thiên tai từ năm 2010-2024 vào kho dữ liệu huấn luyện AI.',
    time: 'Hôm qua, 14:30', timestamp: Date.now() - 24 * 60 * 60 * 1000,
    read: true,
  },
];

const TYPE_CONFIG: Record<NotifType, {
  icon: React.ElementType; color: string; bg: string;
  border: string; label: string; darkBg: string;
}> = {
  critical: { icon: AlertTriangle, color: '#f04438', bg: '#fef3f2', border: '#fecdca', label: 'Nghiêm trọng', darkBg: 'rgba(240,68,56,0.12)' },
  warning:  { icon: Droplets,      color: '#f79009', bg: '#fffaeb', border: '#fedf89', label: 'Cảnh báo',     darkBg: 'rgba(247,144,9,0.12)'  },
  info:     { icon: Info,          color: '#6938ef', bg: '#f4f3ff', border: '#d9d6fe', label: 'Thông tin',    darkBg: 'rgba(105,56,239,0.12)' },
  success:  { icon: Cpu,           color: '#17b26a', bg: '#ecfdf3', border: '#abefc6', label: 'Hệ thống',    darkBg: 'rgba(23,178,106,0.12)' },
};

type FilterKey = 'all' | 'unread' | NotifType;

const FILTER_TABS: { key: FilterKey; label: string; color?: string }[] = [
  { key: 'all',      label: 'Tất cả'         },
  { key: 'unread',   label: 'Chưa đọc'       },
  { key: 'critical', label: 'Nghiêm trọng', color: '#f04438' },
  { key: 'warning',  label: 'Cảnh báo',    color: '#f79009' },
  { key: 'info',     label: 'Thông tin',   color: '#6938ef' },
  { key: 'success',  label: 'Hệ thống',    color: '#17b26a' },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(ALL_NOTIFICATIONS);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = useMemo(() => {
    let list = notifications;
    if (filter === 'unread')    list = list.filter(n => !n.read);
    else if (filter !== 'all')  list = list.filter(n => n.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.district?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [notifications, filter, search]);

  const markAllRead = () => setNotifications(p => p.map(n => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  const deleteOne = (id: number) => {
    setNotifications(p => p.filter(n => n.id !== id));
    setSelected(s => { const ns = new Set(s); ns.delete(id); return ns; });
  };
  const toggleSelect = (id: number) => setSelected(s => {
    const ns = new Set(s);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    return ns;
  });
  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(n => n.id)));
  };
  const deleteSelected = () => {
    setNotifications(p => p.filter(n => !selected.has(n.id)));
    setSelected(new Set());
  };
  const markSelectedRead = () => {
    setNotifications(p => p.map(n => selected.has(n.id) ? { ...n, read: true } : n));
    setSelected(new Set());
  };

  const stats = [
    { label: 'Tổng thông báo', value: notifications.length, color: '#7a5af8', bg: 'rgba(105,56,239,0.08)', icon: Bell },
    { label: 'Chưa đọc', value: unreadCount, color: '#f04438', bg: '#fef3f2', icon: AlertTriangle },
    { label: 'Nghiêm trọng', value: notifications.filter(n => n.type === 'critical').length, color: '#f79009', bg: '#fffaeb', icon: Shield },
    { label: 'Đã xử lý', value: notifications.filter(n => n.read).length, color: '#17b26a', bg: '#ecfdf3', icon: CheckCheck },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-body)', padding: '24px 32px' }}>

      {/* ── Breadcrumb + Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Link href="/dashboard" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
            textDecoration: 'none', transition: 'color 0.15s',
          }}>
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>/</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#7a5af8' }}>Thông báo</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>
              Trung tâm thông báo
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
              Theo dõi tất cả cảnh báo và sự kiện hệ thống theo thời gian thực
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 10,
                border: '1.5px solid rgba(105,56,239,0.3)',
                background: 'rgba(105,56,239,0.07)',
                color: '#7a5af8', fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              <CheckCheck size={14} />
              Đọc tất cả ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {stats.map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="saas-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main panel ── */}
      <div className="saas-card" style={{ overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          {/* Search */}
          <div style={{
            flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 10,
            border: '1px solid var(--border-color)', background: 'var(--bg-subtle)',
          }}>
            <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm thông báo..."
              style={{
                flex: 1, border: 'none', background: 'transparent', outline: 'none',
                fontSize: 13, color: 'var(--text-primary)',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {FILTER_TABS.map(tab => {
              const count = tab.key === 'all' ? notifications.length
                : tab.key === 'unread' ? unreadCount
                : notifications.filter(n => n.type === tab.key).length;
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: active ? 700 : 500,
                    border: `1px solid ${active ? (tab.color || '#7a5af8') : 'var(--border-color)'}`,
                    background: active ? `${tab.color || '#7a5af8'}15` : 'transparent',
                    color: active ? (tab.color || '#7a5af8') : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  {tab.label}
                  <span style={{
                    fontSize: 10, fontWeight: 700, minWidth: 16, height: 16,
                    borderRadius: 99, background: active ? (tab.color || '#7a5af8') : 'var(--border-color)',
                    color: active ? '#fff' : 'var(--text-muted)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px',
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div style={{
            padding: '10px 20px', background: 'rgba(105,56,239,0.06)',
            borderBottom: '1px solid rgba(105,56,239,0.15)',
            display: 'flex', alignItems: 'center', gap: 12,
            animation: 'fadeInUp 0.2s ease-out both',
          }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#7a5af8' }}>
              Đã chọn {selected.size} thông báo
            </span>
            <button onClick={markSelectedRead} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: '1px solid rgba(105,56,239,0.3)', background: 'rgba(105,56,239,0.08)',
              color: '#7a5af8', cursor: 'pointer',
            }}>
              <Check size={12} /> Đánh dấu đã đọc
            </button>
            <button onClick={deleteSelected} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: '1px solid rgba(240,68,56,0.3)', background: 'rgba(240,68,56,0.07)',
              color: '#f04438', cursor: 'pointer',
            }}>
              <Trash2 size={12} /> Xóa đã chọn
            </button>
            <button onClick={() => setSelected(new Set())} style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--text-muted)',
            }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Select-all row */}
        <div style={{
          padding: '10px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-subtle)',
        }}>
          <input
            type="checkbox"
            checked={filtered.length > 0 && selected.size === filtered.length}
            onChange={toggleSelectAll}
            style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#7a5af8' }}
          />
          <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)' }}>
            {filtered.length} thông báo
            {search && ` tìm thấy cho "${search}"`}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
            Thời gian nhận
          </span>
        </div>

        {/* Notification list */}
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Bell size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 16px' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Không tìm thấy thông báo nào</p>
            <button onClick={() => { setFilter('all'); setSearch(''); }}
              style={{ marginTop: 12, fontSize: 12, color: '#7a5af8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          filtered.map((n, idx) => {
            const cfg = TYPE_CONFIG[n.type];
            const Icon = cfg.icon;
            const isSel = selected.has(n.id);
            const isExpanded = expandedId === n.id;

            return (
              <div
                key={n.id}
                style={{
                  borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-color)' : 'none',
                  background: isSel ? 'rgba(105,56,239,0.04)' : n.read ? 'transparent' : 'rgba(105,56,239,0.025)',
                  transition: 'background 0.15s',
                }}
              >
                {/* Main row */}
                <div
                  style={{
                    padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14,
                    cursor: 'pointer',
                  }}
                  onClick={() => { setExpandedId(isExpanded ? null : n.id); if (!n.read) markRead(n.id); }}
                  onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                  onMouseOut={e => (e.currentTarget.style.background = isSel ? 'rgba(105,56,239,0.04)' : n.read ? 'transparent' : 'rgba(105,56,239,0.025)')}
                >
                  {/* Checkbox */}
                  <div style={{ paddingTop: 2, flexShrink: 0 }} onClick={e => { e.stopPropagation(); toggleSelect(n.id); }}>
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => {}}
                      style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#7a5af8' }}
                    />
                  </div>

                  {/* Unread dot */}
                  <div style={{ paddingTop: 8, flexShrink: 0 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: n.read ? 'var(--border-color)' : '#7a5af8',
                      transition: 'background 0.3s',
                    }} />
                  </div>

                  {/* Type icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={17} style={{ color: cfg.color }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
                        borderRadius: 99, padding: '2px 7px',
                      }}>
                        {cfg.label}
                      </span>
                      {n.district && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>
                          <MapPin size={10} /> {n.district}
                        </span>
                      )}
                      {!n.read && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, color: '#7a5af8',
                          background: 'rgba(105,56,239,0.1)', borderRadius: 99, padding: '2px 7px',
                        }}>
                          MỚI
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: n.read ? 500 : 700, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.4 }}>
                      {n.title}
                    </div>
                    <p style={{
                      fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0,
                      display: isExpanded ? 'block' : '-webkit-box',
                      WebkitLineClamp: isExpanded ? undefined : 2,
                      WebkitBoxOrient: isExpanded ? undefined : 'vertical' as const,
                      overflow: isExpanded ? 'visible' : 'hidden',
                    }}>
                      {n.message}
                    </p>
                    {isExpanded && n.action && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button className="btn-primary" style={{ fontSize: 11, padding: '6px 14px' }}>
                          {n.action}
                        </button>
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '6px 14px' }}>
                          Bỏ qua
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right side */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                      <Clock size={10} /> {n.time}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                      {!n.read && (
                        <button
                          onClick={() => markRead(n.id)}
                          title="Đánh dấu đã đọc"
                          style={{
                            width: 26, height: 26, borderRadius: 7,
                            border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'var(--text-muted)',
                          }}
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteOne(n.id)}
                        title="Xóa"
                        style={{
                          width: 26, height: 26, borderRadius: 7,
                          border: '1px solid rgba(240,68,56,0.2)', background: 'rgba(240,68,56,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: '#f04438',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <ChevronDown
                      size={14}
                      style={{
                        color: 'var(--text-muted)',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
