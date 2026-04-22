'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Loader2, User, Mail, Lock, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

export default function SignUpPage() {
  const t = useTranslations('auth');
  const { register } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [agreed, setAgreed] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!agreed) {
      toast.error('Vui lòng đồng ý với điều khoản sử dụng');
      return;
    }
    setIsLoading(true);

    const fd = new FormData(e.currentTarget);
    const firstName = fd.get('firstName') as string;
    const lastName  = fd.get('lastName') as string;

    try {
      await register({
        name:                  `${firstName} ${lastName}`.trim(),
        email:                 fd.get('email'),
        phone:                 fd.get('phone') || undefined,
        password:              fd.get('password'),
        password_confirmation: fd.get('password'),
      });
      toast.success('Đăng ký thành công!');
      await new Promise(r => setTimeout(r, 100));
      window.location.replace('/citizen');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
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
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('firstName')}
            </Label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                id="firstName" name="firstName"
                placeholder={t('firstNamePlaceholder')}
                className="h-11 rounded-xl bg-muted/30 pl-9"
                autoComplete="given-name"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('lastName')}
            </Label>
            <Input
              id="lastName" name="lastName"
              placeholder={t('lastNamePlaceholder')}
              className="h-11 rounded-xl bg-muted/30"
              autoComplete="family-name"
              required
            />
          </div>
        </div>

        {/* Email */}
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

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Số điện thoại <span className="normal-case font-normal text-muted-foreground/60">(tùy chọn)</span>
          </Label>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="phone" name="phone" type="tel"
              placeholder="0901 234 567"
              className="h-11 rounded-xl bg-muted/30 pl-9"
              autoComplete="tel"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t('createPassword')}
          </Label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="password" name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              className="h-11 rounded-xl bg-muted/30 pl-9 pr-10"
              autoComplete="new-password"
              minLength={8}
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
          <p className="text-[11px] text-muted-foreground ml-1">Tối thiểu 8 ký tự</p>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2.5 pt-1">
          <Checkbox
            id="terms"
            checked={agreed}
            onCheckedChange={v => setAgreed(!!v)}
            className="mt-0.5"
          />
          <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            Tôi đồng ý với{' '}
            <Link href="/privacy" className="text-primary font-bold hover:underline underline-offset-4">
              Điều khoản sử dụng
            </Link>{' '}
            và{' '}
            <Link href="/privacy" className="text-primary font-bold hover:underline underline-offset-4">
              Chính sách bảo mật
            </Link>
          </Label>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !agreed}
          className="w-full h-11 font-bold rounded-xl shadow-lg shadow-primary/20"
        >
          {isLoading
            ? <><Loader2 size={16} className="animate-spin mr-2" />{t('signingUp')}</>
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
          {t('signInLink')}
        </Button>
      </Link>
    </div>
  );
}
