'use client';
import React from 'react';

const stats = [
  { label: 'RAINFALL 24H', value: '127mm', status: 'critical' },
  { label: 'AFFECTED AREAS', value: '5 Districts', status: 'high' },
  { label: 'EVACUATED', value: '2,341 ppl', status: 'ok' },
  { label: 'FLOOD DEPTH MAX', value: '0.8m', status: 'critical' },
  { label: 'RELIEF TEAMS', value: '12 Active', status: 'ok' },
  { label: 'AI PREDICTION', value: '94% conf.', status: 'ok' },
  { label: 'SENSOR NODES', value: '48/52 Online', status: 'high' },
  { label: 'NEXT ALERT ETA', value: '0h 32m', status: 'critical' },
];

export default function StatsBar() {
  const all = [...stats, ...stats];
  return (
    <div className="flex-shrink-0 overflow-hidden relative" style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(0,242,254,0.06)', height: '36px' }}>
      <div className="flex items-center h-full animate-ticker whitespace-nowrap" style={{ width: 'max-content' }}>
        {all.map((s, i) => (
          <div key={i} className="flex items-center gap-3 px-6">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</span>
            <span className="text-[11px] font-bold" style={{
              color: s.status === 'critical' ? 'var(--red)' : s.status === 'high' ? '#ffaa00' : 'var(--green)'
            }}>{s.value}</span>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          </div>
        ))}
      </div>
    </div>
  );
}
