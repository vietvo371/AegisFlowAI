'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home, Bell, Settings, LogOut, Menu, MapPin, Phone,
  Users, Truck, CheckCircle, Clock, AlertTriangle, HeartPulse
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LocaleToggle } from '@/components/theme/locale-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { PageTransition } from '@/components/ui/page-transition';
import { ToasterProvider } from '@/components/ui/toaster-provider';

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [requestCount, setRequestCount] = React.useState(0);

  React.useEffect(() => {
    if (!loading && user && user.role !== 'rescue_team') {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  React.useEffect(() => {
    const handler = () => setRequestCount(c => c + 1);
    window.addEventListener('aegis:rescue_request:created', handler);
    return () => window.removeEventListener('aegis:rescue_request:created', handler);
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
    { href: '/team', icon: Home, label: 'Trang chủ' },
    { href: '/team/requests', icon: HeartPulse, label: 'Yêu cầu' },
    { href: '/team/assigned', icon: Truck, label: 'Đã tiếp nhận' },
    { href: '/team/updates', icon: Bell, label: 'Cập nhật' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-950">
      <ToasterProvider />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/team" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <Image src="/images/logo.png" alt="AegisFlow" width={512} height={512} className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold">AegisFlow</span>
            <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Rescue Team</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/team/requests" className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <HeartPulse size={20} />
                {requestCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {requestCount > 9 ? '9+' : requestCount}
                  </span>
                )}
              </Button>
            </Link>
            <ThemeToggle />
            <LocaleToggle />
            <Avatar className="h-8 w-8">
              {user.avatar_url && <AvatarImage src={user.avatar_url} />}
              <AvatarFallback className="bg-orange-500 text-white text-sm">
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
              className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-orange-600 transition-colors"
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
