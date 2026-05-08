'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ShieldCheck, Zap, Users, Globe, Star, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';

const STATS = [
  { value: '98.8%', label: 'AI Accuracy' },
  { value: '< 1s', label: 'Alert Time' },
  { value: '500K+', label: 'Protected' },
];

const FEATURE_ICONS = [Zap, Users, Globe, ShieldCheck];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('auth');

  const features = [
    { icon: FEATURE_ICONS[0], text: t('layoutFeat1') },
    { icon: FEATURE_ICONS[1], text: t('layoutFeat2') },
    { icon: FEATURE_ICONS[2], text: t('layoutFeat3') },
    { icon: FEATURE_ICONS[3], text: t('layoutFeat4') },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* Left branding panel — premium glassmorphism design */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative flex-col justify-between p-10 xl:p-14 overflow-hidden shrink-0">
        {/* Layered background — light/warm tone */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.06),transparent_50%)]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h60v60H0z\' fill=\'none\' stroke=\'%236366f1\' stroke-width=\'.5\'/%3E%3C/svg%3E")' }} />
        {/* Floating orbs */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-32 left-10 w-56 h-56 bg-violet-200/25 rounded-full blur-3xl" />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3 group w-fit">
          <div className="w-11 h-11 rounded-2xl bg-white border border-indigo-100 shadow-md shadow-indigo-100/50 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-indigo-200/50 transition-all duration-300">
            <Image src="/images/logo.png" alt="AegisFlow" width={26} height={26} className="object-contain" />
          </div>
          <span className="text-slate-800 text-xl font-black tracking-tight">AegisFlow AI</span>
        </Link>

        {/* Main content area */}
        <div className="relative z-10 space-y-8">
          {/* Hero heading */}
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-[2.75rem] font-black text-slate-800 leading-[1.1] tracking-tight">
              {t('layoutTitle')}
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                {t('layoutTitleAccent')}
              </span>
            </h1>
            <p className="text-slate-500 text-[15px] leading-relaxed max-w-sm">
              {t('layoutDesc')}
            </p>
          </div>

          {/* Feature cards — glassmorphism grid */}
          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="group/card px-4 py-3.5 rounded-2xl bg-white/60 border border-indigo-100/60 shadow-sm hover:bg-white/80 hover:shadow-md hover:border-indigo-200/60 transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 border border-indigo-200/50 flex items-center justify-center shrink-0 group-hover/card:bg-indigo-200/70 transition-colors">
                    <Icon size={15} className="text-indigo-600" />
                  </div>
                  <span className="text-slate-600 text-[13px] font-medium leading-snug pt-1">{text}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial card */}
          <div className="rounded-2xl bg-white/60 border border-indigo-100/60 shadow-sm p-5">
            <Quote size={18} className="text-indigo-300 mb-3" />
            <p className="text-slate-500 text-sm leading-relaxed italic">
              &ldquo;AegisFlow AI has transformed how we handle flood emergencies. Response times dropped by 60%.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                DT
              </div>
              <div>
                <p className="text-slate-700 text-sm font-semibold">Da Nang City</p>
                <p className="text-slate-400 text-xs">Emergency Management</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="fill-amber-400/80 text-amber-400/80" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 flex items-center gap-8 pt-8 border-t border-indigo-100/60">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-2xl font-black text-slate-800">{s.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 bg-background">
        <div className="flex items-center justify-between px-4 sm:px-8 py-4 shrink-0">
          <Link href="/" className="flex items-center gap-2 lg:invisible">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Image src="/images/logo.png" alt="AegisFlow" width={20} height={20} className="object-contain" />
            </div>
            <span className="font-black text-base tracking-tight">AegisFlow</span>
          </Link>

          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle />
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-bold rounded-full text-muted-foreground">
                <ArrowLeft size={13} />
                {t('homePage')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-6 overflow-y-auto">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        <div className="px-4 sm:px-8 py-4 text-center shrink-0">
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} AegisFlow AI
          </p>
        </div>
      </div>

    </div>
  );
}
