'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  BrainCircuit, TrendingUp, AlertTriangle, MapPin,
  RefreshCw, Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
type HorizonMinutes = 30 | 60;

interface PredictionInputTarget {
  current_water_level_m?: number | string | null;
  weather?: {
    rainfall_mm?: number | string | null;
  } | null;
}

interface ApiPrediction {
  id: number;
  prediction_type?: string | null;
  flood_zone?: { id: number; name: string } | null;
  district?: { id: number; name: string } | null;
  prediction_for?: string | null;
  issued_at?: string | null;
  predicted_value?: number | string | null;
  confidence?: number | string | null;
  probability?: number | string | null;
  severity?: string | null;
  horizon_minutes?: number | null;
  input_data?: PredictionInputTarget[] | Record<string, unknown> | null;
  recommendations?: string[] | null;
  affected_zones?: string[] | null;
  created_at?: string | null;
}

interface Prediction {
  id: number;
  prediction_type?: string;
  flood_zone?: { id: number; name: string } | null;
  type: PredictionType;
  area: string;
  latitude?: number;
  longitude?: number;
  predicted_at: string;
  time_range: string;
  severity: PredictionSeverity;
  confidence: number;
  probability: number;
  water_level_prediction?: number;
  rainfall_prediction?: number;
  affected_zones: string[];
  recommendations: string[];
  created_at: string;
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

function formatHorizon(minutes?: number): string {
  if (!minutes) return 'Không xác định';
  if (minutes < 60) return `${minutes} phút tới`;
  if (minutes % 60 === 0) return `${minutes / 60} giờ tới`;
  return `${Math.round((minutes / 60) * 10) / 10} giờ tới`;
}

function formatMeasurement(value?: number, suffix = ''): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '—';
  const decimals = Math.abs(numeric) >= 10 ? 1 : 2;
  return `${numeric.toFixed(decimals).replace(/\.?0+$/, '')}${suffix}`;
}

function predictionKey(prediction: Prediction): string {
  return [
    prediction.type,
    prediction.flood_zone?.id ?? prediction.area,
    prediction.time_range,
  ].join(':');
}

