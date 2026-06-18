'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Activity, Brain, AlertTriangle, Smartphone, Target, CheckCircle2,
  Wifi, MapPin, Phone, Users, Zap, Shield, Navigation
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const STEP_ICONS = [Activity, Brain, AlertTriangle, Smartphone, Target, CheckCircle2];
const STEP_COLORS = ['cyan', 'purple', 'red', 'green', 'amber', 'emerald'];
const STEP_BADGES = ['LIVE', '78/100', 'CRITICAL', '3 trapped', '#1 / 87pt', 'DONE'];

const C: Record<string, { ring: string; glow: string; text: string; bg: string; border: string; bar: string }> = {
  cyan:    { ring: 'ring-cyan-500/40',    glow: 'shadow-cyan-500/30',    text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    bar: 'bg-cyan-400' },
  purple:  { ring: 'ring-purple-500/40',  glow: 'shadow-purple-500/30',  text: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  bar: 'bg-purple-400' },
  red:     { ring: 'ring-red-500/40',     glow: 'shadow-red-500/30',     text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     bar: 'bg-red-400' },
  green:   { ring: 'ring-green-500/40',   glow: 'shadow-green-500/30',   text: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/30',   bar: 'bg-green-400' },
  amber:   { ring: 'ring-amber-500/40',   glow: 'shadow-amber-500/30',   text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   bar: 'bg-amber-400' },
  emerald: { ring: 'ring-emerald-500/40', glow: 'shadow-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', bar: 'bg-emerald-400' },
};

const STEP_MS = 3200;

// ── Per-step mockup panels ────────────────────────────────────────────────────

function SensorPanel({ tick }: { tick: number }) {
  const t = useTranslations('landing.demo');
  const pts = [0.6, 0.7, 0.8, 0.95, 1.2, 1.5, 1.7, 1.9, 2.05, 2.1];
  const w = 260; const h = 80;
  const maxV = 2.5;
  const path = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - (v / maxV) * h;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
  const area = path + ` L${w},${h} L0,${h} Z`;
  const shown = Math.min(pts.length, Math.floor(tick * 3) + 1);
  const shownPts = pts.slice(0, shown);
  const shownPath = shownPts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - (v / maxV) * h;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  const cards = [
    { label: t('sensorStation1'), val: '2.1 m', sub: '↑ +0.6m/h', color: 'text-red-400', icon: '🌊' },
    { label: t('sensorStation2'), val: '0.4 m', sub: t('sensorNormal'), color: 'text-green-400', icon: '💧' },
    { label: t('sensorRainfall'), val: '56 mm', sub: t('sensorHeavy'), color: 'text-amber-400', icon: '🌧️' },
    { label: t('sensorOnline'), val: '5/5', sub: t('sensorAllActive'), color: 'text-cyan-400', icon: '📡' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {cards.map((card, i) => (
          <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-2.5">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1">{card.icon} {card.label}</div>
            <div className={cn('text-lg font-black mt-0.5', card.color)}>{card.val}</div>
            <div className="text-[10px] text-zinc-500">{card.sub}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-white/5 border border-white/10 p-3">
        <div className="flex justify-between text-[10px] text-zinc-500 mb-2">
          <span>{t('sensorChartLabel')}</span>
          <span className="text-red-400 font-bold">{t('sensorThreshold')}</span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 80 }}>
          <defs>
            <linearGradient id="wgrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1={h - (1.5 / maxV) * h} x2={w} y2={h - (1.5 / maxV) * h}
            stroke="#ef4444" strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
          <text x="4" y={h - (1.5 / maxV) * h - 3} fill="#ef4444" fontSize="8" opacity="0.8">{t('sensorThresholdLine')}</text>
          <path d={area} fill="url(#wgrad)" opacity="0.4" />
          <path d={shownPath} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
          {shownPts.length > 0 && (() => {
            const last = shownPts[shownPts.length - 1];
            const ix = ((shownPts.length - 1) / (pts.length - 1)) * w;
            const iy = h - (last / maxV) * h;
            return <circle cx={ix} cy={iy} r="4" fill="#22d3ee" className="animate-pulse" />;
          })()}
        </svg>
      </div>
    </div>
  );
}

function AIPanel({ tick }: { tick: number }) {
  const t = useTranslations('landing.demo');
  const features = [
    { label: t('aiWaterLevel'), val: 2.1, pct: 70, color: '#a78bfa' },
    { label: t('aiRainfall'), val: 56, pct: 56, color: '#818cf8' },
    { label: t('aiTide'), val: 0.8, pct: 40, color: '#6366f1' },
    { label: t('aiRainDuration'), val: 3.5, pct: 35, color: '#4f46e5' },
  ];
  const score = Math.min(78, Math.floor(tick * 100));
  const radius = 38; const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - score / 100);

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex flex-col items-center justify-center rounded-xl bg-white/5 border border-white/10 p-3 shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={radius} fill="none" stroke="#3f3f46" strokeWidth="8" />
            <circle cx="48" cy="48" r={radius} fill="none" stroke="#a78bfa" strokeWidth="8"
              strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round" transform="rotate(-90 48 48)"
              style={{ transition: 'stroke-dashoffset 0.1s' }} />
            <text x="48" y="44" textAnchor="middle" fill="white" fontSize="16" fontWeight="900">{score}</text>
            <text x="48" y="57" textAnchor="middle" fill="#a78bfa" fontSize="8">/100</text>
          </svg>
          <div className="text-[10px] text-purple-400 font-bold mt-1">{t('aiHighRisk')}</div>
        </div>
        <div className="flex-1 space-y-2">
          {features.map((f, i) => (
            <div key={i}>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-zinc-400">{f.label}</span>
                <span className="text-white font-bold">{f.val}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: tick > 0.3 ? `${f.pct}%` : '0%', background: f.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Model', val: 'RF v4.1' },
          { label: 'Accuracy', val: '98.81%' },
          { label: 'Latency', val: '< 180ms' },
        ].map((m, i) => (
          <div key={i}>
            <div className="text-[10px] text-zinc-500">{m.label}</div>
            <div className="text-xs font-black text-purple-400">{m.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertPanel({ tick }: { tick: number }) {
  const t = useTranslations('landing.demo');
  const shown = tick > 0.2;
  return (
    <div className="space-y-3">
      <div className={cn(
        'rounded-2xl border border-red-500/40 bg-red-500/10 p-3 transition-all duration-500',
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}>
        <div className="flex items-start gap-2.5">
          <div className="size-8 rounded-xl bg-red-500 flex items-center justify-center shrink-0 animate-pulse">
            <AlertTriangle size={16} className="text-white" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest">{t('alertTitle')}</div>
            <div className="text-sm font-black text-white mt-0.5">{t('alertMsg')}</div>
            <div className="text-[11px] text-zinc-400 mt-1">{t('alertDesc')}</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: '📱', label: t('alertPush'), val: tick > 0.4 ? '1,240' : '...', color: 'text-cyan-400' },
          { icon: '🖥️', label: t('alertDashboard'), val: tick > 0.5 ? 'Live' : '...', color: 'text-green-400' },
          { icon: '📻', label: t('alertSMS'), val: tick > 0.6 ? '340' : '...', color: 'text-amber-400' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
            <div className="text-lg">{s.icon}</div>
            <div className={cn('text-sm font-black', s.color)}>{s.val}</div>
            <div className="text-[10px] text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 space-y-1.5">
        {[
          { t: '14:32:05', msg: t('alertTimeline1'), done: true },
          { t: '14:32:06', msg: t('alertTimeline2'), done: tick > 0.3 },
          { t: '14:32:07', msg: t('alertTimeline3'), done: tick > 0.6 },
          { t: '14:32:08', msg: t('alertTimeline4'), done: tick > 0.85 },
        ].map((row, i) => (
          <div key={i} className={cn('flex items-center gap-2 text-[11px] transition-opacity', row.done ? 'opacity-100' : 'opacity-30')}>
            <span className="text-zinc-600 font-mono shrink-0">{row.t}</span>
            <span className={row.done ? 'text-zinc-300' : 'text-zinc-600'}>{row.msg}</span>
            {row.done && <CheckCircle2 size={11} className="text-emerald-400 shrink-0 ml-auto" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function SOSPanel({ tick }: { tick: number }) {
  const t = useTranslations('landing.demo');
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="shrink-0 w-28 rounded-2xl border border-white/20 bg-zinc-900 overflow-hidden" style={{ aspectRatio: '9/16' }}>
          <div className="h-3 bg-zinc-800 flex items-center justify-center">
            <div className="w-8 h-1 bg-zinc-600 rounded-full" />
          </div>
          <div className="p-2 space-y-1.5">
            <div className="text-[8px] text-zinc-400 font-bold">AegisFlow · SOS</div>
            <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-1.5 text-center">
              <div className="text-[8px] text-red-400 font-black">{t('sosEmergency')}</div>
            </div>
            <div className="space-y-1">
              {[
                { l: t('sosAddress'), v: '45 NL Bằng' },
                { l: t('sosPeople'), v: '3' },
                { l: t('sosStatus'), v: t('sosFlood') },
              ].map((f, i) => (
                <div key={i} className="rounded bg-white/5 p-1">
                  <div className="text-[7px] text-zinc-500">{f.l}</div>
                  <div className="text-[8px] text-white font-bold">{f.v}</div>
                </div>
              ))}
            </div>
            <div className={cn('rounded-lg bg-red-500 p-1.5 text-center transition-all', tick > 0.5 ? 'opacity-100' : 'opacity-40')}>
              <div className="text-[8px] text-white font-black">{t('sosSend')}</div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="rounded-xl bg-white/5 border border-white/10 p-2.5">
            <div className="text-[10px] text-zinc-500 mb-1">{t('sosReceived')}</div>
            <div className="text-xs font-black text-white">RR-2026-0042</div>
            <div className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
              <MapPin size={9} className="text-green-400" /> 16.0416°N · 108.1052°E
            </div>
            <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
              <Phone size={9} className="text-green-400" /> 0905-xxx-xxx
            </div>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-2.5">
            <div className="text-[10px] text-zinc-500 mb-1">{t('sosUserInfo')}</div>
            <div className="flex items-center gap-1.5">
              <div className="size-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <Users size={11} className="text-green-400" />
              </div>
              <div>
                <div className="text-[11px] font-black text-white">Nguyễn Văn An</div>
                <div className="text-[9px] text-zinc-500">{t('sosCitizen')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-white/5 border border-white/10 p-2.5">
        <div className="flex justify-between text-[10px] mb-1.5">
          <span className="text-zinc-400">{t('sosUrgency')}</span>
          <span className="text-red-400 font-black">CRITICAL</span>
        </div>
        <div className="flex gap-1">
          {[t('sosLow'), t('sosMed'), t('sosHigh'), t('sosCrit')].map((l, i) => (
            <div key={i} className={cn(
              'flex-1 rounded py-1 text-[9px] text-center font-bold transition-all',
              i === 3 ? 'bg-red-500 text-white' : 'bg-white/5 text-zinc-600'
            )}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PriorityPanel({ tick }: { tick: number }) {
  const t = useTranslations('landing.demo');
  const score = Math.min(87, Math.floor(tick * 110));
  const queue = [
    { id: 'RR-042', addr: '45 Nguyễn Lương Bằng', score: 87, people: 3, highlight: true },
    { id: 'RR-039', addr: '12 Hoàng Diệu', score: 62, people: 1, highlight: false },
    { id: 'RR-041', addr: '88 Lê Duẩn', score: 45, people: 2, highlight: false },
  ];
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-center gap-4">
        <div className="shrink-0 text-center">
          <div className="text-3xl font-black text-amber-400">{score}</div>
          <div className="text-[10px] text-zinc-500">{t('priorityPoints')}</div>
        </div>
        <div className="flex-1">
          <div className="text-xs font-black text-white mb-1">AI Priority Score</div>
          <div className="space-y-0.5">
            {[
              { label: t('priorityCrit'), pts: '+30', show: tick > 0.15 },
              { label: t('priorityElderlyKids'), pts: '+25', show: tick > 0.35 },
              { label: t('priorityWater'), pts: '+18', show: tick > 0.55 },
              { label: t('priorityWaiting'), pts: '+14', show: tick > 0.75 },
            ].map((r, i) => (
              <div key={i} className={cn('flex justify-between text-[10px] transition-opacity', r.show ? 'opacity-100' : 'opacity-0')}>
                <span className="text-zinc-400">{r.label}</span>
                <span className="text-amber-400 font-bold">{r.pts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-white/5 border border-white/10 p-2.5">
        <div className="text-[10px] text-zinc-500 mb-2 flex items-center gap-1">
          <Target size={10} /> {t('priorityQueue')}
        </div>
        <div className="space-y-1.5">
          {queue.map((q, i) => (
            <div key={i} className={cn(
              'flex items-center gap-2 rounded-lg p-2 text-[11px] transition-all',
              q.highlight ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-white/3'
            )}>
              <span className={cn('font-black text-base shrink-0', q.highlight ? 'text-amber-400' : 'text-zinc-600')}>#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold truncate text-[10px]">{q.addr}</div>
                <div className="text-zinc-500 text-[9px]">{q.id} · {t('priorityPeople', { n: q.people })}</div>
              </div>
              <span className={cn('font-black shrink-0', q.highlight ? 'text-amber-400' : 'text-zinc-500')}>{q.score}pt</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DispatchPanel({ tick }: { tick: number }) {
  const t = useTranslations('landing.demo');
  const eta = Math.max(0, Math.round(8 - tick * 8));
  return (
    <div className="space-y-3">
      <div className="rounded-xl overflow-hidden border border-white/10 relative bg-zinc-900" style={{ height: 140 }}>
        <svg className="absolute inset-0 w-full h-full opacity-20">
          {[0.25, 0.5, 0.75].map((r, i) => (
            <React.Fragment key={i}>
              <line x1={`${r * 100}%`} y1="0" x2={`${r * 100}%`} y2="100%" stroke="#4ade80" strokeWidth="0.5" />
              <line x1="0" y1={`${r * 100}%`} x2="100%" y2={`${r * 100}%`} stroke="#4ade80" strokeWidth="0.5" />
            </React.Fragment>
          ))}
        </svg>
        <svg className="absolute inset-0 w-full h-full opacity-30">
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#6b7280" strokeWidth="2" />
          <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#6b7280" strokeWidth="2" />
          <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#6b7280" strokeWidth="2" />
          <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#6b7280" strokeWidth="1" />
          <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#6b7280" strokeWidth="1" />
        </svg>
        {tick > 0.2 && (
          <svg className="absolute inset-0 w-full h-full">
            <path d="M30,100 Q80,80 140,70 Q180,65 200,50" stroke="#22d3ee" strokeWidth="2.5"
              fill="none" strokeDasharray="200"
              strokeDashoffset={Math.max(0, 200 - tick * 300)} strokeLinecap="round" />
          </svg>
        )}
        <div className="absolute text-xs" style={{ left: '15%', top: '65%', transform: 'translate(-50%,-50%)' }}>
          <div className="size-7 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-lg shadow-blue-500/50 animate-pulse">
            <Shield size={13} className="text-white" />
          </div>
          <div className="text-[9px] text-blue-300 text-center font-bold mt-0.5 whitespace-nowrap">PCCC LC</div>
        </div>
        <div className="absolute text-xs" style={{ left: '53%', top: '33%', transform: 'translate(-50%,-50%)' }}>
          <div className="size-7 rounded-full bg-red-500 border-2 border-white flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
            <span className="text-white text-[10px] font-black">SOS</span>
          </div>
          <div className="text-[9px] text-red-300 text-center font-bold mt-0.5 whitespace-nowrap">45 NLB</div>
        </div>
        <div className="absolute bottom-2 right-2 bg-emerald-500/90 rounded-lg px-2 py-1 text-[10px] text-white font-black flex items-center gap-1">
          <Navigation size={10} /> {t('dispatchETA', { min: eta })}
        </div>
        <div className="absolute top-2 left-2 text-[9px] text-zinc-400 bg-zinc-900/80 rounded px-1.5 py-0.5">
          {t('dispatchLocation')}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/5 border border-white/10 p-2.5">
          <div className="text-[10px] text-zinc-500">{t('dispatchTeam')}</div>
          <div className="text-xs font-black text-emerald-400 mt-0.5">PCCC Liên Chiểu</div>
          <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
            <Wifi size={9} /> {t('dispatchMembers')}
          </div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-2.5">
          <div className="text-[10px] text-zinc-500">{t('dispatchStatus')}</div>
          <div className={cn('text-xs font-black mt-0.5', tick > 0.3 ? 'text-emerald-400' : 'text-amber-400')}>
            {tick > 0.3 ? t('dispatchGoing') : t('dispatchPreparing')}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
            <Zap size={9} className="text-amber-400" /> Push ✓
          </div>
        </div>
      </div>
    </div>
  );
}

const PANELS = [SensorPanel, AIPanel, AlertPanel, SOSPanel, PriorityPanel, DispatchPanel];

// ── Main component ────────────────────────────────────────────────────────────

export function DemoSimulation() {
  const t = useTranslations('landing.demo');
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [tick, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const STEP_LABELS = [
    t('step1Label'), t('step2Label'), t('step3Label'),
    t('step4Label'), t('step5Label'), t('step6Label'),
  ];
  const STEP_TITLES = [
    t('step1Title'), t('step2Title'), t('step3Title'),
    t('step4Title'), t('step5Title'), t('step6Title'),
  ];

  const goTo = useCallback((idx: number) => {
    setActive(idx);
    setProgress(0);
    setTick(0);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (frameRef.current) clearInterval(frameRef.current);
    setProgress(0);
    setTick(0);

    const start = Date.now();
    frameRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const tv = Math.min(1, elapsed / STEP_MS);
      setProgress(tv * 100);
      setTick(tv);
      if (tv >= 1) clearInterval(frameRef.current!);
    }, 40);

    timerRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % STEP_ICONS.length);
      setProgress(0);
      setTick(0);
    }, STEP_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (frameRef.current) clearInterval(frameRef.current);
    };
  }, [active]);

  const color = STEP_COLORS[active];
  const c = C[color];
  const Panel = PANELS[active];
  const Icon = STEP_ICONS[active];

  return (
    <section className="py-28 relative overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      <div className={cn('absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 transition-all duration-1000', `bg-${color}-500`)} />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-bold text-cyan-400 mb-5">
            <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {t('liveBadge')}
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
            {t('titleFrom')}{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{t('titleSensor')}</span>
            {' '}{t('titleTo')}{' '}
            <span className="bg-gradient-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent">{t('titleRescue')}</span>
            {' '}{t('titleSuffix')}
          </h2>
          <p className="text-zinc-400 text-base max-w-xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
          {/* Left: step list */}
          <div className="space-y-1.5">
            {STEP_ICONS.map((StepIcon, i) => {
              const sc = C[STEP_COLORS[i]];
              const isActive = i === active;
              const isDone = i < active;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-300 group',
                    isActive
                      ? `border-white/20 bg-white/10 shadow-lg ring-1 ${sc.ring}`
                      : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10'
                  )}
                >
                  <div className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-xl border transition-all',
                    isActive ? `${sc.bg} ${sc.border}` : isDone ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'
                  )}>
                    {isDone
                      ? <CheckCircle2 size={16} className="text-emerald-400" />
                      : <StepIcon size={16} className={isActive ? cn(sc.text, 'animate-pulse') : 'text-zinc-500'} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={cn('text-[11px] font-extrabold', isActive ? 'text-white' : isDone ? 'text-zinc-400' : 'text-zinc-500')}>
                        {STEP_LABELS[i]}
                      </span>
                      {isActive && (
                        <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-full', sc.bg, sc.text, sc.border, 'border')}>
                          {STEP_BADGES[i]}
                        </span>
                      )}
                      {isDone && <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />}
                    </div>
                    {isActive && (
                      <div className="mt-1.5 h-0.5 rounded-full bg-white/10">
                        <div className={cn('h-full rounded-full', sc.bar)} style={{ width: `${progress}%`, transition: 'width 0.04s linear' }} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            <div className="rounded-xl bg-white/5 border border-white/10 p-3 mt-3 text-center">
              <div className="text-[10px] text-zinc-500">{t('totalTime')}</div>
              <div className="text-xl font-black text-white">{t('totalTimeVal')}</div>
              <div className="text-[10px] text-emerald-400 font-bold">{t('totalTimeDesc')}</div>
            </div>
          </div>

          {/* Right: detail */}
          <div className={cn(
            'rounded-3xl border p-5 shadow-2xl transition-all duration-500',
            'bg-zinc-900/80 backdrop-blur-md',
            c.border,
          )}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn('flex size-10 items-center justify-center rounded-xl border', c.bg, c.border)}>
                  <Icon size={18} className={cn(c.text, 'animate-pulse')} />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    {t('stepOf', { id: active + 1 })}
                  </div>
                  <div className={cn('text-sm font-black', c.text)}>{STEP_TITLES[active]}</div>
                </div>
              </div>
              <div className={cn('text-[10px] font-black px-3 py-1 rounded-full border', c.bg, c.text, c.border)}>
                {STEP_BADGES[active]}
              </div>
            </div>

            <Panel tick={tick} />

            <div className="flex justify-center gap-1.5 mt-4">
              {STEP_ICONS.map((_, i) => {
                const sc = C[STEP_COLORS[i]];
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={cn(
                      'rounded-full transition-all duration-300',
                      i === active ? `h-2 w-6 ${sc.bar}` : i < active ? 'h-2 w-2 bg-emerald-500/50' : 'h-2 w-2 bg-white/15'
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
