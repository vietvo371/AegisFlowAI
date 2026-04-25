'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Megaphone, Bell, AlertTriangle, Clock, Eye, Send,
  Search, Filter, Plus, CheckCircle, XCircle, Volume2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Alert {
  id: number;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'flood' | 'weather' | 'rescue' | 'system' | 'emergency';
  status: 'active' | 'resolved' | 'expired';
  area?: string;
  affected_population?: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export default function AlertsPage() {
  const t = useTranslations('dashboard');
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [severityFilter, setSeverityFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  React.useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const api = (await import('@/lib/api')).default;
        const params: any = {};
        if (severityFilter !== 'all') params.severity = severityFilter;
        if (statusFilter !== 'all') params.status = statusFilter;
        const res = await api.get('/alerts', { params });
        setAlerts(res.data?.data ?? []);
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    const handler = () => fetchAlerts();
    window.addEventListener('aegis:alert:created', handler);
    return () => window.removeEventListener('aegis:alert:created', handler);
  }, [severityFilter, statusFilter]);

  const handleResolve = async (id: number) => {
    try {
      const api = (await import('@/lib/api')).default;
      await api.put(`/alerts/${id}/status`, { status: 'resolved' });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved', resolved_at: new Date().toISOString() } : a));
      toast.success('Đã giải quyết cảnh báo');
    } catch (e) {
      toast.error('Không thể giải quyết cảnh báo');
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical': return { color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', label: 'Nghiêm trọng' };
      case 'high': return { color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', label: 'Cao' };
      case 'medium': return { color: 'bg-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Trung bình' };
      case 'low': return { color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', label: 'Thấp' };
      default: return { color: 'bg-gray-500', text: 'text-gray-600', bg: 'bg-gray-50', label: severity };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { color: 'text-green-600', bg: 'bg-green-50', label: 'Đang hoạt động', icon: Bell };
      case 'resolved': return { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Đã giải quyết', icon: CheckCircle };
      case 'expired': return { color: 'text-gray-600', bg: 'bg-gray-50', label: 'Hết hạn', icon: Clock };
      default: return { color: 'text-gray-600', bg: 'bg-gray-50', label: status, icon: Clock };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flood': return '🌊';
      case 'weather': return '⛈️';
      case 'rescue': return '🚑';
      case 'system': return '⚙️';
      case 'emergency': return '🚨';
      default: return '📢';
    }
  };

  const filteredAlerts = alerts.filter(alert =>
    alert.title.toLowerCase().includes(search.toLowerCase()) ||
    alert.description?.toLowerCase().includes(search.toLowerCase()) ||
    alert.area?.toLowerCase().includes(search.toLowerCase())
  );

  const activeAlerts = filteredAlerts.filter(a => a.status === 'active');
  const resolvedAlerts = filteredAlerts.filter(a => a.status === 'resolved');

  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    critical: alerts.filter(a => a.status === 'active' && a.severity === 'critical').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6 custom-scroll">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cảnh báo</h1>
          <p className="text-sm text-muted-foreground">Quản lý và phát cảnh báo</p>
        </div>
        <Button className="gap-2">
          <Plus size={16} />
          Tạo cảnh báo mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng cảnh báo', value: stats.total, icon: Megaphone, color: 'text-blue-600 bg-blue-100' },
          { label: 'Đang hoạt động', value: stats.active, icon: Bell, color: 'text-green-600 bg-green-100' },
          { label: 'Nghiêm trọng', value: stats.critical, icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
          { label: 'Đã giải quyết', value: stats.resolved, icon: CheckCircle, color: 'text-gray-600 bg-gray-100' },
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Tìm kiếm cảnh báo..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={severityFilter} onValueChange={(v) => v && setSeverityFilter(v)}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Mức độ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả mức độ</SelectItem>
            <SelectItem value="critical">Nghiêm trọng</SelectItem>
            <SelectItem value="high">Cao</SelectItem>
            <SelectItem value="medium">Trung bình</SelectItem>
            <SelectItem value="low">Thấp</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Đang hoạt động</SelectItem>
            <SelectItem value="resolved">Đã giải quyết</SelectItem>
            <SelectItem value="expired">Hết hạn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <Bell size={14} />
            Đang hoạt động ({activeAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="gap-2">
            <CheckCircle size={14} />
            Đã giải quyết ({resolvedAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-24 bg-muted rounded-lg animate-pulse" />
                </CardContent>
              </Card>
            ))
          ) : activeAlerts.length > 0 ? (
            activeAlerts.map((alert, i) => {
              const severity = getSeverityConfig(alert.severity);
              const status = getStatusConfig(alert.status);
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`${alert.severity === 'critical' ? 'border-red-200 bg-red-50/30' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${severity.bg} flex items-center justify-center text-2xl shrink-0`}>
                          {getTypeIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold">{alert.title}</h3>
                            <Badge className={`${severity.text} bg-opacity-10`} style={{ backgroundColor: 'var(--tw-bg-opacity, 0.1)' }}>
                              {severity.label}
                            </Badge>
                            <Badge variant="outline" className={`${status.color} gap-1`}>
                              <StatusIcon size={12} />
                              {status.label}
                            </Badge>
                          </div>
                          {alert.description && (
                            <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                            {alert.area && (
                              <span className="flex items-center gap-1">
                                📍 {alert.area}
                              </span>
                            )}
                            {alert.affected_population && (
                              <span className="flex items-center gap-1">
                                👥 {alert.affected_population.toLocaleString()} người
                              </span>
                            )}
                            <span className="flex items-center gap-1 ml-auto">
                              <Clock size={14} />
                              {new Date(alert.created_at).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye size={14} />
                            Chi tiết
                          </Button>
                          <Button size="sm" onClick={() => handleResolve(alert.id)} className="gap-1">
                            <CheckCircle size={14} />
                            Giải quyết
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Không có cảnh báo nào đang hoạt động</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-24 bg-muted rounded-lg animate-pulse" />
                </CardContent>
              </Card>
            ))
          ) : resolvedAlerts.length > 0 ? (
            resolvedAlerts.map((alert, i) => {
              const severity = getSeverityConfig(alert.severity);
              const status = getStatusConfig(alert.status);
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${severity.bg} flex items-center justify-center text-2xl shrink-0 opacity-50`}>
                          {getTypeIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold opacity-75">{alert.title}</h3>
                            <Badge className={`${severity.text} bg-opacity-10 opacity-50`} style={{ backgroundColor: 'var(--tw-bg-opacity, 0.1)' }}>
                              {severity.label}
                            </Badge>
                            <Badge variant="outline" className={`${status.color} gap-1 opacity-75`}>
                              <StatusIcon size={12} />
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {alert.resolved_at && (
                              <span>Giải quyết lúc: {new Date(alert.resolved_at).toLocaleString('vi-VN')}</span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye size={14} />
                          Xem lại
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Không có cảnh báo nào đã giải quyết</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
