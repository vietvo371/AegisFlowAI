'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  Globe,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const t = useTranslations('contact');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsLoading(false);
    toast.success(t('toastSuccess'));
  };

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email — Team Leader',
      value: 'nguyentxuannhi2@dtu.edu.vn',
      sub: 'Nguyễn Thị Xuân Nhi',
      href: 'mailto:nguyentxuannhi2@dtu.edu.vn',
    },
    {
      icon: Phone,
      label: 'WhatsApp — Team Leader',
      value: '0764 619 941',
      sub: 'Nguyễn Thị Xuân Nhi',
      href: 'tel:0764619941',
    },
    {
      icon: MapPin,
      label: 'Trường đại học',
      value: 'Đại học Duy Tân',
      sub: 'Đà Nẵng, Việt Nam',
      href: undefined,
    },
    {
      icon: Clock,
      label: 'Demo trực tiếp',
      value: 'aegis-flow-ai.vercel.app',
      sub: 'Hệ thống đang chạy live',
      href: 'https://aegis-flow-ai.vercel.app',
    },
  ];

  return (
    <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left: Info */}
        <div className="space-y-12">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              {t('title')}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              {t('subtitle')}
            </p>
          </div>

          <div className="space-y-6">
            {contactInfo.map((item, idx) => {
              const inner = (
                <div key={idx} className="flex gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                    <item.icon size={22} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      {item.label}
                    </div>
                    <div className="text-base font-bold group-hover:text-primary transition-colors">{item.value}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{item.sub}</div>
                  </div>
                </div>
              );
              return item.href ? (
                <a key={idx} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                  {inner}
                </a>
              ) : <React.Fragment key={idx}>{inner}</React.Fragment>;
            })}
          </div>

          {/* Team members */}
          <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                {t('teamBadge')}
              </div>
            </div>
            {[
              { name: 'Nguyễn Thị Xuân Nhi', role: 'Team Leader', email: 'nguyentxuannhi2@dtu.edu.vn', phone: '0764619941' },
              { name: 'Phạm Ngọc Hải', role: 'Developer', email: 'pnh02042006@gmail.com', phone: '0785318586' },
              { name: 'Nguyễn Thị Thanh Thủy', role: 'Developer', email: 'nttthuy1403@gmail.com', phone: '0856578543' },
              { name: 'Nguyễn Văn Nhân', role: 'Developer', email: 'vannhan130504@gmail.com', phone: '0394425076' },
            ].map((m, i) => (
              <div key={i} className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-bold">{m.name}</p>
                  <p className="text-xs text-primary font-semibold">{m.role}</p>
                </div>
                <div className="text-right space-y-1">
                  <a href={`mailto:${m.email}`} className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Mail size={11} />
                    <span>{m.email}</span>
                  </a>
                  <a href={`tel:${m.phone}`} className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Phone size={11} />
                    <span>{m.phone}</span>
                  </a>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              {t('mentorLabel')}: <strong>Nguyễn Quốc Long</strong> — quoclongdng@gmail.com · 0905523543
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <div>
          <div className="p-6 md:p-10 rounded-3xl bg-card border border-border shadow-2xl relative">
            <div className="absolute top-[-20px] left-10 p-4 rounded-2xl bg-primary text-white shadow-xl animate-float">
              <MessageSquare size={24} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    {t('firstName')}
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Nguyễn"
                    className="h-12 rounded-xl bg-muted/30 border-border focus:bg-background transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    {t('lastName')}
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Văn A"
                    className="h-12 rounded-xl bg-muted/30 border-border focus:bg-background transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  {t('email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="h-12 rounded-xl bg-muted/30 border-border focus:bg-background transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  {t('message')}
                </Label>
                <Textarea
                  id="message"
                  placeholder={t('messagePlaceholder')}
                  className="min-h-[150px] rounded-xl bg-muted/30 border-border focus:bg-background transition-colors resize-none p-4"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 text-lg group"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {t('send')}
                    <Send className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={20} />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
