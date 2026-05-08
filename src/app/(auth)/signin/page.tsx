'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { signInSchema, type SignInInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Mail, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_ROUTES: Record<string, string> = {
  city_admin:      '/dashboard',
  rescue_operator: '/dashboard',
  ai_operator:     '/dashboard',
  sensor:          '/dashboard',
  rescue_team:     '/team',
  citizen:         '/citizen',
};

export default function SignInPage() {
  const t = useTranslations('auth');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const [formData, setFormData] = React.useState<SignInInput>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof SignInInput, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof SignInInput]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validated = signInSchema.parse(formData);

      const api = (await import('@/lib/api')).default;
      const res = await api.post('/auth/login', validated);

      if (res.data?.success) {
        const { token, user: userData } = res.data.data;
        localStorage.setItem('aegisflow_token', token);
        document.cookie = `aegisflow_token=${token}; path=/; max-age=86400; SameSite=Lax`;

        const role: string = userData?.role ?? 'citizen';
        toast.success(t('loginSuccess'));

        await new Promise(r => setTimeout(r, 100));
        window.location.replace(ROLE_ROUTES[role] ?? '/dashboard');
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof SignInInput, string>> = {};
        error.issues.forEach(err => {
          const fieldName = err.path[0] as keyof SignInInput;
          if (fieldName) fieldErrors[fieldName] = err.message;
        });
        setErrors(fieldErrors);
        toast.error(t('loginValidationError'));
      } else if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
        // Ignore
      } else {
        toast.error(error.response?.data?.message || t('loginError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Decorative Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/20 to-indigo-500/20 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
          <ShieldCheck size={28} className="text-primary" />
        </div>
      </div>

      {/* Heading */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight">{t('welcomeBack')}</h2>
        <p className="text-sm text-muted-foreground">{t('signInDesc')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">
            {t('email')}
          </Label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              id="email" name="email" type="email"
              placeholder={t('emailPlaceholder')}
              className={`h-12 rounded-2xl bg-muted/40 pl-10 border-border/50 focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all ${
                errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
              }`}
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 pl-1">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground">
            {t('password')}
          </Label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              id="password" name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              className={`h-12 rounded-2xl bg-muted/40 pl-10 pr-11 border-border/50 focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all ${
                errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
              }`}
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 pl-1">{errors.password}</p>
          )}
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20" />
            <span className="text-xs text-muted-foreground font-medium">{t('rememberMe')}</span>
          </label>
          <Link href="/reset-password" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
            {t('forgotPassword')}
          </Link>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 font-bold rounded-2xl text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
        >
          {isLoading
            ? <><Loader2 size={18} className="animate-spin mr-2" />{t('signingIn')}</>
            : t('signIn')
          }
        </Button>
      </form>

      {/* Signup link */}
      <p className="text-center text-sm text-muted-foreground">
        {t('noAccount')}{' '}
        <Link href="/signup" className="font-bold text-primary hover:text-primary/80 transition-colors">
          {t('signUpFree')}
        </Link>
      </p>
    </div>
  );
}
