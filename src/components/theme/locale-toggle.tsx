'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function LocaleToggle() {
  const locale = useLocale();
  const t = useTranslations('common');
  const router = useRouter();

  const switchLocale = (newLocale: string) => {
    // Set cookie that next-intl will read in the request config
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "h-9 w-9 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0")}>
        <Globe className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle language</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        <DropdownMenuItem 
          onClick={() => switchLocale('vi')} 
          className="cursor-pointer flex justify-between"
          disabled={locale === 'vi'}
        >
          <span>Tiếng Việt</span>
          {locale === 'vi' && <span>✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => switchLocale('en')} 
          className="cursor-pointer flex justify-between"
          disabled={locale === 'en'}
        >
          <span>English</span>
          {locale === 'en' && <span>✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
