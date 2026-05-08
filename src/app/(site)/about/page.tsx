'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ShieldCheck,
  Lightbulb,
  Heart,
  Eye,
  Target,
  Telescope,
  Code2,
  Database,
  Brain,
  Smartphone,
  Server,
  Wifi,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function AboutPage() {
  const t = useTranslations('about');

  const values = [
    { icon: ShieldCheck, title: t('valueSafety'), desc: t('valueSafetyDesc'), color: 'bg-emerald-500/10 text-emerald-600' },
    { icon: Lightbulb, title: t('valueInnovation'), desc: t('valueInnovationDesc'), color: 'bg-amber-500/10 text-amber-600' },
    { icon: Heart, title: t('valueCommunity'), desc: t('valueCommunityDesc'), color: 'bg-rose-500/10 text-rose-600' },
    { icon: Eye, title: t('valueTransparency'), desc: t('valueTransparencyDesc'), color: 'bg-blue-500/10 text-blue-600' },
  ];

  const team = [
    { name: 'Văn Việt', role: 'Full-stack Developer & AI Lead', initial: 'V' },
    { name: 'Minh Tuấn', role: 'Backend Engineer', initial: 'T' },
    { name: 'Thanh Hà', role: 'Frontend Developer', initial: 'H' },
    { name: 'Quốc Bảo', role: 'IoT & Sensor Engineer', initial: 'B' },
  ];

  const techStack = [
    { icon: Code2, name: 'Next.js 16', desc: 'Frontend' },
    { icon: Server, name: 'Laravel 13', desc: 'Backend API' },
    { icon: Brain, name: 'FastAPI + AI', desc: 'ML Service' },
    { icon: Database, name: 'MySQL + Redis', desc: 'Data Layer' },
    { icon: Wifi, name: 'IoT Sensors', desc: 'Real-time Data' },
    { icon: Smartphone, name: 'React Native', desc: 'Mobile App' },
  ];

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6 mx-auto text-center max-w-4xl animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">{t('title')}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-12">{t('subtitle')}</p>
          <blockquote className="text-xl md:text-2xl font-bold italic text-primary border-l-4 border-primary pl-6 text-left max-w-2xl mx-auto">
            &ldquo;{t('quote')}&rdquo;
          </blockquote>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border border-border bg-card overflow-hidden hover:-translate-y-1 transition-all group">
              <CardContent className="p-8 md:p-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <Target size={28} />
                </div>
                <h2 className="text-2xl font-black mb-4">{t('missionTitle')}</h2>
                <p className="text-muted-foreground leading-relaxed">{t('missionDesc')}</p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card overflow-hidden hover:-translate-y-1 transition-all group">
              <CardContent className="p-8 md:p-10">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                  <Telescope size={28} />
                </div>
                <h2 className="text-2xl font-black mb-4">{t('visionTitle')}</h2>
                <p className="text-muted-foreground leading-relaxed">{t('visionDesc')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-center mb-16">{t('valuesTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${v.color}`}>
                  <v.icon size={32} />
                </div>
                <h3 className="text-lg font-bold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator className="bg-border/50" />

      {/* Team */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">{t('teamTitle')}</h2>
            <p className="text-lg text-muted-foreground">{t('teamSubtitle')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {team.map((member, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <Avatar className="h-20 w-20 mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">
                    {member.initial}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-sm">{member.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">{t('techTitle')}</h2>
            <p className="text-lg text-muted-foreground">{t('techSubtitle')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
            {techStack.map((tech, idx) => (
              <Card key={idx} className="border border-border hover:border-primary/50 transition-all hover:-translate-y-1 group">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    <tech.icon size={24} />
                  </div>
                  <div className="font-bold text-sm">{tech.name}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">{tech.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
