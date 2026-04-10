'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Zap, 
  Globe, 
  Bell, 
  Navigation, 
  Users,
  LineChart,
  Map as MapIcon
} from 'lucide-react';

export default function LandingPage() {
  const t = useTranslations();

  const stats = [
    { label: t('stats.accuracyLabel'), value: t('stats.accuracy'), icon: Activity },
    { label: t('stats.alertTimeLabel'), value: t('stats.alertTime'), icon: Zap },
    { label: t('stats.protectedLabel'), value: t('stats.protected'), icon: Users },
    { label: t('stats.uptimeLabel'), value: t('stats.uptime'), icon: ShieldCheck },
  ];

  const features = [
    { 
      title: t('features.flood.title'), 
      desc: t('features.flood.desc'), 
      icon: LineChart,
      color: 'bg-blue-500/10 text-blue-600'
    },
    { 
      title: t('features.map.title'), 
      desc: t('features.map.desc'), 
      icon: MapIcon,
      color: 'bg-emerald-500/10 text-emerald-600'
    },
    { 
      title: t('features.evacuation.title'), 
      desc: t('features.evacuation.desc'), 
      icon: Navigation,
      color: 'bg-purple-500/10 text-purple-600'
    },
    { 
      title: t('features.alert.title'), 
      desc: t('features.alert.desc'), 
      icon: Bell,
      color: 'bg-orange-500/10 text-orange-600'
    },
    { 
      title: t('features.relief.title'), 
      desc: t('features.relief.desc'), 
      icon: Users,
      color: 'bg-indigo-500/10 text-indigo-600'
    },
    { 
      title: t('features.analytics.title'), 
      desc: t('features.analytics.desc'), 
      icon: Activity,
      color: 'bg-rose-500/10 text-rose-600'
    },
  ];

  return (
    <div className="flex flex-col overflow-hidden">
      {/* ── Hero Section ── */}
      <section className="relative pt-10 pb-20 lg:pt-20 lg:pb-32">
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full opacity-50" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-500/10 blur-[120px] rounded-full opacity-50" />
        </div>

        <div className="container px-4 md:px-6 mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8 animate-fade-in-up">
            <ShieldCheck size={14} />
            <span>{t('hero.badge')}</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 animate-fade-in-up delay-1">
            {t('hero.title1')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">
              {t('hero.title2')}
            </span>
          </h1>

          {/* Subtext */}
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-10 animate-fade-in-up delay-2 leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-in-up delay-3">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 px-10 rounded-2xl bg-primary hover:bg-primary-700 text-white font-bold text-lg shadow-xl shadow-primary/20 group animate-pulse-light">
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

          {/* Image Preview */}
          <div className="relative max-w-5xl mx-auto animate-fade-in-up delay-4">
            <div className="relative rounded-3xl overflow-hidden border-8 border-background/50 shadow-2xl shadow-primary/10 bg-muted">
              <div className="aspect-[16/9] relative">
                <Image 
                  src="/dashboard-preview.png" 
                  alt="AegisFlow Dashboard Preview" 
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  priority
                />
              </div>
              
              {/* Floating Element Overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
            </div>
            
            {/* Decals */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-card rounded-3xl border border-border p-6 shadow-2xl hidden lg:flex flex-col justify-between items-start animate-float">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Zap size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">{t('hero.realtime')}</div>
                <div className="text-xl font-black">99.9%</div>
              </div>
            </div>
            
            <div className="absolute -bottom-8 -left-8 w-48 h-24 bg-card rounded-2xl border border-border p-5 shadow-2xl hidden lg:flex items-center gap-4 animate-float delay-2" style={{ animationDelay: '1.5s' }}>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Globe size={24} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">{t('hero.coverage')}</div>
                <div className="text-sm font-bold">Đà Nẵng</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-6 rounded-3xl bg-background border border-border shadow-sm hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <stat.icon size={24} />
                </div>
                <div className="text-3xl font-black mb-1">{stat.value}</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest leading-tight">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6">
              {t('features.sectionTitle')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('features.sectionSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="border border-border bg-card/50 backdrop-blur-sm overflow-hidden hover:border-primary/50 transition-all hover:-translate-y-2 group">
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.color}`}>
                    <feature.icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA Section ── */}
      <section className="py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="relative rounded-[3rem] bg-primary overflow-hidden p-8 md:p-16 text-center text-white">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white blur-[100px] rounded-full" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white blur-[100px] rounded-full" />
            </div>

            <h2 className="text-3xl md:text-5xl font-black mb-8 relative z-10">
              Sẵn sàng bảo vệ cộng đồng <br className="hidden md:block" />
              trước thiên tai?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-10 max-w-2xl mx-auto font-medium relative z-10">
              Gia nhập AegisFlow AI ngay hôm nay để truy cập hệ thống giám sát và dự báo ngập lụt hiện đại nhất tại Việt Nam.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-14 px-10 rounded-2xl bg-white text-primary hover:bg-white/90 font-bold text-lg shadow-xl shadow-black/10">
                  {t('common.signup')}
                </Button>
              </Link>
              <Link href="/contact" className="w-full sm:w-auto">
                <Button variant="ghost" size="lg" className="w-full h-14 px-10 rounded-2xl border border-white/30 text-white font-bold text-lg hover:bg-white/10">
                  {t('common.contact')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
