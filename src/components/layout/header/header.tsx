'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LocaleToggle } from '@/components/theme/locale-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Menu, ChevronDown, LayoutDashboard, LogOut, User, ShieldAlert, HeartPulse } from 'lucide-react';
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

  const ROLE_BADGE_KEY: Record<string, string> = {
    city_admin:      tHeader('roleAdmin'),
    rescue_operator: tHeader('roleOperator'),
    ai_operator:     tHeader('roleAiOperator'),
    rescue_team:     tHeader('roleRescueTeam'),
    citizen:         tHeader('roleCitizen'),
  };

  const ROLE_PORTAL_LABEL: Record<string, string> = {
    city_admin:      tHeader('portalDashboard'),
    rescue_operator: tHeader('portalDashboard'),
    ai_operator:     tHeader('portalDashboard'),
    rescue_team:     tHeader('portalRescue'),
    citizen:         tHeader('portalCitizen'),
  };

  const portalData = user ? (ROLE_PORTAL_HREF[user.role] ?? ROLE_PORTAL_HREF.citizen) : null;
  const portal = portalData ? { ...portalData, label: ROLE_PORTAL_LABEL[user?.role ?? 'citizen'] ?? 'Portal' } : null;
  const roleBadge = user ? (ROLE_BADGE_KEY[user.role] ?? user.role) : null;

  const navLinks = [
    { href: '/#features', label: t('nav.solutions') },
    { href: '/contact',   label: t('nav.contact') },
  ];

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
      isScrolled
        ? 'bg-background/80 backdrop-blur-md py-3 border-border shadow-sm'
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
          {portal && (
            <Link href={portal.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
              <portal.icon size={16} />
              {portal.label}
            </Link>
          )}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          <LocaleToggle />
          <ThemeToggle />
          <div className="h-6 w-px bg-border mx-1" />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 h-10 px-3 rounded-xl hover:bg-muted transition-colors cursor-pointer outline-none"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-black">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold leading-none">{user.name.split(' ').pop()}</span>
                  <span className="text-[9px] text-muted-foreground leading-none mt-0.5">{roleBadge}</span>
                </div>
                <ChevronDown size={14} className="text-muted-foreground ml-1" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52">
                {/* User info — wrapped in Group for GroupLabel */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1 py-1">
                      <p className="font-bold text-sm text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <Badge variant="outline" className="text-[9px] w-fit mt-0.5 border-primary/30 text-primary">
                        {roleBadge}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {portal && (
                  <DropdownMenuItem onClick={() => router.push(portal.href)}>
                    <portal.icon size={14} />
                    {portal.label}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => router.push(`${portal?.href ?? '/citizen'}/profile`)}>
                  <User size={14} />
                  {tHeader('profile')}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-500 focus:text-red-500 focus:bg-red-50"
                >
                  <LogOut size={14} />
                  {tHeader('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/signin">
                <Button variant="ghost" size="sm" className="font-semibold px-5">
                  {t('common.login')}
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-primary hover:bg-primary-700 text-white rounded-full px-6 font-semibold shadow-md shadow-primary/10">
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
                {user && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-black">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-sm">{user.name}</p>
                      <Badge variant="outline" className="text-[9px] border-primary/30 text-primary mt-0.5">
                        {roleBadge}
                      </Badge>
                    </div>
                  </div>
                )}

                <nav className="flex flex-col gap-1">
                  {navLinks.map(link => (
                    <Link key={link.href} href={link.href}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  ))}
                  {portal && (
                    <Link href={portal.href}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted hover:text-primary transition-colors">
                      <portal.icon size={16} />
                      {portal.label}
                    </Link>
                  )}
                </nav>
              </div>

              {/* Footer */}
              <div className="px-4 pb-6 pt-2 border-t border-border">
                {user ? (
                  <Button variant="outline"
                    className="w-full font-bold rounded-xl text-red-500 border-red-200 hover:bg-red-50"
                    onClick={logout}>
                    <LogOut size={16} className="mr-2" /> {tHeader('logout')}
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link href="/signin" className="w-full">
                      <Button variant="outline" className="w-full font-bold rounded-xl">
                        {t('common.login')}
                      </Button>
                    </Link>
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
