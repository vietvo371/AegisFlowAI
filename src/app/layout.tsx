import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import { ToasterProvider } from './providers/toaster';
import Header from '@/components/layout/header/header';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-be-vietnam-pro',
});

export const metadata: Metadata = {
  title: {
    default: 'AegisFlow AI - Hệ thống giám sát thiên tai thông minh',
    template: '%s | AegisFlow AI',
  },
  description:
    'AegisFlow AI - Nền tảng Digital Twin giám sát, dự báo và điều phối cứu hộ thiên tai theo thời gian thực tại Việt Nam.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`bg-gray-50 dark:bg-dark-secondary min-h-screen flex flex-col ${beVietnamPro.className}`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="data-theme" defaultTheme="light" disableTransitionOnChange>
          {/* ToasterProvider must render before the children components */}
          {/* https://github.com/emilkowalski/sonner/issues/168#issuecomment-1773734618 */}
          <ToasterProvider />

          <Header />
          <div className="isolate flex flex-col flex-1">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
