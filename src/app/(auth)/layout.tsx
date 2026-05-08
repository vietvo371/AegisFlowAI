'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ShieldCheck, Zap, Users, Globe } from 'lucide-react';
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

      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative bg-primary flex-col justify-between p-10 xl:p-14 overflow-hidden shrink-0">
        <div className="absolute inset-0">
          <Image src="/signin-bg.png" alt="" fill className="object-cover opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-indigo-900" />
        </div>

        <Link href="/" className="relative z-10 flex items-center gap-3 group w-fit">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center group-hover:bg-white/25 transition-colors">
            <Image src="/images/logo.png" alt="AegisFlow" width={28} height={28} className="object-contain" />
          </div>
          <span className="text-white text-xl font-black tracking-tight">AegisFlow AI</span>
        </Link>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
            {t('layoutTitle')}<br />
            <span className="text-white/70">{t('layoutTitleAccent')}</span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-sm">
            {t('layoutDesc')}
          </p>

          <div className="space-y-3 pt-2">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-white/80" />
                </div>
                <span className="text-white/70 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-8 pt-8 border-t border-white/10">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-0.5">{s.label}</div>
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
