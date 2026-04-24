'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  BrainCircuit, TrendingUp, Droplets, AlertTriangle, MapPin,
  Clock, RefreshCw, Calendar, Filter, Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface Prediction {
  id: number;
  type: 'flood' | 'rainfall' | 'water_level';
  area: string;
  latitude?: number;
  longitude?: number;
  predicted_at: string;
  time_range: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  water_level_prediction?: number;
  rainfall_prediction?: number;
  affected_zones: string[];
  recommendations: string[];
  created_at: string;
}

export default function PredictionsPage() {
  const t = useTranslations('dashboard');
  const [predictions, setPredictions] = React.useState<Prediction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [timeFilter, setTimeFilter] = React.useState('all');

  React.useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      try {
        const api = (await import('@/lib/api')).default;
        const params: any = {};
        if (timeFilter !== 'all') params.period = timeFilter;
        const res = await api.get('/predictions', { params });
        setPredictions(res.data?.data ?? []);
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();

    const handler = (e: CustomEvent) => {
      const data = e.detail;
      setPredictions(prev => [{ ...data, created_at: new Date().toISOString() }, ...prev]);
    };
    window.addEventListener('aegis:prediction:received', handler as EventListener);
    return () => window.removeEventListener('aegis:prediction:received', handler as EventListener);
  }, [timeFilter]);

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
        <Button variant="outline" className="gap-2">
          <RefreshCw size={16} />
          Làm mới dự báo
        </Button>
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
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {prediction.water_level_prediction !== undefined && (
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground">Mực nước dự báo</p>
                        <p className="font-bold">{prediction.water_level_prediction}m</p>
                      </div>
                    )}
                    {prediction.rainfall_prediction !== undefined && (
                      <div className="p-2 bg-cyan-50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground">Lượng mưa</p>
                        <p className="font-bold">{prediction.rainfall_prediction}mm</p>
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

                  {prediction.recommendations.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Khuyến nghị:</p>
                      <div className="flex flex-wrap gap-2">
                        {prediction.recommendations.slice(0, 3).map((rec, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                            {rec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {prediction.affected_zones.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <MapPin size={12} />
                      <span>Vùng ảnh hưởng: {prediction.affected_zones.slice(0, 3).join(', ')}
                        {prediction.affected_zones.length > 3 && ` +${prediction.affected_zones.length - 3}`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {new Date(prediction.created_at).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    });
  }
}
