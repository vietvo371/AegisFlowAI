import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Home, MoveRight } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in-up">
      <div className="relative mb-8">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-primary/10 flex items-center justify-center text-primary rotate-12 animate-float">
          <ShieldAlert size={60} className="md:size-80" />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-background border border-border rounded-xl p-2 shadow-xl font-black text-2xl md:text-3xl">
          404
        </div>
      </div>

      <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
        {t('title')}
      </h1>
      <p className="text-muted-foreground text-lg max-w-md mx-auto mb-10 leading-relaxed font-medium">
        {t('description')}
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/">
          <Button size="lg" className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary-700 font-bold transition-all group shadow-xl shadow-primary/20">
            <Home className="mr-2" size={20} />
            {t('backHome')}
          </Button>
        </Link>
        <Link href="/contact">
          <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl font-bold group">
            Liên hệ hỗ trợ
            <MoveRight className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={20} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
