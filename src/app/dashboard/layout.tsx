'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, Bell, Settings, LogOut, Search, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LocaleToggle } from '@/components/theme/locale-toggle';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <Image src="/images/logo.png" alt="AegisFlow" width={512} height={512} className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight">AegisFlow</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-semibold">
            <LayoutDashboard size={20} />
            {t('common.dashboard')}
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            {t('nav.liveMap')}
          </Link>
          <Link href="/#features" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
            <div className="w-5 h-5 flex items-center justify-center">
              <Image src="/images/logo.png" alt="" width={512} height={512} className="w-full h-full object-contain" />
            </div>
            {t('nav.solutions')}
          </Link>
          <Link href="/notifications" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
            <Bell size={20} />
            {t('common.notifications')}
          </Link>
          <Link href="/contact" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
            <User size={20} />
            {t('common.contact')}
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all mb-1">
            <Settings size={20} />
            {t('common.settings')}
          </Link>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-3">
            <LogOut size={20} />
            {t('common.logout')}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-card border-b border-border z-10 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu Trigger */}
            <Sheet>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
                <Menu size={20} />
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                <div className="p-6">
                  <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Image src="/images/logo.png" alt="AegisFlow" width={512} height={512} className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">AegisFlow</span>
                  </Link>
                </div>
                <nav className="px-4 py-4 space-y-1">
                  <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-semibold">
                    <LayoutDashboard size={20} />
                    {t('common.dashboard')}
                  </Link>
                  <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground transition-all">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    {t('nav.liveMap')}
                  </Link>
                  <Link href="/#features" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground transition-all">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <Image src="/images/logo.png" alt="" width={512} height={512} className="w-full h-full object-contain" />
                    </div>
                    {t('nav.solutions')}
                  </Link>
                  <Link href="/notifications" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground transition-all">
                    <Bell size={20} />
                    {t('common.notifications')}
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>

            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder={t('common.search')} 
                className="pl-10 h-10 bg-muted/60 border-transparent focus:bg-background transition-colors rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="flex items-center gap-1">
              <LocaleToggle />
              <ThemeToggle />
            </div>
            
            <div className="h-4 w-px bg-border mx-1" />

            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">VV</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-auto relative">
          {children}
        </main>
      </div>
    </div>
  );
}
