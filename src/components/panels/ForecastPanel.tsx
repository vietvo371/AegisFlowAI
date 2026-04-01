'use client';
import React, { useState } from 'react';
import { Activity, Clock, Droplets, Waves, Cpu, ChevronRight } from 'lucide-react';

const alerts = [
  {
    id: 1, district: 'Liên Chiểu', risk: 'Critical', riskClass: 'badge-critical',
    eta: '28 phút', depth: '0.8m', affected: '1,200', progress: 92,
    color: '#f04438', bg: '#fef3f2', border: '#fecdca',
  },
  {
    id: 2, district: 'Hoà Vang', risk: 'Warning', riskClass: 'badge-warning',
    eta: '1g 15p', depth: '0.5m', affected: '780', progress: 68,
    color: '#f79009', bg: '#fffaeb', border: '#fedf89',
  },
  {
    id: 3, district: 'Sơn Trà', risk: 'Warning', riskClass: 'badge-warning',
    eta: '2g 05p', depth: '0.3m', affected: '430', progress: 45,
    color: '#f79009', bg: '#fffaeb', border: '#fedf89',
  },
  {
    id: 4, district: 'Hải Châu', risk: 'Safe', riskClass: 'badge-safe',
    eta: 'Ổn định', depth: 'Bình thường', affected: '0', progress: 12,
    color: '#17b26a', bg: '#ecfdf3', border: '#abefc6',
  },
];

export default function ForecastPanel() {
  const [selected, setSelected] = useState<number | null>(1);

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid #eaecf0' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: '#fef3f2' }}>
            <Activity className="w-4 h-4" style={{ color: '#f04438' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: '#101828' }}>Forecast Radar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: '#f04438' }} />
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#f04438' }}>Live</span>
        </div>
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {[
          { label: 'Nghiêm trọng', value: '1', color: '#f04438', bg: '#fef3f2' },
          { label: 'Cảnh báo', value: '2', color: '#f79009', bg: '#fffaeb' },
        ].map(m => (
          <div key={m.label} className="rounded-lg p-3 text-center"
            style={{ background: m.bg }}>
            <div className="text-2xl font-black leading-tight" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[10px] font-medium mt-0.5" style={{ color: '#667085' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto custom-scroll px-3 pb-3 flex flex-col gap-2">
        {alerts.map((a, i) => (
          <button key={a.id} onClick={() => setSelected(selected === a.id ? null : a.id)}
            className="w-full text-left rounded-xl p-3 transition-all duration-200 animate-fade-in-up"
            style={{
              background: selected === a.id ? a.bg : '#ffffff',
              border: `1px solid ${selected === a.id ? a.border : '#eaecf0'}`,
              animationDelay: `${i * 0.06}s`,
            }}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Waves className="w-3.5 h-3.5 flex-shrink-0" style={{ color: a.color }} />
                <span className="text-sm font-semibold" style={{ color: '#101828' }}>{a.district}</span>
              </div>
              <span className={a.riskClass}>{a.risk}</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full mb-2 overflow-hidden" style={{ background: '#eaecf0' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${a.progress}%`, background: a.color }} />
            </div>

            <div className="flex items-center justify-between text-[11px]" style={{ color: '#667085' }}>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.eta}</span>
              <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> {a.depth}</span>
              {a.affected !== '0' && (
                <span className="font-semibold" style={{ color: a.color }}>{a.affected} người</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* AI Insight footer */}
      <div className="p-3" style={{ borderTop: '1px solid #eaecf0' }}>
        <div className="rounded-xl p-3" style={{ background: '#f4f3ff', border: '1px solid #d9d6fe' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Cpu className="w-3.5 h-3.5" style={{ color: '#6938ef' }} />
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#6938ef' }}>AI Insight</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: '#344054' }}>
            Dự báo lượng mưa 200mm/6h tại Liên Chiểu. Khuyến nghị sơ tán ngay khu vực thấp trũng ven sông.
          </p>
        </div>
      </div>
    </div>
  );
}
