'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

function PasswordStrength({ password }: { password: string }) {
  const strength = React.useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  if (!password) return null;

  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? colors[strength - 1] : 'bg-muted'}`} />
        ))}
      </div>
      <p className={`text-[10px] font-semibold ${strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-orange-500' : strength === 3 ? 'text-yellow-600' : 'text-emerald-500'}`}>
        {labels[strength - 1] || ''}
      </p>
    </div>
  );
}

export default function SignUpPage() {
  const t = useTranslations('auth');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const [formData, setFormData] = React.useState<SignUpInput>({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof SignUpInput, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof SignUpInput]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validated = signUpSchema.parse(formData);

      const api = (await import('@/lib/api')).default;
      const res = await api.post('/auth/register', validated);

      if (res.data?.success) {
        const { token } = res.data.data;
        localStorage.setItem('aegisflow_token', token);
        document.cookie = `aegisflow_token=${token}; path=/; max-age=86400; SameSite=Lax`;

        toast.success(t('signupSuccess'));
        window.location.href = '/citizen';
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof SignUpInput, string>> = {};
        error.issues.forEach(err => {
          const fieldName = err.path[0] as keyof SignUpInput;
          if (fieldName) fieldErrors[fieldName] = err.message;
        });
        setErrors(fieldErrors);
        toast.error(t('signupValidationError'));
      } else if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
        // Ignore
      } else {
        toast.error(error.response?.data?.message || t('signupError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = (hasError: boolean) =>
    `h-12 rounded-2xl bg-muted/40 pl-10 border-border/50 focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all ${
      hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
    }`;

  return (
    <div className="space-y-7">
      {/* Decorative Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/20 to-indigo-500/20 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
          <UserPlus size={28} className="text-primary" />
        </div>
      </div>

      {/* Heading */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight">{t('createAccount')}</h2>
        <p className="text-sm text-muted-foreground">{t('signUpDesc')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name + Phone in 2 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground">
              {t('fullName')}
            </Label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                id="name" name="name" type="text"
                placeholder={t('fullNamePlaceholder')}
                className={inputCls(!!errors.name)}
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            {errors.name && <p className="text-xs text-red-500 pl-1">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground">
              {t('phone')}
            </Label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                id="phone" name="phone" type="tel"
                placeholder={t('phonePlaceholder')}
                className={inputCls(!!errors.phone)}
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-500 pl-1">{errors.phone}</p>}
          </div>
        </div>

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
              className={inputCls(!!errors.email)}
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 pl-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground">
            {t('createPassword')}
          </Label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              id="password" name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              className={`${inputCls(!!errors.password)} pr-11`}
              autoComplete="new-password"
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
          <PasswordStrength password={formData.password} />
          {errors.password && <p className="text-xs text-red-500 pl-1">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="password_confirmation" className="text-xs font-semibold text-muted-foreground">
            {t('confirmPassword')}
          </Label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              id="password_confirmation" name="password_confirmation"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('confirmPasswordPlaceholder')}
              className={inputCls(!!errors.password_confirmation)}
              autoComplete="new-password"
              required
              value={formData.password_confirmation}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          {errors.password_confirmation && <p className="text-xs text-red-500 pl-1">{errors.password_confirmation}</p>}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2.5 pt-1">
          <input
            type="checkbox"
            id="terms"
            required
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
          />
          <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
            {t('agreeTerms')}{' '}
            <Link href="/terms" className="text-primary hover:underline font-semibold">{t('terms')}</Link>
            {' '}{t('and')}{' '}
            <Link href="/privacy" className="text-primary hover:underline font-semibold">{t('privacy')}</Link>
          </Label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 font-bold rounded-2xl text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
        >
          {isLoading
            ? <><Loader2 size={18} className="animate-spin mr-2" />{t('creating')}</>
            : t('signUp')
          }
        </Button>
      </form>

      {/* Signin link */}
      <p className="text-center text-sm text-muted-foreground">
        {t('hasAccount')}{' '}
        <Link href="/signin" className="font-bold text-primary hover:text-primary/80 transition-colors">
          {t('signInLink')}
        </Link>
      </p>
    </div>
  );
}
