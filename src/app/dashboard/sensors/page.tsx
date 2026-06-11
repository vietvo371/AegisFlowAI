'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Activity, Droplets, Thermometer, Wind, Gauge, MapPin,
  Search, Plus, Eye, Bell, Battery, Wifi, WifiOff,
  ChevronLeft, ChevronRight, X, Calendar, Clock, BarChart2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Sensor {
  id: number;
  name: string;
  type: 'water_level' | 'rainfall' | 'wind' | 'humidity' | 'temperature' | 'combined';
  status: string;
  location?: string | { lat?: number | string | null; lng?: number | string | null } | null;
  latitude?: number;
  longitude?: number;
  unit?: string;
  metadata?: {
    station_label?: string;
    address?: string;
    latitude?: number | string;
    longitude?: number | string;
  } | null;
  readings: {
    water_level?: number;
    rainfall?: number;
    temperature?: number;
    humidity?: number;
    wind_speed?: number;
    pressure?: number;
  };
  battery?: number;
  last_reading?: string;
  zone?: string;
  district?: { id: number; name: string } | null;
  flood_zone?: { id: number; name: string } | null;
}

const TYPE_STYLE: Record<string, {
  icon: React.ElementType;
  color: string;
  className: string;
  badgeClass: string;
  glowClass: string;
}> = {
  water_level: {
    icon: Droplets,
    color: '#0ea5e9',
    className: 'border-cyan-200 bg-cyan-50 text-cyan-600 dark:border-cyan-500/20 dark:bg-cyan-950/20 dark:text-cyan-400',
    badgeClass: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/30 dark:bg-cyan-950/30 dark:text-cyan-300',
    glowClass: 'shadow-[0_0_15px_rgba(14,165,233,0.15)] dark:shadow-[0_0_20px_rgba(14,165,233,0.25)]',
  },
  rainfall: {
    icon: Gauge,
    color: '#3b82f6',
    className: 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-950/20 dark:text-blue-400',
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/30 dark:text-blue-300',
    glowClass: 'shadow-[0_0_15px_rgba(59,130,246,0.15)] dark:shadow-[0_0_20px_rgba(59,130,246,0.25)]',
  },
  temperature: {
    icon: Thermometer,
    color: '#f97316',
    className: 'border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/20 dark:bg-orange-950/20 dark:text-orange-400',
    badgeClass: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/30 dark:bg-orange-950/30 dark:text-orange-300',
    glowClass: 'shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:shadow-[0_0_20px_rgba(249,115,22,0.25)]',
  },
  humidity: {
    icon: Droplets,
    color: '#a855f7',
    className: 'border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-500/20 dark:bg-purple-950/20 dark:text-purple-400',
    badgeClass: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/30 dark:bg-purple-950/30 dark:text-purple-300',
    glowClass: 'shadow-[0_0_15px_rgba(168,85,247,0.15)] dark:shadow-[0_0_20px_rgba(168,85,247,0.25)]',
  },
  wind: {
    icon: Wind,
    color: '#10b981',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-300',
    glowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.15)] dark:shadow-[0_0_20px_rgba(16,185,129,0.25)]',
  },
  combined: {
    icon: Activity,
    color: '#ec4899',
    className: 'border-pink-200 bg-pink-50 text-pink-600 dark:border-pink-500/20 dark:bg-pink-950/20 dark:text-pink-400',
    badgeClass: 'border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-900/30 dark:bg-pink-950/30 dark:text-pink-300',
    glowClass: 'shadow-[0_0_15px_rgba(236,72,153,0.15)] dark:shadow-[0_0_20px_rgba(236,72,153,0.25)]',
  },
};

