'use client';

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import ForecastPanel from '@/components/panels/ForecastPanel';
import ReliefPanel from '@/components/panels/ReliefPanel';
import type { EvacuationRoute } from '@/lib/openmap';
import {
  Activity, AlertTriangle, Bell, CheckCircle, ChevronDown,
  Clock, Cpu, Droplets, Filter, MapPin, RefreshCw,
  ShieldCheck, Users, Waves, Zap, ArrowRight, TrendingUp,
  Navigation2, Radio, Eye,
} from 'lucide-react';

const OpenMapComponent = dynamic(() => import('@/components/map/MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <span style={{ color: '#98a2b3', fontSize: 13 }}>Đang tải bản đồ...</span>
    </div>
  ),
});

// ── Mock data ──────────────────────────────────────────────
const ALERTS = [
  {
    id: 1, district: 'Liên Chiểu', ward: 'Phường Hòa Khánh Bắc',
    risk: 'Nghiêm trọng', riskEn: 'Critical',
    riskColor: '#f04438', riskBg: '#fef3f2', riskBorder: '#fecdca',
    eta: '28 phút', depth: '0.8m', affected: 1200, progress: 92,
    lat: 16.096, lng: 108.065,
    desc: 'Mực nước sông Cu Đê vượt ngưỡng cảnh báo. Nguy cơ ngập diện rộng khu dân cư thấp trũng.',
    updatedAt: '09:42 SA',
    icon: '🔴',
  },
  {
    id: 2, district: 'Hòa Vang', ward: 'Xã Hòa Phong',
    risk: 'Cảnh báo', riskEn: 'Warning',
    riskColor: '#f79009', riskBg: '#fffaeb', riskBorder: '#fedf89',
    eta: '1g 15p', depth: '0.5m', affected: 780, progress: 68,
    lat: 16.010, lng: 108.020,
    desc: 'Lượng mưa tích lũy 140mm/6h, dự báo tiếp tục tăng. Khu vực nông nghiệp có nguy cơ ngập.',
    updatedAt: '09:38 SA',
    icon: '🟠',
  },
  {
    id: 3, district: 'Sơn Trà', ward: 'Phường An Hải Bắc',
    risk: 'Cảnh báo', riskEn: 'Warning',
    riskColor: '#f79009', riskBg: '#fffaeb', riskBorder: '#fedf89',
    eta: '2g 05p', depth: '0.3m', affected: 430, progress: 45,
    lat: 16.082, lng: 108.218,
    desc: 'Hệ thống thoát nước quá tải sau mưa lớn kéo dài. Theo dõi thêm 30 phút.',
    updatedAt: '09:30 SA',
    icon: '🟠',
  },
  {
    id: 4, district: 'Hải Châu', ward: 'Phường Nam Dương',
    risk: 'An toàn', riskEn: 'Safe',
    riskColor: '#17b26a', riskBg: '#ecfdf3', riskBorder: '#abefc6',
    eta: 'Ổn định', depth: 'Bình thường', affected: 0, progress: 12,
    lat: 16.062, lng: 108.213,
    desc: 'Không có dấu hiệu bất thường. Hệ thống bơm thoát nước hoạt động tốt.',
    updatedAt: '09:25 SA',
    icon: '🟢',
  },
  {
    id: 5, district: 'Thanh Khê', ward: 'Phường Xuân Hà',
    risk: 'Theo dõi', riskEn: 'Monitor',
    riskColor: '#6938ef', riskBg: '#f4f3ff', riskBorder: '#d9d6fe',
    eta: '3g+', depth: '0.1m', affected: 120, progress: 22,
    lat: 16.072, lng: 108.190,
    desc: 'Mưa vừa, mực nước sông ổn định. Duy trì giám sát tự động.',
    updatedAt: '09:20 SA',
    icon: '🟣',
  },
  {
    id: 6, district: 'Cẩm Lệ', ward: 'Phường Khuê Trung',
    risk: 'An toàn', riskEn: 'Safe',
    riskColor: '#17b26a', riskBg: '#ecfdf3', riskBorder: '#abefc6',
    eta: 'Ổn định', depth: 'Bình thường', affected: 0, progress: 8,
    lat: 16.028, lng: 108.200,
    desc: 'Tình trạng bình thường. Đội cứu hộ dự phòng đã vào vị trí.',
    updatedAt: '09:15 SA',
    icon: '🟢',
  },
];

const METRICS = [
  { label: 'Khu vực nghiêm trọng', value: '1', sub: '↑ 0 so với hôm qua', color: '#f04438', bg: '#fef3f2', icon: AlertTriangle },
  { label: 'Đang cảnh báo', value: '2', sub: 'Liên Chiểu, Sơn Trà', color: '#f79009', bg: '#fffaeb', icon: Bell },
  { label: 'Dân cần sơ tán', value: '2,410', sub: 'Ước tính cập nhật', color: '#6938ef', bg: '#f4f3ff', icon: Users },
  { label: 'Độ chính xác AI', value: '94.7%', sub: 'Chuỗi 30 ngày', color: '#17b26a', bg: '#ecfdf3', icon: Cpu },
];

