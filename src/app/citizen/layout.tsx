'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Home, Bell, AlertTriangle, MapPin, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LocaleToggle } from '@/components/theme/locale-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageTransition } from '@/components/ui/page-transition';
import { ToasterProvider } from '@/components/ui/toaster-provider';
import NotificationPanel from '@/components/citizen/NotificationPanel';
import { useNotifications } from '@/hooks/useNotifications';

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = React.useState(false);

  React.useEffect(() => {
    if (!loading && user && user.role !== 'citizen') router.replace('/dashboard');
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

  if (!user) { router.replace('/signin'); return null; }

  const navItems = [
    { href: '/citizen',          icon: Home,          label: t('common.dashboard'),          sos: false },
    { href: '/citizen/sos',      icon: AlertTriangle, label: 'SOS',                          sos: true  },
    { href: '/citizen/map',      icon: MapPin,        label: t('citizen.map.title'),          sos: false },
    { href: '/citizen/shelters', icon: Building2,     label: t('dashboard.pages.shelters'),   sos: false },
    { href: '/citizen/profile',  icon: User,          label: t('citizen.profile.title'),      sos: false },
  ];

  const isActive = (href: string) => href === '/citizen' ? pathname === '/citizen' : pathname.startsWith(href);
  const isMapPage = pathname === '/citizen/map';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ToasterProvider />

      {/* ── Header ── */}
      {!isMapPage && (
        <header
          className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg border-b border-border shrink-0"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="px-4 h-14 flex items-center justify-between">
            <Link href="/citizen" className="flex items-center gap-2 group">
              <div className="relative w-9 h-9 group-hover:scale-110 transition-transform flex items-center justify-center shrink-0">
                <Image src="/images/logo.png" alt="AegisFlow AI Logo" width={512} height={512}
                  className="object-contain w-full h-full drop-shadow-sm" priority />
              </div>
              <span className="text-base font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                AegisFlow <span className="text-primary">AI</span>
              </span>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">Citizen</span>
            </Link>

            <div className="flex items-center gap-1">
              {/* Bell */}
              <div className="relative">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowNotifications(v => !v)}>
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50">
                      <NotificationPanel onClose={() => setShowNotifications(false)} />
                    </div>
                  </>
                )}
              </div>
              <ThemeToggle />
              <LocaleToggle />
              <Link href="/citizen/profile">
                <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-primary/30 transition-all">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* ── Main content ── */}
      <main className={`flex-1 ${!isMapPage ? 'pb-20' : ''}`}>
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      {/* ── Bottom nav ── */}
      {!isMapPage && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-t border-border"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex justify-around">
            {navItems.map((item) => {
              const active = isActive(item.href);

              // SOS — special center button
              if (item.sos) {
                return (
                  <Link key={item.href} href={item.href}
                    className="flex flex-col items-center justify-center py-2 px-3 -mt-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                      active
                        ? 'bg-red-600 scale-110'
                        : 'bg-red-500 hover:bg-red-600 hover:scale-105'
                    }`}>
                      <item.icon size={22} className="text-white" />
                    </div>
                    <span className="text-[9px] font-bold text-red-500 mt-0.5">SOS</span>
                  </Link>
                );
              }

              return (
                <Link key={item.href} href={item.href}
                  className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                  <div className={`relative p-1.5 rounded-xl transition-all ${active ? 'bg-primary/10' : ''}`}>
                    <item.icon size={20} />
                    {active && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className={`text-[10px] mt-0.5 truncate max-w-[52px] text-center ${active ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
