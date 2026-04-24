'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const [isLoading, setIsLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.post('/auth/forgot-password', { email });

      if (res.data?.success) {
        setSent(true);
        toast.success('Đã gửi liên kết đặt lại mật khẩu!');
      }
    } catch (error: any) {
      if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
        setIsLoading(false);
        return;
      }
      toast.error(error.response?.data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight">Kiểm tra email của bạn</h2>
          <p className="text-sm text-muted-foreground">
            Chúng tôi đã gửi liên kết đặt lại mật khẩu đến <span className="font-semibold">{email}</span>.
            Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Không nhận được email? Kiểm tra thư mục spam hoặc{' '}
          <button onClick={() => setSent(false)} className="text-primary hover:underline">
            thử lại
          </button>
        </p>
        <Link href="/signin">
          <Button variant="outline" className="w-full h-11 rounded-xl font-bold mt-4">
            <ArrowLeft size={16} className="mr-2" />
            Quay lại đăng nhập
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Quên mật khẩu?</h2>
        <p className="text-sm text-muted-foreground">
          Nhập email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="email" name="email" type="email"
              placeholder="your@email.com"
              className="h-11 rounded-xl bg-muted/30 pl-9"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 font-bold rounded-xl shadow-lg shadow-primary/20"
        >
          {isLoading
            ? <><Loader2 size={16} className="animate-spin mr-2" />Đang gửi...</>
            : 'Gửi liên kết đặt lại'
          }
        </Button>
      </form>

      <div className="text-center">
        <Link href="/signin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