const DEFAULT_STYLE = {
  icon: Activity,
  color: '#6b7280',
  className: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/20 dark:bg-slate-950/20 dark:text-slate-400',
  badgeClass: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-900/30 dark:bg-slate-950/30 dark:text-slate-300',
  glowClass: 'shadow-sm',
};

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SensorsPage() {
  const t = useTranslations('dashboard.sensors');

  const [sensors, setSensors] = React.useState<Sensor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [selectedSensor, setSelectedSensor] = React.useState<Sensor | null>(null);
  
  // View mode tab state
  const [viewMode, setViewMode] = React.useState('grid');

  // Pagination states
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 6;

  const fetchSensors = React.useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      const res = await api.get('/sensors', { params });
      
      const mappedSensors = (res.data?.data ?? []).map((s: {
        id: number;
        name: string;
        type: 'water_level' | 'rainfall' | 'wind' | 'humidity' | 'temperature' | 'combined';
        status: string;
        last_value?: string | number | null;
        last_reading_at?: string;
        last_reading?: string;
        battery?: number;
      }) => ({
        ...s,
        readings: {
          [s.type]: s.last_value != null ? parseFloat(String(s.last_value)) : undefined
        },
        last_reading: s.last_reading_at || s.last_reading
      }));
      setSensors(mappedSensors);
    } catch {
      toast.error(t('toastLoadError'));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  React.useEffect(() => {
    fetchSensors();

    // Realtime updates
    const handler = (e: CustomEvent) => {
      const data = e.detail;
      setSensors(prev => prev.map(s => {
        if (s.id === data.sensor_id) {
          const updated = { 
            ...s, 
            readings: { ...(s.readings || {}), ...data.readings }, 
            last_reading: new Date().toISOString() 
          };
          if (selectedSensor?.id === s.id) {
            setSelectedSensor(updated);
          }
          return updated;
        }
        return s;
      }));
    };
    window.addEventListener('aegis:sensor:reading', handler as EventListener);
    return () => window.removeEventListener('aegis:sensor:reading', handler as EventListener);
  }, [fetchSensors, selectedSensor]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'online': return { color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20 bg-emerald-500/10', label: t('statusOnlineLabel'), icon: Wifi };
      case 'offline': return { color: 'bg-zinc-500', text: 'text-zinc-500 dark:text-zinc-400', border: 'border-zinc-500/20 bg-zinc-500/10', label: t('statusOfflineLabel'), icon: WifiOff };
      case 'warning': return { color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20 bg-amber-500/10', label: t('statusWarningLabel'), icon: Bell };
      case 'error': return { color: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20 bg-rose-500/10', label: t('statusErrorLabel'), icon: X };
      default: return { color: 'bg-zinc-500', text: 'text-zinc-500 dark:text-zinc-400', border: 'border-zinc-500/20 bg-zinc-500/10', label: status, icon: WifiOff };
    }
  };

  const getTypeLabel = (type: string): string => {
    const keyMap: Record<string, string> = {
      water_level: t('typeWaterLevel'),
      rainfall: t('typeRainfall'),
      temperature: t('typeTemperature'),
      humidity: t('typeHumidity'),
      wind: t('typeWind'),
      combined: t('typeCombined'),
    };
    return keyMap[type] ?? type;
  };

  const getLocationString = (sensor: Sensor) => {
    if (sensor.metadata?.station_label && sensor.metadata?.address) {
      return `${sensor.metadata.station_label} · ${sensor.metadata.address}`;
    }
    if (sensor.metadata?.address) return sensor.metadata.address;

    if (sensor.flood_zone?.name && sensor.district?.name) {
      return `${sensor.flood_zone.name} · ${sensor.district.name}`;
    }
    if (sensor.flood_zone?.name) return sensor.flood_zone.name;
    if (sensor.district?.name) return sensor.district.name;

    const { location } = sensor;
    if (typeof location === 'object' && location !== null) {
      const lat = Number(location.lat);
      const lng = Number(location.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    }
    const metadataLat = Number(sensor.metadata?.latitude);
    const metadataLng = Number(sensor.metadata?.longitude);
    if (Number.isFinite(metadataLat) && Number.isFinite(metadataLng)) {
      return `${metadataLat.toFixed(4)}, ${metadataLng.toFixed(4)}`;
    }
    if (typeof location === 'string' && location.trim()) return location;
    return t('unknownLocation');
  };

  // Local filtering
  const filteredSensors = React.useMemo(() => {
    return sensors.filter(sensor => {
      const matchSearch = !search ||
        sensor.name.toLowerCase().includes(search.toLowerCase()) ||
        getLocationString(sensor).toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === 'all' || sensor.type === typeFilter;

      return matchSearch && matchType;
    });
  }, [sensors, search, typeFilter]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, statusFilter]);

  // Auto-select first sensor on layout mount or when list changes
  React.useEffect(() => {
    if (filteredSensors.length > 0 && !selectedSensor) {
      setSelectedSensor(filteredSensors[0]);
    }
  }, [filteredSensors, selectedSensor]);

  // Stats calculation
  const stats = React.useMemo(() => {
    return {
      total: sensors.length,
      online: sensors.filter(s => s.status === 'online').length,
      warning: sensors.filter(s => s.status === 'warning').length,
      offline: sensors.filter(s => s.status === 'offline' || s.status === 'error').length,
    };
  }, [sensors]);

  const avgWaterLevel = React.useMemo(() => {
    const activeWaterSensors = sensors.filter(s => s.readings?.water_level !== undefined);
    if (activeWaterSensors.length === 0) return 0;
    return activeWaterSensors.reduce((acc, s) => acc + (s.readings.water_level ?? 0), 0) / activeWaterSensors.length;
  }, [sensors]);

  // Type breakdown bar counts
  const typeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    sensors.forEach(s => {
      counts[s.type] = (counts[s.type] || 0) + 1;
    });
    return counts;
  }, [sensors]);

  const typeBreakdown = React.useMemo(() => {
    if (sensors.length === 0) return [];
    return Object.entries(TYPE_STYLE).map(([type, style]) => {
      const count = typeCounts[type] || 0;
      return {
        type,
        count,
        percentage: (count / sensors.length) * 100,
        style,
        label: getTypeLabel(type),
      };
    }).filter(item => item.count > 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensors, typeCounts]);

  const totalPages = Math.ceil(filteredSensors.length / itemsPerPage);

  const paginatedSensors = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSensors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSensors, currentPage]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // Mock Sparkline Curve generator based on the sensor's readings or properties
  const mockSparklineData = React.useMemo(() => {
    if (!selectedSensor) return [];
    const baseVal = selectedSensor.readings?.water_level ?? selectedSensor.readings?.temperature ?? 30;
    const seed = selectedSensor.id * 1.5;
    const data = [];
    for (let i = 0; i < 15; i++) {
      const shift = Math.sin(seed + i * 0.7) * (baseVal * 0.1) + Math.cos(i * 0.3) * (baseVal * 0.05);
      data.push(Math.max(0.1, baseVal + shift));
    }
    return data;
  }, [selectedSensor]);

  const sparklinePoints = React.useMemo(() => {
    if (mockSparklineData.length === 0) return '';
    const maxVal = Math.max(...mockSparklineData, 5);
    const minVal = Math.min(...mockSparklineData, 0);
    const range = maxVal - minVal || 1;
    
    return mockSparklineData.map((val, idx) => {
      const x = (idx / (mockSparklineData.length - 1)) * 400;
      const y = 80 - ((val - minVal) / range) * 60; // scale between 20 and 80 inside 100 height SVG
      return `${x},${y}`;
    }).join(' ');
  }, [mockSparklineData]);

  const sparklineAreaPoints = React.useMemo(() => {
    if (!sparklinePoints) return '';
    return `${sparklinePoints} 400,90 0,90`;
  }, [sparklinePoints]);

  return (
    <main className="relative flex w-full flex-col gap-6 px-6 py-6 min-h-0 overflow-hidden">
      {/* Aurora Ambient Background Blurs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/[0.04] dark:bg-cyan-500/[0.06] rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-violet-500/[0.03] dark:bg-violet-500/[0.05] rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Container */}
      <section className="relative rounded-3xl border border-border/50 bg-card/45 backdrop-blur-md p-5 shadow-sm md:p-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500" />

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3.5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-cyan-500/20 bg-cyan-500/5 px-2.5 py-0.5 text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-400 tracking-wider">
                {t('badge')}
              </Badge>
              {stats.online > 0 && (
                <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  {t('onlineCountLabel', { online: stats.online, total: stats.total })}
                </Badge>
              )}
            </div>
            <h1 className="flex items-center gap-3.5 text-2xl font-black tracking-tight text-foreground md:text-3xl">
              <span className={cn(
                "flex size-11 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 transition-all duration-300"
              )}>
                <Activity size={21} className="animate-pulse" />
              </span>
              {t('pageTitle')}
            </h1>
            <p className="mt-2 text-xs font-semibold text-muted-foreground leading-relaxed">
              {t('pageDesc')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Button
              className="h-10 gap-2 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
              onClick={() => toast.info(t('addSensorToast'))}
            >
              <Plus size={16} />
              {t('addSensorBtn')}
            </Button>
          </div>
        </div>

        {/* Statistical Metrics Grid */}
        <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-5">
          {[
            { label: t('statsTotal'), value: stats.total, color: 'border-blue-500/20 bg-blue-500/5 text-blue-500' },
            { label: t('statsOnline'), value: stats.online, color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500' },
            { label: t('statsWarning'), value: stats.warning, color: 'border-amber-500/20 bg-amber-500/5 text-amber-500 animate-pulse' },
            { label: t('statsOffline'), value: stats.offline, color: 'border-zinc-500/20 bg-zinc-500/5 text-zinc-500' },
            { label: t('statsAvgWater'), value: `${avgWaterLevel.toFixed(2)} m`, color: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-500' }
          ].map((item, idx) => (
            <Card key={idx} className={cn("bg-background/40 border-border/40 p-4 shadow-sm hover:shadow-md transition-all duration-300", item.color)}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</p>
              <p className="mt-2 text-2xl font-black">{item.value}</p>
            </Card>
          ))}
        </div>

        {/* Advanced Horizontal Category Breakdown Bar */}
        {typeBreakdown.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><BarChart2 size={13} /> {t('typeDistLabel')}</span>
              <span>{t('filteredCount', { count: filteredSensors.length })}</span>
            </div>

            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted border border-border/45 shadow-inner">
              {typeBreakdown.map((item) => (
                <button
                  key={item.type}
                  className="h-full first:rounded-l-full last:rounded-r-full hover:opacity-85 transition-opacity relative group"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.style.color,
                  }}
                  onClick={() => setTypeFilter(item.type)}
                  title={`${item.label}: ${item.count} (${Math.round(item.percentage)}%)`}
                >
                  <span className="sr-only">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Micro legends */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              {typeBreakdown.map((item) => {
                const active = typeFilter === item.type;
                return (
                  <button
                    key={item.type}
                    onClick={() => setTypeFilter(active ? 'all' : item.type)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-lg border transition-all duration-200",
                      active
                        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
                        : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <span className="size-2 rounded-full" style={{ backgroundColor: item.style.color }} />
                    <span>{item.label}</span>
                    <span className="text-[10px] text-muted-foreground/80 font-bold">({item.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Main Multi-Column Panel */}
      <section className="grid min-h-0 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Left Filters Sidebar Card */}
        <Card className="h-fit border-border/50 bg-card/45 backdrop-blur-md p-4 shadow-sm flex flex-col gap-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <Input
              placeholder={t('searchPlaceholder')}
              className="h-10 rounded-xl pl-9 pr-8 border-border/60 focus-visible:ring-cyan-500 bg-background/50 text-xs font-semibold"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status selector */}
          <div className="grid gap-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-2 pb-1">{t('statusFilterLabel')}</span>
            <Select value={statusFilter} onValueChange={(val) => { if (val) setStatusFilter(val); }}>
              <SelectTrigger className="w-full h-9 rounded-xl border-border/60 bg-background/50 text-xs font-semibold focus:ring-cyan-500">
                <SelectValue>
                  {statusFilter === 'all' ? t('allStatuses') : getStatusConfig(statusFilter).label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-semibold">{t('allStatuses')}</SelectItem>
                <SelectItem value="online" className="text-xs font-semibold">🟢 {t('statusOnline')}</SelectItem>
                <SelectItem value="warning" className="text-xs font-semibold">🟡 {t('statusWarning')}</SelectItem>
                <SelectItem value="offline" className="text-xs font-semibold">⚫ {t('statusOffline')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type selector */}
          <div className="grid gap-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-2 pb-1">{t('typeFilterLabel')}</span>
            <Select value={typeFilter} onValueChange={(val) => { if (val) setTypeFilter(val); }}>
              <SelectTrigger className="w-full h-9 rounded-xl border-border/60 bg-background/50 text-xs font-semibold focus:ring-cyan-500">
                <SelectValue>
                  {typeFilter === 'all' ? t('allTypes') : getTypeLabel(typeFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-semibold">{t('allTypes')}</SelectItem>
                <SelectItem value="water_level" className="text-xs font-semibold">🌊 {t('typeWaterLevel')}</SelectItem>
                <SelectItem value="rainfall" className="text-xs font-semibold">⛈️ {t('typeRainfall')}</SelectItem>
                <SelectItem value="temperature" className="text-xs font-semibold">🌡️ {t('typeTemperature')}</SelectItem>
                <SelectItem value="humidity" className="text-xs font-semibold">💧 {t('typeHumidity')}</SelectItem>
                <SelectItem value="wind" className="text-xs font-semibold">💨 {t('typeWind')}</SelectItem>
                <SelectItem value="combined" className="text-xs font-semibold">⚙️ {t('typeCombined')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-border/60" />

          {/* Reset Filters button */}
          {(statusFilter !== 'all' || typeFilter !== 'all' || search) && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 rounded-xl font-bold border-dashed border-cyan-500/40 text-cyan-500 hover:bg-cyan-500/10 text-xs"
              onClick={() => {
                setSearch('');
                setTypeFilter('all');
                setStatusFilter('all');
              }}
            >
              <X className="mr-1.5" size={13} /> {t('clearFilter')}
            </Button>
          )}
        </Card>

        {/* Master-Detail Container Split Grid */}
        <div className="grid min-h-[580px] gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
          {/* Sensors List Card */}
          <Card className="overflow-hidden border-border/50 bg-card/45 backdrop-blur-md shadow-sm flex flex-col">
            {/* List Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5 bg-muted/10">
              <div className="flex items-center gap-3">
                <h2 className="font-black text-sm tracking-tight">{t('listTitle')}</h2>
                <Tabs value={viewMode} onValueChange={setViewMode} className="h-7">
                  <TabsList className="h-7 p-0.5 rounded-lg bg-background/50 border">
                    <TabsTrigger value="grid" className="h-6 rounded-md text-[10px] font-bold px-2">{t('gridView')}</TabsTrigger>
                    <TabsTrigger value="list" className="h-6 rounded-md text-[10px] font-bold px-2">{t('listView')}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <Badge variant="outline" className="border-cyan-500/20 bg-cyan-500/5 text-cyan-600 text-[10px] font-bold flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-cyan-500 animate-pulse" />
                Live Network
              </Badge>
            </div>

            {/* Scrollable list content */}
            <ScrollArea className="flex-1 h-[580px] custom-scroll bg-background/25">
              {loading ? (
                <div className="space-y-4 p-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 bg-muted/30 border border-border/40 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : filteredSensors.length === 0 ? (
                <div className="flex min-h-[460px] flex-col items-center justify-center p-8 text-center animate-fade-in-up">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-muted bg-muted/45 text-muted-foreground/60 shadow-inner">
                    <Activity size={28} />
                  </div>
                  <h3 className="text-base font-black tracking-tight">{t('noSensorsFound')}</h3>
                  <p className="mt-2.5 max-w-xs text-xs font-semibold leading-relaxed text-muted-foreground">
                    {t('noSensorsFoundDesc')}
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                  {paginatedSensors.map((sensor) => {
                    const cfg = TYPE_STYLE[sensor.type] ?? DEFAULT_STYLE;
                    const status = getStatusConfig(sensor.status);
                    const TypeIcon = cfg.icon;
                    const active = selectedSensor?.id === sensor.id;

                    return (
                      <div
                        key={sensor.id}
                        onClick={() => setSelectedSensor(sensor)}
                        className={cn(
                          'relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer select-none bg-card/25',
                          active
                            ? 'border-cyan-500/35 bg-cyan-500/[0.04] dark:bg-cyan-500/[0.07] ring-1 ring-cyan-500/20'
                            : 'border-border/45 hover:border-border hover:bg-muted/30',
                        )}
                      >
                        {/* Side glowing bar for active card */}
                        {active && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-l" />
                        )}

                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 text-lg",
                              cfg.className,
                              sensor.status === 'online' && cfg.glowClass
                            )}>
                              <TypeIcon size={16} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs font-extrabold text-foreground truncate">{sensor.name}</h3>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate font-semibold">
                                <MapPin size={10} />
                                {getLocationString(sensor)}
                              </p>
                            </div>
                          </div>
                          
                          <Badge variant="outline" className={cn("text-[8px] h-4 font-black uppercase tracking-wider gap-1 shrink-0", status.border, status.text)}>
                            <span className={cn("size-1 rounded-full", status.color)} />
                            {status.label}
                          </Badge>
                        </div>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-2 gap-2 mt-2 mb-1.5">
                          {sensor.readings?.water_level !== undefined && (
                            <div className="p-2 bg-cyan-500/[0.03] border border-cyan-500/10 rounded-xl flex flex-col justify-between">
                              <span className="text-[9px] font-extrabold text-muted-foreground/85 uppercase tracking-wide">{t('waterLevelLabel')}</span>
                              <span className="font-extrabold text-xs text-cyan-600 dark:text-cyan-400 mt-1">{sensor.readings.water_level}m</span>
                            </div>
                          )}
                          {sensor.readings?.temperature !== undefined && (
                            <div className="p-2 bg-orange-500/[0.03] border border-orange-500/10 rounded-xl flex flex-col justify-between">
                              <span className="text-[9px] font-extrabold text-muted-foreground/85 uppercase tracking-wide">{t('temperatureLabel')}</span>
                              <span className="font-extrabold text-xs text-orange-600 dark:text-orange-400 mt-1">{sensor.readings.temperature}°C</span>
                            </div>
                          )}
                          {sensor.readings?.humidity !== undefined && (
                            <div className="p-2 bg-purple-500/[0.03] border border-purple-500/10 rounded-xl flex flex-col justify-between">
                              <span className="text-[9px] font-extrabold text-muted-foreground/85 uppercase tracking-wide">{t('humidityLabel')}</span>
                              <span className="font-extrabold text-xs text-purple-600 dark:text-purple-400 mt-1">{sensor.readings.humidity}%</span>
                            </div>
                          )}
                          {sensor.readings?.rainfall !== undefined && (
                            <div className="p-2 bg-blue-500/[0.03] border border-blue-500/10 rounded-xl flex flex-col justify-between">
                              <span className="text-[9px] font-extrabold text-muted-foreground/85 uppercase tracking-wide">{t('rainfallLabel')}</span>
                              <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400 mt-1">{sensor.readings.rainfall}mm</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3 text-[10px] font-bold text-muted-foreground border-t border-border/40 pt-2.5">
                          <span className="text-[9px] uppercase tracking-wider opacity-80">{getTypeLabel(sensor.type)}</span>
                          {sensor.battery !== undefined && (
                            <span className="flex items-center gap-1 text-[9px] opacity-75 font-semibold">
                              <Battery size={11} className={cn(sensor.battery < 20 ? "text-rose-500 animate-pulse" : "text-muted-foreground")} />
                              {sensor.battery}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="divide-y divide-border/45 border-y border-border/45 bg-card/10">
                  {paginatedSensors.map((sensor) => {
                    const cfg = TYPE_STYLE[sensor.type] ?? DEFAULT_STYLE;
                    const status = getStatusConfig(sensor.status);
                    const TypeIcon = cfg.icon;
                    const active = selectedSensor?.id === sensor.id;

                    return (
                      <div
                        key={sensor.id}
                        onClick={() => setSelectedSensor(sensor)}
                        className={cn(
                          'group relative flex w-full items-center gap-4 px-5 py-4 text-left transition-all duration-300 cursor-pointer select-none',
                          active
                            ? 'bg-cyan-500/[0.04] dark:bg-cyan-500/[0.08]'
                            : 'hover:bg-muted/30',
                        )}
                      >
                        {active && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-r" />
                        )}

                        <div className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 text-lg",
                          cfg.className,
                          sensor.status === 'online' && cfg.glowClass
                        )}>
                          <TypeIcon size={16} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-xs font-extrabold text-foreground">{sensor.name}</h3>
                            <Badge variant="outline" className={cn("text-[8px] h-4 font-black uppercase tracking-wider gap-0.5", status.border, status.text)}>
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold truncate">
                            <MapPin size={10} />
                            {getLocationString(sensor)}
                          </p>
                        </div>

                        <div className="flex items-center gap-5 shrink-0">
                          {/* Readings details inline */}
                          <div className="text-right text-xs font-black text-foreground">
                            {sensor.readings?.water_level !== undefined && <span>{sensor.readings.water_level}m</span>}
                            {sensor.readings?.rainfall !== undefined && <span className="ml-2.5 text-blue-600 dark:text-blue-400">{sensor.readings.rainfall}mm</span>}
                            {sensor.readings?.water_level === undefined && sensor.readings?.temperature !== undefined && <span>{sensor.readings.temperature}°C</span>}
                          </div>

                          <div className="flex items-center gap-2">
                            {sensor.battery !== undefined && (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                                <Battery size={11} className="text-muted-foreground" />
                                {sensor.battery}%
                              </span>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="size-8 rounded-lg p-0 border-border bg-background hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Eye size={13} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* List Pagination indicators */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/60 px-5 py-4 bg-muted/5">
                <span className="text-[10px] font-bold text-muted-foreground">
                  {t('paginationInfo', { start: Math.min(filteredSensors.length, (currentPage - 1) * itemsPerPage + 1), end: Math.min(filteredSensors.length, currentPage * itemsPerPage), total: filteredSensors.length })}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-8 rounded-lg p-0"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={15} />
                  </Button>
                  {getPageNumbers().map((num, i) => (
                    <Button
                      key={i}
                      variant={currentPage === num ? 'default' : 'outline'}
                      size="sm"
                      className={cn("size-8 rounded-lg p-0 text-xs font-bold", currentPage === num && "bg-cyan-500 hover:bg-cyan-600 text-white")}
                      onClick={() => typeof num === 'number' && setCurrentPage(num)}
                      disabled={typeof num !== 'number'}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-8 rounded-lg p-0"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={15} />
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Active Detail card panel */}
          <Card className="relative overflow-hidden border-border/50 bg-card/45 backdrop-blur-md shadow-sm flex flex-col">
            <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-cyan-500/20 via-cyan-500 to-cyan-500/20" />

            {selectedSensor ? (
              <div className="flex flex-col h-full">
                {/* Panel Header */}
                <div className="border-b border-border/60 px-5 py-4 flex items-center justify-between bg-muted/10">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                      Sensor ID: #{String(selectedSensor.id).padStart(4, '0')}
                    </p>
                    <h2 className="font-black text-sm tracking-tight mt-0.5 truncate text-foreground">
                      {t('detailTitle')}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSensor.battery !== undefined && (
                      <Badge variant="outline" className={cn("text-[9px] font-bold h-5 px-1.5 flex items-center gap-1", selectedSensor.battery < 20 ? "border-rose-500 bg-rose-500/5 text-rose-500" : "border-border")}>
                        <Battery size={11} className={selectedSensor.battery < 20 ? "text-rose-500" : "text-muted-foreground"} />
                        <span>{selectedSensor.battery}%</span>
                      </Badge>
                    )}
                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-wider gap-1", getStatusConfig(selectedSensor.status).border, getStatusConfig(selectedSensor.status).text)}>
                      {getStatusConfig(selectedSensor.status).label}
                    </Badge>
                  </div>
                </div>

                {/* Detail Content */}
                <ScrollArea className="flex-1 custom-scroll p-5">
                  <div className="space-y-6">
                    {/* Big Title & Icon Area */}
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "flex size-14 shrink-0 items-center justify-center rounded-2xl border text-3xl transition-all duration-300 shadow-md",
                        TYPE_STYLE[selectedSensor.type]?.className ?? DEFAULT_STYLE.className,
                        selectedSensor.status === 'online' && (TYPE_STYLE[selectedSensor.type]?.glowClass ?? DEFAULT_STYLE.glowClass)
                      )}>
                        {React.createElement(TYPE_STYLE[selectedSensor.type]?.icon ?? DEFAULT_STYLE.icon, { size: 24 })}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-black leading-snug text-foreground">
                          {selectedSensor.name}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Badge variant="outline" className={cn("text-[10px] font-extrabold border uppercase tracking-wider", TYPE_STYLE[selectedSensor.type]?.badgeClass ?? DEFAULT_STYLE.badgeClass)}>
                            {getTypeLabel(selectedSensor.type)}
                          </Badge>
                          {selectedSensor.flood_zone?.name && (
                            <Badge variant="outline" className="text-[10px] font-extrabold border uppercase tracking-wider border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400">
                              {t('floodZoneLabel', { name: selectedSensor.flood_zone.name })}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sensor Readings Visual Modules */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Water Level Wave Animation */}
                    {selectedSensor.readings?.water_level !== undefined && (
                      <div className="col-span-2 relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.02] p-4 flex items-center justify-between">
                        <div className="z-10">
                          <span className="text-[10px] font-extrabold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Droplets size={12} /> {t('currentWater')}
                          </span>
                          <div className="flex items-baseline gap-1.5 mt-2">
                            <span className="text-3xl font-black text-foreground">{selectedSensor.readings.water_level.toFixed(2)}</span>
                            <span className="text-xs font-bold text-muted-foreground">{t('waterUnit')}</span>
                          </div>
                        </div>

                        {/* Interactive wave animation mockup */}
                        <div className="absolute inset-y-0 right-0 w-32 opacity-25 dark:opacity-15 pointer-events-none">
                          <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-500 fill-current">
                            <path d="M0,50 Q25,60 50,50 T100,50 L100,100 L0,100 Z" className="animate-pulse" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Temperature Gauges */}
                    {selectedSensor.readings?.temperature !== undefined && (
                      <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.01] p-3 flex flex-col justify-between">
                        <span className="text-[9px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1">
                          <Thermometer size={12} /> {t('temperatureLabel')}
                        </span>
                        <span className="text-xl font-black text-foreground mt-2">
                          {selectedSensor.readings.temperature}°C
                        </span>
                        <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-orange-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (selectedSensor.readings.temperature / 50) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Humidity progress dials */}
                    {selectedSensor.readings?.humidity !== undefined && (
                      <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.01] p-3 flex flex-col justify-between">
                        <span className="text-[9px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                          <Droplets size={12} /> {t('humidityLabel')}
                        </span>
                        <span className="text-xl font-black text-foreground mt-2">
                          {selectedSensor.readings.humidity}%
                        </span>
                        <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-purple-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${selectedSensor.readings.humidity}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Rainfall Dials */}
                    {selectedSensor.readings?.rainfall !== undefined && (
                      <div className="col-span-2 rounded-xl border border-blue-500/20 bg-blue-500/[0.01] p-3 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                            <Gauge size={12} /> {t('rainfallLabel')}
                          </span>
                          <span className="text-xl font-black text-foreground mt-2">
                            {selectedSensor.readings.rainfall} mm
                          </span>
                        </div>
                        <Badge variant="outline" className="border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-extrabold">
                          {selectedSensor.readings.rainfall > 50 ? t('rainfallHeavy') : t('rainfallModerate')}
                        </Badge>
                      </div>
                    )}

                    {/* Wind Speed dials */}
                    {selectedSensor.readings?.wind_speed !== undefined && (
                      <div className="col-span-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.01] p-3 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <Wind size={12} /> {t('windLabel')}
                          </span>
                          <span className="text-xl font-black text-foreground mt-2">
                            {selectedSensor.readings.wind_speed} m/s
                          </span>
                        </div>
                        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-extrabold">
                          {t('windBeaufort', { level: Math.min(12, Math.floor(selectedSensor.readings.wind_speed / 2.5)) })}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Premium Simulated 24h reading sparkline chart */}
                  <div className="rounded-2xl border border-border/50 bg-background/50 p-4 shadow-inner space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Activity size={13} /> {t('sparklineTitle')}</span>
                      <span>{t('sparklineUpdate')}</span>
                    </div>

                    {/* High-Fidelity SVG Sparkline curve */}
                    <div className="h-28 w-full relative flex items-end justify-center rounded-xl bg-card/25 border border-border/30 overflow-hidden">
                      <svg className="w-full h-full absolute inset-0" viewBox="0 0 400 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Fill area */}
                        {sparklinePoints && (
                          <polygon points={sparklineAreaPoints} fill="url(#sparklineGrad)" />
                        )}
                        {/* Sparkline curve stroke */}
                        {sparklinePoints && (
                          <polyline
                            fill="none"
                            stroke="#0ea5e9"
                            strokeWidth="2.5"
                            points={sparklinePoints}
                            className="drop-shadow-[0_2px_8px_rgba(14,165,233,0.3)]"
                          />
                        )}
                      </svg>
                      
                      {/* Labels axis */}
                      <div className="absolute bottom-1.5 left-2 right-2 flex justify-between text-[8px] font-bold text-muted-foreground uppercase tracking-wider pointer-events-none">
                        <span>{t('chart24hAgo')}</span>
                        <span>{t('chartNow')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="col-span-2 rounded-xl border border-border/40 bg-background/25 p-3">
                      <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <MapPin size={12} className="text-cyan-500/80" /> {t('locationLabel')}
                      </span>
                      <p className="text-xs font-bold text-foreground mt-2 leading-relaxed">
                        {getLocationString(selectedSensor)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/40 bg-background/25 p-3 flex flex-col justify-between">
                      <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar size={12} className="text-amber-500/80" /> {t('lastReadingLabel')}
                      </span>
                      <span className="text-xs font-black text-foreground mt-2 leading-relaxed">
                        {selectedSensor.last_reading ? formatFullDate(selectedSensor.last_reading) : t('noReadingYet')}
                      </span>
                    </div>

                    <div className="rounded-xl border border-border/40 bg-background/25 p-3 flex flex-col justify-between">
                      <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <Clock size={12} className="text-rose-500/80" /> {t('readingFreqLabel')}
                      </span>
                      <span className="text-xs font-black text-foreground mt-2">
                        {t('readingFreqValue')}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                        {t('readingFreqDesc')}
                      </span>
                    </div>

                    {selectedSensor.latitude !== undefined && selectedSensor.longitude !== undefined && (
                      <div className="col-span-2 rounded-xl border border-border/40 bg-background/25 p-3">
                        <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">
                          {t('gpsLabel')}
                        </span>
                        <div className="mt-2 flex items-center justify-between text-xs font-semibold">
                          <span>{t('latLabel', { lat: Number(selectedSensor.latitude).toFixed(5) })}</span>
                          <span>{t('lngLabel', { lng: Number(selectedSensor.longitude).toFixed(5) })}</span>
                        </div>
                      </div>
                    )}
                  </div>
                 </div>
                </ScrollArea>
               </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-muted/5">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-dashed border-muted-foreground/35 bg-background/50 text-muted-foreground/50 shadow-inner">
                  <Activity size={24} />
                </div>
                <h3 className="text-sm font-bold text-foreground">{t('noSensorSelected')}</h3>
                <p className="mt-1.5 max-w-xs text-xs text-muted-foreground font-semibold">
                  {t('noSensorSelectedDesc')}
                </p>
              </div>
            )}
          </Card>
        </div>
      </section>
    </main>
  );
}
