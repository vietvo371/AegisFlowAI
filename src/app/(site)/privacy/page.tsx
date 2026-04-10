'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ShieldCheck, Lock, Eye, FileText, Globe } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function PrivacyPage() {
  const t = useTranslations('footer');

  const sections = [
    {
      title: '1. Thu thập thông tin',
      content: 'Chúng tôi thu thập các thông tin cần thiết để vận hành hệ thống giám sát thiên tai, bao gồm vị trí GPS (với sự đồng ý của bạn) để cung cấp cảnh báo ngập lụt chính xác nhất tại khu vực của bạn.',
      icon: Eye
    },
    {
      title: '2. Sử dụng thông tin',
      content: 'Dữ liệu được sử dụng để phân tích AI, dự báo nguy cơ và điều phối lực lượng cứu hộ. Chúng tôi cam kết không chia sẻ dữ liệu cá nhân cho bên thứ ba vì mục đích thương mại.',
      icon: FileText
    },
    {
      title: '3. Bảo mật dữ liệu',
      content: 'Hệ thống áp dụng chuẩn mã hóa AES-256 cho toàn bộ dữ liệu người dùng. Dữ liệu nhạy cảm được lưu trữ trên hạ tầng tuân thủ chuẩn ISO 27001.',
      icon: Lock
    },
    {
      title: '4. Quyền của người dùng',
      content: 'Bạn có toàn quyền truy cập, sửa đổi hoặc yêu cầu xóa dữ liệu cá nhân bất kỳ lúc nào thông qua phần cài đặt tài khoản.',
      icon: ShieldCheck
    }
  ];

  return (
    <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 max-w-4xl animate-fade-in-up">
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">{t('privacyPolicy')}</h1>
        <p className="text-muted-foreground font-medium">Cập nhật lần cuối: 10 Tháng 4, 2026</p>
      </div>

      <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-12">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-lg leading-relaxed text-muted-foreground font-medium italic border-l-4 border-primary pl-6 py-2">
            "Tại AegisFlow AI, quyền riêng tư của bạn là ưu tiên hàng đầu. Chúng tôi thiết lập các tiêu chuẩn bảo mật nghiêm ngặt để bảo vệ dữ liệu cộng đồng trong mọi tình huống thiên tai."
          </p>
        </div>

        <Separator className="bg-border/50" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <section.icon size={24} />
              </div>
              <h3 className="text-xl font-bold">{section.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm font-medium">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <Separator className="bg-border/50" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
              Secure Protocol
            </div>
            <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
              GDPR Compliant
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
            <Globe size={14} />
            AegisFlow Legal Team
          </p>
        </div>
      </div>
    </div>
  );
}
