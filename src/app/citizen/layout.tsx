'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  Home, Bell, AlertTriangle, MapPin, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LocaleToggle } from '@/components/theme/locale-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageTransition } from '@/components/ui/page-transition';
import { ToasterProvider } from '@/components/ui/toaster-provider';
import NotificationPanel from '@/components/citizen/NotificationPanel';
import { useNotifications } from '@/hooks/useNotifications';

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = React.useState(false);

  React.useEffect(() => {
    if (!loading && user && user.role !== 'citizen') {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">{t('common.loading')}</p>
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
    { href: '/citizen/sos', icon: AlertTriangle, label: 'SOS' },
    { href: '/citizen/map', icon: MapPin, label: t('citizen.map.title') },
    { href: '/citizen/shelters', icon: Building2, label: t('dashboard.pages.shelters') },
  ];

  const isActive = (href: string) => {
    if (href === '/citizen') return pathname === '/citizen';
    return pathname.startsWith(href);
  };

  // Map page có header & bottom nav riêng (position: fixed)
  const isMapPage = pathname === '/citizen/map';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 flex flex-col">
      <ToasterProvider />
      {/* Header */}
      {!isMapPage && (
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border shadow-sm shrink-0">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/citizen" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Image src="/images/logo.png" alt="AegisFlow" width={512} height={512} className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold">AegisFlow</span>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Citizen</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(v => !v)}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  {/* Panel */}
                  <div className="absolute right-0 top-full mt-2 z-50">
                    <NotificationPanel onClose={() => setShowNotifications(false)} />
                  </div>
                </>
              )}
            </div>
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
      )}

      {/* Mobile Navigation */}
      {!isMapPage && (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 safe-area-bottom shrink-0">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {active ? (
                  <div className="relative">
                    <item.icon size={20} className="text-primary" />
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  </div>
                ) : (
                  <item.icon size={20} />
                )}
                <span className={`text-[10px] font-medium ${active ? 'text-primary font-bold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
