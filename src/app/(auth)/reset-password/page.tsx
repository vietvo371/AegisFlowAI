'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate reset request
    await new Promise(r => setTimeout(r, 1500));
    setIsLoading(false);
    setIsSent(true);
    toast.success('Yêu cầu đã được gửi! Hãy kiểm tra email của bạn.');
  };

  if (isSent) {
    return (
      <div className="text-center space-y-6 animate-fade-in-up">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
          <Mail size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight">Kiểm tra Email</h2>
          <p className="text-sm font-medium text-muted-foreground leading-relaxed">
            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra cả thư mục spam nếu không thấy.
          </p>
        </div>
        <div className="pt-4">
          <Link href="/signin">
            <Button size="lg" className="w-full h-12 bg-primary hover:bg-primary-700 font-bold rounded-xl">
              Quay lại Đăng nhập
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Chưa nhận được email? <button onClick={() => setIsSent(false)} className="text-primary font-bold hover:underline">Thử lại</button>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight">{t('forgotTitle')}</h2>
        <p className="text-sm font-medium text-muted-foreground">
          {t('forgotDesc')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-12 bg-primary hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary/20"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={18} />
              Gửi yêu cầu...
            </div>
          ) : (
            t('sendResetLink')
          )}
        </Button>
      </form>

      <div className="text-center">
        <Link href="/signin" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft size={16} />
          {t('rememberedPassword')}
        </Link>
      </div>
    </div>
  );
}
