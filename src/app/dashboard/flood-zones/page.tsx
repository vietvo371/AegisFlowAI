'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Layers, MapPin, Droplets, Search,
  ChevronLeft, ChevronRight, X, Sparkles, Navigation, Users, BarChart2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FloodZone {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_level_label?: string;
  status: 'monitoring' | 'alert' | 'danger' | 'flooded' | 'receded';
  status_label?: string;
  current_water_level_m?: number | string | null;
  alert_threshold_m?: number | string | null;
  danger_threshold_m?: number | string | null;
  area_km2?: number | string | null;
  population_affected?: number | null;
  centroid?: { lat?: number | string | null; lng?: number | string | null } | null;
  district?: { id: number; name: string } | null;
  updated_at?: string;
}

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function FloodZonesPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.floodZones');
  const tEnum = useTranslations('enums');

  const [zones, setZones] = React.useState<FloodZone[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('all');
  const [selectedZone, setSelectedZone] = React.useState<FloodZone | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 6;

  const getRiskConfig = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return { color: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/25 bg-rose-500/10', bg: 'bg-rose-500/10', label: t('riskCriticalLabel') };
      case 'high': return { color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/25 bg-amber-500/10', bg: 'bg-amber-500/10', label: t('riskHighLabel') };
      case 'medium': return { color: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/25 bg-yellow-500/10', bg: 'bg-yellow-500/10', label: t('riskMediumLabel') };
      default: return { color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/25 bg-emerald-500/10', bg: 'bg-emerald-500/10', label: t('riskLowLabel') };
    }
  };

  const fetchZones = React.useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.get('/flood-zones', {
        params: {
          risk_level: filter !== 'all' ? filter : undefined,
          search: search || undefined,
          per_page: 50,
        },
      });
      setZones(res.data?.data ?? []);
    } catch {
      // handled by api interceptor
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [filter, search]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchZones();
    }, 250);
    
    const handler = () => void fetchZones(false);
    window.addEventListener('aegis:incident:created', handler);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('aegis:incident:created', handler);
    };
  }, [fetchZones]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  React.useEffect(() => {
    if (zones.length > 0 && !selectedZone) {
      setSelectedZone(zones[0]);
    }
  }, [zones, selectedZone]);

  const getRiskScore = (zone: FloodZone) => {
    const current = toNumber(zone.current_water_level_m);
    const danger = toNumber(zone.danger_threshold_m) || 3;
    const waterScore = Math.min(70, Math.round((current / danger) * 70));
    const riskBonus = zone.risk_level === 'critical' ? 30 : zone.risk_level === 'high' ? 22 : zone.risk_level === 'medium' ? 12 : 4;
    return Math.min(100, waterScore + riskBonus);
  };

  const handleViewDetail = async (zone: FloodZone) => {
    setSelectedZone(zone);
    setDetailLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.get(`/flood-zones/${zone.id}`);
      setSelectedZone(res.data?.data ?? zone);
    } catch {
      toast.error(t('toastDetailError'));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenMap = (zone?: FloodZone | null) => {
    const target = zone ?? zones.find(z => z.centroid?.lat && z.centroid?.lng);
    const lat = Number(target?.centroid?.lat);
    const lng = Number(target?.centroid?.lng);

    if (!target || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error(t('toastNoCoords'));
      return;
    }

    const config = getRiskConfig(target.risk_level);
    const params = new URLSearchParams({
      zoneId: String(target.id),
      zoneName: target.name,
      lat: String(lat),
      lng: String(lng),
      zoneDistrict: target.district?.name || '',
      zoneStatus: target.status_label || tEnum(`floodZoneStatus.${target.status}`) || target.status,
      zoneRisk: target.risk_level_label || config.label,
      zoneWater: `${toNumber(target.current_water_level_m).toFixed(2)}m`,
    });
    router.push(`/dashboard?${params.toString()}`);
  };

  const levelCounts = React.useMemo(() => {
    return {
      critical: zones.filter(z => z.risk_level === 'critical').length,
      high: zones.filter(z => z.risk_level === 'high').length,
      medium: zones.filter(z => z.risk_level === 'medium').length,
      low: zones.filter(z => z.risk_level === 'low').length,
    };
  }, [zones]);

  const totalPages = Math.ceil(zones.length / itemsPerPage);
  const paginatedZones = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return zones.slice(startIndex, startIndex + itemsPerPage);
  }, [zones, currentPage]);

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

  return (
    <main className="relative flex w-full flex-col gap-6 px-6 py-6 min-h-0 overflow-hidden text-foreground">
      {/* Background blurs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/[0.04] rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-violet-500/[0.03] rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Container */}
      <section className="relative rounded-3xl border border-border/50 bg-card/45 backdrop-blur-md p-5 shadow-sm md:p-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500" />
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3.5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-cyan-500/20 bg-cyan-500/5 px-2.5 py-0.5 text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                {t('badge')}
              </Badge>
              <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold">
                {t('networkBadge')}
              </Badge>
            </div>
            <h1 className="flex items-center gap-3.5 text-2xl font-black tracking-tight text-foreground md:text-3xl">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-500/20 transition-all duration-300">
                <Droplets size={21} className="animate-pulse" />
              </span>
              {t('pageTitle')}
            </h1>
            <p className="mt-2 text-xs font-semibold text-muted-foreground leading-relaxed">
              {t('pageDesc')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Button
              className="h-10 gap-2 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/25 border-none"
              onClick={() => handleOpenMap()}
            >
              <Layers size={16} />
              {t('mapBtn')}
            </Button>
          </div>
        </div>

        {/* Statistical Metrics Grid - Interactive filters */}
        <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { key: 'critical', label: t('riskCriticalLabel'), count: levelCounts.critical, color: 'border-rose-500/20 bg-rose-500/5 text-rose-400' },
            { key: 'high', label: t('riskHighLabel'), count: levelCounts.high, color: 'border-amber-500/20 bg-amber-500/5 text-amber-400' },
            { key: 'medium', label: t('riskMediumLabel'), count: levelCounts.medium, color: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400' },
            { key: 'low', label: t('riskLowLabel'), count: levelCounts.low, color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' }
          ].map((item) => (
            <Card
              key={item.key}
              className={cn(
                "cursor-pointer bg-card/40 border-border/50 p-4 shadow-sm hover:shadow-md transition-all duration-300 select-none",
                filter === item.key ? "border-cyan-500/40 bg-cyan-500/[0.05] ring-1 ring-cyan-500/10" : "",
                item.color
              )}
              onClick={() => setFilter(filter === item.key ? 'all' : item.key)}
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</p>
              <p className="mt-2 text-2xl font-black">{item.count}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Main Multi-Column Panel */}
      <section className="grid min-h-0 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Left Filters Sidebar Card */}
        <Card className="h-fit border-border bg-card/45 backdrop-blur-md p-4 shadow-sm flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <Input
              placeholder={t('searchPlaceholder')}
              className="h-10 rounded-xl pl-9 pr-8 border-border focus-visible:ring-cyan-500 bg-background text-xs font-semibold text-foreground"
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

          <div className="grid gap-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-2 pb-1">{t('filterRiskLabel')}</span>
            <Select value={filter} onValueChange={(val) => { if (val) setFilter(val); }}>
              <SelectTrigger className="w-full h-9 rounded-xl border-border bg-background text-xs font-semibold focus:ring-cyan-500 text-foreground">
                <SelectValue>
                  {filter === 'all' ? t('allRisk') : getRiskConfig(filter).label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-xs font-semibold text-foreground">{t('allRisk')}</SelectItem>
                <SelectItem value="critical" className="text-xs font-semibold text-foreground">🔴 {t('riskCriticalLabel')}</SelectItem>
                <SelectItem value="high" className="text-xs font-semibold text-foreground">🟠 {t('riskHighLabel')}</SelectItem>
                <SelectItem value="medium" className="text-xs font-semibold text-foreground">🟡 {t('riskMediumLabel')}</SelectItem>
                <SelectItem value="low" className="text-xs font-semibold text-foreground">🟢 {t('riskLowLabel')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(filter !== 'all' || search) && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 rounded-xl font-bold border-dashed border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 text-xs"
              onClick={() => {
                setSearch('');
                setFilter('all');
              }}
            >
              <X className="mr-1.5" size={13} /> {t('clearFilter')}
            </Button>
          )}
        </Card>

        {/* Master-Detail Split Grid */}
        <div className="grid min-h-[580px] gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
          {/* Master List Card */}
          <Card className="overflow-hidden border-border bg-card/45 backdrop-blur-md shadow-sm flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-card/20">
              <h2 className="font-black text-sm tracking-tight">{t('listTitle')}</h2>
              <Badge variant="outline" className="border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-[10px] font-bold flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-cyan-500 animate-pulse" />
                Live Flood Levels
              </Badge>
            </div>

            <ScrollArea className="flex-1 h-[580px] custom-scroll bg-transparent">
              {loading ? (
                <div className="space-y-4 p-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 bg-card border border-border/50 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : zones.length === 0 ? (
                <div className="flex min-h-[460px] flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-border/80 bg-muted/30 text-muted-foreground shadow-inner">
                    <Droplets size={28} />
                  </div>
                  <h3 className="text-base font-black tracking-tight text-foreground">{t('noZones')}</h3>
                  <p className="mt-2.5 max-w-xs text-xs font-semibold leading-relaxed text-muted-foreground">
                    {t('noZonesDesc')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                  {paginatedZones.map((zone) => {
                    const config = getRiskConfig(zone.risk_level);
                    const waterLevel = toNumber(zone.current_water_level_m);
                    const riskScore = getRiskScore(zone);
                    const active = selectedZone?.id === zone.id;
                    const statusLabel = zone.status_label || tEnum(`floodZoneStatus.${zone.status}`) || zone.status;

                    return (
                      <div
                        key={zone.id}
                        onClick={() => handleViewDetail(zone)}
                        className={cn(
                          'relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer select-none bg-card/40',
                          active
                            ? 'border-cyan-500/35 bg-cyan-500/[0.04] ring-1 ring-cyan-500/20'
                            : 'border-border hover:border-border/80 hover:bg-muted/30',
                        )}
                      >
                        {active && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-l" />
                        )}

                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0 flex items-start gap-2.5">
                            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border text-white text-lg", config.color)}>
                              <Droplets size={16} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs font-extrabold text-foreground truncate">{zone.name}</h3>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate font-semibold">
                                <MapPin size={10} />
                                {zone.district?.name || 'Da Nang'}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn("text-[8px] h-4 font-black uppercase tracking-wider gap-1 shrink-0", config.border, config.text)}>
                            {zone.risk_level_label || config.label}
                          </Badge>
                        </div>

                        {/* Metric stats breakdown */}
                        <div className="grid grid-cols-2 gap-2 mt-2 mb-1.5">
                          <div className="p-2 bg-muted/30 border border-border/50 rounded-xl flex flex-col justify-between">
                            <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wide">{t('waterLevelLabel')}</span>
                            <span className="font-extrabold text-xs text-foreground mt-1">
                              {waterLevel.toFixed(2)}m
                            </span>
                          </div>
                          <div className="p-2 bg-muted/30 border border-border/50 rounded-xl flex flex-col justify-between">
                            <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wide">{t('riskScoreLabel')}</span>
                            <span className="font-extrabold text-xs text-foreground mt-1">
                              {riskScore}/100
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 text-[10px] font-bold text-muted-foreground border-t border-border/50 pt-2.5">
                          <span className="text-[9px] uppercase tracking-wider opacity-80">{statusLabel}</span>
                          {zone.population_affected && (
                            <span className="text-[9px] text-muted-foreground/80 font-semibold flex items-center gap-1">
                              <Users size={11} />
                              {t('populationAffected', { count: zone.population_affected.toLocaleString() })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* List Pagination Indicators */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-5 py-4 bg-card/20">
                <span className="text-[10px] font-bold text-muted-foreground">
                  {t('paginationInfo', {
                    start: Math.min(zones.length, (currentPage - 1) * itemsPerPage + 1),
                    end: Math.min(zones.length, currentPage * itemsPerPage),
                    total: zones.length
                  })}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-8 rounded-lg p-0 border-border hover:bg-muted"
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
                      className={cn("size-8 rounded-lg p-0 text-xs font-bold border-border hover:bg-muted", currentPage === num && "bg-cyan-600 hover:bg-cyan-500 text-white border-none")}
                      onClick={() => typeof num === 'number' && setCurrentPage(num)}
                      disabled={typeof num !== 'number'}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-8 rounded-lg p-0 border-border hover:bg-muted"
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
          <Card className="relative overflow-hidden border-border bg-card/45 backdrop-blur-md shadow-sm flex flex-col">
            <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-cyan-500/20 via-cyan-500 to-cyan-500/20" />

            {selectedZone ? (
              <div className="flex flex-col h-full">
                {/* Panel Header */}
                <div className="border-b border-border px-5 py-4 flex items-center justify-between bg-card/20">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                      Zone ID: #{String(selectedZone.id).padStart(4, '0')}
                    </p>
                    <h2 className="font-black text-sm tracking-tight mt-0.5 truncate text-foreground">
                      {t('detailTitle')}
                    </h2>
                  </div>
                  <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-wider gap-1", getRiskConfig(selectedZone.risk_level).border, getRiskConfig(selectedZone.risk_level).text)}>
                    {selectedZone.risk_level_label || getRiskConfig(selectedZone.risk_level).label}
                  </Badge>
                </div>

                {/* Detail Content */}
                <ScrollArea className="flex-1 custom-scroll p-5">
                  {detailLoading ? (
                    <div className="space-y-4">
                      <div className="h-16 bg-muted/20 border border-border/50 rounded-2xl animate-pulse" />
                      <div className="h-28 bg-muted/20 border border-border/50 rounded-2xl animate-pulse" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Big Title & Icon */}
                      <div className="flex items-start gap-4">
                        <div className={cn("flex size-14 shrink-0 items-center justify-center rounded-2xl border text-white text-3xl shadow-md", getRiskConfig(selectedZone.risk_level).color)}>
                          <Droplets size={24} className="animate-pulse" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-black leading-snug text-foreground">
                            {selectedZone.name}
                          </h3>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="text-[10px] font-extrabold border uppercase tracking-wider border-cyan-500/20 bg-cyan-500/5 text-cyan-400">
                              {t('zoneStatus', { status: selectedZone.status_label || tEnum(`floodZoneStatus.${selectedZone.status}`) || selectedZone.status })}
                            </Badge>
                            {selectedZone.district?.name && (
                              <Badge variant="outline" className="text-[10px] font-extrabold border uppercase tracking-wider border-border bg-muted/20 text-muted-foreground">
                                {t('zoneDistrict', { district: selectedZone.district.name })}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* AI calculation risk meter gauge */}
                      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold text-cyan-500 uppercase tracking-widest flex items-center gap-1.5">
                            <BarChart2 size={12} /> {t('aiRiskMeter')}
                          </span>
                          <div className="flex items-baseline gap-1.5 mt-2">
                            <span className="text-3xl font-black text-foreground">{getRiskScore(selectedZone)}</span>
                            <span className="text-xs font-bold text-muted-foreground">{t('aiRiskUnit')}</span>
                          </div>
                        </div>

                        {/* Micro gauge circle graphic */}
                        <div className="size-16 relative flex items-center justify-center shrink-0">
                          <svg className="size-full transform -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4.5" fill="transparent" className="text-muted/30" />
                            <circle cx="32" cy="32" r="28" stroke="#0ea5e9" strokeWidth="4.5" fill="transparent"
                              strokeDasharray="175"
                              strokeDashoffset={175 - (175 * getRiskScore(selectedZone)) / 100}
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <span className="absolute text-[10px] font-black text-cyan-500">{getRiskScore(selectedZone)}%</span>
                        </div>
                      </div>

                      {/* Thresholds Info Card */}
                      <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3.5">
                        <p className="text-xs font-bold text-foreground flex items-center gap-2">
                          <Sparkles size={14} className="text-cyan-500 animate-pulse" />
                          {t('waterMonitorTitle')}
                        </p>
                        
                        <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                          <div className="p-2.5 rounded-xl bg-card border border-border/50">
                            <p className="text-[9px] text-muted-foreground font-extrabold uppercase">{t('waterCurrent')}</p>
                            <p className="text-sm font-black text-foreground mt-1">{toNumber(selectedZone.current_water_level_m).toFixed(2)}m</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-card border border-border/50">
                            <p className="text-[9px] text-muted-foreground font-extrabold uppercase">{t('waterAlert')}</p>
                            <p className="text-sm font-black text-amber-500 mt-1">{toNumber(selectedZone.alert_threshold_m).toFixed(2)}m</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-card border border-border/50">
                            <p className="text-[9px] text-muted-foreground font-extrabold uppercase">{t('waterDanger')}</p>
                            <p className="text-sm font-black text-rose-500 mt-1">{toNumber(selectedZone.danger_threshold_m).toFixed(2)}m</p>
                          </div>
                        </div>
                      </div>

                      {/* Area km2 and Population affected details */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-xl border border-border bg-muted/20 p-3 flex flex-col justify-between">
                          <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                            <Users size={12} className="text-cyan-500" /> {t('populationLabel')}
                          </span>
                          <span className="text-sm font-black text-foreground mt-2">
                            {selectedZone.population_affected ? `${selectedZone.population_affected.toLocaleString()}` : '—'}
                          </span>
                        </div>

                        <div className="rounded-xl border border-border bg-muted/20 p-3 flex flex-col justify-between">
                          <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">
                            {t('areaLabel')}
                          </span>
                          <span className="text-sm font-black text-foreground mt-2">
                            {selectedZone.area_km2 ? `${selectedZone.area_km2} km²` : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Description Notes */}
                      <div className="rounded-2xl border border-border bg-muted/20 p-3.5 text-xs">
                        <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1.5">
                          {t('geoDescLabel')}
                        </p>
                        <p className="text-foreground/90 font-semibold leading-relaxed">
                          {selectedZone.description || t('noGeoDesc')}
                        </p>
                      </div>

                      {/* Centroid Coordinates */}
                      {selectedZone.centroid?.lat && selectedZone.centroid?.lng && (
                        <div className="rounded-2xl border border-border bg-muted/20 p-3.5 text-[10px] font-bold text-muted-foreground">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2 flex items-center gap-1">
                            <MapPin size={11} className="text-cyan-500" /> {t('coordsLabel')}
                          </p>
                          <div className="flex items-center justify-between">
                            <span>{t('latLabel', { lat: Number(selectedZone.centroid.lat).toFixed(5) })}</span>
                            <span>{t('lngLabel', { lng: Number(selectedZone.centroid.lng).toFixed(5) })}</span>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2.5">
                        <Button
                          className="w-full gap-2 rounded-xl h-10 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
                          onClick={() => handleOpenMap(selectedZone)}
                        >
                          <Navigation size={14} />
                          {t('openMapBtn')}
                        </Button>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-transparent">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-muted-foreground shadow-inner">
                  <Droplets size={24} />
                </div>
                <h3 className="text-sm font-bold text-foreground">{t('noZoneSelected')}</h3>
                <p className="mt-1.5 max-w-xs text-xs text-muted-foreground font-semibold">
                  {t('noZoneSelectedDesc')}
                </p>
              </div>
            )}
          </Card>
        </div>
      </section>
    </main>
  );
}
