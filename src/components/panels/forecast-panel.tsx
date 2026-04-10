'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CloudRain, 
  Wind, 
  Droplets, 
  Thermometer, 
  TrendingUp, 
  AlertCircle,
  Clock,
  Waves
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function ForecastPanel() {
  const t = useTranslations('dashboard');

  const mainStats = [
    { icon: Droplets, label: 'Lượng mưa', value: '42mm', sub: '+12% vs t.qua', color: 'text-blue-500' },
    { icon: Waves, label: 'Mực nước', value: '3.8m', sub: 'Báo động II', color: 'text-orange-500' },
    { icon: Wind, label: 'Tốc độ gió', value: '24km/h', sub: 'Bắc - Đông Bắc', color: 'text-slate-500' },
    { icon: Thermometer, label: 'Nhiệt độ', value: '24°C', sub: 'Cảm giác 26°C', color: 'text-rose-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with AI Insight */}
      <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <TrendingUp size={80} className="rotate-12" />
        </div>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider">
              {t('aiInsight')}
            </Badge>
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          </div>
          <p className="text-sm font-medium leading-relaxed max-w-md">
            Mực nước sông Cẩm Lệ dự báo sẽ đạt đỉnh <span className="text-primary font-bold">4.2m</span> vào lúc 22:00 hôm nay. Khuyến cáo khu vực phường Hòa Thọ Tây chuẩn bị phương án sơ tán tại chỗ.
          </p>
        </CardContent>
      </Card>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-4">
        {mainStats.map((stat, i) => (
          <Card key={i} className="border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon size={18} />
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">{stat.label}</div>
              </div>
              <div className="text-2xl font-black">{stat.value}</div>
              <div className="text-[10px] font-medium text-muted-foreground mt-1">{stat.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Forecast Radar / Detailed Metrics */}
      <Card className="border-border shadow-sm">
        <CardHeader className="p-5 pb-0">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            {t('forecastRadar')}
            <Badge variant="secondary" className="text-[10px] font-medium">Hòa Thọ Tây</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground text-[10px] uppercase">Nguy cơ ngập lụt</span>
              <span className="text-orange-500">85%</span>
            </div>
            <Progress value={85} className="h-1.5 bg-muted" />
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2">
            {['14:00', '16:00', '18:00', '20:00'].map((time) => (
              <div key={time} className="text-center space-y-2 p-2 rounded-xl border border-border/50 bg-muted/30">
                <div className="text-[9px] font-bold text-muted-foreground">{time}</div>
                <CloudRain className="mx-auto text-blue-500" size={16} />
                <div className="text-xs font-bold">85%</div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-3">
            <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={16} />
            <div className="text-[11px] font-medium text-orange-700 leading-relaxed">
              Mưa lớn kéo dài 6 giờ qua đã làm bão hòa đất. Khả năng cao sẽ có ngập cục bộ tại các điểm trũng.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
