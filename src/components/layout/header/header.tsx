'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LocaleToggle } from '@/components/theme/locale-toggle';
import { 
  Menu, 
  X, 
  ShieldCheck, 
  ChevronDown,
  LayoutDashboard,
  Bell,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

export default function Header() {
  const t = useTranslations();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/#features', label: t('nav.solutions') },
    { href: '/contact', label: t('nav.contact') },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
        isScrolled 
          ? 'bg-background/80 backdrop-blur-md py-3 border-border shadow-sm' 
          : 'bg-transparent py-5 border-transparent'
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <ShieldCheck size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            AegisFlow <span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <LayoutDashboard size={16} />
            {t('common.dashboard')}
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <LocaleToggle />
          <ThemeToggle />
          <div className="h-6 w-px bg-border mx-1" />
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
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          <LocaleToggle />
          <ThemeToggle />
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="rounded-full" />}>
              <Menu size={24} />
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-6 pt-12">
              <SheetTitle className="text-left">Menu</SheetTitle>
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-lg font-semibold border-b border-border pb-2 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/dashboard"
                  className="text-lg font-semibold border-b border-border pb-2 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard size={20} />
                  {t('common.dashboard')}
                </Link>
              </nav>
              <div className="flex flex-col gap-3 mt-auto pb-10">
                <Link href="/signin" className="w-full">
                  <Button variant="outline" className="w-full font-bold py-6 rounded-xl">
                    {t('common.login')}
                  </Button>
                </Link>
                <Link href="/signup" className="w-full">
                  <Button className="w-full bg-primary hover:bg-primary-700 text-white font-bold py-6 rounded-xl">
                    {t('nav.getStarted')}
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
