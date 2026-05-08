'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowRight,
  ShieldCheck,
  Activity,
  Zap,
  Globe,
  Users,
  Quote,
  AlarmClock,
  RadioTower,
  EyeOff,
  Heart,
  Settings2,
  Languages,
  Wifi,
  AlertTriangle,
  Brain,
  Navigation,
  Send,
  type LucideProps,
} from 'lucide-react';
import type { FC } from 'react';

// ── Inline diagram components (slide-style) ──────────────────────────────────

function AIEngineDiagram({ t }: { t: (key: string) => string }) {
  const inputs = [
    { label: t('landing.diagramAIInputWaterLevel'), pct: '40%', y: 18 },
    { label: t('landing.diagramAIInputRainfall'), pct: '30%', y: 42 },
    { label: t('landing.diagramAIInputRainDuration'), pct: '15%', y: 66 },
    { label: t('landing.diagramAIInputTide'), pct: '10%', y: 90 },
    { label: t('landing.diagramAIInputHistory'), pct: '5%', y: 114 },
  ];
  const risks = [
    { label: t('landing.diagramAIRiskLow'), color: '#64748b', y: 20 },
    { label: t('landing.diagramAIRiskMedium'), color: '#0ea5e9', y: 50 },
    { label: t('landing.diagramAIRiskHigh'), color: '#f59e0b', y: 80 },
    { label: t('landing.diagramAIRiskCritical'), color: '#ef4444', y: 110 },
  ];
  return (
    <svg viewBox="0 0 380 136" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {inputs.map((inp, i) => (
        <g key={i}>
          <rect x="0" y={inp.y - 11} width="128" height="22" rx="5" fill="#1e3a5f" />
          <text x="8" y={inp.y + 4} fill="#cbd5e1" fontSize="9.5">{inp.label}</text>
          <text x="118" y={inp.y + 4} fill="#4ade80" fontSize="9" fontWeight="700" textAnchor="end">{inp.pct}</text>
          <line x1="128" y1={inp.y} x2="176" y2="68" stroke="#4ade80" strokeWidth="1" opacity="0.35" />
        </g>
      ))}
      {/* RandomForest box */}
      <rect x="176" y="30" width="88" height="76" rx="8" fill="#1e3a5f" stroke="#4ade80" strokeWidth="1.5" />
      <text x="220" y="58" fill="white" fontSize="9" fontWeight="700" textAnchor="middle">{t('landing.diagramAIModelName').split(' ')[0]}</text>
      <text x="220" y="71" fill="white" fontSize="9" fontWeight="700" textAnchor="middle">{t('landing.diagramAIModelName').split(' ')[1]}</text>
      <text x="220" y="87" fill="#4ade80" fontSize="8" textAnchor="middle">{t('landing.diagramAIModelSub')}</text>
      {/* connector */}
      <line x1="264" y1="68" x2="286" y2="68" stroke="#4ade80" strokeWidth="1.5" />
      <polygon points="286,68 281,65 281,71" fill="#4ade80" />
      {risks.map((r, i) => (
        <g key={i}>
          <rect x="288" y={r.y - 10} width="92" height="20" rx="4" fill={r.color + '22'} stroke={r.color} strokeWidth="1" />
          <circle cx="298" cy={r.y} r="4" fill={r.color} />
          <text x="306" y={r.y + 4} fill={r.color} fontSize="8" fontWeight="700">{r.label}</text>
        </g>
      ))}
    </svg>
  );
}

