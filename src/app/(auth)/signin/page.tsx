'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AUTH_ACTORS } from '@/lib/auth-actors';
import { Button } from '@/components/ui/button';

export default function SignInActorSelectPage() {
  const t = useTranslations('auth');

  return (
    <div className="space-y-7">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight">{t('chooseActorTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('chooseActorDesc')}</p>
      </div>

      <div className="grid gap-3">
        {AUTH_ACTORS.map((actor) => {
          const Icon = actor.icon;

          return (
            <Link
              key={actor.slug}
              href={`/signin/${actor.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-muted/25 p-4 transition-all hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon size={21} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black">{t(`roles.${actor.labelKey}`)}</div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`roles.${actor.descKey}`)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <Link href="/signup" className="block">
        <Button variant="outline" className="w-full h-11 rounded-2xl font-bold">
          {t('signUpFree')}
        </Button>
      </Link>
    </div>
  );
}
