'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Activity, Brain, AlertTriangle, Smartphone, Target, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    id: 1,
    icon: Activity,
    color: 'blue',
    title: 'Cảm biến phát hiện',
    subtitle: 'Trạm Hòa Khánh · 14:32:05',
    detail: 'Mực nước',
    value: '2.1m',
    badge: '↑ Đang tăng',
    badgeColor: 'amber',
    log: [
      'SENSOR-DN-002 · water_level = 2.1m',
      'Ngưỡng cảnh báo: 1.5m → VƯỢT NGƯỠNG',
      'Kích hoạt phân tích AI...',
    ],
  },
  {
    id: 2,
    icon: Brain,
    color: 'purple',
    title: 'AI Dự báo ngập lụt',
    subtitle: 'RandomForest v4.1 · 98.81% accuracy',
    detail: 'Nguy cơ ngập',
    value: '78/100',
    badge: 'Mức CAO',
    badgeColor: 'orange',
    log: [
      'Input: rainfall=56mm · water=2.1m · tide=0.8m',
      'Ensemble model → flood_risk = HIGH',
      'Xác suất ngập: 78% · Độ tin cậy: 91%',
    ],
  },
  {
    id: 3,
    icon: AlertTriangle,
    color: 'red',
    title: 'Cảnh báo được phát',
    subtitle: 'Hệ thống · Broadcast tức thời',
    detail: 'Khu vực',
    value: 'Hòa Khánh',
    badge: 'CRITICAL',
    badgeColor: 'red',
    log: [
      'Alert #ALT-20260617-0001 tạo thành công',
      'Push notification → 1,240 cư dân',
      'Broadcast WebSocket → Dashboard admin',
    ],
  },
  {
    id: 4,
    icon: Smartphone,
    color: 'green',
    title: 'Citizen gửi SOS',
    subtitle: 'Nguyễn Văn An · 14:35:18',
    detail: 'Địa chỉ',
    value: '45 NLBằng',
    badge: '3 người kẹt',
    badgeColor: 'rose',
    log: [
      'RescueRequest #RR-2026-0042 nhận được',
      'Vị trí: 16.0416°N · 108.1052°E',
      'Ảnh hiện trường đính kèm · Chờ AI phân loại...',
    ],
  },
  {
    id: 5,
    icon: Target,
    color: 'amber',
    title: 'AI chấm điểm ưu tiên',
    subtitle: 'Priority Scorer · <200ms',
    detail: 'Điểm ưu tiên',
    value: '87/100',
    badge: 'Ưu tiên #1',
    badgeColor: 'purple',
    log: [
      'urgency=critical (+30) · vulnerable (+25)',
      'water_level=0.8m (+10) · wait=3min (+8)',
      'Score 87 → ƯU TIÊN CAO NHẤT hàng đợi',
    ],
  },
  {
    id: 6,
    icon: CheckCircle2,
    color: 'emerald',
    title: 'Điều phối cứu hộ',
    subtitle: 'Admin xác nhận · 14:36:02',
    detail: 'Đội cứu hộ',
    value: 'PCCC L.Chiểu',
    badge: 'Đang đến',
    badgeColor: 'emerald',
    log: [
      'Đội RESCUE-001 được phân công',
      'ETA: 8 phút · Tuyến tối ưu đã tính',
      'Push notification → mobile team ✓',
    ],
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; glow: string; dot: string }> = {
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    text: 'text-blue-400',    glow: 'shadow-blue-500/20',    dot: 'bg-blue-500' },
  purple:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  text: 'text-purple-400',  glow: 'shadow-purple-500/20',  dot: 'bg-purple-500' },
  red:     { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     glow: 'shadow-red-500/20',     dot: 'bg-red-500' },
  green:   { bg: 'bg-green-500/10',   border: 'border-green-500/30',   text: 'text-green-400',   glow: 'shadow-green-500/20',   dot: 'bg-green-500' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   glow: 'shadow-amber-500/20',   dot: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-emerald-500/20', dot: 'bg-emerald-500' },
};

const BADGE_COLOR: Record<string, string> = {
  amber:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  orange:  'bg-orange-500/15 text-orange-400 border-orange-500/30',
  red:     'bg-red-500/15 text-red-400 border-red-500/30',
  rose:    'bg-rose-500/15 text-rose-400 border-rose-500/30',
  purple:  'bg-purple-500/15 text-purple-400 border-purple-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  green:   'bg-green-500/15 text-green-400 border-green-500/30',
};

const STEP_DURATION = 2800; // ms per step