function EcosystemLoop({ t }: { t: (key: string) => string }) {
  const nodes = [
    { label: t('landing.diagramEcoCollect'), sub: t('landing.diagramEcoCollectSub'), x: 200, y: 24, color: '#0ea5e9' },
    { label: t('landing.diagramEcoPredict'), sub: t('landing.diagramEcoPredictSub'), x: 342, y: 90, color: '#6366f1' },
    { label: t('landing.diagramEcoAlert'), sub: t('landing.diagramEcoAlertSub'), x: 288, y: 200, color: '#ef4444' },
    { label: t('landing.diagramEcoAction'), sub: t('landing.diagramEcoActionSub'), x: 112, y: 200, color: '#f59e0b' },
    { label: t('landing.diagramEcoExecute'), sub: t('landing.diagramEcoExecuteSub'), x: 58, y: 90, color: '#22c55e' },
  ];
  // simple circle path between nodes
  const cx = 200, cy = 120, r = 88;
  const angles = [-90, -90 + 72, -90 + 144, -90 + 216, -90 + 288];
  const pts = angles.map(a => ({
    x: cx + r * Math.cos((a * Math.PI) / 180),
    y: cy + r * Math.sin((a * Math.PI) / 180),
  }));
  return (
    <svg viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-lg mx-auto">
      {/* Circle connector */}
      <circle cx={cx} cy={cy} r={r} stroke="#334155" strokeWidth="1" strokeDasharray="6 4" />
      {/* Arrows between nodes */}
      {pts.map((p, i) => {
        const next = pts[(i + 1) % pts.length];
        const mx = (p.x + next.x) / 2 + (next.y - p.y) * 0.08;
        const my = (p.y + next.y) / 2 - (next.x - p.x) * 0.08;
        const node = nodes[i];
        return (
          <g key={i}>
            <path d={`M${p.x} ${p.y} Q${mx} ${my} ${next.x} ${next.y}`}
              stroke={node.color} strokeWidth="1.8" fill="none" markerEnd={`url(#arrow-${i})`} opacity="0.7" />
            <defs>
              <marker id={`arrow-${i}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 Z" fill={node.color} opacity="0.7" />
              </marker>
            </defs>
          </g>
        );
      })}
      {/* Node circles */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={pts[i].x} cy={pts[i].y} r="26" fill={n.color + '18'} stroke={n.color} strokeWidth="1.5" />
          <text x={pts[i].x} y={pts[i].y - 3} fill={n.color} fontSize="8.5" fontWeight="700" textAnchor="middle">{n.label}</text>
          <text x={pts[i].x} y={pts[i].y + 9} fill="#94a3b8" fontSize="7.5" textAnchor="middle">{n.sub}</text>
        </g>
      ))}
      {/* Center label */}
      <text x={cx} y={cy - 6} fill="#1e293b" fontSize="10" fontWeight="800" textAnchor="middle">AegisFlow</text>
      <text x={cx} y={cy + 8} fill="#64748b" fontSize="8.5" textAnchor="middle">Ecosystem</text>
    </svg>
  );
}

function EvacuationDiagram({ t }: { t: (key: string) => string }) {
  return (
    <svg viewBox="0 0 360 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Background grid */}
      {[40, 80, 120, 160].map(y => <line key={y} x1="20" y1={y} x2="340" y2={y} stroke="#e2e8f0" strokeWidth="0.5" />)}
      {[60, 120, 180, 240, 300].map(x => <line key={x} x1={x} y1="20" x2={x} y2="160" stroke="#e2e8f0" strokeWidth="0.5" />)}
      {/* Flood zone polygon */}
      <polygon points="120,60 200,50 230,90 210,130 140,135 100,100" fill="#ef444420" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5 3" />
      <text x="160" y="98" fill="#ef4444" fontSize="9" fontWeight="700" textAnchor="middle">{t('landing.diagramEvacFloodZone')}</text>
      {/* Safe zone */}
      <rect x="280" y="55" width="60" height="60" rx="6" fill="#22c55e18" stroke="#22c55e" strokeWidth="1.5" />
      <text x="310" y="82" fill="#22c55e" fontSize="8" fontWeight="700" textAnchor="middle">{t('landing.diagramEvacSafe1')}</text>
      <text x="310" y="94" fill="#22c55e" fontSize="8" fontWeight="700" textAnchor="middle">{t('landing.diagramEvacSafe2')}</text>
      {/* Safe route arc */}
      <path d="M100,85 Q120,30 200,28 Q270,26 295,70" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeDasharray="8 4">
        <animate attributeName="stroke-dashoffset" from="48" to="0" dur="2s" repeatCount="indefinite" />
      </path>
      <text x="170" y="18" fill="#22c55e" fontSize="7.5" textAnchor="middle">{t('landing.diagramEvacSafeRoute')}</text>
      {/* Danger route crossed */}
      <line x1="100" y1="85" x2="295" y2="85" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
      <line x1="185" y1="75" x2="205" y2="95" stroke="#ef4444" strokeWidth="2" />
      <line x1="205" y1="75" x2="185" y2="95" stroke="#ef4444" strokeWidth="2" />
      <text x="194" y="110" fill="#ef4444" fontSize="7" textAnchor="middle">{t('landing.diagramEvacShortRoute')}</text>
      <text x="194" y="120" fill="#ef4444" fontSize="7" textAnchor="middle">{t('landing.diagramEvacPenalty')}</text>
      {/* People dots */}
      {[[52, 80], [60, 96], [44, 102]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill="#1e3a5f" />
      ))}
      <text x="52" y="120" fill="#64748b" fontSize="7.5" textAnchor="middle">{t('landing.diagramEvacResidents')}</text>
      {/* Arrow at end */}
      <polygon points="295,70 287,62 287,78" fill="#22c55e" />
      {/* Legend */}
      <circle cx="28" cy="155" r="4" fill="#22c55e" />
      <text x="36" y="158" fill="#64748b" fontSize="7.5">{t('landing.diagramEvacLegendSafe')}</text>
      <circle cx="160" cy="155" r="4" fill="#ef4444" />
      <text x="168" y="158" fill="#64748b" fontSize="7.5">{t('landing.diagramEvacLegendAvoid')}</text>
    </svg>
  );
}

function AutomationTimeline({ t }: { t: (key: string) => string }) {
  const steps: { t: string; Icon: FC<LucideProps>; title: string; desc: string; color: string }[] = [
    { t: t('landing.timelineStep1T'), Icon: Wifi,          title: t('landing.timelineStep1Title'),     desc: t('landing.timelineStep1Desc'),              color: '#64748b' },
    { t: t('landing.timelineStep2T'), Icon: AlertTriangle, title: t('landing.timelineStep2Title'),    desc: t('landing.timelineStep2Desc'),            color: '#0ea5e9' },
    { t: t('landing.timelineStep3T'), Icon: Brain,         title: t('landing.timelineStep3Title'),      desc: t('landing.timelineStep3Desc'),  color: '#ef4444' },
    { t: t('landing.timelineStep4T'), Icon: Navigation,    title: t('landing.timelineStep4Title'), desc: t('landing.timelineStep4Desc'),     color: '#6366f1' },
    { t: t('landing.timelineStep5T'), Icon: Send,          title: t('landing.timelineStep5Title'),    desc: t('landing.timelineStep5Desc'),             color: '#22c55e' },
  ];
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[640px] relative py-8">
        <div className="absolute top-[52px] left-[5%] right-[5%] h-1 bg-gradient-to-r from-slate-300 via-red-400 to-emerald-400 rounded-full" />
        <div className="grid grid-cols-5 gap-0 px-[5%]">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-2">
              <span className="font-mono text-[10px] font-bold text-muted-foreground">{step.t}</span>
              <div className="w-5 h-5 rounded-full border-2 bg-background z-10 flex items-center justify-center"
                style={{ borderColor: step.color }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: step.color }} />
              </div>
              <div className="mt-2 rounded-2xl border p-3 w-full"
                style={{ borderColor: step.color + '40', backgroundColor: step.color + '08' }}>
                <div className="flex justify-center mb-2">
                  <step.Icon size={18} style={{ color: step.color }} />
                </div>
                <div className="text-xs font-bold" style={{ color: step.color }}>{step.title}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4 font-medium">
          {t('landing.timelineFooter')}
        </p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const t = useTranslations();

  const stats = [
    { label: t('stats.accuracyLabel'), value: '98.8%', icon: Activity, sub: 'F1-score: 0.9886' },
    { label: t('stats.alertTimeLabel'), value: '< 1s', icon: Zap, sub: 'WebSocket latency 0.9s' },
    { label: t('stats.protectedLabel'), value: t('stats.protected'), icon: Users, sub: '4 phân quyền' },
    { label: t('stats.uptimeLabel'), value: '100%', icon: ShieldCheck, sub: 'Chiến lược AI Kép' },
  ];

  return (
    <div className="flex flex-col overflow-hidden">

      {/* ── Hero ── */}
      <section className="relative pt-10 pb-20 lg:pt-20 lg:pb-32">
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full opacity-50" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-500/10 blur-[120px] rounded-full opacity-50" />
        </div>
        <div className="container px-4 md:px-6 mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8">
            <ShieldCheck size={14} />
            <span>{t('hero.badge')}</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6">
            {t('hero.title1')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">
              {t('hero.title2')}
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-10 leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 group">
                {t('hero.ctaPrimary')}
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#features" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full h-14 px-10 rounded-2xl font-bold text-lg">
                {t('hero.ctaSecondary')}
              </Button>
            </Link>
          </div>
          <div className="relative max-w-5xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden border-8 border-background/50 shadow-2xl shadow-primary/10 bg-muted">
              <div className="aspect-[16/9] relative">
                <Image src="/dashboard-preview.png" alt="AegisFlow Dashboard Preview" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 1024px" priority />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-card rounded-3xl border border-border p-6 shadow-2xl hidden lg:flex flex-col justify-between items-start animate-float">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Zap size={20} /></div>
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">SYSTEM STATUS</div>
                <div className="text-sm font-black text-emerald-500">[ONLINE]</div>
              </div>
            </div>
            <div className="absolute -bottom-8 -left-8 w-52 h-24 bg-card rounded-2xl border border-border p-5 shadow-2xl hidden lg:flex items-center gap-4 animate-float" style={{ animationDelay: '1.5s' }}>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600"><Globe size={24} /></div>
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">DATA FLOW</div>
                <div className="text-sm font-bold">OPTIMAL</div>
                <div className="text-[10px] text-muted-foreground">Đà Nẵng Hub</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-6 rounded-3xl bg-background border border-border shadow-sm hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <stat.icon size={24} />
                </div>
                <div className="text-3xl font-black mb-1">{stat.value}</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest leading-tight">{stat.label}</div>
                {stat.sub && <div className="text-[10px] text-muted-foreground/60 mt-1 font-mono">{stat.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 Khoảng Trống (Problem Gaps) ── */}
      <section className="py-24 bg-muted/50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-bold mb-5">
              {t('landing.problemBadge')}
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">
              {t('landing.problemTitle')}{' '}
              <span className="text-red-500">{t('landing.problemTitleHighlight')}</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t('landing.problemSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {([
              {
                tag: t('landing.gap1Tag'),
                Icon: AlarmClock,
                problem: t('landing.gap1Problem'),
                desc: t('landing.gap1Desc'),
              },
              {
                tag: t('landing.gap2Tag'),
                Icon: RadioTower,
                problem: t('landing.gap2Problem'),
                desc: t('landing.gap2Desc'),
              },
              {
                tag: t('landing.gap3Tag'),
                Icon: EyeOff,
                problem: t('landing.gap3Problem'),
                desc: t('landing.gap3Desc'),
              },
            ] as { tag: string; Icon: FC<LucideProps>; problem: string; desc: string }[]).map((card, i) => (
              <div key={i} className="rounded-3xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="h-1 bg-red-500" />
                <div className="p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                      <card.Icon size={20} />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {t('landing.gapLabel', { tag: card.tag })}
                    </span>
                  </div>
                  <h3 className="text-red-500 text-xl font-black leading-tight">{card.problem}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <div className="h-px w-16 bg-border" />
            <span className="font-semibold">{t('landing.gapFooter')}</span>
            <div className="h-px w-16 bg-border" />
          </div>
        </div>
      </section>

      {/* ── Features: 3 Spotlight Sections ── */}
      <section id="features" className="py-8">

        {/* Feature 1: AI Prediction Engine */}
        <div className="py-20 border-b border-border">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-bold">
                  {t('landing.feat1Badge')}
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight">
                  {t('landing.feat1Title')}<br />
                  <span className="text-blue-500">{t('landing.feat1TitleHighlight')}</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('landing.feat1Desc')}
                </p>
                <ul className="space-y-2">
                  {[t('landing.feat1Bullet1'), t('landing.feat1Bullet2'), t('landing.feat1Bullet3')].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-slate-50 dark:bg-slate-900/50 p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                  {t('landing.feat1DiagramTitle')}
                </p>
                <AIEngineDiagram t={t} />
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Evacuation & Spatial Intelligence */}
        <div className="py-20 border-b border-border bg-muted/20">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 rounded-2xl border border-border bg-white dark:bg-slate-900/50 p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                  {t('landing.feat2DiagramTitle')}
                </p>
                <EvacuationDiagram t={t} />
              </div>
              <div className="order-1 lg:order-2 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
                  {t('landing.feat2Badge')}
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight">
                  {t('landing.feat2Title')}<br />
                  <span className="text-emerald-500">{t('landing.feat2TitleHighlight')}</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('landing.feat2Desc')}
                </p>
                <ul className="space-y-2">
                  {[t('landing.feat2Bullet1'), t('landing.feat2Bullet2'), t('landing.feat2Bullet3')].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Zero-Touch Automation */}
        <div className="py-20 border-b border-border">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-xs font-bold mb-4">
                {t('landing.feat3Badge')}
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight mb-4">
                {t('landing.feat3Title')}<br />
                <span className="text-indigo-500">{t('landing.feat3TitleHighlight')}</span>
              </h2>
              <p className="text-muted-foreground">
                {t('landing.feat3Desc')}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white dark:bg-slate-900/50 p-6 md:p-8">
              <AutomationTimeline t={t} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section className="py-24 bg-muted/50">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-5">
              {t('landing.compareBadge')}
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">{t('landing.compareTitle')}</h2>
            <p className="text-lg text-muted-foreground">{t('landing.compareSubtitle')}</p>
          </div>
          <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-5 font-bold text-foreground w-[30%]">{t('landing.compareColCriteria')}</th>
                  <th className="p-5 font-bold text-muted-foreground text-center">{t('landing.compareColTraditional')}</th>
                  <th className="p-5 font-bold text-emerald-600 text-center bg-emerald-50 dark:bg-emerald-900/20">{t('landing.compareColAegis')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    criteria: t('landing.compareRow1Criteria'),
                    traditional: t('landing.compareRow1Traditional'),
                    aegis: t('landing.compareRow1Aegis'),
                  },
                  {
                    criteria: t('landing.compareRow2Criteria'),
                    traditional: t('landing.compareRow2Traditional'),
                    aegis: t('landing.compareRow2Aegis'),
                  },
                  {
                    criteria: t('landing.compareRow3Criteria'),
                    traditional: t('landing.compareRow3Traditional'),
                    aegis: t('landing.compareRow3Aegis'),
                  },
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/30'}`}>
                    <td className="p-5 font-semibold text-foreground">{row.criteria}</td>
                    <td className="p-5 text-muted-foreground text-center">{row.traditional}</td>
                    <td className="p-5 text-emerald-600 font-semibold text-center bg-emerald-50/50 dark:bg-emerald-900/10">
                      {row.aegis}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Ecosystem Loop (How It Works) ── */}
      <section className="py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-5">
              {t('landing.ecosystemBadge')}
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">{t('landing.ecosystemTitle')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('landing.ecosystemSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <EcosystemLoop t={t} />
            <div className="space-y-3">
              {[
                { num: t('landing.ecoStep1Num'), title: t('landing.ecoStep1Title'), desc: t('landing.ecoStep1Desc'), color: 'text-sky-500', border: 'border-sky-200 dark:border-sky-800', dot: 'bg-sky-500' },
                { num: t('landing.ecoStep2Num'), title: t('landing.ecoStep2Title'), desc: t('landing.ecoStep2Desc'), color: 'text-indigo-500', border: 'border-indigo-200 dark:border-indigo-800', dot: 'bg-indigo-500' },
                { num: t('landing.ecoStep3Num'), title: t('landing.ecoStep3Title'), desc: t('landing.ecoStep3Desc'), color: 'text-red-500', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' },
                { num: t('landing.ecoStep4Num'), title: t('landing.ecoStep4Title'), desc: t('landing.ecoStep4Desc'), color: 'text-amber-500', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
                { num: t('landing.ecoStep5Num'), title: t('landing.ecoStep5Title'), desc: t('landing.ecoStep5Desc'), color: 'text-emerald-500', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
              ].map((step) => (
                <div key={step.num} className={`flex gap-4 p-5 rounded-3xl border ${step.border} bg-card shadow-sm hover:shadow-md transition-all`}>
                  <div className={`w-6 h-6 rounded-full ${step.dot} text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5`}>
                    {step.num.replace('0', '')}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${step.color}`}>{step.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ASEAN Scalability ── */}
      <section className="py-24 bg-muted/50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-5">
              {t('landing.aseanBadge')}
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">{t('landing.aseanTitle')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('landing.aseanSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {([
              {
                Icon: Heart,
                title: t('landing.aseanCard1Title'),
                desc: t('landing.aseanCard1Desc'),
                iconColor: 'bg-emerald-500/10 text-emerald-600',
              },
              {
                Icon: Settings2,
                title: t('landing.aseanCard2Title'),
                desc: t('landing.aseanCard2Desc'),
                iconColor: 'bg-blue-500/10 text-blue-600',
              },
              {
                Icon: Languages,
                title: t('landing.aseanCard3Title'),
                desc: t('landing.aseanCard3Desc'),
                iconColor: 'bg-indigo-500/10 text-indigo-600',
              },
            ] as { Icon: FC<LucideProps>; title: string; desc: string; iconColor: string }[]).map((card, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card p-8 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all space-y-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.iconColor}`}>
                  <card.Icon size={24} />
                </div>
                <h3 className="font-black text-xl text-foreground">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trusted by ── */}
      <section className="py-16 border-y border-border overflow-hidden">
        <div className="container px-4 md:px-6 mx-auto">
          <p className="text-center text-sm font-bold text-muted-foreground uppercase tracking-widest mb-10">
            {t('landing.trustedBy')}
          </p>
          <div className="flex items-center justify-center gap-12 md:gap-16 flex-wrap opacity-50">
            {['UBND TP. Đà Nẵng', 'Sở TN&MT', 'PCTT Miền Trung', 'ĐH Bách Khoa', 'VNPT IoT'].map((name) => (
              <div key={name} className="text-sm md:text-base font-bold text-muted-foreground whitespace-nowrap">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6">{t('testimonials.sectionTitle')}</h2>
            <p className="text-lg text-muted-foreground">{t('testimonials.sectionSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { quote: t('testimonials.t1.quote'), name: t('testimonials.t1.name'), role: t('testimonials.t1.role'), initial: 'M' },
              { quote: t('testimonials.t2.quote'), name: t('testimonials.t2.name'), role: t('testimonials.t2.role'), initial: 'H' },
              { quote: t('testimonials.t3.quote'), name: t('testimonials.t3.name'), role: t('testimonials.t3.role'), initial: 'L' },
            ].map((item, idx) => (
              <div key={idx} className="relative rounded-3xl border border-border bg-card p-8 hover:border-primary/30 hover:-translate-y-1 transition-all">
                <Quote size={32} className="text-primary/20 mb-4" />
                <p className="text-sm leading-relaxed text-muted-foreground mb-8 font-medium italic">&ldquo;{item.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-black">{item.initial}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="relative rounded-[3rem] bg-slate-900 overflow-hidden p-8 md:p-16 text-center text-white">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary blur-[100px] rounded-full" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 blur-[100px] rounded-full" />
            </div>
            {/* GPS corner markers */}
            <div className="absolute top-6 left-6 text-[10px] font-mono text-slate-500 hidden md:block text-left leading-relaxed">
              GPS COORD.<br />LAT: 16.0471° N<br />LON: 108.2062° E
            </div>
            <div className="absolute top-6 right-6 text-[10px] font-mono text-slate-500 hidden md:block text-right leading-relaxed">
              SYSTEM STATUS<br /><span className="text-emerald-400 font-bold">[ONLINE]</span><br />DATA FLOW: OPTIMAL
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-4 relative z-10 leading-tight">
              {t('landing.ctaTitle1')}<br />
              <span className="text-primary">{t('landing.ctaTitle2')}</span>
            </h2>
            <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto font-medium relative z-10">
              {t('landing.ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl">
                  {t('landing.ctaPrimary')}
                  <ArrowRight size={20} className="ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button variant="ghost" size="lg" className="w-full h-14 px-10 rounded-2xl border border-white/20 text-white font-bold text-lg hover:bg-white/10">
                  {t('landing.ctaSecondary')}
                </Button>
              </Link>
            </div>
            <p className="text-xs text-slate-600 mt-8 font-mono relative z-10">
              {t('landing.ctaFooter')}
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
