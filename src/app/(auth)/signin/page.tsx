'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Github, Chrome, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SignInPage() {
  const t = useTranslations('auth');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate auth
    await new Promise(r => setTimeout(r, 1500));
    setIsLoading(false);
    toast.success('Đăng nhập thành công! Đang chuyển hướng...');
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight">{t('welcomeBack')}</h2>
        <p className="text-sm font-medium text-muted-foreground">
          {t('signInDesc')}
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
            {t('email')}
          </Label>
          <Input 
            id="email" 
            type="email" 
            placeholder={t('emailPlaceholder')} 
            className="h-12 rounded-xl bg-muted/30 border-border focus:bg-background transition-colors"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('password')}
            </Label>
            <Link href="/reset-password" title={t('forgotPassword')} className="text-xs font-bold text-primary hover:text-primary-700">
              {t('forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"} 
              placeholder={t('passwordPlaceholder')} 
              className="h-12 rounded-xl bg-muted/30 border-border focus:bg-background transition-colors pr-10"
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

        <div className="flex items-center space-x-2 ml-1">
          <Checkbox id="remember" className="rounded-md" />
          <Label htmlFor="remember" className="text-sm font-medium leading-none cursor-pointer">
            {t('rememberMe')}
          </Label>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-12 bg-primary hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary/20"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={18} />
              {t('signingIn')}
            </div>
          ) : (
            t('signIn')
          )}
        </Button>
      </form>

      <p className="text-center text-sm font-medium text-muted-foreground mt-8">
        {t('noAccount')}{' '}
        <Link href="/signup" className="text-primary font-black hover:underline underline-offset-4">
          {t('signUpFree')}
        </Link>
      </p>

      <div className="pt-4 flex items-center justify-center gap-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-500" />
          AES-256 SSL
        </span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
        <span>ISO 27001</span>
      </div>
    </div>
  );
}
