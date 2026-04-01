'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { Shield, Bell, Search, Settings, LayoutDashboard, Map, AlertTriangle, Zap } from 'lucide-react';
import ForecastPanel from '@/components/panels/ForecastPanel';
import ReliefPanel from '@/components/panels/ReliefPanel';
import type { EvacuationRoute } from '@/lib/openmap';

const OpenMapComponent = dynamic(() => import('@/components/map/MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <span style={{ color: '#98a2b3', fontSize: 13 }}>Đang tải bản đồ...</span>
    </div>
  ),
});

export default function Home() {
  const [evacuationRoute, setEvacuationRoute] = useState<EvacuationRoute | null>(null);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#f9fafb' }}>
      {/* ── MAIN CONTENT — fills all remaining height ── */}
      <div style={{
        flex: 1,
        minHeight: 0,          // critical: allows flex child to shrink below content size
        display: 'flex',
        gap: 12,
        padding: '12px 24px 16px',
      }}>
        {/* LEFT PANEL */}
        <div style={{
          width: 300, flexShrink: 0,
          background: '#fff', borderRadius: 12,
          border: '1px solid #eaecf0',
          boxShadow: '0px 1px 3px rgba(16,24,40,0.1)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <ForecastPanel />
        </div>

        {/* CENTER MAP — grows to fill available space */}
        <div style={{
          flex: 1,
          minWidth: 0,           // critical: allows flex child to shrink in flex row
          borderRadius: 12, overflow: 'hidden',
          border: '1px solid #eaecf0',
          boxShadow: '0px 1px 3px rgba(16,24,40,0.1)',
        }}>
          <OpenMapComponent evacuationRoute={evacuationRoute} />
        </div>

        {/* RIGHT PANEL */}
        <div style={{
          width: 300, flexShrink: 0,
          background: '#fff', borderRadius: 12,
          border: '1px solid #eaecf0',
          boxShadow: '0px 1px 3px rgba(16,24,40,0.1)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <ReliefPanel onRouteChange={setEvacuationRoute} />
        </div>
      </div>
    </div>
  );
}