function latestPerArea(items: Prediction[]): Prediction[] {
  const seen = new Set<string>();
  return items.filter((prediction) => {
    const key = predictionKey(prediction);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mapPrediction(p: ApiPrediction): Prediction {
  const input = firstInputTarget(p.input_data);
  const probability = toNumber(p.probability) ?? 0;

  return {
    ...p,
    prediction_type: p.prediction_type ?? undefined,
    type: normalizeType(p.prediction_type === 'flood_risk' ? 'flood' : p.prediction_type),
    area: p.flood_zone?.name || p.district?.name || 'Khu vực chung',
    predicted_at: p.prediction_for || p.issued_at || p.created_at || new Date().toISOString(),
    time_range: formatHorizon(p.horizon_minutes ?? undefined),
    water_level_prediction: toNumber(p.predicted_value) ?? toNumber(input?.current_water_level_m),
    rainfall_prediction: toNumber(input?.weather?.rainfall_mm),
    recommendations: p.recommendations || [],
    affected_zones: p.affected_zones || (p.flood_zone ? [p.flood_zone.name] : []),
    severity: normalizeSeverity(p.severity),
    confidence: toNumber(p.confidence) ?? 0,
    probability,
    created_at: p.created_at || new Date().toISOString(),
  };
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = React.useState<Prediction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [timeFilter, setTimeFilter] = React.useState('all');
  const [horizon, setHorizon] = React.useState<HorizonMinutes>(60);

  const fetchPredictions = React.useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const params: Record<string, string> = {};
      if (timeFilter !== 'all') params.period = timeFilter;
      const res = await api.get('/predictions', { params });
      const mappedPredictions = ((res.data?.data ?? []) as ApiPrediction[]).map(mapPrediction);
      setPredictions(latestPerArea(mappedPredictions));
    } catch (e) {
      console.error(e);
      toast.error('Không tải được danh sách dự báo');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [timeFilter]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPredictions();

    const handler = (e: CustomEvent) => {
      const mapped = mapPrediction(e.detail as ApiPrediction);
      setPredictions(prev => latestPerArea([mapped, ...prev]));
    };
    window.addEventListener('aegis:prediction:received', handler as EventListener);
    return () => window.removeEventListener('aegis:prediction:received', handler as EventListener);
  }, [fetchPredictions]);

  const handleRefreshPredictions = async () => {
    setRefreshing(true);
    try {
      const api = (await import('@/lib/api')).default;
      await api.post('/predictions/trigger', { horizon_minutes: horizon, sync: true });
      await fetchPredictions(false);
      toast.success(`Đã chạy dự báo ${horizon} phút`);
    } catch (e) {
      console.error(e);
      toast.error('Không chạy được dự báo AI');
    } finally {
      setRefreshing(false);
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical': return { color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', label: 'Nghiêm trọng' };
      case 'high': return { color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', label: 'Cao' };
      case 'medium': return { color: 'bg-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Trung bình' };
      case 'low': return { color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', label: 'Thấp' };
      default: return { color: 'bg-gray-500', text: 'text-gray-600', bg: 'bg-gray-50', label: severity };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flood': return '🌊';
      case 'rainfall': return '🌧️';
      case 'water_level': return '📊';
      default: return '🔮';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const avgConfidence = predictions.length > 0
    ? predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length
    : 0;

  const stats = {
    total: predictions.length,
    critical: predictions.filter(p => p.severity === 'critical').length,
    high: predictions.filter(p => p.severity === 'high').length,
    avgConfidence: Math.round(avgConfidence * 100),
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6 custom-scroll">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dự báo AI</h1>
          <p className="text-sm text-muted-foreground">Phân tích và dự báo bằng trí tuệ nhân tạo</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(horizon)} onValueChange={(value) => setHorizon(Number(value) as HorizonMinutes)}>
            <SelectTrigger className="w-[132px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 phút</SelectItem>
              <SelectItem value="60">60 phút</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={handleRefreshPredictions} disabled={loading || refreshing}>
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Đang chạy...' : 'Chạy dự báo'}
          </Button>
        </div>
      </div>

      {/* AI Model Status */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <BrainCircuit size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="font-semibold">AegisFlow AI Model</p>
              <p className="text-xs text-muted-foreground">Độ chính xác trung bình: {stats.avgConfidence}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-600 font-medium">Đang hoạt động</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng dự báo', value: stats.total, icon: BrainCircuit, color: 'text-blue-600 bg-blue-100' },
          { label: 'Nghiêm trọng', value: stats.critical, icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
          { label: 'Mức cao', value: stats.high, icon: TrendingUp, color: 'text-orange-600 bg-orange-100' },
          { label: 'Độ chính xác TB', value: `${stats.avgConfidence}%`, icon: Star, color: 'text-purple-600 bg-purple-100' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={24} />
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={timeFilter} onValueChange={(v) => v && setTimeFilter(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Thời gian dự báo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả thời gian</SelectItem>
            <SelectItem value="1h">1 giờ tới</SelectItem>
            <SelectItem value="3h">3 giờ tới</SelectItem>
            <SelectItem value="6h">6 giờ tới</SelectItem>
            <SelectItem value="12h">12 giờ tới</SelectItem>
            <SelectItem value="24h">24 giờ tới</SelectItem>
            <SelectItem value="48h">48 giờ tới</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Predictions List */}
      <Tabs defaultValue="flood" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flood" className="gap-2">🌊 Dự báo lũ</TabsTrigger>
          <TabsTrigger value="rainfall" className="gap-2">🌧️ Lượng mưa</TabsTrigger>
          <TabsTrigger value="all" className="gap-2">📊 Tất cả</TabsTrigger>
        </TabsList>

        <TabsContent value="flood" className="space-y-4">
          {renderPredictions(predictions.filter(p => p.type === 'flood'), loading)}
        </TabsContent>

        <TabsContent value="rainfall" className="space-y-4">
          {renderPredictions(predictions.filter(p => p.type === 'rainfall'), loading)}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {renderPredictions(predictions, loading)}
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderPredictions(items: Prediction[], isLoading: boolean) {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="h-32 bg-muted rounded-lg animate-pulse" />
          </CardContent>
        </Card>
      ));
    }

    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <BrainCircuit className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Không có dự báo nào</p>
          </CardContent>
        </Card>
      );
    }

    return items.map((prediction, i) => {
      const severity = getSeverityConfig(prediction.severity);

      return (
        <motion.div
          key={prediction.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className={`${prediction.severity === 'critical' ? 'border-red-200' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl ${severity.bg} flex items-center justify-center text-2xl shrink-0`}>
                  {getTypeIcon(prediction.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold">{prediction.area}</h3>
                    <Badge className={`${severity.text} bg-opacity-10`} style={{ backgroundColor: 'var(--tw-bg-opacity, 0.1)' }}>
                      {severity.label}
                    </Badge>
                    <Badge variant="outline" className={getConfidenceColor(prediction.confidence)}>
                      {Math.round(prediction.confidence * 100)}% độ chính
                    </Badge>
                    <Badge variant="outline">
                      Nguy cơ {Math.round(prediction.probability * 100)}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {prediction.water_level_prediction !== undefined && (
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground">Mực nước dự báo</p>
                        <p className="font-bold">{formatMeasurement(prediction.water_level_prediction, 'm')}</p>
                      </div>
                    )}
                    {prediction.rainfall_prediction !== undefined && (
                      <div className="p-2 bg-cyan-50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground">Lượng mưa</p>
                        <p className="font-bold">{formatMeasurement(prediction.rainfall_prediction, 'mm')}</p>
                      </div>
                    )}
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <p className="text-[10px] text-muted-foreground">Thời gian</p>
                      <p className="font-bold text-sm">{prediction.time_range}</p>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <p className="text-[10px] text-muted-foreground">Dự báo lúc</p>
                      <p className="font-bold text-xs">
                        {new Date(prediction.predicted_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {prediction.recommendations?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Khuyến nghị:</p>
                      <div className="flex flex-wrap gap-2">
                        {prediction.recommendations.slice(0, 3).map((rec: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                            {rec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {prediction.affected_zones?.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <MapPin size={12} />
                      <span>Vùng ảnh hưởng: {prediction.affected_zones.slice(0, 3).join(', ')}
                        {prediction.affected_zones.length > 3 && ` +${prediction.affected_zones.length - 3}`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {prediction.created_at ? new Date(prediction.created_at).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : ''}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    });
  }
}