export function DemoSimulation() {
  const [activeStep, setActiveStep] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [logVisible, setLogVisible] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = (next: number) => {
    setActiveStep(next);
    setLogLines(STEPS[next].log);
    setLogVisible(0);
    setProgress(0);
  };

  useEffect(() => {
    advance(0);
  }, []);

  // progress bar
  useEffect(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(0);
    const tick = 50;
    const steps = STEP_DURATION / tick;
    let count = 0;
    progressRef.current = setInterval(() => {
      count++;
      setProgress(Math.min(100, (count / steps) * 100));
      if (count >= steps) clearInterval(progressRef.current!);
    }, tick);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [activeStep]);

  // log lines reveal
  useEffect(() => {
    setLogVisible(0);
    const t1 = setTimeout(() => setLogVisible(1), 300);
    const t2 = setTimeout(() => setLogVisible(2), 800);
    const t3 = setTimeout(() => setLogVisible(3), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [activeStep]);

  // auto-advance
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveStep(prev => {
        const next = (prev + 1) % STEPS.length;
        advance(next);
        return next;
      });
    }, STEP_DURATION);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const step = STEPS[activeStep];
  const c = COLOR_MAP[step.color];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* bg glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-500/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-xs font-bold text-blue-400 mb-4">
            <span className="size-1.5 rounded-full bg-blue-400 animate-pulse" />
            DEMO TRỰC TIẾP
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            Hệ thống vận hành{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              như thế nào?
            </span>
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Giả lập luồng xử lý thời gian thực từ khi cảm biến phát hiện đến khi đội cứu hộ được điều phối.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-start">
          {/* Left: Step pills */}
          <div className="space-y-2">
            {STEPS.map((s, i) => {
              const sc = COLOR_MAP[s.color];
              const isActive = i === activeStep;
              const isDone = i < activeStep;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => advance(i)}
                  className={cn(
                    'w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300',
                    isActive
                      ? `${sc.border} ${sc.bg} shadow-lg ${sc.glow}`
                      : isDone
                        ? 'border-border/30 bg-muted/20 opacity-60'
                        : 'border-border/30 bg-card/20 hover:bg-muted/20'
                  )}
                >
                  {/* step number / icon */}
                  <div className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl border transition-all',
                    isActive ? `${sc.bg} ${sc.border} ${sc.text}` : isDone ? 'bg-muted/40 border-border/30 text-muted-foreground' : 'bg-muted/20 border-border/30 text-muted-foreground'
                  )}>
                    {isDone
                      ? <CheckCircle2 size={18} className="text-emerald-400" />
                      : isActive
                        ? <Icon size={18} className={cn(sc.text, 'animate-pulse')} />
                        : <Icon size={18} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-sm font-extrabold truncate', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                        {s.title}
                      </p>
                      {isActive && (
                        <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0', BADGE_COLOR[s.badgeColor])}>
                          {s.badge}
                        </span>
                      )}
                      {isDone && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shrink-0">
                          ✓ Xong
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-semibold mt-0.5 truncate">{s.subtitle}</p>
                    {/* progress bar on active */}
                    {isActive && (
                      <div className="mt-2 h-1 rounded-full bg-border/40 overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', sc.dot)}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <ChevronRight size={14} className={cn('shrink-0', isActive ? sc.text : 'text-muted-foreground/40')} />
                </button>
              );
            })}
          </div>

          {/* Right: Active detail card */}
          <div className={cn('rounded-3xl border p-6 shadow-xl transition-all duration-500 sticky top-24', c.border, c.bg)}>
            {/* card header */}
            <div className="flex items-center gap-3 mb-5">
              <div className={cn('flex size-12 items-center justify-center rounded-2xl border', c.border, c.bg)}>
                <step.icon size={22} className={cn(c.text, 'animate-pulse')} />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                  Bước {step.id}/6
                </p>
                <h3 className={cn('text-base font-black', c.text)}>{step.title}</h3>
              </div>
            </div>

            {/* big metric */}
            <div className={cn('rounded-2xl border p-4 mb-4 text-center', c.border, 'bg-background/40')}>
              <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1">
                {step.detail}
              </p>
              <p className={cn('text-4xl font-black', c.text)}>{step.value}</p>
              <span className={cn('inline-block mt-2 text-[11px] font-black px-3 py-1 rounded-full border', BADGE_COLOR[step.badgeColor])}>
                {step.badge}
              </span>
            </div>

            {/* terminal log */}
            <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 font-mono text-[11px] space-y-1.5 min-h-[88px]">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="size-2 rounded-full bg-red-500" />
                <span className="size-2 rounded-full bg-yellow-500" />
                <span className="size-2 rounded-full bg-green-500" />
                <span className="ml-2 text-zinc-500 text-[10px]">aegisflow · system log</span>
              </div>
              {logLines.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-2 transition-all duration-500',
                    i < logVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                  )}
                >
                  <span className="text-zinc-600 shrink-0">›</span>
                  <span className={i === logLines.length - 1 && logVisible >= logLines.length ? 'text-green-400' : 'text-zinc-300'}>
                    {line}
                  </span>
                </div>
              ))}
              {logVisible < logLines.length && (
                <div className="flex items-center gap-1 text-zinc-500">
                  <span>›</span>
                  <span className="animate-pulse">█</span>
                </div>
              )}
            </div>

            {/* step dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => advance(i)}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    i === activeStep ? `h-2 w-5 ${c.dot}` : i < activeStep ? 'h-2 w-2 bg-emerald-500/50' : 'h-2 w-2 bg-border'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
