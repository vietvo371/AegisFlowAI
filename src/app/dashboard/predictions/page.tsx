'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import {
  AlertTriangle,
  BrainCircuit,
  Lightbulb,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Droplets,
  Gauge,
  History,
  Loader2,
  MapPin,
  RefreshCw,
  Settings2,
  ShieldCheck,
  TrendingUp,
  Waves,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type PredictionType = 'flood' | 'rainfall' | 'water_level';
type PredictionSeverity = 'low' | 'medium' | 'high' | 'critical';
type HorizonMinutes = 15 | 30 | 60 | 120 | 240 | 1440;

interface PredictionInputTarget {
  current_water_level_m?: number | string | null;
  weather?: {
    rainfall_mm?: number | string | null;
  } | null;
}

interface ApiPrediction {
  id: number;
  prediction_type?: string | null;
  model?: { id: number; name: string; version: string } | null;
  model_version?: string | null;
  flood_zone?: { id: number; name: string } | null;
  district?: { id: number; name: string } | null;
  prediction_for?: string | null;
  issued_at?: string | null;
  predicted_value?: number | string | null;
  confidence?: number | string | null;
  probability?: number | string | null;
  severity?: string | null;
  severity_label?: string | null;
  status?: string | null;
  horizon_minutes?: number | null;
  input_data?: PredictionInputTarget[] | Record<string, unknown> | null;
  recommendations?: string[] | null;
  affected_zones?: string[] | null;
  processing_time_ms?: number | string | null;
  created_at?: string | null;
}

interface Prediction {
  id: number;
  prediction_type?: string;
  model_version?: string;
  flood_zone?: { id: number; name: string } | null;
  type: PredictionType;
  area: string;
  predicted_at: string;
  time_range: string;
  severity: PredictionSeverity;
  severity_label: string;
  confidence: number;
  probability: number;
  water_level_prediction?: number;
  rainfall_prediction?: number;
  affected_zones: string[];
  recommendations: string[];
  processing_time_ms?: number;
  created_at: string;
}

interface AiSettings {
  prediction_enabled: boolean;
  prediction_interval_minutes: number;
  prediction_horizon_minutes: number;
  seasonality_enabled: boolean;
  last_run_at?: string | null;
}

function toNumber(value: unknown): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function normalizeType(type?: string | null): PredictionType {
  if (type === 'rainfall' || type === 'water_level') return type;
  return 'flood';
}

function normalizeSeverity(severity?: string | null): PredictionSeverity {
  if (severity === 'low' || severity === 'medium' || severity === 'high' || severity === 'critical') {
    return severity;
  }
  return 'medium';
}

function firstInputTarget(inputData: ApiPrediction['input_data']): PredictionInputTarget | null {
  return Array.isArray(inputData) ? inputData[0] ?? null : null;
}

function formatMeasurement(value?: number, suffix = ''): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  const decimals = Math.abs(numeric) >= 10 ? 1 : 2;
  return `${numeric.toFixed(decimals).replace(/\.?0+$/, '')}${suffix}`;
}

