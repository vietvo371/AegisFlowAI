'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Lightbulb, AlertTriangle, TrendingUp,
  Clock, Filter, RefreshCw, ArrowUpRight, ArrowDownRight, Minus
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

interface Recommendation {
  id: number;
  type: 'evacuation' | 'preparation' | 'prevention' | 'emergency' | 'general';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  target_area?: string;
  target_audience?: string[];
  impact?: string;
  confidence?: number;
  status: 'active' | 'implemented' | 'expired';
  created_at: string;
  expires_at?: string;
}

export default function RecommendationsPage() {
  const t = useTranslations('dashboard');
  const [recommendations, setRecommendations] = React.useState<Recommendation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [priorityFilter, setPriorityFilter] = React.useState('all');

  React.useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const api = (await import('@/lib/api')).default;
        const params: any = {};
        if (typeFilter !== 'all') params.type = typeFilter;
        if (priorityFilter !== 'all') params.priority = priorityFilter;
        const res = await api.get('/recommendations', { params });
        setRecommendations(res.data?.data ?? []);
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [typeFilter, priorityFilter]);

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'critical': return { color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', label: 'Khẩn cấp' };
      case 'high': return { color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', label: 'Cao' };
      case 'medium': return { color: 'bg-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Trung bình' };
      case 'low': return { color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', label: 'Thấp' };
      default: return { color: 'bg-gray-500', text: 'text-gray-600', bg: 'bg-gray-50', label: priority };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'evacuation': return { icon: '🚨', label: 'Sơ tán', color: 'text-red-600 bg-red-100' };
      case 'preparation': return { icon: '🛡️', label: 'Chuẩn bị', color: 'text-blue-600 bg-blue-100' };
      case 'prevention': return { icon: '⚠️', label: 'Phòng ngừa', color: 'text-green-600 bg-green-100' };
      case 'emergency': return { icon: '🚑', label: 'Khẩn cấp', color: 'text-orange-600 bg-orange-100' };
      case 'general': return { icon: '📋', label: 'Chung', color: 'text-gray-600 bg-gray-100' };
      default: return { icon: '📌', label: type, color: 'text-gray-600 bg-gray-100' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { label: 'Đang hoạt động', color: 'text-green-600' };
      case 'implemented': return { label: 'Đã triển khai', color: 'text-blue-600' };
      case 'expired': return { label: 'Hết hạn', color: 'text-gray-600' };
      default: return { label: status, color: 'text-gray-600' };
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (typeFilter !== 'all' && rec.type !== typeFilter) return false;
    if (priorityFilter !== 'all' && rec.priority !== priorityFilter) return false;
    return true;
  });

  const stats = {
    total: recommendations.length,
    active: recommendations.filter(r => r.status === 'active').length,
    implemented: recommendations.filter(r => r.status === 'implemented').length,
    critical: recommendations.filter(r => r.priority === 'critical' && r.status === 'active').length,
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6 custom-scroll">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Khuyến nghị</h1>
          <p className="text-sm text-muted-foreground">AI đề xuất hành động tối ưu</p>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw size={16} />
          Cập nhật
        </Button>
      </div>

      {/* AI Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Lightbulb size={24} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold">AI Recommendation Engine</p>
              <p className="text-xs text-muted-foreground">
                {stats.active} khuyến nghị đang hoạt động • {stats.critical} ưu tiên cao
              </p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-700">Hoạt động</Badge>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng khuyến nghị', value: stats.total, icon: CheckCircle2, color: 'text-blue-600 bg-blue-100' },
          { label: 'Đang hoạt động', value: stats.active, icon: TrendingUp, color: 'text-green-600 bg-green-100' },
          { label: 'Đã triển khai', value: stats.implemented, icon: CheckCircle2, color: 'text-purple-600 bg-purple-100' },
          { label: 'Khẩn cấp', value: stats.critical, icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
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
        <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            <SelectItem value="evacuation">Sơ tán</SelectItem>
            <SelectItem value="preparation">Chuẩn bị</SelectItem>
            <SelectItem value="prevention">Phòng ngừa</SelectItem>
            <SelectItem value="emergency">Khẩn cấp</SelectItem>
            <SelectItem value="general">Chung</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => v && setPriorityFilter(v)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Ưu tiên" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả ưu tiên</SelectItem>
            <SelectItem value="critical">Khẩn cấp</SelectItem>
            <SelectItem value="high">Cao</SelectItem>
            <SelectItem value="medium">Trung bình</SelectItem>
            <SelectItem value="low">Thấp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recommendations List */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Đang hoạt động ({filteredRecommendations.filter(r => r.status === 'active').length})</TabsTrigger>
          <TabsTrigger value="implemented">Đã triển khai ({filteredRecommendations.filter(r => r.status === 'implemented').length})</TabsTrigger>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {renderRecommendations(filteredRecommendations.filter(r => r.status === 'active'), loading)}
        </TabsContent>

        <TabsContent value="implemented" className="space-y-4">
          {renderRecommendations(filteredRecommendations.filter(r => r.status === 'implemented'), loading)}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {renderRecommendations(filteredRecommendations, loading)}
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderRecommendations(items: Recommendation[], isLoading: boolean) {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="h-28 bg-muted rounded-lg animate-pulse" />
          </CardContent>
        </Card>
      ));
    }

    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Không có khuyến nghị nào</p>
          </CardContent>
        </Card>
      );
    }

    return items.map((rec, i) => {
      const priority = getPriorityConfig(rec.priority);
      const type = getTypeConfig(rec.type);
      const status = getStatusConfig(rec.status);

      return (
        <motion.div
          key={rec.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className={`${rec.priority === 'critical' && rec.status === 'active' ? 'border-red-200' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${type.color} flex items-center justify-center text-xl shrink-0`}>
                  {type.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold">{rec.title}</h3>
                    <Badge className={`${priority.text} bg-opacity-10`} style={{ backgroundColor: 'var(--tw-bg-opacity, 0.1)' }}>
                      {priority.label}
                    </Badge>
                    <Badge variant="outline">{type.label}</Badge>
                    <Badge variant="outline" className={`${status.color}`}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    {rec.target_area && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        📍 {rec.target_area}
                      </span>
                    )}
                    {rec.impact && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        📊 Tác động: {rec.impact}
                      </span>
                    )}
                    {rec.confidence !== undefined && (
                      <span className={`text-xs font-medium ${rec.confidence >= 0.8 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {Math.round(rec.confidence * 100)}% độ chính xác
                      </span>
                    )}
                    {rec.target_audience && rec.target_audience.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        👥 {rec.target_audience.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {rec.status === 'active' && (
                    <Button size="sm">
                      Triển khai
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    Chi tiết
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    });
  }
}
