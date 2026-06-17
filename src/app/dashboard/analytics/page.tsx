'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, AlertTriangle, HeartPulse,
  Droplets, Activity, BrainCircuit, Waves, CloudRain,
  MapPin, Clock, Info, PieChart as PieChartIcon
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
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { useTranslations } from 'next-intl';

interface StatCard {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  iconClass: string;
  gradient: string;
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

interface AnalyticsOverview {
  incidents?: {
    total?: number;
    active?: number;
    critical?: number;
    resolution_rate?: number;
    distribution?: Record<string, number>;
    trend_7d?: Array<{ date: string; count: number }>;
  };
  rescue_requests?: {
    pending?: number;
    critical?: number;
  };
  flood_zones?: {
    flooded?: number;
    alert?: number;
    top_water_levels?: Array<{
      id: number;
      name: string;
      water_level_m?: number | string | null;
      risk_level?: string;
      status?: string;
    }>;
  };
  rescue_teams?: {
    available?: number;
  };
}

interface FloodReportFeature {
  id?: number | string;
  properties?: {
    street_name?: string | null;
    ward_name?: string | null;
    district_name?: string | null;
    water_level_cm?: number | string | null;
  };
}

type ApiListPayload<T> = {
  data?: {
    data?: T[];
  } | T[];
};

type TooltipEntry = {
  color?: string;
  name?: string;
  value?: string | number;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
};

const getListData = <T,>(payload: ApiListPayload<T>): T[] => {
  const data = Array.isArray(payload.data) ? payload.data : payload.data?.data ?? [];
  return Array.isArray(data) ? data : [];
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const listKey = (prefix: string, id: unknown, index: number) => {
  const normalizedId = String(id ?? '').trim();
  return normalizedId ? `${prefix}-${normalizedId}` : `${prefix}-fallback-${index}`;
};

const SEVERITY_COLORS = {
  critical: '#f04438', // danger/red from DESIGN.md
  high: '#f79009', // warning/orange from DESIGN.md
  medium: '#eab308', // yellow-500
  low: '#7a5af8', // primary/purple from DESIGN.md
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-xl">
        <p className="text-sm font-semibold mb-2 text-slate-800 dark:text-slate-100">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }} 
              />
              <span className="text-slate-500 dark:text-slate-400 font-medium">{entry.name}:</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const t = useTranslations('dashboard.analytics');
  const tEnum = useTranslations('enums');

