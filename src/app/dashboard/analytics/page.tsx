'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { 
  AlertTriangle, 
  Activity, 
  HeartPulse, 
  Droplets,
  TrendingUp,
  BarChart3,
  Waves,
  RefreshCcw,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { IncidentTrendChart } from '@/components/analytics/IncidentTrendChart';
import { SeverityDistribution } from '@/components/analytics/SeverityDistribution';
import { WaterLevelBarChart } from '@/components/analytics/WaterLevelBarChart';
import { Badge } from '@/components/ui/badge';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/overview');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh data every 5 minutes or on custom event if needed
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Skeleton className="h-[400px] rounded-3xl" />
           <Skeleton className="h-[400px] rounded-3xl" />
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Sự cố Đang xử lý', value: data?.incidents?.active || 0, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Yêu cầu Cứu hộ', value: data?.rescue_requests?.pending || 0, icon: HeartPulse, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Vùng Nguy hiểm', value: data?.flood_zones?.flooded || 0, icon: Waves, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Tỷ lệ Giải quyết', value: `${data?.incidents?.resolution_rate}%`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8 bg-muted/10 min-h-full overflow-auto custom-scroll">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <BarChart3 className="text-primary" size={32} />
            Hệ thống Thống kê
          </h1>
          <p className="text-muted-foreground font-medium text-sm">Phân tích dữ liệu vận hành AegisFlow AI trực tuyến</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block mr-2">
             <div className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Cập nhật lần cuối</div>
             <div className="text-xs font-bold text-foreground">vừa xong</div>
          </div>
          <Button variant="outline" size="icon" onClick={fetchStats} className="rounded-xl shadow-sm">
             <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
             <Users size={18} />
             Hệ báo cáo
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-border shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl group">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <h3 className="text-3xl font-black">{kpi.value}</h3>
              </div>
              <div className={`p-4 rounded-2xl ${kpi.bg} ${kpi.color} group-hover:scale-110 transition-transform`}>
                <kpi.icon size={24} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <IncidentTrendChart data={data?.incidents?.trend_7d || []} />
        <SeverityDistribution data={data?.incidents?.distribution || {}} />
        <WaterLevelBarChart data={data?.flood_zones?.top_water_levels || []} />
        
        {/* Rescue Team Status Card */}
        <Card className="col-span-1 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
             <div className="space-y-1">
               <CardTitle className="text-base font-bold">Lực lượng Đáp ứng</CardTitle>
               <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Tình trạng các đội cứu hộ</CardDescription>
             </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
             <div className="flex items-center justify-between">
                <div className="space-y-1">
                   <span className="text-xs text-muted-foreground font-medium">Đang sẵn sàng</span>
                   <div className="text-3xl font-black text-emerald-500">{data?.rescue_teams?.available}</div>
                </div>
                <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                   <Activity size={32} className="text-emerald-500" />
                </div>
             </div>
             <div className="pt-4 border-t border-border">
                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-4">Phân bổ vùng trọng điểm</div>
                <div className="space-y-4">
                   {data?.flood_zones?.top_water_levels.slice(0, 3).map((zone: any) => (
                      <div key={zone.id} className="space-y-2">
                         <div className="flex justify-between items-center text-xs font-bold">
                            <span>{zone.name}</span>
                            <Badge variant={zone.water_level_m > 3 ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
                               {zone.water_level_m}m
                            </Badge>
                         </div>
                         <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                               className={`h-full ${zone.status === 'danger' ? 'bg-orange-500' : 'bg-rose-500'}`} 
                               style={{ width: `${Math.min((zone.water_level_m / 5) * 100, 100)}%` }}
                            />
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
