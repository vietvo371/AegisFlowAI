'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Megaphone, Bell, AlertTriangle, Clock, Eye, Send,
  Search, Filter, Plus, CheckCircle, XCircle, Volume2, MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Alert {
  id: number;
  alert_number?: string;
  title: string;
  description?: string;
  alert_type: string;
  severity: string;
  status: string;
  geometry?: any;
  affected_districts?: any;
  affected_flood_zones?: any;
  radius_km?: number;
  effective_from: string;
  effective_until?: string;
  source?: string;
  issued_by?: number;
  resolved_by?: number;
  resolved_at?: string;
  related_incident_id?: number;
  related_prediction_id?: number;
  created_at: string;
  area?: string;
  address?: string | null;
  affected_population?: number;
  updated_at?: string;
}

interface FloodZoneOption {
  id: number;
  name: string;
  district?: {
    id: number;
    name: string;
  } | null;
  centroid?: {
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
  } | null;
  current_water_level_m?: number | string | null;
  risk_level?: string;
}

interface IncidentOption {
  id: number;
  title: string;
  type?: string;
  severity: string;
  status: string;
  address?: string | null;
  location?: {
    lat?: number | string;
    lng?: number | string;
    latitude?: number | string;
    longitude?: number | string;
  } | null;
  water_level_m?: number | string | null;
  district?: {
    id: number;
    name: string;
  } | null;
  flood_zone?: {
    id: number;
    name: string;
  } | null;
  created_at?: string;
}

