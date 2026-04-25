'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { usePathname, useRouter } from 'next/navigation';
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
import { NotificationBell } from '@/components/notification/NotificationBell';
import { ToasterProvider } from '@/components/ui/toaster-provider';

// Roles that are allowed to access dashboard
const DASHBOARD_ROLES = ['city_admin', 'rescue_operator', 'ai_operator', 'sensor'];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const tDash = useTranslations('dashboard');
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Check if user has access to dashboard
  const hasAccess = !loading && user && DASHBOARD_ROLES.includes(user.role);

  // Redirect unauthorized roles away from dashboard
  React.useEffect(() => {
    if (hasAccess === false && loading === false && user) {
      const roleRoute: Record<string, string> = {
        citizen: '/citizen',
        rescue_team: '/team',
      };
      router.replace(roleRoute[user.role] ?? '/signin');
    }
  }, [hasAccess, loading, user, router]);

  // Show loading while checking auth
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

  // User doesn't have access to dashboard - return null, useEffect will redirect
  if (!hasAccess) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <ToasterProvider />
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
            { href: '/dashboard',                 icon: LayoutDashboard, labelKey: 'pages.overview',         roles: null },
            { href: '/dashboard/analytics',       icon: BarChart3,       labelKey: 'pages.analytics',        roles: null },
            { href: '/dashboard/incidents',       icon: AlertTriangle,   labelKey: 'pages.incidents',        roles: null },
            { href: '/dashboard/flood-zones',     icon: Waves,           labelKey: 'pages.floodZones',       roles: null },
            { href: '/dashboard/rescue-requests', icon: HeartPulse,      labelKey: 'pages.rescueRequests',   roles: null },
            { href: '/dashboard/rescue-teams',    icon: ShieldAlert,     labelKey: 'pages.rescueTeams',      roles: null },
            { href: '/dashboard/shelters',        icon: Home,            labelKey: 'pages.shelters',         roles: null },
            { href: '/dashboard/sensors',         icon: Activity,        labelKey: 'pages.sensors',          roles: null },
            { href: '/dashboard/alerts',          icon: Megaphone,       labelKey: 'pages.alerts',           roles: null },
            { href: '/dashboard/predictions',     icon: BrainCircuit,    labelKey: 'pages.predictions',      roles: null },
            { href: '/dashboard/recommendations', icon: CheckCircle2,    labelKey: 'pages.recommendations',  roles: null },
            { href: '/dashboard/admin/users',     icon: Users,           labelKey: 'pages.users',            roles: ['city_admin'] },
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
                <span className="text-sm tracking-tight">{tDash(item.labelKey as any)}</span>
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
            <span className="text-sm font-medium">{t('common.settings')}</span>
          </Link>
          <Button variant="ghost" onClick={() => logout()} className="w-full justify-start text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 gap-3 h-10 px-4 rounded-xl font-medium transition-all">
            <LogOut size={20} />
            <span className="text-sm">{t('common.logout')}</span>
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

            <NotificationBell />

            <Avatar className="h-9 w-9 border border-border mt-1">
              {user?.avatar_url ? <AvatarImage src={user.avatar_url} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-hidden relative min-h-0">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
