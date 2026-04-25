'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone } from 'lucide-react';
import { toast } from 'sonner';

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

        toast.success('Đăng ký thành công! Chuyển hướng...');
        window.location.href = '/citizen';
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof SignUpInput, string>> = {};
        error.issues.forEach(err => {
          const fieldName = err.path[0] as keyof SignUpInput;
          if (fieldName) {
            fieldErrors[fieldName] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error('Vui lòng kiểm tra lại các trường');
      } else if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
        // Ignore abort errors
      } else {
        const message = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{t('createAccount')}</h2>
        <p className="text-sm text-muted-foreground">{t('signUpDesc')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t('fullName')}
          </Label>
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="name" name="name" type="text"
              placeholder={t('fullNamePlaceholder')}
              className={`h-11 rounded-xl bg-muted/30 pl-9 ${
                errors.name ? 'border-red-500 focus:border-red-500' : ''
              }`}
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <span>⚠</span> {errors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t('email')}
          </Label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="email" name="email" type="email"
              placeholder={t('emailPlaceholder')}
              className={`h-11 rounded-xl bg-muted/30 pl-9 ${
                errors.email ? 'border-red-500 focus:border-red-500' : ''
              }`}
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <span>⚠</span> {errors.email}
            </p>
          )}
        </div>

        {/* Phone Field */}
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t('phone')}
          </Label>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="phone" name="phone" type="tel"
              placeholder="0912 345 678"
              className={`h-11 rounded-xl bg-muted/30 pl-9 ${
                errors.phone ? 'border-red-500 focus:border-red-500' : ''
              }`}
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          {errors.phone && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <span>⚠</span> {errors.phone}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t('password')}
          </Label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="password" name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              className={`h-11 rounded-xl bg-muted/30 pl-9 pr-10 ${
                errors.password ? 'border-red-500 focus:border-red-500' : ''
              }`}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <span>⚠</span> {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1.5">
          <Label htmlFor="password_confirmation" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t('confirmPassword')}
          </Label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="password_confirmation" name="password_confirmation"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('confirmPasswordPlaceholder')}
              className={`h-11 rounded-xl bg-muted/30 pl-9 ${
                errors.password_confirmation ? 'border-red-500 focus:border-red-500' : ''
              }`}
              autoComplete="new-password"
              required
              value={formData.password_confirmation}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          {errors.password_confirmation && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <span>⚠</span> {errors.password_confirmation}
            </p>
          )}
        </div>

        <div className="flex items-start gap-2 pt-2">
          <input
            type="checkbox"
            id="terms"
            required
            className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
          />
          <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
            Tôi đồng ý với{' '}
            <Link href="/terms" className="text-primary hover:underline">Điều khoản sử dụng</Link>
            {' '}và{' '}
            <Link href="/privacy" className="text-primary hover:underline">Chính sách bảo mật</Link>
          </Label>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 font-bold rounded-xl shadow-lg shadow-primary/20"
        >
          {isLoading
            ? <><Loader2 size={16} className="animate-spin mr-2" />{t('creating')}</>
            : t('signUp')
          }
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-[11px] font-medium text-muted-foreground">
            Đã có tài khoản?
          </span>
        </div>
      </div>

      <Link href="/signin" className="w-full">
        <Button variant="outline" className="w-full h-11 rounded-xl font-bold">
          {t('signIn')}
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
