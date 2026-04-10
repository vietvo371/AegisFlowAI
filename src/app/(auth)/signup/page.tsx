'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Github, Chrome, Loader2, User, Mail, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function SignUpPage() {
  const t = useTranslations('auth');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate auth
    await new Promise(r => setTimeout(r, 1500));
    setIsLoading(false);
    toast.success('Đăng ký thành công! Hãy kiểm tra email để xác thực.');
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight">{t('createAccount')}</h2>
        <p className="text-sm font-medium text-muted-foreground">
          {t('signUpDesc')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-12 border-border font-bold rounded-xl gap-2 hover:bg-muted/50">
          <Chrome size={18} />
          Google
        </Button>
        <Button variant="outline" className="h-12 border-border font-bold rounded-xl gap-2 hover:bg-muted/50">
          <Github size={18} />
          Github
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
          <span className="bg-background px-4 text-muted-foreground">{t('orSignInWith')}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              {t('firstName')}
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                id="firstName" 
                placeholder={t('firstNamePlaceholder')} 
                className="h-12 rounded-xl bg-muted/30 border-border focus:bg-background transition-colors pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              {t('lastName')}
            </Label>
            <Input 
              id="lastName" 
              placeholder={t('lastNamePlaceholder')} 
              className="h-12 rounded-xl bg-muted/30 border-border focus:bg-background transition-colors"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
            {t('email')}
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              id="email" 
              type="email" 
              placeholder={t('emailPlaceholder')} 
              className="h-12 rounded-xl bg-muted/30 border-border focus:bg-background transition-colors pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
            {t('createPassword')}
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"} 
              placeholder={t('passwordPlaceholder')} 
              className="h-12 rounded-xl bg-muted/30 border-border focus:bg-background transition-colors px-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-start space-x-2 ml-1 pt-2">
          <Checkbox id="terms" className="rounded-md mt-1" required />
          <Label htmlFor="terms" className="text-xs font-medium text-muted-foreground leading-relaxed cursor-pointer">
            {t('agreeTerms')}{' '}
            <Link href="/terms" className="text-primary font-bold hover:underline">{t('terms')}</Link>{' '}
            {t('and')}{' '}
            <Link href="/privacy" className="text-primary font-bold hover:underline">{t('privacy')}</Link>.
          </Label>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-12 bg-primary hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary/20 mt-4"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={18} />
              {t('signingUp')}
            </div>
          ) : (
            t('signUp')
          )}
        </Button>
      </form>

      <p className="text-center text-sm font-medium text-muted-foreground mt-8">
        {t('hasAccount')}{' '}
        <Link href="/signin" className="text-primary font-black hover:underline underline-offset-4">
          {t('signInLink')}
        </Link>
      </p>

      <div className="pt-4 flex items-center justify-center gap-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="text-emerald-500" size={12} />
          {t('security')}
        </span>
      </div>
    </div>
  );
}
