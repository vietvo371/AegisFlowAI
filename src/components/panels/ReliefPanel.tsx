'use client';
import React, { useState } from 'react';
import { Navigation2, Users, Truck, Target, Loader2, CheckCircle, Clock, Route } from 'lucide-react';
import { fetchEvacuationRoute, type EvacuationRoute } from '@/lib/openmap';

const reliefPoints = [
  {
    id: 1, name: 'THPT Hoà Vang', type: 'Điểm sơ tán', priority: 98,
    population: 450, risk: 'Critical', riskColor: '#f04438', riskBg: '#fef3f2',
    supplies: 72, distance: '2.3km', teams: 3,
    origin: { lat: 16.096, lng: 108.145 },
    destination: { lat: 16.067, lng: 108.207 },
  },
  {
    id: 2, name: 'BV Quận Liên Chiểu', type: 'Y tế ưu tiên', priority: 85,
    population: 150, risk: 'High', riskColor: '#f79009', riskBg: '#fffaeb',
    supplies: 45, distance: '4.1km', teams: 2,
    origin: { lat: 16.085, lng: 108.132 },
    destination: { lat: 16.054, lng: 108.172 },
  },
  {
    id: 3, name: 'Trung tâm CĐ D1', type: 'Hub cứu trợ', priority: 72,
    population: 300, risk: 'Moderate', riskColor: '#6938ef', riskBg: '#f4f3ff',
    supplies: 88, distance: '6.7km', teams: 1,
    origin: { lat: 16.010, lng: 107.980 },
    destination: { lat: 16.047, lng: 108.206 },
  },
  {
    id: 4, name: 'UBND Sơn Trà', type: 'Điểm chỉ huy', priority: 61,
    population: 200, risk: 'Monitor', riskColor: '#17b26a', riskBg: '#ecfdf3',
    supplies: 95, distance: '8.2km', teams: 1,
    origin: { lat: 16.082, lng: 108.218 },
    destination: { lat: 16.060, lng: 108.240 },
  },
];

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 18, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-11 h-11 flex-shrink-0">
      <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#f2f4f7" strokeWidth="3" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-black" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

interface ReliefPanelProps {
  onRouteChange?: (route: EvacuationRoute | null) => void;
}

export default function ReliefPanel({ onRouteChange }: ReliefPanelProps) {
  const [dispatchStates, setDispatchStates] = useState<Record<number, {
    status: 'idle' | 'loading' | 'success' | 'error';
    routeResult?: { distance: string; duration: string };
  }>>({});
  const [activeId, setActiveId] = useState<number | null>(null);
  const dispatched = Object.values(dispatchStates).filter(s => s.status === 'success').length;

  const handleDispatch = async (point: typeof reliefPoints[0]) => {
    if (activeId === point.id && dispatchStates[point.id]?.status === 'success') {
      setActiveId(null);
      onRouteChange?.(null);
      return;
    }
    setDispatchStates(prev => ({ ...prev, [point.id]: { status: 'loading' } }));
    setActiveId(point.id);

    const result = await fetchEvacuationRoute(point.origin, point.destination, 'car');
    if (result) {
      setDispatchStates(prev => ({
        ...prev,
        [point.id]: { status: 'success', routeResult: { distance: result.distance.text, duration: result.duration.text } },
      }));
      onRouteChange?.({ polyline: result.polyline, origin: point.origin, destination: point.destination, label: point.name });
    } else {
      setDispatchStates(prev => ({ ...prev, [point.id]: { status: 'error' } }));
      setActiveId(null);
      onRouteChange?.(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid #eaecf0' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: '#f4f3ff' }}>
            <Target className="w-4 h-4" style={{ color: '#6938ef' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: '#101828' }}>Relief Dispatch</span>
        </div>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide"
          style={{ background: '#f4f3ff', color: '#6938ef' }}>AI Queue</span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 p-3">
        {[
          { v: '12', l: 'Teams', c: '#6938ef' },
          { v: String(reliefPoints.length), l: 'Sites', c: '#f79009' },
          { v: String(dispatched), l: 'Done', c: '#17b26a' },
        ].map(m => (
          <div key={m.l} className="rounded-lg p-2 text-center"
            style={{ background: '#f9fafb', border: '1px solid #eaecf0' }}>
            <div className="text-lg font-black leading-tight" style={{ color: m.c }}>{m.v}</div>
            <div className="text-[10px] font-medium" style={{ color: '#667085' }}>{m.l}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll px-3 pb-3 flex flex-col gap-2">
        {reliefPoints.map((p, i) => {
          const state = dispatchStates[p.id] || { status: 'idle' };
          const isActive = activeId === p.id;
          return (
            <div key={p.id} className="rounded-xl p-3 animate-fade-in-up transition-all duration-200"
              style={{
                background: isActive ? p.riskBg : '#ffffff',
                border: `1px solid ${isActive ? p.riskColor + '40' : '#eaecf0'}`,
                animationDelay: `${i * 0.06}s`,
              }}>
              {/* Row 1: name + score */}
              <div className="flex items-start gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium mb-0.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{ background: p.riskBg, color: p.riskColor }}>#{i + 1}</span>
                    <span style={{ color: '#98a2b3' }}>{p.type}</span>
                  </div>
                  <h4 className="text-sm font-semibold truncate" style={{ color: '#101828' }}>{p.name}</h4>
                </div>
                <ScoreRing score={p.priority} color={p.riskColor} />
              </div>

              {/* Route result */}
              {state.status === 'success' && state.routeResult && (
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  {[
                    { icon: Route, val: state.routeResult.distance },
                    { icon: Clock, val: state.routeResult.duration },
                  ].map(({ icon: Icon, val }) => (
                    <span key={val} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: '#ecfdf3', border: '1px solid #abefc6', color: '#027a48' }}>
                      <Icon className="w-2.5 h-2.5" />{val}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-3 mb-2 text-[11px]" style={{ color: '#667085' }}>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{p.population}</span>
                <span className="flex items-center gap-1"><Navigation2 className="w-3 h-3" />{p.distance}</span>
                <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{p.teams} đội</span>
              </div>

              {/* Supplies */}
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[10px] shrink-0" style={{ color: '#98a2b3' }}>Supplies</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: '#eaecf0' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${p.supplies}%`,
                    background: p.supplies > 70 ? '#17b26a' : p.supplies > 40 ? '#f79009' : '#f04438'
                  }} />
                </div>
                <span className="text-[10px] shrink-0 font-medium" style={{ color: '#667085' }}>{p.supplies}%</span>
              </div>

              {/* Button */}
              <button onClick={() => handleDispatch(p)}
                disabled={state.status === 'loading'}
                className="btn-primary w-full disabled:opacity-50"
                style={state.status === 'success' && isActive ? {
                  background: 'linear-gradient(97deg, #027a48, #17b26a)',
                } : {}}>
                {state.status === 'loading' ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" />Đang tính toán...</>
                ) : state.status === 'success' && isActive ? (
                  <><CheckCircle className="w-3.5 h-3.5" />Đã sơ tán ✓</>
                ) : (
                  <><Navigation2 className="w-3.5 h-3.5" />Dispatch Route</>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
