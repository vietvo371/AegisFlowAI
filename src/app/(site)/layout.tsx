'use client';

import Footer from '@/components/layout/footer';
import { usePathname } from 'next/navigation';

const AUTH_PATHS = ['/signin', '/signup', '/reset-password'];

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuth = AUTH_PATHS.includes(pathname);

  if (isAuth) {
    // Auth pages are full-screen — no wrapper, no footer
    return <>{children}</>;
  }

  return (
    <div className="dark:bg-[#101828] flex flex-col flex-1">
      <div className="isolate flex-1 flex flex-col">{children}</div>
      <Footer />
    </div>
  );
}
