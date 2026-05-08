'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { FileText, User, Database, ShieldAlert, RefreshCw, Scale, Globe } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function TermsPage() {
  const t = useTranslations('terms');

  const sections = [
    { icon: FileText, title: t('usage.title'), content: t('usage.content') },
    { icon: User, title: t('account.title'), content: t('account.content') },
    { icon: Database, title: t('data.title'), content: t('data.content') },
    { icon: ShieldAlert, title: t('liability.title'), content: t('liability.content') },
    { icon: RefreshCw, title: t('changes.title'), content: t('changes.content') },
    { icon: Scale, title: t('law.title'), content: t('law.content') },
  ];

  return (
    <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 max-w-4xl animate-fade-in-up">
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground font-medium">{t('lastUpdated')}</p>
      </div>

      <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-12">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-lg leading-relaxed text-muted-foreground font-medium italic border-l-4 border-primary pl-6 py-2">
            &ldquo;{t('intro')}&rdquo;
          </p>
        </div>

        <Separator className="bg-border/50" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <section.icon size={24} />
              </div>
              <h3 className="text-xl font-bold">{section.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm font-medium">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <Separator className="bg-border/50" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
              Vietnamese Law
            </div>
            <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
              Da Nang Jurisdiction
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
            <Globe size={14} />
            AegisFlow Legal Team
          </p>
        </div>
      </div>
    </div>
  );
}
