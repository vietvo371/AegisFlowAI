'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import {
  Home, AlertTriangle, MapPin, Building2, Bell
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LocaleToggle } from '@/components/theme/locale-toggle';
import { useAuth } from '@/lib/auth-context';

const CitizenMap = dynamic(() => import('@/components/map/CitizenMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgb(243,244,246)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgb(59,130,246)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Đang tải bản đồ...</p>
      </div>
    </div>
  ),
});

export default function CitizenMapPage() {
  const t = useTranslations('citizen.map');
  const { user } = useAuth();

  const navItems = [
    { href: '/citizen', icon: Home, label: 'Trang chủ' },
    { href: '/citizen/sos', icon: AlertTriangle, label: 'SOS' },
    { href: '/citizen/map', icon: MapPin, label: t('title'), active: true },
    { href: '/citizen/shelters', icon: Building2, label: 'Điểm sơ tán' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
      }}
    >
      {/* Header - giống layout cha */}
      <header
        style={{
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderBottom: '1px solid rgb(224,224,224)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 10,
          backdropFilter: 'blur(8px)',
          paddingTop: 'max(12px, env(safe-area-inset-top))',
        }}
      >
        <Link href="/citizen" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgb(59,130,246)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image src="/images/logo.png" alt="AegisFlow" width={20} height={20} style={{ width: '20px', height: '20px' }} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>AegisFlow</span>
          <span style={{ fontSize: '12px', fontWeight: '500', color: 'rgb(59,130,246)', backgroundColor: 'rgb(59,130,246,0.1)', padding: '2px 8px', borderRadius: '9999px' }}>Citizen</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button style={{ background: 'none', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', color: 'rgb(107,114,128)' }}>
            <Bell size={20} />
          </button>
          <ThemeToggle />
          <LocaleToggle />
          <Avatar style={{ width: '32px', height: '32px' }}>
            {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
            <AvatarFallback style={{ backgroundColor: 'rgb(59,130,246)', color: 'white', fontSize: '14px' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Map */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        <CitizenMap />
      </div>

      {/* Bottom nav - giống layout cha */}
      <nav
        style={{
          backgroundColor: 'white',
          borderTop: '1px solid rgb(224,224,224)',
          padding: '8px 0',
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          display: 'flex',
          justifyContent: 'space-around',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {navItems.map((item) => {
          const active = !!item.active;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 16px',
                textDecoration: 'none',
                color: active ? 'rgb(59,130,246)' : 'rgb(107,114,128)',
              }}
            >
              {active ? (
                <div style={{ position: 'relative' }}>
                  <item.icon size={20} style={{ color: 'rgb(59,130,246)' }} />
                  <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'rgb(59,130,246)' }} />
                </div>
              ) : (
                <item.icon size={20} />
              )}
              <span style={{ fontSize: '10px', fontWeight: active ? 'bold' : 'normal' }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

