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

interface StatCard {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  colorClass: string;
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

const severityLabel = (severity: string) => {
  switch (severity) {
    case 'critical': return 'Nghiêm trọng';
    case 'high': return 'Cao';
    case 'medium': return 'Trung bình';
    case 'low': return 'Thấp';
    default: return severity || 'Khác';
  }
};

const SEVERITY_COLORS = {
  critical: '#ef4444', // red-500
  high: '#f97316', // orange-500
  medium: '#eab308', // yellow-500
  low: '#3b82f6', // blue-500
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl">
        <p className="text-sm font-semibold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name || 'Số lượng'}:</span>
            <span className="font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
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
      title: 'Tổng sự cố ngập lụt', 
      value: stats.totalIncidents, 
      icon: Waves, 
      colorClass: 'text-blue-500', 
      gradient: 'from-blue-500/20 to-blue-500/5' 
    },
    { 
      title: 'Sự cố đang xử lý', 
      value: stats.activeIncidents, 
      icon: Activity, 
      colorClass: 'text-orange-500', 
      gradient: 'from-orange-500/20 to-orange-500/5' 
    },
    { 
      title: 'Yêu cầu cứu hộ khẩn', 
      value: stats.activeRescues, 
      icon: HeartPulse, 
      colorClass: 'text-red-500', 
      gradient: 'from-red-500/20 to-red-500/5' 
    },
    { 
      title: 'Khu vực cảnh báo', 
      value: stats.flooded, 
      icon: AlertTriangle, 
      colorClass: 'text-yellow-500', 
      gradient: 'from-yellow-500/20 to-yellow-500/5' 
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

  const pieData = [
    { name: severityLabel('critical'), value: severityCounts.critical, color: SEVERITY_COLORS.critical },
    { name: severityLabel('high'), value: severityCounts.high, color: SEVERITY_COLORS.high },
    { name: severityLabel('medium'), value: severityCounts.medium, color: SEVERITY_COLORS.medium },
    { name: severityLabel('low'), value: severityCounts.low, color: SEVERITY_COLORS.low },
  ].filter(item => item.value > 0);

  const trendData = React.useMemo(() => {
    const trend = overview?.incidents?.trend_7d ?? [];
    if (trend.length > 0) {
      return trend.slice(-7).map((item) => ({
        name: new Date(item.date).toLocaleDateString('vi-VN', { weekday: 'short' }),
        'Sự cố': toNumber(item.count),
      }));
    }

    const buckets = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return {
        dateKey: date.toISOString().slice(0, 10),
        name: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
        'Sự cố': 0,
      };
    });

    incidents.forEach((incident) => {
      const key = new Date(incident.created_at).toISOString().slice(0, 10);
      const bucket = buckets.find((item) => item.dateKey === key);
      if (bucket) bucket['Sự cố'] += 1;
    });

    if (!buckets.some((item) => item['Sự cố']) && floodReports.length > 0) {
      buckets[buckets.length - 1]['Sự cố'] = floodReports.length;
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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-full h-auto p-4 md:p-8 space-y-8 bg-background relative overflow-x-hidden">
      {/* Background decorations for Smart City vibe */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      {/* Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-lg p-6 md:p-8"
      >
        <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none">
          <BrainCircuit size={180} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
                AegisFlow AI Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Hệ thống giám sát, dự báo ngập lụt và tối ưu phân bổ cứu trợ theo thời gian thực tại Đà Nẵng.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-background/50 rounded-full p-1.5 pr-4 border border-border/50 backdrop-blur-md">
            <Select value={period} onValueChange={(v) => v && setPeriod(v)}>
              <SelectTrigger className="w-[160px] border-none shadow-none focus:ring-0 bg-transparent h-9">
                <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 giờ qua</SelectItem>
                <SelectItem value="7d">7 ngày qua</SelectItem>
                <SelectItem value="30d">30 ngày qua</SelectItem>
                <SelectItem value="90d">90 ngày qua</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map((stat) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <Card className="relative overflow-hidden border-border/50 bg-card/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-background shadow-sm border border-border/50 flex items-center justify-center ${stat.colorClass} group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon size={24} />
                  </div>
                  {stat.change !== undefined && (
                    <Badge variant={stat.change >= 0 ? "destructive" : "default"} className="bg-opacity-20 text-xs">
                      {stat.change >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                      {Math.abs(stat.change)}%
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-bold tracking-tight">
                    {loading ? <span className="animate-pulse">--</span> : stat.value}
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-card/60 backdrop-blur-md border border-border/50 p-1">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Tổng quan AI
          </TabsTrigger>
          <TabsTrigger value="incidents" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Sự cố ({incidents.length})
          </TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Cảnh báo trực tiếp
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent key="overview-panel" value="overview" className="space-y-6 m-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Trend Chart */}
                <Card className="lg:col-span-2 border-border/50 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden">
                  <CardHeader className="border-b border-border/20 bg-background/20 pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <TrendingUp className="text-cyan-500" size={20} />
                      Xu hướng sự cố ngập lụt
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loading ? (
                      <div className="h-[300px] bg-muted/30 rounded-xl animate-pulse" />
                    ) : (
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                              dy={10}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Area 
                              type="monotone" 
                              dataKey="Sự cố" 
                              stroke="#06b6d4" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorIncidents)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Severity Pie Chart */}
                <Card className="border-border/50 bg-card/40 backdrop-blur-md shadow-lg">
                  <CardHeader className="border-b border-border/20 bg-background/20 pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <PieChartIcon className="text-orange-500" size={20} />
                      Phân bổ mức độ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loading ? (
                      <div className="h-[300px] bg-muted/30 rounded-xl animate-pulse" />
                    ) : pieData.length > 0 ? (
                      <div className="h-[300px] w-full flex flex-col items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="45%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Legend 
                              verticalAlign="bottom" 
                              height={36} 
                              iconType="circle"
                              formatter={(value) => <span className="text-sm font-medium text-foreground">{value}</span>}
                            />
                          </RePieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                          <span className="text-3xl font-bold">{pieData.reduce((a,b) => a+b.value, 0)}</span>
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Tổng</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Không đủ dữ liệu
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Water Levels */}
                <Card className="lg:col-span-3 border-border/50 bg-card/40 backdrop-blur-md shadow-lg">
                  <CardHeader className="border-b border-border/20 bg-background/20 pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Droplets className="text-blue-500" size={20} />
                        Điểm ngập nghiêm trọng nhất
                      </div>
                      <Badge variant="secondary" className="font-normal">Real-time update</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}
                      </div>
                    ) : topWaterLevels.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {topWaterLevels.map((item, i) => {
                          const percent = Math.min(100, Math.max(5, Math.round((item.levelM / 2.5) * 100)));
                          const isCritical = item.levelM >= 1.0;
                          const isWarning = item.levelM >= 0.5 && item.levelM < 1.0;
                          
                          let barColor = "bg-blue-500";
                          let shadowColor = "shadow-blue-500/50";
                          if (isCritical) { barColor = "bg-red-500"; shadowColor = "shadow-red-500/50"; }
                          else if (isWarning) { barColor = "bg-orange-500"; shadowColor = "shadow-orange-500/50"; }

                          return (
                            <motion.div 
                              key={listKey('water-level', item.id, i)}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className="bg-background/50 rounded-2xl p-5 border border-border/50 shadow-sm relative overflow-hidden group hover:border-primary/50 transition-colors"
                            >
                              {/* Pulsing indicator for critical */}
                              {isCritical && (
                                <span className="absolute top-4 right-4 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                              )}
                              
                              <div className="flex items-start gap-3 mb-4">
                                <div className={`p-2 rounded-xl bg-background border border-border/50 ${isCritical ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-blue-500'}`}>
                                  <MapPin size={18} />
                                </div>
                                <div className="flex-1 min-w-0 pr-6">
                                  <h4 className="font-semibold text-base truncate" title={item.name}>{item.name}</h4>
                                  <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mực nước</span>
                                  <span className={`text-2xl font-bold ${isCritical ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-blue-500'}`}>
                                    {item.levelM.toFixed(2)}<span className="text-sm font-medium ml-1">m</span>
                                  </span>
                                </div>
                                <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden border border-border/30">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percent}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-full rounded-full ${barColor} shadow-lg ${shadowColor}`} 
                                  />
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-background/30 rounded-2xl border border-dashed border-border/50">
                        <Info className="mb-2 opacity-50" size={32} />
                        <p>Hệ thống chưa ghi nhận ngập lụt đáng kể</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent key="incidents-panel" value="incidents" className="m-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-border/50 bg-card/40 backdrop-blur-md shadow-lg">
                <CardHeader className="border-b border-border/20 bg-background/20 pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    <span>Danh sách sự cố ngập lụt & cứu hộ</span>
                    <Badge variant="outline">{incidents.length} sự kiện</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-6 space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : incidents.length > 0 ? (
                    <div className="divide-y divide-border/20">
                      {incidents.map((incident, i) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={listKey('incident', incident.id, i)}
                          className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 shadow-sm ${
                            incident.severity === 'critical' ? 'bg-red-500 shadow-red-500/50' :
                            incident.severity === 'high' ? 'bg-orange-500 shadow-orange-500/50' :
                            incident.severity === 'medium' ? 'bg-yellow-500 shadow-yellow-500/50' : 'bg-blue-500 shadow-blue-500/50'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{incident.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock size={12} />
                              {new Date(incident.created_at).toLocaleString('vi-VN')}
                            </div>
                          </div>
                          <Badge variant={incident.status === 'resolved' ? 'secondary' : 'default'} className="capitalize shrink-0">
                            {incident.status === 'resolved' ? 'Đã xử lý' : 'Đang mở'}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <CloudRain className="mb-3 opacity-30" size={48} />
                      <p>Hiện không có sự cố nào trong hệ thống</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent key="alerts-panel" value="alerts" className="m-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-border/50 bg-card/40 backdrop-blur-md shadow-lg">
                <CardHeader className="border-b border-border/20 bg-background/20 pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    <span>Nhật ký cảnh báo hệ thống</span>
                    {alerts.length > 0 && (
                      <span className="flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-6 space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : alerts.length > 0 ? (
                    <div className="divide-y divide-border/20">
                      {alerts.map((alert, i) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={listKey('alert', alert.id, i)}
                          className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className={`mt-1 p-2 rounded-lg bg-background border border-border/50 ${
                            alert.severity === 'critical' ? 'text-red-500' :
                            alert.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'
                          }`}>
                            <AlertTriangle size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm leading-tight">{alert.title}</p>
                            <p className="text-xs text-muted-foreground mt-1.5">
                              {new Date(alert.created_at).toLocaleString('vi-VN')}
                            </p>
                          </div>
                          <Badge variant="outline" className={`capitalize shrink-0 border ${
                             alert.severity === 'critical' ? 'border-red-500/50 text-red-500' :
                             alert.severity === 'high' ? 'border-orange-500/50 text-orange-500' : 'border-yellow-500/50 text-yellow-500'
                          }`}>
                            Mức {alert.severity}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <HeartPulse className="mb-3 opacity-30" size={48} />
                      <p>Hệ thống an toàn, không có cảnh báo mới</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
