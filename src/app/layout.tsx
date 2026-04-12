import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import { Inter, Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'vietnamese'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-heading',
  subsets: ['latin', 'vietnamese'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'AegisFlow AI - Hệ thống giám sát thiên tai thông minh',
    template: '%s | AegisFlow AI',
  },
  description:
    'AegisFlow AI - Nền tảng AI hỗ trợ dự báo ngập lụt sớm, đề xuất tuyến sơ tán an toàn, và tối ưu phân bổ cứu trợ theo thời gian thực tại Đà Nẵng.',
  keywords: ['ngập lụt', 'thiên tai', 'cứu hộ', 'AI', 'Đà Nẵng', 'giám sát thời gian thực', 'AegisFlow'],
  authors: [{ name: 'AegisFlow Team' }],
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://aegisflow.ai',
    siteName: 'AegisFlow AI',
    title: 'AegisFlow AI - Giám sát thiên tai thông minh',
    description: 'Hệ thống dự báo và điều phối cứu hộ thiên tai sử dụng AI hàng đầu.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AegisFlow AI Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AegisFlow AI',
    description: 'Giám sát thiên tai thông minh thời gian thực.',
    images: ['/images/og-image.png'],
  },
};

import { AuthProvider } from '@/lib/auth-context';

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} ${geistMono.variable} min-h-screen bg-background font-inter antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>
              <Toaster richColors position="top-right" />
              {children}
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
