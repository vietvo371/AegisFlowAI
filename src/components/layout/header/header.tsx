'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { AUTH_ACTORS } from '@/lib/auth-actors';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LocaleToggle } from '@/components/theme/locale-toggle';
import Image from 'next/image';
import { Menu, ChevronDown, LayoutDashboard, LogOut, ShieldAlert, HeartPulse } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from '@/components/ui/sheet';

const ROLE_PORTAL_HREF: Record<string, { href: string; icon: React.ElementType }> = {
  city_admin:      { href: '/dashboard', icon: LayoutDashboard },
  rescue_operator: { href: '/dashboard', icon: LayoutDashboard },
  ai_operator:     { href: '/dashboard', icon: LayoutDashboard },
  rescue_team:     { href: '/team',      icon: ShieldAlert },
  citizen:         { href: '/citizen',   icon: HeartPulse },
};

export default function Header() {
  const t = useTranslations();
  const tHeader = useTranslations('header');
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const ROLE_PORTAL_LABEL: Record<string, string> = {
    city_admin:      tHeader('portalDashboard'),
    rescue_operator: tHeader('portalDashboard'),
    ai_operator:     tHeader('portalDashboard'),
    rescue_team:     tHeader('portalRescue'),
    citizen:         tHeader('portalCitizen'),
  };

  const portalData = user ? (ROLE_PORTAL_HREF[user.role] ?? ROLE_PORTAL_HREF.citizen) : null;
  const portal = portalData ? { ...portalData, label: ROLE_PORTAL_LABEL[user?.role ?? 'citizen'] ?? 'Portal' } : null;
  const PortalIcon = portal?.icon;

  const navLinks = [
    { href: '/#features', label: t('nav.solutions') },
    { href: '/about',     label: t('footer.aboutUs') },
    { href: '/contact',   label: t('nav.contact') },
  ];

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
      isScrolled
        ? 'bg-background/60 backdrop-blur-2xl py-3.5 border-border/50 shadow-sm'
        : 'bg-transparent py-5 border-transparent'
    )}>
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-10 h-10 group-hover:scale-110 transition-transform flex items-center justify-center">
            <Image src="/images/logo.png" alt="AegisFlow AI Logo" width={512} height={512}
              className="object-contain w-full h-full drop-shadow-sm" priority />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            AegisFlow <span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          <LocaleToggle />
          <ThemeToggle />

          <div className="h-6 w-px bg-border mx-1" />

          {user && portal && PortalIcon ? (
            <>
              <Button
                size="sm"
                onClick={() => router.push(portal.href)}
                className="rounded-full px-5 font-semibold"
              >
                <PortalIcon size={15} className="mr-2" />
                {portal.label}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="rounded-full text-muted-foreground hover:text-red-500"
                aria-label={tHeader('logout')}
              >
                <LogOut size={16} />
              </Button>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="font-semibold px-5 gap-1.5" />}>
                  {t('common.login')}
                  <ChevronDown size={14} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{t('auth.actorLoginTitle')}</DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  {AUTH_ACTORS.map((actor) => {
                    const Icon = actor.icon;

                    return (
                      <DropdownMenuItem
                        key={actor.slug}
                        onClick={() => router.push(`/signin/${actor.slug}`)}
                        className="items-start gap-3 px-2 py-2.5"
                      >
                        <Icon size={16} className="mt-0.5 text-primary" />
                        <span className="flex min-w-0 flex-col">
                          <span className="font-semibold leading-none">{t(`auth.roles.${actor.labelKey}`)}</span>
                          <span className="mt-1 text-xs leading-snug text-muted-foreground">
                            {t(`auth.roles.${actor.descKey}`)}
                          </span>
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href="/signup" className="magnetic-btn">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground border border-border px-6 backdrop-blur-md rounded-full font-semibold transition-all shadow-md flex items-center justify-center">
                  {t('nav.getStarted')}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="rounded-full" />}>
              <Menu size={24} />
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-0 pt-0 w-72 p-0" showCloseButton={false}>
              {/* Header row */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <SheetTitle className="text-base font-bold">Menu</SheetTitle>
                <div className="flex items-center gap-1">
                  <LocaleToggle />
                  <ThemeToggle />
                  <SheetClose render={<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" />}>
                    <span className="text-base leading-none">✕</span>
                    <span className="sr-only">Đóng</span>
                  </SheetClose>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex flex-col gap-4 flex-1 overflow-y-auto px-4 py-4">
                <nav className="flex flex-col gap-1">
                  {navLinks.map(link => (
                    <Link key={link.href} href={link.href}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Footer */}
              <div className="px-4 pb-6 pt-2 border-t border-border">
                {user && portal && PortalIcon ? (
                  <div className="flex flex-col gap-2">
                    <Link href={portal.href} className="w-full">
                      <Button className="w-full font-bold rounded-xl">
                        <PortalIcon size={16} className="mr-2" />
                        {portal.label}
                      </Button>
                    </Link>
                    <Button variant="outline"
                      className="w-full font-bold rounded-xl text-red-500 border-red-200 hover:bg-red-50"
                      onClick={logout}>
                      <LogOut size={16} className="mr-2" /> {tHeader('logout')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="rounded-xl border border-border p-1">
                      <p className="px-2 py-1.5 text-xs font-bold text-muted-foreground">
                        {t('auth.actorLoginTitle')}
                      </p>
                      {AUTH_ACTORS.map((actor) => {
                        const Icon = actor.icon;

                        return (
                          <Link
                            key={actor.slug}
                            href={`/signin/${actor.slug}`}
                            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold hover:bg-muted"
                          >
                            <Icon size={15} className="text-primary" />
                            {t(`auth.roles.${actor.labelKey}`)}
                          </Link>
                        );
                      })}
                    </div>
                    <Link href="/signup" className="w-full">
                      <Button className="w-full bg-primary text-white font-bold rounded-xl">
                        {t('nav.getStarted')}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
}
