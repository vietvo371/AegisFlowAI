'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Bell, Settings, LogOut, Search, User, Menu,
  BarChart3, AlertTriangle, HeartPulse, ShieldAlert, Home, Activity, 
  Megaphone, BrainCircuit, Users, CheckCircle2, Waves
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LocaleToggle } from '@/components/theme/locale-toggle';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { RealtimeListener } from '@/components/realtime/RealtimeListener';
import { PageTransition } from '@/components/ui/page-transition';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await (await import('@/lib/api')).default.get('/alerts', { params: { status: 'active', per_page: 1 } });
        setUnreadCount(res.data?.meta?.total ?? 0);
      } catch { /* silent */ }
    };
    fetchUnread();
    const handler = () => fetchUnread();
    window.addEventListener('aegis:alert:created', handler);
    window.addEventListener('aegis:incident:created', handler);
    window.addEventListener('aegis:rescue_request:created', handler);
    return () => {
      window.removeEventListener('aegis:alert:created', handler);
      window.removeEventListener('aegis:incident:created', handler);
      window.removeEventListener('aegis:rescue_request:created', handler);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <RealtimeListener />
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

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scroll">
          {[
            { href: '/dashboard',                    icon: LayoutDashboard, label: t('common.dashboard') || 'Tổng quan', roles: null },
            { href: '/dashboard/analytics',          icon: BarChart3,       label: 'Thống kê',    roles: null },
            { href: '/dashboard/incidents',          icon: AlertTriangle,   label: 'Sự cố',       roles: null },
            { href: '/dashboard/flood-zones',        icon: Waves,           label: 'Vùng ngập',   roles: null },
            { href: '/dashboard/rescue-requests',    icon: HeartPulse,      label: 'Cứu trợ',     roles: null },
            { href: '/dashboard/rescue-teams',       icon: ShieldAlert,     label: 'Đội cứu hộ',  roles: null },
            { href: '/dashboard/shelters',           icon: Home,            label: 'Tị nạn',      roles: null },
            { href: '/dashboard/sensors',            icon: Activity,        label: 'Cảm biến',    roles: null },
            { href: '/dashboard/alerts',             icon: Megaphone,       label: 'Cảnh báo',    roles: null },
            { href: '/dashboard/predictions',        icon: BrainCircuit,    label: 'AI Dự báo',   roles: null },
            { href: '/dashboard/recommendations',    icon: CheckCircle2,    label: 'Đề xuất AI',  roles: null },
            { href: '/dashboard/admin/users',        icon: Users,           label: 'Nhân sự',     roles: ['city_admin'] },
          ].filter(item => !item.roles || item.roles.includes(user?.role ?? '')).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-bold' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <div className={`transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-sm tracking-tight">{item.label}</span>
                {isActive && (
                   <motion.div 
                     layoutId="active-nav-indicator" 
                     className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground" 
                   />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-border bg-muted/20">
          <Link href="/dashboard/settings" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all mb-1 group ${pathname === '/dashboard/settings' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            <Settings size={20} />
            <span className="text-sm font-medium">{t('common.settings') || 'Cài đặt'}</span>
          </Link>
          <Button variant="ghost" onClick={() => logout()} className="w-full justify-start text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 gap-3 h-10 px-4 rounded-xl font-medium transition-all">
            <LogOut size={20} />
            <span className="text-sm">{t('common.logout') || 'Đăng xuất'}</span>
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

            <Link href="/dashboard/notifications" className="relative">
              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
                <Bell size={20} className="text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </Link>

            <Avatar className="h-9 w-9 border border-border mt-1">
              {user?.avatar_url ? <AvatarImage src={user.avatar_url} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-auto relative">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
