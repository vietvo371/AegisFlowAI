'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPasswordConfirmPage() {
  const t = useTranslations('auth');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDone, setIsDone] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate reset
    await new Promise(r => setTimeout(r, 1500));
    setIsLoading(false);
    setIsDone(true);
    toast.success('Mật khẩu đã được đặt lại thành công!');
  };

  if (isDone) {
    return (
      <div className="text-center space-y-6 animate-fade-in-up">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-600">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight">Thành công!</h2>
          <p className="text-sm font-medium text-muted-foreground leading-relaxed">
            Mật khẩu của bạn đã chính thức được thay đổi. Giờ bạn có thể đăng nhập bằng mật khẩu mới này.
          </p>
        </div>
        <div className="pt-4">
          <Link href="/signin">
            <Button size="lg" className="w-full h-12 bg-primary hover:bg-primary-700 font-bold rounded-xl">
              Đăng nhập ngay
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight">{t('resetPassword')}</h2>
        <p className="text-sm font-medium text-muted-foreground">
          Vui lòng nhập mật khẩu mới bảo mật nhất cho tài khoản của bạn.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
            {t('newPassword')}
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

        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
            {t('confirmPassword')}
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              id="confirm-password" 
              type={showPassword ? "text" : "password"} 
              placeholder={t('passwordPlaceholder')} 
              className="h-12 rounded-xl bg-muted/30 border-border focus:bg-background transition-colors px-10"
              required
            />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-12 bg-primary hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary/20 mt-4"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={18} />
              Đang thực hiện...
            </div>
          ) : (
            t('resetPassword')
          )}
        </Button>
      </form>
    </div>
  );
}