type TabKey = 'overview' | 'alerts' | 'map' | 'dispatch';

const TABS: { key: TabKey; label: string; hash: string }[] = [
  { key: 'overview', label: 'Tổng quan', hash: '' },
  { key: 'alerts', label: 'Cảnh báo', hash: 'alerts' },
  { key: 'map', label: 'Bản đồ', hash: 'maps' },
  { key: 'dispatch', label: 'Điều phối', hash: 'dispatch' },
];

export default function DashboardPage() {
  const [evacuationRoute, setEvacuationRoute] = useState<EvacuationRoute | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Đọc hash và cập nhật time chỉ ở client
  React.useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const found = TABS.find(t => t.hash === hash);
    if (found) setActiveTab(found.key);

    const tick = () => setCurrentTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, []);

  const filteredAlerts = filterRisk === 'all'
    ? ALERTS
    : ALERTS.filter(a => a.riskEn.toLowerCase() === filterRisk);

  const handleTabChange = (tab: typeof TABS[0]) => {
    setActiveTab(tab.key);
    if (tab.hash) window.location.hash = tab.hash;
    else history.pushState(null, '', window.location.pathname);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg-body)' }}>

      {/* ── Dashboard Tab Bar ── */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab)}
                style={{
                  padding: '12px 16px',
                  fontSize: 13,
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  color: activeTab === tab.key ? '#7a5af8' : 'var(--text-muted)',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid #7a5af8' : '2px solid transparent',
                  background: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: '#f04438', display: 'inline-block', width: 6, height: 6, borderRadius: '50%' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#f04438', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Live{currentTime ? ` · ${currentTime}` : ''}
            </span>
          </div>
        </div>
      </div>


      {/* ── TAB: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 12, padding: '12px 24px 16px' }}>
          <div style={{ width: 300, flexShrink: 0, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <ForecastPanel />
          </div>
          <div style={{ flex: 1, minWidth: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
            <OpenMapComponent evacuationRoute={evacuationRoute} />
          </div>
          <div style={{ width: 300, flexShrink: 0, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <ReliefPanel onRouteChange={setEvacuationRoute} />
          </div>
        </div>
      )}

      {/* ── TAB: ALERTS ── */}
      {activeTab === 'alerts' && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px 24px' }} className="custom-scroll" id="alerts">

          {/* Metric strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {METRICS.map(({ label, value, sub, color, bg, icon: Icon }) => (
              <div key={label} className="saas-card animate-fade-in-up" style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 18, height: 18, color }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>{label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Insight banner */}
          <div className="animate-fade-in-up delay-1" style={{
            background: 'linear-gradient(135deg, rgba(105,56,239,0.08) 0%, rgba(105,56,239,0.12) 100%)',
            border: '1px solid rgba(105,56,239,0.2)', borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(105,56,239,0.1)', border: '1px solid rgba(105,56,239,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Cpu style={{ width: 16, height: 16, color: '#7a5af8' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7a5af8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                AI Insight — Cập nhật 09:45 SA
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                Mô hình LSTM dự báo tổng lượng mưa <strong>200–240mm</strong> trong 6h tới tại lưu vực Liên Chiểu–Hòa Vang. Khuyến nghị kích hoạt phương án sơ tán cấp 2 và điều động thêm 4 đội cứu hộ đến khu vực ven sông Cu Đê trước 10:15 SA.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <TrendingUp style={{ width: 14, height: 14, color: '#f04438' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#f04438' }}>RỦI RO TĂNG</span>
            </div>
          </div>

          {/* Alerts header + filter */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell style={{ width: 16, height: 16, color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Danh sách cảnh báo</span>
              <span style={{ fontSize: 11, fontWeight: 600, background: 'rgba(105,56,239,0.1)', color: '#7a5af8', border: '1px solid rgba(105,56,239,0.2)', borderRadius: 99, padding: '2px 8px' }}>
                {filteredAlerts.length} khu vực
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'critical', label: '🔴 Nghiêm trọng' },
                  { key: 'warning', label: '🟠 Cảnh báo' },
                  { key: 'safe', label: '🟢 An toàn' },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilterRisk(f.key)}
                    style={{
                      padding: '5px 10px', fontSize: 11, fontWeight: 500,
                      borderRadius: 8, border: '1px solid',
                      borderColor: filterRisk === f.key ? '#7a5af8' : 'var(--border-color)',
                      background: filterRisk === f.key ? 'rgba(105,56,239,0.1)' : 'var(--bg-card)',
                      color: filterRisk === f.key ? '#7a5af8' : 'var(--text-muted)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>
              <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', fontSize: 11 }}>
                <RefreshCw style={{ width: 12, height: 12 }} />
                Làm mới
              </button>
            </div>
          </div>

          {/* Alert cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredAlerts.map((alert, i) => {
              const isExpanded = expandedId === alert.id;
              return (
                <div
                  key={alert.id}
                  className="saas-card animate-fade-in-up"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    border: `1px solid ${isExpanded ? alert.riskBorder : 'var(--border-color)'}`,
                    background: isExpanded ? alert.riskBg : 'var(--bg-card)',
                    transition: 'all 0.2s',
                    overflow: 'hidden',
                  }}
                >
                  {/* Card header — always visible */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                    style={{ width: '100%', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    {/* Risk indicator */}
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: alert.riskColor, flexShrink: 0, boxShadow: `0 0 0 3px ${alert.riskColor}20` }} />

                    {/* District info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{alert.district}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>{alert.ward}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        Cập nhật lúc {alert.updatedAt}
                      </div>
                    </div>

                    {/* ETA */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <Clock style={{ width: 11, height: 11, color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{alert.eta}</span>
                    </div>

                    {/* Depth */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <Droplets style={{ width: 11, height: 11, color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{alert.depth}</span>
                    </div>

                    {/* Affected */}
                    {alert.affected > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <Users style={{ width: 11, height: 11, color: alert.riskColor }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: alert.riskColor }}>{alert.affected.toLocaleString()}</span>
                      </div>
                    )}

                    {/* Badge */}
                    <span style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                      background: alert.riskBg, color: alert.riskColor,
                      border: `1px solid ${alert.riskBorder}`, flexShrink: 0,
                    }}>
                      {alert.risk}
                    </span>

                    {/* Progress + chevron */}
                    <div style={{ width: 80, flexShrink: 0 }}>
                      <div style={{ height: 4, borderRadius: 99, background: 'var(--border-color)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 99, width: `${alert.progress}%`, background: alert.riskColor, transition: 'width 0.6s ease' }} />
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'right', marginTop: 2 }}>{alert.progress}%</div>
                    </div>

                    <ChevronDown style={{ width: 14, height: 14, color: 'var(--text-muted)', flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ padding: '0 18px 16px', borderTop: `1px solid ${alert.riskBorder}` }}>
                      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '12px 0 14px' }}>
                        {alert.desc}
                      </p>

                      {/* Detail metrics row */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                        {[
                          { label: 'Thời gian dự báo ngập', value: alert.eta, icon: Clock },
                          { label: 'Độ sâu nước', value: alert.depth, icon: Droplets },
                          { label: 'Dân bị ảnh hưởng', value: alert.affected > 0 ? `${alert.affected.toLocaleString()} người` : 'Không có', icon: Users },
                          { label: 'Tọa độ', value: `${alert.lat}°N, ${alert.lng}°E`, icon: MapPin },
                        ].map(({ label, value, icon: Icon }) => (
                          <div key={label} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Icon style={{ width: 12, height: 12, color: 'var(--text-muted)', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{value}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}
                          onClick={() => { setActiveTab('map'); }}
                        >
                          <Eye style={{ width: 12, height: 12 }} />
                          Xem trên bản đồ
                        </button>
                        <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}
                          onClick={() => { setActiveTab('dispatch'); }}
                        >
                          <Navigation2 style={{ width: 12, height: 12 }} />
                          Điều phối cứu trợ
                        </button>
                        <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                          <Radio style={{ width: 12, height: 12 }} />
                          Phát cảnh báo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Timeline footer */}
          <div className="saas-card animate-fade-in-up" style={{ marginTop: 20, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Activity style={{ width: 14, height: 14, color: '#7a5af8' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Lịch sử sự kiện hôm nay</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { time: '09:45', text: 'AI nâng mức cảnh báo Liên Chiểu từ Warning → Critical', color: '#f04438' },
                { time: '09:30', text: 'Phát cảnh báo SMS đến 1,200 cư dân khu vực Hòa Khánh Bắc', color: '#f79009' },
                { time: '09:15', text: 'Đội cứu hộ số 3 đã đến vị trí tại THPT Hòa Vang', color: '#17b26a' },
                { time: '08:50', text: 'Hệ thống phát hiện mưa vượt ngưỡng 100mm/3h tại trạm đo Liên Chiểu', color: '#7a5af8' },
              ].map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', minWidth: 36, paddingTop: 1 }}>{ev.time}</span>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: ev.color, marginTop: 4, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ev.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: MAP ── */}
      {activeTab === 'map' && (
        <div style={{ flex: 1, minHeight: 0, padding: '12px 24px 16px', display: 'flex', flexDirection: 'column', gap: 12 }} id="maps">
          <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
            <div style={{ width: 300, flexShrink: 0, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <ForecastPanel />
            </div>
            <div style={{ flex: 1, minWidth: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
              <OpenMapComponent evacuationRoute={evacuationRoute} />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: DISPATCH ── */}
      {activeTab === 'dispatch' && (
        <div style={{ flex: 1, minHeight: 0, padding: '12px 24px 16px', display: 'flex', gap: 12 }} id="dispatch">
          <div style={{ flex: 1, minWidth: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
            <OpenMapComponent evacuationRoute={evacuationRoute} />
          </div>
          <div style={{ width: 320, flexShrink: 0, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <ReliefPanel onRouteChange={setEvacuationRoute} />
          </div>
        </div>
      )}
    </div>
  );
}
