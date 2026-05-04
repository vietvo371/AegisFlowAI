'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Home, AlertTriangle, MapPin, Building2, Bell, User
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LocaleToggle } from '@/components/theme/locale-toggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationPanel from '@/components/citizen/NotificationPanel';

const CitizenMap = dynamic(() => import('@/components/map/CitizenMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/30">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Đang tải bản đồ...</p>
      </div>
    </div>
  ),
});

export default function CitizenMapPage() {
  const t = useTranslations();
  const { user } = useAuth();
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { href: '/citizen',          icon: Home,          label: t('common.dashboard') },
    { href: '/citizen/sos',      icon: AlertTriangle, label: 'SOS' },
    { href: '/citizen/map',      icon: MapPin,        label: t('citizen.map.title') },
    { href: '/citizen/shelters', icon: Building2,     label: t('dashboard.pages.shelters') },
    { href: '/citizen/profile',  icon: User,          label: t('citizen.profile.title') },
  ];

  const isActive = (href: string) => {
    if (href === '/citizen') return pathname === '/citizen';
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background" style={{ zIndex: 9999 }}>

      {/* Header — đồng bộ với layout */}
      <header className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-b border-border shrink-0 z-10"
        style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}>
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/citizen" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Image src="/images/logo.png" alt="AegisFlow" width={20} height={20} className="w-5 h-5" />
            </div>
            <span className="text-base font-bold">AegisFlow</span>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Citizen</span>
          </Link>

          <div className="flex items-center gap-1">
            {/* Notification Bell — functional */}
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setShowNotifications(v => !v)}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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

            <Avatar className="h-8 w-8">
              {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <CitizenMap />
      </div>

      {/* Bottom nav — đồng bộ với layout */}
      <nav className="bg-white dark:bg-zinc-900 border-t border-border shrink-0 z-10"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${active ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                {active ? (
                  <div className="relative">
                    <item.icon size={20} className="text-primary" />
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  </div>
                ) : (
                  <item.icon size={20} />
                )}
                <span className={`text-[10px] font-medium ${active ? 'font-bold' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