export default function AlertsPage() {
  const t = useTranslations('dashboard');
  const tAlerts = useTranslations('dashboard.alerts');
  const tEnum = useTranslations('enums');
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [severityFilter, setSeverityFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [selectedAlert, setSelectedAlert] = React.useState<Alert | null>(null);
  const [incidents, setIncidents] = React.useState<IncidentOption[]>([]);
  const [incidentsLoading, setIncidentsLoading] = React.useState(false);
  const [floodZones, setFloodZones] = React.useState<FloodZoneOption[]>([]);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    alert_type: 'flood_warning',
    severity: 'medium',
    incident_id: '',
    flood_zone_id: '',
    effective_until: '',
  });

  const alertTypeLabels: Record<string, string> = {
    flood_warning: 'Cảnh báo ngập',
    heavy_rain: 'Mưa lớn',
    dam_warning: 'Cảnh báo đập',
    evacuation: 'Sơ tán',
    weather: 'Thời tiết',
    all_clear: 'Dỡ cảnh báo',
  };

  const severityLabels: Record<string, string> = {
    low: tAlerts('sevLow'),
    medium: tAlerts('sevMedium'),
    high: tAlerts('sevHigh'),
    critical: tAlerts('sevCritical'),
  };

  const fetchAlerts = React.useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const params: any = {};
      if (severityFilter !== 'all') params.severity = severityFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/alerts', { params });
      setAlerts(res.data?.data ?? []);
    } catch (e) {
      toast.error('Không tải được danh sách cảnh báo');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [severityFilter, statusFilter]);

  React.useEffect(() => {
    fetchAlerts();

    const handler = () => fetchAlerts();
    window.addEventListener('aegis:alert:created', handler);
    return () => window.removeEventListener('aegis:alert:created', handler);
  }, [fetchAlerts]);

  React.useEffect(() => {
    const fetchAlertContext = async () => {
      setIncidentsLoading(true);
      try {
        const api = (await import('@/lib/api')).default;
        const [incidentsRes, zonesRes] = await Promise.all([
          api.get('/incidents', { params: { per_page: 100 } }),
          api.get('/flood-zones', { params: { per_page: 100 } }),
        ]);
        setIncidents(incidentsRes.data?.data ?? []);
        setFloodZones(zonesRes.data?.data ?? []);
      } catch {
        toast.error('Không tải được danh sách sự cố/khu vực cảnh báo');
      } finally {
        setIncidentsLoading(false);
      }
    };

    fetchAlertContext();
  }, []);

  const selectedIncident = React.useMemo(
    () => incidents.find(incident => String(incident.id) === form.incident_id) ?? null,
    [incidents, form.incident_id]
  );

  const selectedFloodZone = React.useMemo(
    () => {
      const incidentZoneId = selectedIncident?.flood_zone?.id;
      if (incidentZoneId) {
        return floodZones.find(zone => zone.id === incidentZoneId) ?? null;
      }

      return floodZones.find(zone => String(zone.id) === form.flood_zone_id) ?? null;
    },
    [floodZones, form.flood_zone_id, selectedIncident]
  );
  const selectedLat = selectedIncident?.location
    ? Number(selectedIncident.location.latitude ?? selectedIncident.location.lat)
    : selectedFloodZone?.centroid
      ? Number(selectedFloodZone.centroid.latitude ?? selectedFloodZone.centroid.lat)
      : NaN;
  const selectedLng = selectedIncident?.location
    ? Number(selectedIncident.location.longitude ?? selectedIncident.location.lng)
    : selectedFloodZone?.centroid
      ? Number(selectedFloodZone.centroid.longitude ?? selectedFloodZone.centroid.lng)
      : NaN;
  const hasSelectedCoordinates = Number.isFinite(selectedLat) && Number.isFinite(selectedLng);

  const handleIncidentChange = (incidentId: string) => {
    const incident = incidents.find(item => String(item.id) === incidentId);
    setForm(prev => ({
      ...prev,
      incident_id: incidentId,
      flood_zone_id: incident?.flood_zone?.id ? String(incident.flood_zone.id) : '',
      title: prev.title || (incident ? `Cảnh báo: ${incident.title}` : ''),
      description: prev.description || incident?.address || '',
      severity: incident?.severity || prev.severity,
    }));
  };

  const handleCreateAlert = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung cảnh báo');
      return;
    }

    if (!selectedIncident) {
      toast.error('Vui lòng chọn vụ/sự cố cần cảnh báo');
      return;
    }

    const effectiveUntil = form.effective_until ? new Date(form.effective_until) : null;
    if (effectiveUntil && effectiveUntil <= new Date()) {
      toast.error('Hạn cảnh báo phải sau thời điểm hiện tại');
      return;
    }

    setSubmitting(true);
    try {
      const api = (await import('@/lib/api')).default;
      await api.post('/alerts', {
        title: form.title.trim(),
        description: form.description.trim(),
        alert_type: form.alert_type,
        severity: form.severity,
        related_incident_id: selectedIncident.id,
        affected_flood_zones: selectedIncident.flood_zone?.id ? [selectedIncident.flood_zone.id] : [],
        affected_districts: selectedIncident.district?.id ? [selectedIncident.district.id] : [],
        geometry: hasSelectedCoordinates ? `POINT(${selectedLng} ${selectedLat})` : undefined,
        radius_km: 2,
        effective_until: effectiveUntil ? effectiveUntil.toISOString() : undefined,
      });
      setIsCreateOpen(false);
      setForm({
        title: '',
        description: '',
        alert_type: 'flood_warning',
        severity: 'medium',
        incident_id: '',
        flood_zone_id: '',
        effective_until: '',
      });
      await fetchAlerts(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (alert: Alert) => {
    setSelectedAlert(alert);
    setDetailLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.get(`/alerts/${alert.id}`);
      setSelectedAlert(res.data?.data ?? alert);
    } catch {
      toast.error('Không tải được chi tiết cảnh báo');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      const api = (await import('@/lib/api')).default;
      await api.put(`/alerts/${id}/status`, { status: 'resolved' });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved', resolved_at: new Date().toISOString() } : a));
      toast.success('Đã giải quyết cảnh báo');
    } catch (e) {
      toast.error(t('alerts.updateError') || 'Không thể giải quyết cảnh báo');
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical': return { color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', label: tAlerts('sevCritical') };
      case 'high': return { color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', label: tAlerts('sevHigh') };
      case 'medium': return { color: 'bg-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-50', label: tAlerts('sevMedium') };
      case 'low': return { color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', label: tAlerts('sevLow') };
      default: return { color: 'bg-gray-500', text: 'text-gray-600', bg: 'bg-gray-50', label: severity };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { color: 'text-green-600', bg: 'bg-green-50', label: tAlerts('statusActive'), icon: Bell };
      case 'updated': return { color: 'text-blue-600', bg: 'bg-blue-50', label: tAlerts('statusUpdated'), icon: Bell };
      case 'resolved': return { color: 'text-blue-600', bg: 'bg-blue-50', label: tAlerts('statusResolved'), icon: CheckCircle };
      case 'expired': return { color: 'text-gray-600', bg: 'bg-gray-50', label: tAlerts('statusExpired'), icon: Clock };
      default: return { color: 'text-gray-600', bg: 'bg-gray-50', label: status, icon: Clock };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flood_warning': return '🌊';
      case 'heavy_rain': return '⛈️';
      case 'dam_warning': return '⚠️';
      case 'evacuation': return '🚨';
      case 'all_clear': return '✅';
      case 'weather': return '☁️';
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
          <h1 className="text-2xl font-bold tracking-tight">{t('pages.alerts')}</h1>
          <p className="text-sm text-muted-foreground">{tAlerts('subtitle')}</p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} />
          {tAlerts('issueBtn')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: tAlerts('colStatus') || 'Tổng cảnh báo', value: stats.total, icon: Megaphone, color: 'text-blue-600 bg-blue-100' },
          { label: tAlerts('statusActive') || 'Đang hoạt động', value: stats.active, icon: Bell, color: 'text-green-600 bg-green-100' },
          { label: tAlerts('sevCritical') || 'Nghiêm trọng', value: stats.critical, icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
          { label: tAlerts('statusResolved') || 'Đã giải quyết', value: stats.resolved, icon: CheckCircle, color: 'text-gray-600 bg-gray-100' },
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
            placeholder={tAlerts('searchPlaceholder')}
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={severityFilter} onValueChange={(v) => v && setSeverityFilter(v)}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder={tAlerts('severityPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('table.all')}</SelectItem>
            <SelectItem value="critical">{tAlerts('sevCritical')}</SelectItem>
            <SelectItem value="high">{tAlerts('sevHigh')}</SelectItem>
            <SelectItem value="medium">{tAlerts('sevMedium')}</SelectItem>
            <SelectItem value="low">{tAlerts('sevLow')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder={tAlerts('statusPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('table.all')}</SelectItem>
            <SelectItem value="active">{tAlerts('statusActive')}</SelectItem>
            <SelectItem value="updated">{tAlerts('statusUpdated')}</SelectItem>
            <SelectItem value="resolved">{tAlerts('statusResolved')}</SelectItem>
            <SelectItem value="expired">{tAlerts('statusExpired')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <Bell size={14} />
            {tAlerts('statusActive')} ({activeAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="gap-2">
            <CheckCircle size={14} />
            {tAlerts('statusResolved')} ({resolvedAlerts.length})
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
                          {getTypeIcon(alert.alert_type)}
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
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => handleViewDetail(alert)}>
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
                          {getTypeIcon(alert.alert_type)}
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
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleViewDetail(alert)}>
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{tAlerts('createTitle')}</DialogTitle>
            <DialogDescription>{tAlerts('createDesc')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label>{tAlerts('fieldTitle')}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder={tAlerts('fieldTitlePlaceholder')}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{tAlerts('fieldType')}</Label>
                <Select value={form.alert_type} onValueChange={(v) => setForm(prev => ({ ...prev, alert_type: v || 'flood_warning' }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{alertTypeLabels[form.alert_type]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="min-w-[180px]">
                    {Object.entries(alertTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{tAlerts('fieldSeverity')}</Label>
                <Select value={form.severity} onValueChange={(v) => setForm(prev => ({ ...prev, severity: v || 'medium' }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{severityLabels[form.severity]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(severityLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Vụ/sự cố cần cảnh báo *</Label>
              <Select
                value={form.incident_id}
                onValueChange={(v) => handleIncidentChange(v || '')}
                disabled={incidentsLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={incidentsLoading ? 'Đang tải sự cố...' : 'Chọn sự cố / vụ việc cụ thể'} />
                </SelectTrigger>
                <SelectContent>
                  {incidents.map(incident => (
                    <SelectItem key={incident.id} value={String(incident.id)}>
                      #{String(incident.id).padStart(4, '0')} · {incident.title}
                      {incident.district?.name ? ` · ${incident.district.name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedIncident && (
                <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 font-medium text-foreground">
                    <MapPin size={13} />
                    #{String(selectedIncident.id).padStart(4, '0')} · {selectedIncident.title}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Vùng: {selectedIncident.flood_zone?.name ?? selectedFloodZone?.name ?? 'Chưa gắn vùng ngập'}</span>
                    <span>Quận/huyện: {selectedIncident.district?.name ?? selectedFloodZone?.district?.name ?? 'Chưa có'}</span>
                    <span>Địa chỉ: {selectedIncident.address ?? 'Chưa có'}</span>
                    <span>Mực nước: {selectedIncident.water_level_m ?? selectedFloodZone?.current_water_level_m ?? '—'}m</span>
                    <span>
                      Toạ độ: {hasSelectedCoordinates ? `${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)}` : 'Chưa có'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Tự dỡ cảnh báo lúc (tuỳ chọn)</Label>
              <Input
                type="datetime-local"
                value={form.effective_until}
                onChange={(e) => setForm(prev => ({ ...prev, effective_until: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Bỏ trống nếu muốn cảnh báo tiếp tục hoạt động cho tới khi bạn bấm Giải quyết.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>{tAlerts('fieldContent')}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={tAlerts('fieldContentPlaceholder')}
                className="min-h-28"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button onClick={handleCreateAlert} disabled={submitting}>
              {submitting ? 'Đang phát...' : tAlerts('issueCommand')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>{selectedAlert?.title}</DialogTitle>
            <DialogDescription>
              {selectedAlert ? `#${selectedAlert.alert_number ?? selectedAlert.id} · ${getTypeIcon(selectedAlert.alert_type)} ${selectedAlert.alert_type}` : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              {detailLoading ? (
                <div className="h-40 rounded-lg bg-muted animate-pulse" />
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`${getSeverityConfig(selectedAlert.severity).text} bg-opacity-10`} style={{ backgroundColor: 'var(--tw-bg-opacity, 0.1)' }}>
                      {getSeverityConfig(selectedAlert.severity).label}
                    </Badge>
                    <Badge variant="outline" className={getStatusConfig(selectedAlert.status).color}>
                      {getStatusConfig(selectedAlert.status).label}
                    </Badge>
                  </div>
                  <div className="rounded-lg border p-3 text-sm">
                    <p className="text-muted-foreground whitespace-pre-line">
                      {selectedAlert.description || 'Không có nội dung chi tiết'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Phát lúc</p>
                      <p className="font-medium">{selectedAlert.created_at ? new Date(selectedAlert.created_at).toLocaleString('vi-VN') : '—'}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Hết hạn</p>
                      <p className="font-medium">{selectedAlert.effective_until ? new Date(selectedAlert.effective_until).toLocaleString('vi-VN') : 'Chưa đặt'}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Người phát</p>
                      <p className="font-medium">{(selectedAlert as any).issuer?.name ?? '—'}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Khu vực</p>
                      <p className="font-medium">{selectedAlert.area || selectedAlert.address || 'Chưa có vị trí cụ thể'}</p>
                    </div>
                  </div>
                  {selectedAlert.status !== 'resolved' && (
                    <Button className="w-full gap-2" onClick={() => handleResolve(selectedAlert.id)}>
                      <CheckCircle size={14} />
                      Đánh dấu đã giải quyết
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
