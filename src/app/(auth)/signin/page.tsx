'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_ROUTES: Record<string, string> = {
  city_admin:      '/dashboard',
  rescue_operator: '/dashboard',
  ai_operator:     '/dashboard',
  rescue_team:     '/team',
  citizen:         '/citizen',
};

export default function SignInPage() {
  const t = useTranslations('auth');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email    = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.post('/auth/login', { email, password });

      if (res.data?.success) {
        const { token, user: userData } = res.data.data;
        localStorage.setItem('aegisflow_token', token);
        document.cookie = `aegisflow_token=${token}; path=/; max-age=86400; SameSite=Lax`;

        const role: string = userData?.role ?? 'citizen';
        toast.success('Đăng nhập thành công!');

        await new Promise(r => setTimeout(r, 100));
        window.location.replace(ROLE_ROUTES[role] ?? '/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{t('welcomeBack')}</h2>
        <p className="text-sm text-muted-foreground">{t('signInDesc')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t('email')}
          </Label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="email" name="email" type="email"
              placeholder={t('emailPlaceholder')}
              className="h-11 rounded-xl bg-muted/30 pl-9"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('password')}
            </Label>
            <Link href="/reset-password" className="text-xs font-bold text-primary hover:underline underline-offset-4">
              {t('forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="password" name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              className="h-11 rounded-xl bg-muted/30 pl-9 pr-10"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 font-bold rounded-xl shadow-lg shadow-primary/20"
        >
          {isLoading
            ? <><Loader2 size={16} className="animate-spin mr-2" />{t('signingIn')}</>
            : t('signIn')
          }
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-[11px] font-medium text-muted-foreground">
            Chưa có tài khoản?
          </span>
        </div>
      </div>

      <Link href="/signup" className="w-full">
        <Button variant="outline" className="w-full h-11 rounded-xl font-bold">
          {t('signUpFree')}
        </Button>
      </Link>

      {/* Trust */}
      <div className="flex items-center justify-center gap-3 pt-2">
        {['AES-256 SSL', 'ISO 27001', 'GDPR'].map((badge, i) => (
          <React.Fragment key={badge}>
            {i > 0 && <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />}
            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{badge}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
