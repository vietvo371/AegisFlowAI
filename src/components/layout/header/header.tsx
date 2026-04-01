'use client';
import { CloseIcon, MenuIcon } from '@/icons/icons';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import DesktopNav from './desktop-nav';
import MainMobileNav from './main-mobile-nav';
import ThemeToggle from './theme-toggle';
import { usePathname } from 'next/navigation';
import { navItems, dashboardNavItems } from './nav-items';
import { Search, Bell, Settings } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="bg-white/80 dark:bg-dark-primary/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 py-2 lg:py-2.5 transition-all duration-300">
      <div className="px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-14">
          {/* Left: Brand */}
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-primary-500/10 group-hover:scale-105 transition-transform duration-300">
                <Image 
                  src="/logo-aegisflow.png" 
                  alt="AegisFlow AI Logo" 
                  fill
                  className="object-cover"
                />
              </div>
              <span className="hidden sm:inline-block text-[19px] font-black text-gray-900 dark:text-white tracking-[-0.03em]">
                AegisFlow AI
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:block ml-2">
              <DesktopNav items={isDashboard ? dashboardNavItems : navItems} />
            </div>
          </div>

          {/* Right: Actions/Widgets */}
          <div className="flex items-center gap-4">
            {isDashboard ? (
              <div className="flex items-center gap-3">
                <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 w-56 transition-all focus-within:w-72 focus-within:ring-2 focus-within:ring-primary-500/20">
                  <Search size={14} className="text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm vùng..." 
                    className="bg-transparent border-none outline-none text-xs text-gray-700 dark:text-gray-300 w-full font-medium"
                  />
                </div>
                {/* Widgets etc. */}
                <ThemeToggle />
                <div className="flex items-center gap-1.5 ml-2">
                  <button className="relative p-2 rounded-full border border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 transition-colors">
                    <Bell size={18} />
                  </button>
                  <button className="p-2 rounded-full border border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 transition-colors">
                    <Settings size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 lg:gap-6">
                <ThemeToggle />
                <Link
                  href="/signin"
                  className="text-sm hidden lg:block font-bold text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-6 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-full font-bold text-sm transition-all shadow-md shadow-primary-500/10 active:scale-95"
                >
                  Dùng thử ngay
                </Link>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-900"
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      <MainMobileNav isOpen={mobileMenuOpen} />
    </header>
  );
}