  const [period, setPeriod] = React.useState('7d');
  const [loading, setLoading] = React.useState(true);
  const [overview, setOverview] = React.useState<AnalyticsOverview | null>(null);
  const [stats, setStats] = React.useState({
    totalIncidents: 0,
    activeIncidents: 0,
    activeRescues: 0,
    flooded: 0,
  });
  const [incidents, setIncidents] = React.useState<Incident[]>([]);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [floodReports, setFloodReports] = React.useState<FloodReportFeature[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const api = (await import('@/lib/api')).default;
        const [statsRes, incidentsRes, alertsRes, reportsRes] = await Promise.allSettled([
          api.get('/analytics/overview', { params: { period } }),
          api.get('/incidents', { params: { per_page: 10 } }),
          api.get('/alerts', { params: { per_page: 10 } }),
          api.get('/map/flood-reports'),
        ]);

        const reports: FloodReportFeature[] = reportsRes.status === 'fulfilled'
          ? reportsRes.value.data?.features ?? []
          : [];
        const nextIncidents = incidentsRes.status === 'fulfilled'
          ? getListData<Incident>(incidentsRes.value)
          : [];
        const nextAlerts = alertsRes.status === 'fulfilled'
          ? getListData<Alert>(alertsRes.value)
          : [];

        setFloodReports(reports);
        setIncidents(nextIncidents);
        setAlerts(nextAlerts);

        if (statsRes.status === 'fulfilled') {
          const data: AnalyticsOverview | undefined = statsRes.value.data?.data;
          if (data) {
            setOverview(data);
            setStats({
              totalIncidents: data.incidents?.total || nextIncidents.length || reports.length,
              activeIncidents: data.incidents?.active || nextIncidents.filter((incident) => !['resolved', 'closed'].includes(incident.status)).length,
              activeRescues: data.rescue_requests?.pending ?? 0,
              flooded: data.flood_zones?.flooded || reports.length,
            });
          }
        } else {
          setOverview(null);
          setStats({
            totalIncidents: nextIncidents.length || reports.length,
            activeIncidents: nextIncidents.filter((incident) => !['resolved', 'closed'].includes(incident.status)).length,
            activeRescues: 0,
            flooded: reports.length,
          });
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const statCards: StatCard[] = [
    { 
      title: t('totalIncidents'), 
      value: stats.totalIncidents, 
      icon: Waves, 
      iconClass: 'bg-cyan-50 text-cyan-600 border border-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-500/20', 
      gradient: 'from-cyan-500/5 to-cyan-500/0 dark:from-cyan-500/10 dark:to-cyan-500/0' 
    },
    { 
      title: t('activeIncidents'), 
      value: stats.activeIncidents, 
      icon: Activity, 
      iconClass: 'bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-500/20', 
      gradient: 'from-orange-500/5 to-orange-500/0 dark:from-orange-500/10 dark:to-orange-500/0' 
    },
    { 
      title: t('activeRescues'), 
      value: stats.activeRescues, 
      icon: HeartPulse, 
      iconClass: 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-500/20', 
      gradient: 'from-rose-500/5 to-rose-500/0 dark:from-rose-500/10 dark:to-rose-500/0' 
    },
    { 
      title: t('alertZones'), 
      value: stats.flooded, 
      icon: AlertTriangle, 
      iconClass: 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-500/20', 
      gradient: 'from-amber-500/5 to-amber-500/0 dark:from-amber-500/10 dark:to-amber-500/0' 
    },
  ];

  const severityCounts = React.useMemo(() => {
    const fromOverview = overview?.incidents?.distribution ?? {};
    const counts = {
      critical: toNumber(fromOverview.critical),
      high: toNumber(fromOverview.high),
      medium: toNumber(fromOverview.medium),
      low: toNumber(fromOverview.low),
    };

    if (Object.values(counts).some(Boolean)) return counts;

    incidents.forEach((incident) => {
      const key = incident.severity as keyof typeof counts;
      if (key in counts) counts[key] += 1;
    });

    if (Object.values(counts).some(Boolean)) return counts;

    floodReports.forEach((report) => {
      const levelCm = toNumber(report.properties?.water_level_cm);
      if (levelCm >= 75) counts.critical += 1;
      else if (levelCm >= 50) counts.high += 1;
      else if (levelCm >= 25) counts.medium += 1;
      else counts.low += 1;
    });

    return counts;
  }, [floodReports, incidents, overview]);

  const getSeverityLabel = (key: string) => {
    try {
      return tEnum(`severity.${key}`);
    } catch {
      return key;
    }
  };

  const pieData = [
    { name: getSeverityLabel('critical'), value: severityCounts.critical, color: SEVERITY_COLORS.critical },
    { name: getSeverityLabel('high'), value: severityCounts.high, color: SEVERITY_COLORS.high },
    { name: getSeverityLabel('medium'), value: severityCounts.medium, color: SEVERITY_COLORS.medium },
    { name: getSeverityLabel('low'), value: severityCounts.low, color: SEVERITY_COLORS.low },
  ].filter(item => item.value > 0);

  const trendData = React.useMemo(() => {
    const trend = overview?.incidents?.trend_7d ?? [];
    if (trend.length > 0) {
      return trend.slice(-7).map((item) => ({
        name: new Date(item.date).toLocaleDateString('vi-VN', { weekday: 'short' }),
        value: toNumber(item.count),
      }));
    }

    const buckets = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return {
        dateKey: date.toISOString().slice(0, 10),
        name: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
        value: 0,
      };
    });

    incidents.forEach((incident) => {
      const key = new Date(incident.created_at).toISOString().slice(0, 10);
      const bucket = buckets.find((item) => item.dateKey === key);
      if (bucket) bucket.value += 1;
    });

    if (!buckets.some((item) => item.value) && floodReports.length > 0) {
      buckets[buckets.length - 1].value = floodReports.length;
    }

    return buckets;
  }, [floodReports.length, incidents, overview]);

