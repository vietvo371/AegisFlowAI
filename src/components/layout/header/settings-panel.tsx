'use client';

import React, { useCallback, useState } from 'react';
import {
  Settings, Bell, Map, Shield, Database, Globe,
  Monitor, Moon, Sun, ChevronRight, ToggleLeft, ToggleRight,
  RefreshCw, AlertTriangle, Volume2, VolumeX,
} from 'lucide-react';
import { useClickOutside } from '@/hooks/use-click-outside';
import { useTheme } from 'next-themes';

interface SettingToggle {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  value: boolean;
}

const INITIAL_TOGGLES: SettingToggle[] = [
  { id: 'sound',      label: 'Âm thanh cảnh báo',    description: 'Phát âm thanh khi có cảnh báo mới',       icon: Volume2,        value: true  },
  { id: 'autoRefresh',label: 'Tự động làm mới',       description: 'Cập nhật dữ liệu mỗi 30 giây',            icon: RefreshCw,      value: true  },
  { id: 'criticalOnly',label: 'Chỉ hiện nghiêm trọng',description: 'Lọc chỉ hiển thị cảnh báo Critical',     icon: AlertTriangle,  value: false },
  { id: 'mapLayer',   label: 'Lớp bản đồ mặc định',  description: 'Hiển thị lớp ngập lụt khi mở trang',      icon: Map,            value: true  },
];

const REFRESH_OPTS = ['15 giây', '30 giây', '1 phút', '5 phút'];
const MAP_STYLES   = ['Vệ tinh', 'Địa hình', 'Đường phố', 'Tối giản'];

