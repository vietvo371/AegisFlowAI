'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Map, User, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { RealtimeListener } from '@/components/realtime/RealtimeListener';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const NAV = [
  { href: '/team',         icon: LayoutDashboard, label: 'Nhiệm vụ' },
  { href: '/team/map',     icon: Map,             label: 'Bản đồ' },
  { href: '/team/profile', icon: User,            label: 'Hồ sơ' },
];

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <RealtimeListener />

      <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 bg-background/95 backdrop-blur-md border-b border-border">
        <Link href="/team" className="flex items-center gap-2">
          <Image src="/images/logo.png" alt="AegisFlow" width={28} height={28} className="object-contain" />
          <span className="font-black text-base tracking-tight">AegisFlow</span>
          <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 border-orange-400/50 text-orange-500">
            Rescue Team
          </Badge>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red-500"
            onClick={logout}
          >
            <LogOut size={16} />
          </Button>
        </div>
      </header>

      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-50 h-16 bg-background/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around h-full max-w-lg mx-auto px-2">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors ${
                  active ? 'text-orange-500' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
