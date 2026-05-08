'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ShieldCheck, Lock, Eye, FileText, Globe, UserCheck, Server } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function PrivacyPage() {
  const t = useTranslations('footer');

  const sections = [
    {
      title: '1. Thu thập thông tin',
      content: 'Chúng tôi thu thập các thông tin cần thiết để vận hành hệ thống giám sát thiên tai, bao gồm vị trí GPS (với sự đồng ý của bạn), thông tin tài khoản, và dữ liệu sử dụng dịch vụ để cung cấp cảnh báo ngập lụt chính xác nhất tại khu vực của bạn.',
      icon: Eye,
    },
    {
      title: '2. Sử dụng thông tin',
      content: 'Dữ liệu được sử dụng để phân tích AI, dự báo nguy cơ, điều phối lực lượng cứu hộ và cải thiện chất lượng dịch vụ. Chúng tôi cam kết không chia sẻ dữ liệu cá nhân cho bên thứ ba vì mục đích thương mại.',
      icon: FileText,
    },
    {
      title: '3. Bảo mật dữ liệu',
      content: 'Hệ thống áp dụng chuẩn mã hóa AES-256 cho toàn bộ dữ liệu người dùng. Dữ liệu nhạy cảm được lưu trữ trên hạ tầng tuân thủ chuẩn ISO 27001. Truyền tải dữ liệu luôn được mã hóa qua TLS 1.3.',
      icon: Lock,
    },
    {
      title: '4. Quyền của người dùng',
      content: 'Bạn có toàn quyền truy cập, chỉnh sửa hoặc yêu cầu xóa dữ liệu cá nhân bất kỳ lúc nào thông qua phần cài đặt tài khoản. Chúng tôi sẽ xử lý yêu cầu trong vòng 30 ngày làm việc.',
      icon: UserCheck,
    },
    {
      title: '5. Cookie & Theo dõi',
      content: 'Chúng tôi sử dụng cookie cần thiết để duy trì phiên đăng nhập và cookie phân tích (có thể tắt) để cải thiện trải nghiệm. Không sử dụng cookie quảng cáo hay theo dõi bên thứ ba.',
      icon: Globe,
    },
    {
      title: '6. Lưu trữ và bảo quản',
      content: 'Dữ liệu cảm biến và dự báo được lưu trữ tối đa 2 năm phục vụ nghiên cứu khoa học. Dữ liệu cá nhân được xóa trong vòng 90 ngày sau khi tài khoản bị hủy. Sao lưu được mã hóa và lưu tại trung tâm dữ liệu tại Việt Nam.',
      icon: Server,
    },
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
            &ldquo;Tại AegisFlow AI, quyền riêng tư của bạn là ưu tiên hàng đầu. Chúng tôi thiết lập các tiêu chuẩn bảo mật nghiêm ngặt để bảo vệ dữ liệu cộng đồng trong mọi tình huống thiên tai.&rdquo;
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
          <div className="flex items-center gap-4 flex-wrap">
            <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
              AES-256 Encrypted
            </div>
            <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
              ISO 27001
            </div>
            <div className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 text-[10px] font-bold uppercase tracking-wider">
              TLS 1.3
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={14} />
            AegisFlow Legal Team
          </p>
        </div>
      </div>
    </div>
  );
}
