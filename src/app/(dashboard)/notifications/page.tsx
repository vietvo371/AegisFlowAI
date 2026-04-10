'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  Search, 
  Filter, 
  CheckCheck, 
  Trash2,
  Clock,
  ChevronRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const notifications = [
    {
      id: 1,
      type: 'critical',
      title: 'Báo động II: Sông Cẩm Lệ',
      desc: 'Mực nước vượt mức 3.8m. Khuyến cáo khu vực phường Hòa Thọ Tây sẵn sàng sơ tán.',
      time: '2 phút trước',
      read: false,
      icon: ShieldAlert,
      color: 'bg-rose-500/10 text-rose-600 border-rose-500/20'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Dự báo mưa lớn tập trung',
      desc: 'Dự báo mưa từ 50-100mm trong 3 giờ tới tại quận Liên Chiểu. Nguy cơ ngập cục bộ.',
      time: '15 phút trước',
      read: false,
      icon: AlertTriangle,
      color: 'bg-orange-500/10 text-orange-600 border-orange-500/20'
    },
    {
      id: 3,
      type: 'info',
      title: 'Cập nhật hệ thống cứu trợ',
      desc: 'Đội cứu hộ số 04 đã được điều phối đến điểm tập kết Hòa Thọ Tây.',
      time: '1 giờ trước',
      read: true,
      icon: Info,
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    },
    {
      id: 4,
      type: 'info',
      title: 'Thông báo bảo trì hệ thống',
      desc: 'Hệ thống Dashoard sẽ được tối ưu hóa vào lúc 01:00 AM ngày 11/04.',
      time: '3 giờ trước',
      read: true,
      icon: Info,
      color: 'bg-slate-500/10 text-slate-600 border-slate-500/20'
    }
  ];

  const filtered = filter === 'all' ? notifications : notifications.filter(n => !n.read);

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Bell className="text-primary" size={28} />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Quản lý và theo dõi các cảnh báo thiên tai theo thời gian thực.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl h-10 px-4 font-bold border-border bg-card">
            <CheckCheck size={16} className="mr-2" />
            {t('markAllRead')}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-destructive hover:bg-destructive/10">
            <Trash2 size={18} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              placeholder="Tìm thông báo..." 
              className="pl-10 h-10 bg-card border-border rounded-xl focus-visible:ring-primary/20"
            />
          </div>

          <div className="space-y-1">
            <Button 
              variant={filter === 'all' ? 'secondary' : 'ghost'} 
              className={cn("w-full justify-start font-bold rounded-xl h-11", filter === 'all' ? "bg-primary/10 text-primary hover:bg-primary/20" : "")}
              onClick={() => setFilter('all')}
            >
              <Bell size={18} className="mr-3" />
              Tất cả
              <Badge variant="secondary" className="ml-auto bg-background/50 border-none px-2 shadow-none">4</Badge>
            </Button>
            <Button 
              variant={filter === 'unread' ? 'secondary' : 'ghost'} 
              className={cn("w-full justify-start font-bold rounded-xl h-11", filter === 'unread' ? "bg-primary/10 text-primary hover:bg-primary/20" : "")}
              onClick={() => setFilter('unread')}
            >
              <div className="w-2 h-2 rounded-full bg-primary mr-3.5 ml-1" />
              Chưa đọc
              <Badge variant="secondary" className="ml-auto bg-background/50 border-none px-2 shadow-none">2</Badge>
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="lg:col-span-3">
          <Card className="border-border shadow-sm overflow-hidden bg-card/50">
            <ScrollArea className="h-[calc(100vh-280px)]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                  <Loader2 className="animate-spin text-primary" size={32} />
                  <p className="text-sm font-bold text-muted-foreground">{t('loading')}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Bell className="text-muted-foreground opacity-20" size={32} />
                  </div>
                  <h3 className="text-lg font-bold">{t('noNotifications')}</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                    Bạn hiện không có bất kỳ thông báo nào. Mọi tin tức mới nhất sẽ xuất hiện ở đây.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filtered.map((item) => (
                    <div 
                      key={item.id} 
                      className={cn(
                        "p-6 transition-all hover:bg-muted/30 flex gap-5 group cursor-pointer",
                        !item.read && "bg-primary/[0.02]"
                      )}
                    >
                      <div className={cn("shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border", item.color)}>
                        <item.icon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <h3 className={cn("text-base truncate", !item.read ? "font-black text-foreground" : "font-semibold text-muted-foreground")}>
                            {item.title}
                          </h3>
                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 shrink-0 whitespace-nowrap uppercase tracking-wider">
                            <Clock size={12} />
                            {item.time}
                          </span>
                        </div>
                        <p className={cn("text-sm leading-relaxed line-clamp-2", !item.read ? "text-muted-foreground" : "text-muted-foreground/60")}>
                          {item.desc}
                        </p>
                        {!item.read && (
                          <div className="mt-4 flex items-center gap-2">
                            <Button size="sm" variant="outline" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                              Xem chi tiết
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider text-primary">
                              Đánh dấu đã đọc
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 self-center">
                        <ChevronRight className="opacity-0 group-hover:opacity-100 transition-all text-muted-foreground" size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