function formatDateTime(value?: string | null, locale = 'vi'): string {
  if (!value) return '';
  return new Date(value).toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function predictionKey(prediction: Prediction): string {
  return [
    prediction.type,
    prediction.flood_zone?.id ?? prediction.area,
    prediction.time_range,
  ].join(':');
}

function latestPerArea(items: Prediction[]): Prediction[] {
  const seenIds = new Set<number | string>();
  const seen = new Set<string>();
  return items.filter((prediction) => {
    if (seenIds.has(prediction.id)) return false;
    seenIds.add(prediction.id);
    const key = predictionKey(prediction);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mapPrediction(p: ApiPrediction, formatHorizonFn: (m?: number) => string): Prediction {
  const input = firstInputTarget(p.input_data);
  const probability = toNumber(p.probability) ?? 0;
  const severity = normalizeSeverity(p.severity);
  const predictedValue = toNumber(p.predicted_value);
  const waterLevelPrediction = predictedValue !== undefined && predictedValue <= 10
    ? predictedValue
    : toNumber(input?.current_water_level_m);

  return {
    id: p.id,
    prediction_type: p.prediction_type ?? undefined,
    model_version: p.model_version ?? p.model?.version ?? undefined,
    flood_zone: p.flood_zone ?? null,
    type: normalizeType(p.prediction_type === 'flood_risk' ? 'flood' : p.prediction_type),
    area: p.flood_zone?.name || p.district?.name || 'Khu vực chung',
    predicted_at: p.prediction_for || p.issued_at || p.created_at || new Date().toISOString(),
    time_range: formatHorizonFn(p.horizon_minutes ?? undefined),
    water_level_prediction: waterLevelPrediction,
    rainfall_prediction: toNumber(input?.weather?.rainfall_mm),
    recommendations: p.recommendations || [],
    affected_zones: p.affected_zones || (p.flood_zone ? [p.flood_zone.name] : []),
    severity,
    severity_label: p.severity_label || severity,
    confidence: toNumber(p.confidence) ?? 0,
    probability,
    processing_time_ms: toNumber(p.processing_time_ms),
    created_at: p.created_at || new Date().toISOString(),
  };
}

function getSeverityConfig(severity: string) {
  switch (severity) {
    case 'critical':
      return { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', bar: 'bg-red-500' };
    case 'high':
      return { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', bar: 'bg-orange-500' };
    case 'medium':
      return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' };
    case 'low':
      return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500' };
    default:
      return { text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', bar: 'bg-slate-500' };
  }
}

function riskPercent(prediction: Prediction): number {
  if (prediction.probability <= 1) return Math.round(prediction.probability * 100);
  return Math.round(Math.min(100, prediction.probability));
}

export default function PredictionsPage() {
  const t = useTranslations('dashboard.predictions');
  const tEnum = useTranslations('enums');
  const locale = useLocale();
  const [predictions, setPredictions] = React.useState<Prediction[]>([]);
  const [aiSettings, setAiSettings] = React.useState<AiSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [retraining, setRetraining] = React.useState(false);
  const [timeFilter, setTimeFilter] = React.useState('all');
  const [horizon, setHorizon] = React.useState<HorizonMinutes>(60);
  const [pendingRecCount, setPendingRecCount] = React.useState<number>(0);

  function formatHorizon(minutes?: number): string {
    if (!minutes) return t('unknownHorizon');
    if (minutes < 60) return t('horizonMinutes', { minutes });
    if (minutes % 60 === 0) return t('horizonHours', { hours: minutes / 60 });
    return t('horizonHours', { hours: Math.round((minutes / 60) * 10) / 10 });
  }

  function getSeverityLabel(severity: string): string {
    try { return tEnum(`severity.${severity}`); } catch { return severity; }
  }

  const fetchAiSettings = React.useCallback(async () => {
    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.get('/admin/system-settings');
      const ai = res.data?.data?.ai;
      if (ai) {
        setAiSettings({
          prediction_enabled: Boolean(ai.prediction_enabled),
          prediction_interval_minutes: Number(ai.prediction_interval_minutes ?? 15),
          prediction_horizon_minutes: Number(ai.prediction_horizon_minutes ?? 60),
          seasonality_enabled: Boolean(ai.seasonality_enabled),
          last_run_at: ai.last_run_at ?? null,
        });
        setHorizon(Number(ai.prediction_horizon_minutes ?? 60) as HorizonMinutes);
      }
    } catch {
      setAiSettings(null);
    }
  }, []);

  const fetchPredictions = React.useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const params: Record<string, string | number> = { per_page: 50, recent_only: 1 };
      if (timeFilter !== 'all') params.period = timeFilter;
      const res = await api.get('/predictions', { params });
      const mappedPredictions = ((res.data?.data ?? []) as ApiPrediction[]).map((p) => mapPrediction(p, formatHorizon));
      setPredictions(latestPerArea(mappedPredictions));
    } catch (error) {
      console.error(error);
      toast.error(t('toastLoadError'));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [timeFilter, t]);

  React.useEffect(() => {
    const fetchPendingRecs = async () => {
      try {
        const api = (await import('@/lib/api')).default;
        const res = await api.get('/recommendations', { params: { status: 'pending', per_page: 1 } });
        setPendingRecCount(res.data?.meta?.total ?? res.data?.total ?? 0);
      } catch { /* ignore */ }
    };
    fetchPendingRecs();
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPredictions();
    fetchAiSettings();

    const handler = (event: CustomEvent) => {
      const mapped = mapPrediction(event.detail as ApiPrediction, formatHorizon);
      setPredictions(prev => latestPerArea([mapped, ...prev]));
    };
    window.addEventListener('aegis:prediction:received', handler as EventListener);
    return () => window.removeEventListener('aegis:prediction:received', handler as EventListener);
  }, [fetchAiSettings, fetchPredictions]);

  const handleRetrain = async () => {
    setRetraining(true);
    toast.info(t('toastRetraining'), { duration: 5000 });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? 'http://localhost:5005'}/api/retrain`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast.success(t('toastRetrainSuccess', { version: data.model_version, f1: (data.f1_weighted * 100).toFixed(1), acc: (data.balanced_accuracy * 100).toFixed(1) }));
        await fetchPredictions(false);
      } else {
        toast.error(t('toastRetrainError', { error: data.errors?.[0] ?? 'unknown error' }));
      }
    } catch {
      toast.error(t('toastAiServiceError'));
    } finally {
      setRetraining(false);
    }
  };

  const handleRefreshPredictions = async () => {
    setRefreshing(true);
    try {
      const api = (await import('@/lib/api')).default;
      await api.post('/predictions/trigger', { horizon_minutes: horizon, sync: true });
      await Promise.all([fetchPredictions(false), fetchAiSettings()]);
      toast.success(t('toastTriggerSuccess', { horizon: formatHorizon(horizon) }));
    } catch (error) {
      console.error(error);
      toast.error(t('toastTriggerError'));
    } finally {
      setRefreshing(false);
    }
  };

  const avgConfidence = predictions.length > 0
    ? predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length
    : 0;
  const watchlist = predictions.filter(p => ['critical', 'high'].includes(p.severity));
  const latestPrediction = predictions[0];
  const modelVersion = latestPrediction?.model_version || '3.0.0';

  const stats = {
    total: predictions.length,
    critical: predictions.filter(p => p.severity === 'critical').length,
    high: predictions.filter(p => p.severity === 'high').length,
    avgConfidence: Math.round(avgConfidence * 100),
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6 custom-scroll">
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {t('modelStateActive')}
              </Badge>
              <Badge variant="outline">{t('modelStateModel', { version: modelVersion })}</Badge>
              {modelVersion.startsWith('3') && (
                <Badge variant="outline" className="gap-1.5 border-blue-200 bg-blue-50 text-blue-700">
                  <TrendingUp size={12} />
                  {t('modelStateTrend')}
                </Badge>
              )}
              {aiSettings?.seasonality_enabled && (
                <Badge variant="outline" className="gap-1.5">
                  <History size={12} />
                  {t('modelStateSeason')}
                </Badge>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {t('pageDesc')}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-background p-3">
                <p className="text-xs text-muted-foreground">{t('autoCycle')}</p>
                <p className="mt-1 font-semibold">
                  {aiSettings?.prediction_enabled ? formatHorizon(aiSettings.prediction_interval_minutes) : tEnum('status.disabled')}
                </p>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <p className="text-xs text-muted-foreground">{t('defaultHorizon')}</p>
                <p className="mt-1 font-semibold">{formatHorizon(aiSettings?.prediction_horizon_minutes ?? 60)}</p>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <p className="text-xs text-muted-foreground">{t('lastRun')}</p>
                <p className="mt-1 font-semibold">{formatDateTime(aiSettings?.last_run_at, locale) || t('noPredictionCreated')}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="grid gap-3 sm:grid-cols-[170px_180px]">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t('manualHorizonLabel')}</p>
                <Select value={String(horizon)} onValueChange={(value) => setHorizon(Number(value) as HorizonMinutes)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">{t('horizonMinutes', { minutes: 15 })}</SelectItem>
                    <SelectItem value="30">{t('horizonMinutes', { minutes: 30 })}</SelectItem>
                    <SelectItem value="60">{t('horizonHours', { hours: 1 })}</SelectItem>
                    <SelectItem value="120">{t('horizonHours', { hours: 2 })}</SelectItem>
                    <SelectItem value="240">{t('horizonHours', { hours: 4 })}</SelectItem>
                    <SelectItem value="1440">{t('horizonHours', { hours: 24 })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full gap-2" onClick={handleRefreshPredictions} disabled={loading || refreshing}>
                  {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  {refreshing ? t('btnRunning') : t('btnTrigger')}
                </Button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleRetrain} disabled={retraining || loading}>
                {retraining ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
                {retraining ? t('btnRetrainLoading') : t('btnRetrain')}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2" asChild>
                <a href="/dashboard/settings">
                  <Settings2 size={14} />
                  {t('btnConfig')}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {pendingRecCount > 0 && (
        <a href="/dashboard/recommendations" className="block rounded-xl border border-amber-200 bg-amber-50 p-4 hover:bg-amber-100 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                <Lightbulb size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">
                  {t('pendingRecsBanner', { count: pendingRecCount })}
                </p>
                <p className="text-xs text-amber-700">{t('pendingRecsBannerDesc')}</p>
              </div>
            </div>
            <span className="text-sm font-medium text-amber-700">{t('viewNow')}</span>
          </div>
        </a>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: t('statsRun'), value: stats.total, icon: BrainCircuit, color: 'text-blue-600 bg-blue-50' },
          { label: t('statsCritical'), value: stats.critical, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
          { label: t('statsWatch'), value: stats.high, icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
          { label: t('statsConfidence'), value: `${stats.avgConfidence}%`, icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon size={22} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('sectionTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('sectionDesc')}</p>
        </div>
        <Select value={timeFilter} onValueChange={(value) => value && setTimeFilter(value)}>
          <SelectTrigger className="w-full sm:w-[190px]">
            <SelectValue placeholder={t('selectPeriodPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('periodAll')}</SelectItem>
            <SelectItem value="1h">{t('period1h')}</SelectItem>
            <SelectItem value="3h">{t('period3h')}</SelectItem>
            <SelectItem value="6h">{t('period6h')}</SelectItem>
            <SelectItem value="12h">{t('period12h')}</SelectItem>
            <SelectItem value="24h">{t('period24h')}</SelectItem>
            <SelectItem value="48h">{t('period48h')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="watchlist" className="space-y-4">
        <TabsList>
          <TabsTrigger value="watchlist">{t('tabWatchlist', { count: watchlist.length })}</TabsTrigger>
          <TabsTrigger value="flood">{t('tabFlood', { count: predictions.filter(p => p.type === 'flood').length })}</TabsTrigger>
          <TabsTrigger value="all">{t('tabAll', { count: predictions.length })}</TabsTrigger>
        </TabsList>

        <TabsContent value="watchlist" className="space-y-3">
          {renderPredictions(watchlist, loading)}
        </TabsContent>
        <TabsContent value="flood" className="space-y-3">
          {renderPredictions(predictions.filter(p => p.type === 'flood'), loading)}
        </TabsContent>
        <TabsContent value="all" className="space-y-3">
          {renderPredictions(predictions, loading)}
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderPredictions(items: Prediction[], isLoading: boolean) {
    if (isLoading) {
      return Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="h-28 animate-pulse rounded-lg bg-muted" />
          </CardContent>
        </Card>
      ));
    }

    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <CheckCircle2 className="mb-3 h-11 w-11 text-emerald-500" />
            <p className="font-medium">{t('noForecast')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('noForecastDesc')}
            </p>
          </CardContent>
        </Card>
      );
    }

    return items.map((prediction, i) => {
      const severity = getSeverityConfig(prediction.severity);
      const risk = riskPercent(prediction);
      const confidence = Math.round(prediction.confidence * 100);

      return (
        <motion.div
          key={prediction.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.035 }}
        >
          <Card className={severity.border}>
            <CardContent className="p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                <div className="min-w-0 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${severity.bg} ${severity.text}`}>
                        {prediction.type === 'flood' ? <Waves size={24} /> : prediction.type === 'rainfall' ? <Droplets size={24} /> : <Gauge size={24} />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{prediction.area}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge className={`${severity.bg} ${severity.text}`}>
                            {getSeverityLabel(prediction.severity)}
                          </Badge>
                          <Badge variant="outline">{prediction.time_range}</Badge>
                          {prediction.model_version && <Badge variant="outline">v{prediction.model_version}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{t('itemCreatedTime')}</p>
                      <p className="font-medium text-foreground">{formatDateTime(prediction.created_at, locale)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{t('itemHazardIndex')}</span>
                      <span className={`font-bold ${severity.text}`}>{risk}%</span>
                    </div>
                    <Progress value={risk} className="h-2" indicatorClassName={severity.bar} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <Metric label={t('itemWater')} value={formatMeasurement(prediction.water_level_prediction, 'm')} icon={Gauge} />
                    <Metric label={t('itemRain')} value={formatMeasurement(prediction.rainfall_prediction, 'mm')} icon={Droplets} />
                    <Metric label={t('itemConfidence')} value={`${confidence}%`} icon={ShieldCheck} />
                    <Metric label={t('itemProcTime')} value={prediction.processing_time_ms ? `${Math.round(prediction.processing_time_ms)}ms` : '-'} icon={Clock3} />
                  </div>

                  {prediction.affected_zones.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin size={14} />
                      <span>{t('itemZones', { zones: prediction.affected_zones.slice(0, 3).join(', ') })}</span>
                    </div>
                  )}
                </div>

                <aside className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <CalendarClock size={15} />
                    {t('itemPredictedTime')}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(prediction.predicted_at, locale)}</p>

                  <div className="mt-4">
                    <p className="text-sm font-semibold">{t('itemRecs')}</p>
                    {prediction.recommendations.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {prediction.recommendations.slice(0, 3).map((rec, index) => (
                          <span key={`${prediction.id}-${index}`} className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                            {rec}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 space-y-1.5">
                        <p className="text-xs text-muted-foreground">
                          {prediction.severity === 'low'
                            ? t('itemRecsLowRisk')
                            : t('itemRecsNone')}
                        </p>
                        <a
                          href="/dashboard/recommendations"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          {t('viewPendingRecs')}
                        </a>
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    });
  }
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon size={13} />
        {label}
      </div>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