  const topWaterLevels = React.useMemo(() => {
    const zones = overview?.flood_zones?.top_water_levels ?? [];
    if (zones.length > 0) {
      return zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        levelM: toNumber(zone.water_level_m),
        sub: zone.risk_level || zone.status || 'Theo dõi',
      }));
    }

    return floodReports
      .slice()
      .sort((a, b) => toNumber(b.properties?.water_level_cm) - toNumber(a.properties?.water_level_cm))
      .slice(0, 5)
      .map((report, index) => ({
        id: report.id ?? index,
        name: report.properties?.street_name || report.properties?.ward_name || `Điểm ngập #${index + 1}`,
        levelM: toNumber(report.properties?.water_level_cm) / 100,
        sub: report.properties?.district_name || 'Đà Nẵng',
      }));
  }, [floodReports, overview]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 bg-slate-50/50 dark:bg-[#0f0d18] relative overflow-x-hidden text-foreground">
      {/* Decorative Aurora Glow blobs */}
      <div className="fixed top-0 left-1/4 w-[50vw] h-[50vh] bg-brand-200/20 dark:bg-brand-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[40vw] h-[40vh] bg-cyan-200/20 dark:bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      {/* Hero Header Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white/70 dark:bg-slate-900/30 backdrop-blur-2xl shadow-xl dark:shadow-2xl p-8"
      >
        <div className="absolute -bottom-20 -right-20 opacity-5 dark:opacity-10 pointer-events-none text-slate-800 dark:text-white">
          <BrainCircuit size={250} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative flex h-5 w-5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-50"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500 shadow-[0_0_10px_#7a5af8]"></span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-cyan-600 to-indigo-600 dark:from-brand-400 dark:via-cyan-400 dark:to-indigo-400 drop-shadow-sm">
                {t('title')}
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl font-light">
              {t('description')}
            </p>
          </div>
          
          <div className="flex items-center bg-slate-100/80 dark:bg-slate-900/50 rounded-2xl p-2 border border-slate-200/60 dark:border-white/10 backdrop-blur-xl shrink-0">
            <Clock className="w-5 h-5 ml-3 mr-1 text-slate-500 dark:text-slate-400" />
            <Select value={period} onValueChange={(v) => v && setPeriod(v)}>
              <SelectTrigger className="w-[180px] border-none shadow-none focus:ring-0 bg-transparent text-slate-800 dark:text-slate-100 font-bold">
                <SelectValue>
                  {period === '24h' ? t('period24h') :
                   period === '7d' ? t('period7d') :
                   period === '30d' ? t('period30d') :
                   period === '90d' ? t('period90d') :
                   period}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-white/10">
                <SelectItem value="24h">{t('period24h')}</SelectItem>
                <SelectItem value="7d">{t('period7d')}</SelectItem>
                <SelectItem value="30d">{t('period30d')}</SelectItem>
                <SelectItem value="90d">{t('period90d')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* KPIs Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map((stat) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <Card className="relative overflow-hidden border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/30 backdrop-blur-xl shadow-lg dark:shadow-xl hover:shadow-2xl hover:border-brand-200 dark:hover:border-white/10 transition-all duration-500 group rounded-3xl h-full">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100/30 dark:bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-slate-200/30 dark:group-hover:bg-white/10 transition-colors duration-700" />
              
              <CardContent className="p-6 relative z-10 flex flex-col h-full justify-between gap-6">
                <div className="flex items-start justify-between">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner ${stat.iconClass}`}>
                    <stat.icon size={28} strokeWidth={1.5} />
                  </div>
                  {stat.change !== undefined && (
                    <Badge variant={stat.change >= 0 ? "destructive" : "default"} className="bg-slate-100/50 dark:bg-black/30 border border-slate-200/40 dark:border-white/5 backdrop-blur-md">
                      {stat.change >= 0 ? <TrendingUp size={14} className="mr-1.5 text-red-500" /> : <TrendingDown size={14} className="mr-1.5 text-emerald-500" />}
                      <span className="font-bold text-slate-800 dark:text-slate-200">{Math.abs(stat.change)}%</span>
                    </Badge>
                  )}
                </div>
                <div>
                  <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white drop-shadow-sm mb-1">
                    {loading ? <span className="animate-pulse opacity-50">--</span> : stat.value}
                  </h3>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        
        {/* Trend Area Chart (Spans 4 columns) */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="lg:col-span-4">
          <Card className="h-full border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/30 backdrop-blur-xl shadow-lg dark:shadow-xl rounded-3xl overflow-hidden group">
            <CardHeader className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 py-5">
              <CardTitle className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-slate-100">
                <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20">
                  <TrendingUp size={20} />
                </div>
                {t('trendTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-8">
              {loading ? (
                <div className="h-[320px] bg-slate-100/40 dark:bg-white/5 rounded-2xl animate-pulse" />
              ) : (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7a5af8" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#7a5af8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" strokeOpacity={0.12} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                        dy={15}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                        dx={-10}
                      />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(122,90,248,0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        name={t('totalIncidents')}
                        stroke="#7a5af8" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorIncidents)" 
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#7a5af8', style: { filter: 'drop-shadow(0px 0px 8px rgba(122,90,248,0.8))' } }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Severity Pie Chart (Spans 2 columns) */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="lg:col-span-2">
          <Card className="h-full border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/30 backdrop-blur-xl shadow-lg dark:shadow-xl rounded-3xl overflow-hidden group">
            <CardHeader className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 py-5">
              <CardTitle className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-slate-100">
                <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20">
                  <PieChartIcon size={20} />
                </div>
                {t('severityTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="h-[320px] bg-slate-100/40 dark:bg-white/5 rounded-2xl animate-pulse" />
              ) : pieData.length > 0 ? (
                <div className="h-[320px] w-full flex flex-col items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="rgba(0,0,0,0.05)"
                        strokeWidth={2}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 4px 8px ${entry.color}25)` }} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={40} 
                        iconType="circle"
                        formatter={(value) => <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{value}</span>}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                    <span className="text-4xl font-black text-slate-900 dark:text-white drop-shadow-sm">{pieData.reduce((a,b) => a+b.value, 0)}</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{t('total')}</span>
                  </div>
                </div>
              ) : (
                <div className="h-[320px] flex items-center justify-center text-slate-500 dark:text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-200 dark:border-white/5 border-dashed">
                  {t('insufficientData')}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Water Levels (Spans 6 columns) */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="lg:col-span-6">
          <Card className="border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/30 backdrop-blur-xl shadow-lg dark:shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 flex flex-row items-center justify-between py-5">
              <CardTitle className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-slate-100">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                  <Droplets size={20} />
                </div>
                {t('topWaterTitle')}
              </CardTitle>
              <Badge variant="outline" className="font-bold bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 px-3 py-1.5 rounded-xl shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse mr-2" />
                {t('realtimeBadge')}
              </Badge>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-100/40 dark:bg-white/5 rounded-2xl animate-pulse" />)}
                </div>
              ) : topWaterLevels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {topWaterLevels.map((item, i) => {
                    const percent = Math.min(100, Math.max(5, Math.round((item.levelM / 2.5) * 100)));
                    const isCritical = item.levelM >= 1.0;
                    const isWarning = item.levelM >= 0.5 && item.levelM < 1.0;
                    
                    let barColor = "bg-blue-500";
                    let shadowColor = "shadow-blue-500/20";
                    let textColor = "text-blue-600 dark:text-blue-400";
                    let glowClass = "border-slate-100 dark:border-white/5";

                    if (isCritical) { 
                      barColor = "bg-red-500"; 
                      shadowColor = "shadow-red-500/30"; 
                      textColor = "text-red-600 dark:text-red-400";
                      glowClass = "shadow-[0_0_15px_rgba(239,68,68,0.08)] border-red-200 dark:border-red-500/30 bg-red-50/20 dark:bg-red-950/5";
                    } else if (isWarning) { 
                      barColor = "bg-amber-500"; 
                      shadowColor = "shadow-amber-500/30"; 
                      textColor = "text-amber-600 dark:text-amber-400";
                      glowClass = "border-amber-200 dark:border-amber-500/20";
                    }

                    return (
                      <motion.div 
                        key={listKey('water-level', item.id, i)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05, type: "spring" }}
                        className={`rounded-2xl p-5 border ${glowClass} relative overflow-hidden group bg-slate-50/60 dark:bg-slate-950/30 hover:bg-slate-100/50 dark:hover:bg-slate-900/20 transition-all duration-300`}
                      >
                        {isCritical && (
                          <div className="absolute -top-10 -right-10 w-20 h-20 bg-red-500/10 dark:bg-red-500/5 blur-xl rounded-full pointer-events-none" />
                        )}
                        
                        <div className="flex items-start gap-3 mb-5">
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-400 shadow-sm">
                            <MapPin size={16} />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <h4 className="font-bold text-base truncate text-slate-800 dark:text-slate-100" title={item.name}>{item.name}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-semibold mt-0.5">{item.sub}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('waterLevelUpper')}</span>
                            <span className={`text-2xl font-black ${textColor} drop-shadow-sm`}>
                              {item.levelM.toFixed(2)}<span className="text-sm font-bold ml-1 opacity-80">m</span>
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/30 dark:border-white/5 shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 1.5, ease: "easeOut", delay: i * 0.05 + 0.1 }}
                              className={`h-full rounded-full ${barColor} shadow-lg ${shadowColor}`} 
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                  <Info className="mb-3 opacity-40 text-slate-400" size={36} />
                  <p className="font-semibold">{t('noSignificantFlood')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs Section for Details (Incidents & Alerts) */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible" className="pt-4">
        <Tabs defaultValue="incidents" className="space-y-6">
          <TabsList className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 p-1 rounded-2xl h-auto flex flex-wrap gap-2 w-fit">
            <TabsTrigger value="incidents" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold text-slate-600 dark:text-slate-400 transition-all">
              {t('tabIncidents', { count: incidents.length })}
            </TabsTrigger>
            <TabsTrigger value="alerts" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold text-slate-600 dark:text-slate-400 transition-all">
              {t('tabAlerts')}
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent key="incidents-panel" value="incidents" className="m-0">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/30 backdrop-blur-xl shadow-lg dark:shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 py-5">
                    <CardTitle className="text-lg font-bold flex items-center justify-between text-slate-900 dark:text-slate-100">
                      <span className="flex items-center gap-2">
                        <Activity size={18} className="text-brand-500"/> 
                        {t('incidentsListTitle')}
                      </span>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-200 font-bold px-3 py-1 rounded-lg">
                        {t('eventsCount', { count: incidents.length })}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="p-6 space-y-4">
                        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100/40 dark:bg-white/5 rounded-2xl animate-pulse" />)}
                      </div>
                    ) : incidents.length > 0 ? (
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {incidents.map((incident, i) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            key={listKey('incident', incident.id, i)}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className={`w-3 h-3 rounded-full flex-shrink-0 shadow-lg ${
                                incident.severity === 'critical' ? 'bg-red-500 shadow-red-500/30' :
                                incident.severity === 'high' ? 'bg-orange-500 shadow-orange-500/30' :
                                incident.severity === 'medium' ? 'bg-amber-500 shadow-amber-500/30' : 'bg-blue-500 shadow-blue-500/30'
                              }`} />
                              <div className="min-w-0">
                                <p className="font-bold text-base text-slate-800 dark:text-slate-100">{incident.title}</p>
                                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                  <Clock size={12} />
                                  {new Date(incident.created_at).toLocaleString('vi-VN')}
                                </div>
                              </div>
                            </div>
                            <Badge 
                              variant={incident.status === 'resolved' ? 'outline' : 'default'} 
                              className={`capitalize px-3 py-1 text-xs font-bold shrink-0 rounded-lg ${
                                incident.status === 'resolved' 
                                  ? 'border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400' 
                                  : 'bg-brand-500 text-white hover:bg-brand-600'
                              }`}
                            >
                              {incident.status === 'resolved' ? t('statusResolved') : t('statusOpen')}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
                        <CloudRain className="mb-4 opacity-30 text-slate-400" size={56} />
                        <p className="font-bold text-lg">{t('noIncidents')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent key="alerts-panel" value="alerts" className="m-0">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/30 backdrop-blur-xl shadow-lg dark:shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 py-5">
                    <CardTitle className="text-lg font-bold flex items-center justify-between text-slate-900 dark:text-slate-100">
                      <span className="flex items-center gap-2">
                        <AlertTriangle size={18} className="text-red-500"/> 
                        {t('alertsListTitle')}
                      </span>
                      {alerts.length > 0 && (
                        <div className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="p-6 space-y-4">
                        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100/40 dark:bg-white/5 rounded-2xl animate-pulse" />)}
                      </div>
                    ) : alerts.length > 0 ? (
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {alerts.map((alert, i) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            key={listKey('alert', alert.id, i)}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className={`p-2.5 rounded-xl border shrink-0 ${
                                alert.severity === 'critical' 
                                  ? 'text-red-600 bg-red-50 border-red-150 dark:text-red-400 dark:bg-red-950/30 dark:border-red-500/20' 
                                  : alert.severity === 'high' 
                                    ? 'text-orange-600 bg-orange-50 border-orange-150 dark:text-orange-400 dark:bg-orange-950/30 dark:border-orange-500/20' 
                                    : 'text-amber-600 bg-amber-50 border-amber-150 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-500/20'
                              }`}>
                                <AlertTriangle size={20} strokeWidth={2} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-base text-slate-800 dark:text-slate-100 leading-snug">{alert.title}</p>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                                  <Clock size={12}/>
                                  {new Date(alert.created_at).toLocaleString('vi-VN')}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`shrink-0 border px-3 py-1 text-xs font-bold rounded-lg ${
                                 alert.severity === 'critical' ? 'border-red-200 text-red-600 bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:bg-red-500/10' :
                                 alert.severity === 'high' ? 'border-orange-200 text-orange-600 bg-orange-50 dark:border-orange-500/30 dark:text-orange-400 dark:bg-orange-500/10' : 
                                 'border-amber-200 text-amber-600 bg-amber-50 dark:border-amber-500/30 dark:text-amber-400 dark:bg-amber-500/10'
                              }`}
                            >
                              {t('severityLevel', { level: getSeverityLabel(alert.severity) })}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
                        <HeartPulse className="mb-4 opacity-30 text-slate-400" size={56} />
                        <p className="font-bold text-lg">{t('noAlerts')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </div>
  );
}
