'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('common');

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Image/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/signin-bg.png" 
            alt="AegisFlow Auth Backdrop" 
            fill
            className="object-cover opacity-20"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-indigo-900/90" />
        </div>

        <div className="relative z-10 w-full max-w-md text-white">
          <Link href="/" className="inline-flex items-center gap-2 mb-12 group">
            <div className="w-12 h-12 rounded-2xl bg-white text-primary flex items-center justify-center shadow-2xl">
              <ShieldCheck size={28} />
            </div>
            <span className="text-3xl font-black tracking-tighter">AegisFlow AI</span>
          </Link>

          <h1 className="text-5xl font-black leading-[1.1] mb-6 tracking-tight animate-fade-in-up">
            Bảo vệ cộng đồng <br /> với Trí tuệ Nhân tạo.
          </h1>
          <p className="text-xl text-primary-foreground/70 font-medium leading-relaxed animate-fade-in-up delay-1">
            Gia nhập mạng lưới giám sát thiên tai thông minh nhất Việt Nam để nhận cảnh báo sớm và hỗ trợ cứu hộ kịp thời.
          </p>

          <div className="mt-16 pt-12 border-t border-white/10 flex items-center gap-10 opacity-60 animate-fade-in-up delay-2">
            <div>
              <div className="text-2xl font-black">500K+</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">Protected lives</div>
            </div>
            <div>
              <div className="text-2xl font-black">94.7%</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">AI Accuracy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 bg-background relative">
        <div className="absolute top-8 left-8 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight">AegisFlow</span>
          </Link>
        </div>

        <div className="absolute top-8 right-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="font-bold text-xs gap-2 rounded-full">
              <ArrowLeft size={14} />
              {t('back')}
            </Button>
          </Link>
        </div>

        <main className="w-full max-w-md animate-fade-in-up">
          {children}
        </main>

        <footer className="mt-auto pt-8 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
          © {new Date().getFullYear()} AegisFlow AI. Secure Infrastructure.
        </footer>
      </div>
    </div>
  );
}
