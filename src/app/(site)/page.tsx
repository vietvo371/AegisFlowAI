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
import { TechMarquee } from '@/components/landing/TechMarquee';

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
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="aurora-bg"></div>
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{ transform: 'none' }}>
          <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[70vw] h-[70vw] lg:w-[40vw] lg:h-[40vw] bg-emerald-500/10 rounded-full blur-[120px] dark:mix-blend-screen" />
          <div className="absolute top-[40%] left-[30%] w-[50vw] h-[50vw] bg-blue-500/10 rounded-full blur-[100px] dark:mix-blend-screen" />
          <div className="absolute top-[10%] right-[20%] w-[40vw] h-[40vw] bg-purple-500/10 rounded-full blur-[100px] dark:mix-blend-screen" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        </div>
        <div className="relative z-10 container max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 uppercase tracking-widest backdrop-blur-md animate-glow-pulse">
            <Zap size={16} className="text-emerald-400" />
            <span>{t('hero.badge')}</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-[84px] font-extrabold tracking-tight font-heading leading-tight md:leading-[1.1] animate-fade-in-up">
            <span className="text-foreground block mb-2">{t('hero.title1')}</span>
            <span className="text-gradient-animated">
              {t('hero.title2')}
            </span>
          </h1>
          <p className="mt-8 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground font-medium leading-relaxed animate-fade-in-up delay-1">
            {t('hero.subtitle')}
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5 animate-fade-in-up delay-2">
            <div className="magnetic-btn">
              <Link href="/dashboard">
                <Button type="button" className="shimmer-btn group inline-flex shrink-0 items-center justify-center gap-1.5 h-14 px-10 text-base font-bold bg-foreground text-background border-none hover:opacity-90 transition-all rounded-full shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] animate-glow-pulse cursor-pointer">
                  {t('hero.ctaPrimary')}
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <div className="magnetic-btn">
              <Link href="#features">
                <Button variant="outline" className="w-full sm:w-auto px-10 h-14 rounded-full bg-secondary/50 hover:bg-secondary border border-border font-bold tracking-wide transition-all backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer text-base">
                  {t('hero.ctaSecondary')}
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Dashboard Preview 3D */}
          <div className="mt-24 mb-16 relative max-w-5xl mx-auto group animate-fade-in-up delay-3 [perspective:2000px] z-20">
            <div className="relative rounded-3xl overflow-hidden border border-border shadow-[0_0_100px_-20px_rgba(59,130,246,0.3)] transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] [transform:rotateX(12deg)_scale(0.95)] group-hover:[transform:rotateX(0deg)_scale(1)] bg-slate-900/50">
              <div className="aspect-[1904/849] relative">
                <Image 
                  src="/dashboard-preview.png" 
                  alt="AegisFlow Dashboard Preview" 
                  fill 
                  className="object-cover transition-opacity" 
                  sizes="(max-width: 1024px) 100vw, 1024px" 
                  priority 
                  quality={100}
                  unoptimized={true}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none" />
            </div>
            
            {/* Glow cast shadow under the dashboard */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-20 bg-primary/40 blur-[100px] rounded-[100%] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
            
            {/* Floating UI Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-card/80 backdrop-blur-xl rounded-3xl border border-border p-6 shadow-2xl hidden lg:flex flex-col justify-between items-start animate-float transform transition-transform duration-700 group-hover:scale-110">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Zap size={20} /></div>
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">SYSTEM STATUS</div>
                <div className="text-sm font-black text-emerald-500 animate-pulse">[ONLINE]</div>
              </div>
            </div>
            <div className="absolute -bottom-8 -left-8 w-52 h-24 bg-card/80 backdrop-blur-xl rounded-2xl border border-border p-5 shadow-2xl hidden lg:flex items-center gap-4 animate-float transform transition-transform duration-700 group-hover:scale-110" style={{ animationDelay: '1.5s' }}>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600"><Globe size={24} /></div>
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">DATA FLOW</div>
                <div className="text-sm font-bold">OPTIMAL</div>
                <div className="text-[10px] text-muted-foreground">Đà Nẵng Hub</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in-up delay-3">
            {[
              { val: stats[0].value, label: stats[0].label, color: 'text-blue-400' },
              { val: stats[1].value, label: stats[1].label, color: 'text-emerald-400' },
              { val: stats[2].value, label: stats[2].label, color: 'text-purple-400' },
              { val: stats[3].value, label: stats[3].label, color: 'text-amber-400' },
            ].map((s, i) => (
              <div key={i} className="text-center p-4 rounded-2xl bg-secondary/30 border border-border/50 hover:border-border transition-all hover:shadow-lg cursor-default">
                <div className={`text-3xl md:text-4xl font-black font-heading ${s.color}`}>
                  {s.val}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TechMarquee />

      {/* ── 3 Khoảng Trống (Problem Gaps) ── */}
      <section className="py-24 relative overflow-hidden bg-background">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold mb-5 backdrop-blur-md">
              {t('landing.problemBadge')}
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6 font-heading">
              {t('landing.problemTitle')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">{t('landing.problemTitleHighlight')}</span>
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
              <div key={i} className="group relative rounded-3xl border border-red-500/20 hover:border-red-500/50 overflow-hidden bg-card/40 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/20">
                <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-8 space-y-5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                      <card.Icon size={24} />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {t('landing.gapLabel', { tag: card.tag })}
                    </span>
                  </div>
                  <h3 className="text-red-400 text-xl font-black leading-tight font-heading">{card.problem}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 flex items-center justify-center gap-3 text-sm text-muted-foreground relative z-10">
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
              <div className="glowing-border-wrapper group">
                <div className="glowing-inner p-8 bg-card/60 backdrop-blur-xl">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 relative z-10">
                    {t('landing.feat1DiagramTitle')}
                  </p>
                  <div className="relative z-10">
                    <AIEngineDiagram t={t} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Evacuation & Spatial Intelligence */}
        <div className="py-20 border-b border-border bg-muted/20">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 glowing-border-wrapper glowing-border-wrapper-emerald group">
                <div className="glowing-inner p-8 bg-card/60 backdrop-blur-xl">
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 relative z-10">
                    {t('landing.feat2DiagramTitle')}
                  </p>
                  <div className="relative z-10">
                    <EvacuationDiagram t={t} />
                  </div>
                </div>
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
            <div className="glowing-border-wrapper glowing-border-wrapper-indigo group">
              <div className="glowing-inner p-6 md:p-10 bg-card/60 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                <div className="relative z-10">
                  <AutomationTimeline t={t} />
                </div>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Traditional Column */}
            <div className="rounded-3xl border border-border/50 bg-background/60 backdrop-blur-xl p-8 flex flex-col gap-6 opacity-70 scale-95 transition-all duration-500 hover:opacity-100 hover:scale-100 hover:shadow-xl hover:border-border/80">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-muted-foreground">{t('landing.compareColTraditional')}</h3>
              </div>
              <ul className="space-y-6">
                {[
                  { criteria: t('landing.compareRow1Criteria'), desc: t('landing.compareRow1Traditional') },
                  { criteria: t('landing.compareRow2Criteria'), desc: t('landing.compareRow2Traditional') },
                  { criteria: t('landing.compareRow3Criteria'), desc: t('landing.compareRow3Traditional') },
                ].map((item, i) => (
                  <li key={i} className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.criteria}</span>
                    <span className="text-sm text-muted-foreground flex items-start gap-2">
                      <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                      {item.desc}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* AegisFlow Column */}
            <div className="group relative z-10 scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-black px-5 py-1.5 rounded-full uppercase tracking-widest shadow-[0_0_20px_-2px_rgba(16,185,129,0.5)] z-20">
                AegisFlow AI
              </div>
              <div className="glowing-border-wrapper glowing-border-wrapper-emerald h-full shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
                <div className="glowing-inner bg-slate-900 p-8 flex flex-col gap-6 backdrop-blur-2xl h-full">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="text-center mb-4 relative z-10">
                  <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">{t('landing.compareColAegis')}</h3>
                </div>
                <ul className="space-y-6 relative z-10">
                  {[
                    { criteria: t('landing.compareRow1Criteria'), desc: t('landing.compareRow1Aegis') },
                    { criteria: t('landing.compareRow2Criteria'), desc: t('landing.compareRow2Aegis') },
                    { criteria: t('landing.compareRow3Criteria'), desc: t('landing.compareRow3Aegis') },
                  ].map((item, i) => (
                    <li key={i} className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.criteria}</span>
                      <div className="text-sm text-slate-200 flex items-start gap-2 font-medium">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldCheck size={12} className="text-emerald-400" />
                        </div>
                        {item.desc}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            </div>
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
                { num: t('landing.ecoStep1Num'), title: t('landing.ecoStep1Title'), desc: t('landing.ecoStep1Desc'), color: 'text-sky-500', border: 'border-sky-500/30 hover:border-sky-500', shadow: 'hover:shadow-sky-500/20', dot: 'bg-sky-500' },
                { num: t('landing.ecoStep2Num'), title: t('landing.ecoStep2Title'), desc: t('landing.ecoStep2Desc'), color: 'text-indigo-500', border: 'border-indigo-500/30 hover:border-indigo-500', shadow: 'hover:shadow-indigo-500/20', dot: 'bg-indigo-500' },
                { num: t('landing.ecoStep3Num'), title: t('landing.ecoStep3Title'), desc: t('landing.ecoStep3Desc'), color: 'text-red-500', border: 'border-red-500/30 hover:border-red-500', shadow: 'hover:shadow-red-500/20', dot: 'bg-red-500' },
                { num: t('landing.ecoStep4Num'), title: t('landing.ecoStep4Title'), desc: t('landing.ecoStep4Desc'), color: 'text-amber-500', border: 'border-amber-500/30 hover:border-amber-500', shadow: 'hover:shadow-amber-500/20', dot: 'bg-amber-500' },
                { num: t('landing.ecoStep5Num'), title: t('landing.ecoStep5Title'), desc: t('landing.ecoStep5Desc'), color: 'text-emerald-500', border: 'border-emerald-500/30 hover:border-emerald-500', shadow: 'hover:shadow-emerald-500/20', dot: 'bg-emerald-500' },
              ].map((step, idx) => (
                <div key={step.num} className={`group flex gap-4 p-5 rounded-3xl border ${step.border} bg-card/40 backdrop-blur-xl ${step.shadow} hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-up`} style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className={`w-8 h-8 rounded-full ${step.dot} text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-lg group-hover:scale-110 transition-transform`}>
                    {step.num.replace('0', '')}
                  </div>
                  <div>
                    <p className={`font-black text-base ${step.color}`}>{step.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1 font-medium">{step.desc}</p>
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
              <div key={i} className="group rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-8 shadow-lg hover:shadow-2xl hover:border-primary/50 hover:-translate-y-2 transition-all duration-500 space-y-5 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: `${i * 0.2}s` }}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.iconColor} group-hover:scale-110 transition-transform duration-500 relative z-10 shadow-inner`}>
                  <card.Icon size={28} />
                </div>
                <h3 className="font-black text-2xl text-foreground relative z-10 group-hover:text-primary transition-colors">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium relative z-10">{card.desc}</p>
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
              { quote: t('testimonials.t1.quote'), name: t('testimonials.t1.name'), role: t('testimonials.t1.role'), initial: 'M', color: 'from-blue-500/10' },
              { quote: t('testimonials.t2.quote'), name: t('testimonials.t2.name'), role: t('testimonials.t2.role'), initial: 'H', color: 'from-emerald-500/10' },
              { quote: t('testimonials.t3.quote'), name: t('testimonials.t3.name'), role: t('testimonials.t3.role'), initial: 'L', color: 'from-purple-500/10' },
            ].map((item, idx) => (
              <div key={idx} className="group relative rounded-3xl border border-border/50 bg-card/30 backdrop-blur-xl p-8 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${item.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
                
                {/* Shimmer line effect on hover */}
                <div className="absolute top-0 left-[-100%] w-1/2 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent group-hover:left-[200%] transition-all duration-1000 ease-in-out" />
                
                <Quote size={40} className="text-primary/20 mb-6 group-hover:scale-110 group-hover:text-primary/40 transition-all duration-500" />
                <p className="text-base leading-relaxed text-foreground mb-8 font-medium italic relative z-10">&ldquo;{item.quote}&rdquo;</p>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-primary/20 group-hover:border-primary/60 transition-colors">
                      <AvatarFallback className="bg-background text-primary text-lg font-black">{item.initial}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-background rounded-full" />
                  </div>
                  <div>
                    <div className="font-black text-base">{item.name}</div>
                    <div className="text-xs font-bold text-primary tracking-wide uppercase">{item.role}</div>
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
                <Button size="lg" className="shimmer-btn w-full h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] animate-glow-pulse border-none">
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
