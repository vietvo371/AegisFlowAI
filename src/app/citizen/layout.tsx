'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home, Bell, Settings, LogOut, Menu, AlertTriangle, HeartPulse,
  MapPin, Phone, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LocaleToggle } from '@/components/theme/locale-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { PageTransition } from '@/components/ui/page-transition';

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [notificationCount, setNotificationCount] = React.useState(0);

  React.useEffect(() => {
    if (!loading && user && user.role !== 'citizen') {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  React.useEffect(() => {
    const handler = () => setNotificationCount(c => c + 1);
    window.addEventListener('aegis:alert:created', handler);
    window.addEventListener('aegis:incident:created', handler);
    return () => {
      window.removeEventListener('aegis:alert:created', handler);
      window.removeEventListener('aegis:incident:created', handler);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.replace('/signin');
    return null;
  }

  const navItems = [
    { href: '/citizen', icon: Home, label: t('common.dashboard') },
    { href: '/citizen/sos', icon: HeartPulse, label: 'Khu vực SOS' },
    { href: '/citizen/alerts', icon: Bell, label: t('common.notifications') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/citizen" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Image src="/images/logo.png" alt="AegisFlow" width={512} height={512} className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold">AegisFlow</span>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Citizen</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Button>
            <ThemeToggle />
            <LocaleToggle />
            <Avatar className="h-8 w-8">
              {user.avatar_url && <AvatarImage src={user.avatar_url} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 safe-area-bottom">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24 lg:pb-6">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
