'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, AlertTriangle, Users, HeartPulse,
  Droplets, Activity, BarChart3, PieChart, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StatCard {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
}

interface Incident {
  id: number;
  title: string;
  severity: string;
  status: string;
  created_at: string;
}

interface Alert {
  id: number;
  title: string;
  severity: string;
  created_at: string;
}

export default function AnalyticsPage() {
  const t = useTranslations('dashboard');
  const [period, setPeriod] = React.useState('7d');
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    totalIncidents: 0,
    activeIncidents: 0,
    activeRescues: 0,
    flooded: 0,
  });
  const [incidents, setIncidents] = React.useState<Incident[]>([]);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const api = (await import('@/lib/api')).default;
        const [statsRes, incidentsRes, alertsRes] = await Promise.allSettled([
          api.get('/analytics/overview', { params: { period } }),
          api.get('/incidents', { params: { per_page: 10 } }),
          api.get('/alerts', { params: { per_page: 10 } }),
        ]);

        if (statsRes.status === 'fulfilled') {
          const data = statsRes.value.data?.data;
          if (data) {
            setStats({
              totalIncidents: data.incidents?.total ?? 0,
              activeIncidents: data.incidents?.active ?? 0,
              activeRescues: data.rescue_requests?.pending ?? 0,
              flooded: data.flood_zones?.flooded ?? 0,
            });
          }
        }
        if (incidentsRes.status === 'fulfilled') {
          setIncidents(incidentsRes.value.data?.data ?? []);
        }
        if (alertsRes.status === 'fulfilled') {
          setAlerts(alertsRes.value.data?.data ?? []);
        }
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const statCards: StatCard[] = [
    { title: 'Tổng sự cố', value: stats.totalIncidents, change: 12, icon: AlertTriangle, color: 'text-red-500 bg-red-100' },
    { title: 'Sự cố đang xử lý', value: stats.activeIncidents, change: -5, icon: Activity, color: 'text-orange-500 bg-orange-100' },
    { title: 'Yêu cầu cứu hộ', value: stats.activeRescues, icon: HeartPulse, color: 'text-blue-500 bg-blue-100' },
    { title: 'Khu vực ngập lụt', value: stats.flooded, change: -8, icon: Droplets, color: 'text-cyan-500 bg-cyan-100' },
  ];

  return (
    <div className="h-full overflow-auto p-6 space-y-6 custom-scroll">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Phân tích & Thống kê</h1>
          <p className="text-sm text-muted-foreground">Tổng quan về tình hình lũ lụt</p>
        </div>
        <Select value={period} onValueChange={(v) => v && setPeriod(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">24 giờ qua</SelectItem>
            <SelectItem value="7d">7 ngày</SelectItem>
            <SelectItem value="30d">30 ngày</SelectItem>
            <SelectItem value="90d">90 ngày</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon size={20} />
                  </div>
                  {stat.change !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${stat.change >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {stat.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {Math.abs(stat.change)}%
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="incidents">Sự cố</TabsTrigger>
          <TabsTrigger value="alerts">Cảnh báo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Incidents by Severity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <PieChart size={18} />
                  Sự cố theo mức độ nghiêm trọng
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-48 bg-muted rounded-lg animate-pulse" />
                ) : (
                  <div className="space-y-3">
                    {[
                      { label: 'Nghiêm trọng', value: 12, color: 'bg-red-500', percent: 30 },
                      { label: 'Cao', value: 18, color: 'bg-orange-500', percent: 45 },
                      { label: 'Trung bình', value: 8, color: 'bg-yellow-500', percent: 20 },
                      { label: 'Thấp', value: 2, color: 'bg-blue-500', percent: 5 },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{item.label}</span>
                          <span className="font-medium">{item.value}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all`}
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Incidents by Day */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BarChart3 size={18} />
                  Sự cố theo ngày
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-48 bg-muted rounded-lg animate-pulse" />
                ) : (
                  <div className="flex items-end justify-between h-40 gap-2">
                    {[65, 45, 80, 55, 90, 70, 85].map((value, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-primary/20 rounded-t-lg hover:bg-primary/30 transition-colors"
                          style={{ height: `${value}%` }}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Sự cố gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : incidents.length > 0 ? (
                <div className="space-y-3">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
                      <div className={`w-3 h-3 rounded-full ${
                        incident.severity === 'critical' ? 'bg-red-500' :
                        incident.severity === 'high' ? 'bg-orange-500' :
                        incident.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{incident.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(incident.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">{incident.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Không có sự cố nào</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Cảnh báo gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
                      <div className={`w-3 h-3 rounded-full ${
                        alert.severity === 'critical' ? 'bg-red-500' :
                        alert.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">{alert.severity}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Không có cảnh báo nào</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