export default function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const [toggles, setToggles] = useState<SettingToggle[]>(INITIAL_TOGGLES);
  const [refreshRate, setRefreshRate] = useState('30 giây');
  const [mapStyle, setMapStyle] = useState('Địa hình');
  const [activeSection, setActiveSection] = useState<'general' | 'map' | 'data' | 'account'>('general');

  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside<HTMLDivElement>(close);

  const flipToggle = (id: string) =>
    setToggles(prev => prev.map(t => t.id === id ? { ...t, value: !t.value } : t));

  const sections = [
    { key: 'general', label: 'Chung',     icon: Settings },
    { key: 'map',     label: 'Bản đồ',    icon: Map      },
    { key: 'data',    label: 'Dữ liệu',   icon: Database },
    { key: 'account', label: 'Tài khoản', icon: Shield   },
  ] as const;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: 8, borderRadius: '50%',
          border: '1px solid var(--border-color)',
          background: open ? 'var(--bg-subtle)' : 'transparent',
          color: open ? '#7a5af8' : 'var(--text-muted)',
          cursor: 'pointer', transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Cài đặt"
      >
        <Settings size={18} style={{ transition: 'transform 0.4s ease', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 10px)',
          width: 440, borderRadius: 16,
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
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Settings size={16} style={{ color: '#7a5af8' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Cài đặt hệ thống</span>
          </div>

          <div style={{ display: 'flex', height: 420 }}>
            {/* Sidebar nav */}
            <div style={{
              width: 120, borderRight: '1px solid var(--border-color)',
              padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0,
            }}>
              {sections.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  style={{
                    width: '100%', padding: '9px 10px',
                    borderRadius: 9, border: 'none',
                    background: activeSection === key ? 'rgba(105,56,239,0.1)' : 'transparent',
                    color: activeSection === key ? '#7a5af8' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: activeSection === key ? 600 : 500,
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            {/* Content area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }} className="custom-scroll">

              {/* ── GENERAL ── */}
              {activeSection === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Theme toggle */}
                  <div style={{
                    padding: '12px 14px', borderRadius: 12,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-subtle)',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                      Giao diện
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { label: 'Sáng', value: 'light', icon: Sun },
                        { label: 'Tối', value: 'dark', icon: Moon },
                        { label: 'Tự động', value: 'system', icon: Monitor },
                      ].map(({ label, value, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setTheme(value)}
                          style={{
                            flex: 1, padding: '8px 0', borderRadius: 9,
                            border: `1.5px solid ${resolvedTheme === value || (value === 'system' && !isDark) ? '#7a5af8' : 'var(--border-color)'}`,
                            background: resolvedTheme === value || (value === 'system' && !isDark) ? 'rgba(105,56,239,0.08)' : 'transparent',
                            color: resolvedTheme === value || (value === 'system' && !isDark) ? '#7a5af8' : 'var(--text-muted)',
                            fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.15s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          }}
                        >
                          <Icon size={14} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  {toggles.map(t => {
                    const Icon = t.icon;
                    return (
                      <div
                        key={t.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px', borderRadius: 10,
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-card)',
                          transition: 'background 0.15s', cursor: 'pointer',
                        }}
                        onClick={() => flipToggle(t.id)}
                        onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                        onMouseOut={e => (e.currentTarget.style.background = 'var(--bg-card)')}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                          background: t.value ? 'rgba(105,56,239,0.1)' : 'var(--bg-subtle)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={14} style={{ color: t.value ? '#7a5af8' : 'var(--text-muted)' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{t.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{t.description}</div>
                        </div>
                        {/* Toggle switch */}
                        <div
                          onClick={e => { e.stopPropagation(); flipToggle(t.id); }}
                          style={{
                            width: 38, height: 22, borderRadius: 99, position: 'relative', flexShrink: 0,
                            background: t.value ? '#7a5af8' : 'var(--border-color)',
                            transition: 'background 0.25s', cursor: 'pointer',
                          }}
                        >
                          <span style={{
                            position: 'absolute', top: 3, left: t.value ? 19 : 3,
                            width: 16, height: 16, borderRadius: '50%',
                            background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                            transition: 'left 0.25s ease',
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── MAP ── */}
              {activeSection === 'map' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    Phong cách bản đồ
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {MAP_STYLES.map(style => (
                      <button
                        key={style}
                        onClick={() => setMapStyle(style)}
                        style={{
                          padding: '12px', borderRadius: 10, cursor: 'pointer',
                          border: `1.5px solid ${mapStyle === style ? '#7a5af8' : 'var(--border-color)'}`,
                          background: mapStyle === style ? 'rgba(105,56,239,0.08)' : 'var(--bg-subtle)',
                          color: mapStyle === style ? '#7a5af8' : 'var(--text-secondary)',
                          fontSize: 12.5, fontWeight: mapStyle === style ? 700 : 500,
                          display: 'flex', alignItems: 'center', gap: 6,
                          transition: 'all 0.15s',
                        }}
                      >
                        <Globe size={14} />
                        {style}
                      </button>
                    ))}
                  </div>
                  <div style={{
                    marginTop: 4, padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(105,56,239,0.06)', border: '1px solid rgba(105,56,239,0.15)',
                  }}>
                    <div style={{ fontSize: 11, color: '#7a5af8', fontWeight: 600 }}>Phong cách hiện tại: {mapStyle}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Thay đổi có hiệu lực khi tải lại bản đồ.</div>
                  </div>
                </div>
              )}

              {/* ── DATA ── */}
              {activeSection === 'data' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    Tần suất cập nhật
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {REFRESH_OPTS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setRefreshRate(opt)}
                        style={{
                          padding: '10px 14px', borderRadius: 9, cursor: 'pointer',
                          border: `1.5px solid ${refreshRate === opt ? '#7a5af8' : 'var(--border-color)'}`,
                          background: refreshRate === opt ? 'rgba(105,56,239,0.08)' : 'transparent',
                          color: refreshRate === opt ? '#7a5af8' : 'var(--text-secondary)',
                          fontSize: 12.5, fontWeight: refreshRate === opt ? 700 : 500,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <RefreshCw size={13} />
                          {opt}
                        </span>
                        {refreshRate === opt && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: '#7a5af8', color: '#fff', borderRadius: 99, padding: '2px 7px' }}>
                            Đang dùng
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── ACCOUNT ── */}
              {activeSection === 'account' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Avatar */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px',
                    borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)',
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #6938ef, #9b8afb)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 800, color: '#fff',
                    }}>
                      A
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Admin AegisFlow</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>admin@aegisflow.ai</div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4,
                        fontSize: 10, fontWeight: 700, color: '#17b26a',
                        background: '#ecfdf3', border: '1px solid #abefc6',
                        borderRadius: 99, padding: '2px 7px',
                      }}>
                        <Shield size={9} /> Quản trị viên
                      </div>
                    </div>
                  </div>

                  {/* Quick links */}
                  {[
                    { label: 'Thông tin tài khoản', icon: Shield },
                    { label: 'Nhật ký hoạt động', icon: Database },
                    { label: 'API & Tích hợp', icon: Globe },
                    { label: 'Đăng xuất', icon: Settings },
                  ].map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 9, cursor: 'pointer',
                        border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                        color: label === 'Đăng xuất' ? '#f04438' : 'var(--text-secondary)',
                        fontSize: 12.5, fontWeight: 500, transition: 'all 0.15s',
                      }}
                      onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                      onMouseOut={e => (e.currentTarget.style.background = 'var(--bg-card)')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon size={14} />
                        {label}
                      </span>
                      <ChevronRight size={13} style={{ opacity: 0.5 }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 18px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>v1.0.0 · AegisFlow AI</span>
            <button
              onClick={close}
              style={{
                fontSize: 11, fontWeight: 600, color: '#7a5af8',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              Lưu & đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
