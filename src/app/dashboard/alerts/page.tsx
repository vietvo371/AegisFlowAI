'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Megaphone, Bell, Clock, Eye, Send, Search, Plus, CheckCircle,
  MapPin, Calendar, ChevronLeft, ChevronRight, RefreshCw, X,
  ShieldAlert, User
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { cn } from '@/lib/utils';

interface Alert {
  id: number;
  alert_number?: string;
  title: string;
  description?: string;
  alert_type: string;
  severity: string;
  status: string;
  geometry?: unknown;
  affected_districts?: unknown;
  affected_flood_zones?: unknown;
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
  issuer?: {
    name?: string;
    email?: string;
  } | null;
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

const ALERT_TYPE_CONFIG: Record<string, {
  labelKey: string;
  icon: string;
  color: string;
  className: string;
  badgeClass: string;
  bgClass: string;
  glowClass: string;
}> = {
  flood_warning: {
    labelKey: 'typeFloodWarning',
    icon: '🌊',
    color: '#3b82f6',
    className: 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-950/20 dark:text-blue-400',
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/30 dark:text-blue-300',
    bgClass: 'bg-blue-500/10 text-blue-500 dark:text-blue-400',
    glowClass: 'shadow-[0_0_15px_rgba(59,130,246,0.15)] dark:shadow-[0_0_20px_rgba(59,130,246,0.25)]',
  },
  heavy_rain: {
    labelKey: 'typeHeavyRain',
    icon: '⛈️',
    color: '#8b5cf6',
    className: 'border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-950/20 dark:text-violet-400',
    badgeClass: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/30 dark:bg-violet-950/30 dark:text-violet-300',
    bgClass: 'bg-violet-500/10 text-violet-500 dark:text-violet-400',
    glowClass: 'shadow-[0_0_15px_rgba(139,92,246,0.15)] dark:shadow-[0_0_20px_rgba(139,92,246,0.25)]',
  },
  dam_warning: {
    labelKey: 'typeDamWarning',
    icon: '⚠️',
    color: '#f59e0b',
    className: 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-400',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300',
    bgClass: 'bg-amber-500/10 text-amber-500 dark:text-amber-400',
    glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.15)] dark:shadow-[0_0_20px_rgba(245,158,11,0.25)]',
  },
  evacuation: {
    labelKey: 'typeEvacuation',
    icon: '🚨',
    color: '#ef4444',
    className: 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-400',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300',
    bgClass: 'bg-rose-500/10 text-rose-500 dark:text-rose-400',
    glowClass: 'shadow-[0_0_15px_rgba(244,63,94,0.15)] dark:shadow-[0_0_20px_rgba(244,63,94,0.25)]',
  },
  weather: {
    labelKey: 'typeWeather',
    icon: '☁️',
    color: '#6b7280',
    className: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/20 dark:bg-slate-950/20 dark:text-slate-400',
    badgeClass: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-900/30 dark:bg-slate-950/30 dark:text-slate-300',
    bgClass: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
    glowClass: 'shadow-[0_0_15px_rgba(100,116,139,0.15)] dark:shadow-[0_0_20px_rgba(100,116,139,0.25)]',
  },
  all_clear: {
    labelKey: 'typeAllClear',
    icon: '✅',
    color: '#10b981',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-300',
    bgClass: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400',
    glowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.15)] dark:shadow-[0_0_20px_rgba(16,185,129,0.25)]',
  },
};

const DEFAULT_TYPE_CONFIG = {
  labelKey: 'typeSystem',
  icon: '📢',
  color: '#6b7280',
  className: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/20 dark:bg-slate-950/20 dark:text-slate-400',
  badgeClass: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-900/30 dark:bg-slate-950/30 dark:text-slate-300',
  bgClass: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
  glowClass: 'shadow-sm',
};

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (diff < 60) return rtf.format(0, 'second');
  if (diff < 3600) return rtf.format(-Math.floor(diff / 60), 'minute');
  if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), 'hour');
  return date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

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

function getGroupedAlerts(items: Alert[]) {
  const today: Alert[] = [];
  const yesterday: Alert[] = [];
  const older: Alert[] = [];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date();
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);

  items.forEach((item) => {
    const d = new Date(item.created_at);
    if (d >= startOfToday) {
      today.push(item);
    } else if (d >= startOfYesterday) {
      yesterday.push(item);
    } else {
      older.push(item);
    }
  });

  return { today, yesterday, older };
}

export default function AlertsPage() {
  const t = useTranslations('dashboard');
  const tAlerts = useTranslations('dashboard.alerts');

  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [severityFilter, setSeverityFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [selectedAlert, setSelectedAlert] = React.useState<Alert | null>(null);
  
  const [incidents, setIncidents] = React.useState<IncidentOption[]>([]);
  const [incidentsLoading, setIncidentsLoading] = React.useState(false);
  const [floodZones, setFloodZones] = React.useState<FloodZoneOption[]>([]);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<number | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 6;

  const [form, setForm] = React.useState({
    title: '',
    description: '',
    alert_type: 'flood_warning',
    severity: 'medium',
    incident_id: '',
    flood_zone_id: '',
    effective_until: '',
  });

  const severityLabels: Record<string, string> = {
    low: tAlerts('sevLow'),
    medium: tAlerts('sevMedium'),
    high: tAlerts('sevHigh'),
    critical: tAlerts('sevCritical'),
  };

  const getTypeLabel = (type: string): string => {
    const cfg = ALERT_TYPE_CONFIG[type] ?? DEFAULT_TYPE_CONFIG;
    return tAlerts(cfg.labelKey as Parameters<typeof tAlerts>[0]);
  };

  const fetchAlerts = React.useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const params: Record<string, string> = {};
      if (severityFilter !== 'all') params.severity = severityFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/alerts', { params });
      setAlerts(res.data?.data ?? []);
    } catch {
      toast.error(tAlerts('toastLoadError'));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [severityFilter, statusFilter]);

  React.useEffect(() => {
    fetchAlerts();

    const handler = () => fetchAlerts(false);
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
        toast.error(tAlerts('toastContextError'));
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
      title: prev.title || (incident ? tAlerts('alertTitle', { title: incident.title }) : ''),
      description: prev.description || incident?.address || '',
      severity: incident?.severity || prev.severity,
    }));
  };

  const handleCreateAlert = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error(tAlerts('toastTitleContentRequired'));
      return;
    }

    if (!selectedIncident) {
      toast.error(tAlerts('toastIncidentRequired'));
      return;
    }

    const effectiveUntil = form.effective_until ? new Date(form.effective_until) : null;
    if (effectiveUntil && effectiveUntil <= new Date()) {
      toast.error(tAlerts('toastExpiryInvalid'));
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
      toast.error(tAlerts('toastCreateError'));
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
      const detailedAlert = res.data?.data ?? alert;
      setSelectedAlert(detailedAlert);
    } catch {
      toast.error(tAlerts('toastDetailError'));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleResolve = async (id: number) => {
    setActionLoading(id);
    try {
      const api = (await import('@/lib/api')).default;
      await api.put(`/alerts/${id}/status`, { status: 'resolved' });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved', resolved_at: new Date().toISOString() } : a));
      
      setSelectedAlert(prev => {
        if (prev && prev.id === id) {
          return { ...prev, status: 'resolved', resolved_at: new Date().toISOString() };
        }
        return prev;
      });
    } catch {
      toast.error(t('alerts.updateError') || 'Không thể giải quyết cảnh báo');
    } finally {
      setActionLoading(null);
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical': return { color: 'text-red-500 border-red-500/20 bg-red-500/10', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20', label: tAlerts('sevCritical') };
      case 'high': return { color: 'text-orange-500 border-orange-500/20 bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/20', label: tAlerts('sevHigh') };
      case 'medium': return { color: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/20', label: tAlerts('sevMedium') };
      case 'low': return { color: 'text-blue-500 border-blue-500/20 bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20', label: tAlerts('sevLow') };
      default: return { color: 'text-gray-500 border-gray-500/20 bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-950/20', label: severity };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { color: 'text-green-600 border-green-500/20 bg-green-500/10 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/20', label: tAlerts('statusActive'), icon: Bell };
      case 'updated': return { color: 'text-blue-600 border-blue-500/20 bg-blue-500/10 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20', label: tAlerts('statusUpdated'), icon: Bell };
      case 'resolved': return { color: 'text-zinc-500 border-zinc-500/20 bg-zinc-500/10 dark:text-zinc-400', bg: 'bg-zinc-50 dark:bg-zinc-950/20', label: tAlerts('statusResolved'), icon: CheckCircle };
      case 'expired': return { color: 'text-gray-500 border-gray-500/20 bg-gray-500/10 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-950/20', label: tAlerts('statusExpired'), icon: Clock };
      default: return { color: 'text-gray-500 border-gray-500/20 bg-gray-500/10 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-950/20', label: status, icon: Clock };
    }
  };

  const getTypeConfig = (type: string) => {
    return ALERT_TYPE_CONFIG[type] ?? DEFAULT_TYPE_CONFIG;
  };

  // Local filtering logic
  const filteredAlerts = React.useMemo(() => {
    return alerts.filter(alert => {
      const matchSearch = !search ||
        alert.title.toLowerCase().includes(search.toLowerCase()) ||
        alert.description?.toLowerCase().includes(search.toLowerCase()) ||
        alert.area?.toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === 'all' || alert.alert_type === typeFilter;

      return matchSearch && matchType;
    });
  }, [alerts, search, typeFilter]);

  // Reset page when filters change
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, severityFilter, statusFilter]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Group stats calculations
  const stats = React.useMemo(() => {
    return {
      total: alerts.length,
      active: alerts.filter(a => a.status === 'active' || a.status === 'updated').length,
      critical: alerts.filter(a => (a.status === 'active' || a.status === 'updated') && a.severity === 'critical').length,
      resolved: alerts.filter(a => a.status === 'resolved' || a.status === 'expired').length,
    };
  }, [alerts]);

  // Alert Type count summary
  const typeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.forEach(a => {
      counts[a.alert_type] = (counts[a.alert_type] || 0) + 1;
    });
    return counts;
  }, [alerts]);

  const typeBreakdown = React.useMemo(() => {
    if (alerts.length === 0) return [];
    return Object.entries(ALERT_TYPE_CONFIG).map(([type, cfg]) => {
      const count = typeCounts[type] || 0;
      return {
        type,
        count,
        percentage: (count / alerts.length) * 100,
        config: cfg,
      };
    }).filter(t => t.count > 0);
  }, [alerts, typeCounts]);

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);

  const paginatedAlerts = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAlerts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAlerts, currentPage]);

  const grouped = React.useMemo(() => {
    return getGroupedAlerts(paginatedAlerts);
  }, [paginatedAlerts]);

  // Auto-select first alert on layout mount or when list changes
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (filteredAlerts.length > 0 && !selectedAlert) {
      handleViewDetail(filteredAlerts[0]);
    }
  }, [filteredAlerts, selectedAlert]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
    <main className="relative flex w-full flex-col gap-6 px-6 py-6 min-h-0 overflow-hidden">
      {/* Aurora Ambient Background Blurs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/[0.04] dark:bg-amber-500/[0.06] rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-red-500/[0.03] dark:bg-red-500/[0.05] rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Container */}
      <section className="relative rounded-3xl border border-border/50 bg-card/45 backdrop-blur-md p-5 shadow-sm md:p-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3.5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-amber-500/20 bg-amber-500/5 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                {tAlerts('badge')}
              </Badge>
              {stats.active > 0 && (
                <Badge variant="destructive" className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider animate-glow-pulse-red bg-rose-500 text-white">
                  {tAlerts('activeCountLabel', { active: stats.active })}
                </Badge>
              )}
            </div>
            <h1 className="flex items-center gap-3.5 text-2xl font-black tracking-tight text-foreground md:text-3xl">
              <span className={cn(
                "flex size-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20 transition-all duration-300",
                stats.active > 0 && "animate-float"
              )}>
                <Megaphone size={21} className={cn(stats.active > 0 && "animate-pulse")} />
              </span>
              {t('pages.alerts')}
            </h1>
            <p className="mt-2 text-xs font-semibold text-muted-foreground leading-relaxed">{tAlerts('subtitle')}</p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Button
              className="h-10 gap-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={16} />
              {tAlerts('issueBtn')}
            </Button>
          </div>
        </div>

        {/* Statistical Metrics Grid */}
        <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: tAlerts('totalAlerts'), value: stats.total, color: 'border-blue-500/20 bg-blue-500/5 text-blue-500' },
            { label: tAlerts('activeAlerts'), value: stats.active, color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500' },
            { label: tAlerts('criticalAlerts'), value: stats.critical, color: 'border-rose-500/20 bg-rose-500/5 text-rose-500 animate-pulse' },
            { label: tAlerts('resolvedAlerts'), value: stats.resolved, color: 'border-zinc-500/20 bg-zinc-500/5 text-zinc-500' }
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
              <span className="flex items-center gap-1.5"><ShieldAlert size={13} /> {tAlerts('alertDistribution')}</span>
              <span>{tAlerts('filteredRecords', { count: filteredAlerts.length })}</span>
            </div>

            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted border border-border/45 shadow-inner">
              {typeBreakdown.map((item) => (
                <button
                  key={item.type}
                  className="h-full first:rounded-l-full last:rounded-r-full hover:opacity-85 transition-opacity relative group"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.config.color,
                  }}
                  onClick={() => setTypeFilter(item.type)}
                  title={`${getTypeLabel(item.type)}: ${item.count} (${Math.round(item.percentage)}%)`}
                >
                  <span className="sr-only">{getTypeLabel(item.type)}</span>
                </button>
              ))}
            </div>

            {/* Micro legends */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              {Object.entries(ALERT_TYPE_CONFIG).map(([type, cfg]) => {
                const count = typeCounts[type] || 0;
                if (count === 0) return null;
                const active = typeFilter === type;

                return (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(active ? 'all' : type)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-lg border transition-all duration-200",
                      active
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <span className="size-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span>{getTypeLabel(type)}</span>
                    <span className="text-[10px] text-muted-foreground/80 font-bold">({count})</span>
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
              placeholder={tAlerts('searchPlaceholder')}
              className="h-10 rounded-xl pl-9 pr-8 border-border/60 focus-visible:ring-amber-500 bg-background/50 text-xs"
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

          {/* Severity filter */}
          <div className="grid gap-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-2 pb-1">{tAlerts('severityFilterLabel')}</span>
            <Select value={severityFilter} onValueChange={(val) => { if (val) setSeverityFilter(val); }}>
              <SelectTrigger className="w-full h-9 rounded-xl border-border/60 bg-background/50 text-xs focus:ring-amber-500">
                <SelectValue>
                  {severityFilter === 'all' ? tAlerts('allSeverities') : severityLabels[severityFilter] || severityFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tAlerts('allSeverities')}</SelectItem>
                <SelectItem value="critical">{tAlerts('sevCriticalLabel')}</SelectItem>
                <SelectItem value="high">{tAlerts('sevHighLabel')}</SelectItem>
                <SelectItem value="medium">{tAlerts('sevMediumLabel')}</SelectItem>
                <SelectItem value="low">{tAlerts('sevLowLabel')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status filter */}
          <div className="grid gap-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-2 pb-1">{tAlerts('statusFilterLabel')}</span>
            <Select value={statusFilter} onValueChange={(val) => { if (val) setStatusFilter(val); }}>
              <SelectTrigger className="w-full h-9 rounded-xl border-border/60 bg-background/50 text-xs focus:ring-amber-500">
                <SelectValue>
                  {statusFilter === 'all' ? tAlerts('allStatuses') : getStatusConfig(statusFilter).label || statusFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tAlerts('allStatuses')}</SelectItem>
                <SelectItem value="active">{tAlerts('statusActiveLabel')}</SelectItem>
                <SelectItem value="updated">{tAlerts('statusUpdatedLabel')}</SelectItem>
                <SelectItem value="resolved">{tAlerts('statusResolvedLabel')}</SelectItem>
                <SelectItem value="expired">{tAlerts('statusExpiredLabel')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-border/60" />

          {/* Reset button */}
          {(severityFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all' || search) && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 rounded-xl font-bold border-dashed border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
              onClick={() => {
                setSearch('');
                setTypeFilter('all');
                setSeverityFilter('all');
                setStatusFilter('all');
              }}
            >
              <X className="mr-1.5" size={13} /> {tAlerts('clearFilter')}
            </Button>
          )}
        </Card>

        {/* Master-Detail Container Split Grid */}
        <div className="grid min-h-[580px] gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
          {/* Alerts List Card */}
          <Card className="overflow-hidden border-border/50 bg-card/45 backdrop-blur-md shadow-sm flex flex-col">
            {/* List Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 bg-muted/10">
              <div>
                <h2 className="font-black text-sm tracking-tight">{tAlerts('communityAlerts')}</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">
                  {tAlerts('showingCount', { filtered: filteredAlerts.length, total: alerts.length })}
                </p>
              </div>
              <Badge variant="outline" className="border-amber-500/20 bg-amber-500/5 text-amber-600 text-[10px] font-bold flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                {tAlerts('liveFeed')}
              </Badge>
            </div>

            {/* Grouped Alerts List View */}
            <ScrollArea className="flex-1 h-[580px] custom-scroll bg-background/25">
              {loading ? (
                <div className="space-y-4 p-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 bg-muted/30 border border-border/40 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="flex min-h-[460px] flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-muted bg-muted/45 text-muted-foreground/60 shadow-inner">
                    <Megaphone size={28} />
                  </div>
                  <h3 className="text-base font-black tracking-tight">{tAlerts('noAlerts')}</h3>
                  <p className="mt-2.5 max-w-xs text-xs font-semibold leading-relaxed text-muted-foreground">
                    {tAlerts('noAlertSelectedDesc')}
                  </p>
                </div>
              ) : (
                <div className="space-y-6 py-4">
                  {(['today', 'yesterday', 'older'] as const).map((groupKey) => {
                    const groupItems = grouped[groupKey];
                    if (groupItems.length === 0) return null;

                    const groupLabels = {
                      today: tAlerts('today'),
                      yesterday: tAlerts('yesterday'),
                      older: tAlerts('older'),
                    };

                    return (
                      <div key={groupKey} className="space-y-2">
                        {/* Group Header */}
                        <div className="flex items-center gap-2 px-5 text-[10px] font-black text-muted-foreground/80 uppercase tracking-widest">
                          <Calendar size={12} className="text-muted-foreground/65" />
                          <span>{groupLabels[groupKey]}</span>
                          <span className="ml-1 text-[9px] rounded-md bg-muted px-1.5 py-0.5 border border-border/40">
                            {groupItems.length}
                          </span>
                        </div>

                        {/* List Items */}
                        <div className="divide-y divide-border/45 border-y border-border/45 bg-card/20">
                          {groupItems.map((item) => {
                            const cfg = getTypeConfig(item.alert_type);
                            const severity = getSeverityConfig(item.severity);
                            const active = selectedAlert?.id === item.id;

                            return (
                              <div
                                key={item.id}
                                onClick={() => handleViewDetail(item)}
                                className={cn(
                                  'group relative flex w-full items-start gap-4 px-5 py-4 text-left transition-all duration-300 cursor-pointer select-none',
                                  active
                                    ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.08]'
                                    : 'hover:bg-muted/30',
                                )}
                              >
                                {/* Active Side Border Indicator */}
                                {active && (
                                  <div className="absolute left-0 top-0 h-full w-1 bg-amber-500 rounded-r" />
                                )}

                                {/* Color Indicator left bar for critical severity */}
                                {item.severity === 'critical' && (
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-0.5 bg-red-500 rounded-r shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                )}

                                {/* Icon Display */}
                                <div className={cn(
                                  "relative flex shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 size-10 text-xl",
                                  cfg.className,
                                  (item.status === 'active' || item.status === 'updated') && cfg.glowClass
                                )}>
                                  {cfg.icon}
                                  {(item.status === 'active' || item.status === 'updated') && (
                                    <span className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full border-2 border-background bg-rose-500 animate-pulse-dot" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className={cn('h-5 border px-2 py-0 text-[10px] font-extrabold uppercase tracking-wide', cfg.badgeClass)}>
                                      {getTypeLabel(item.alert_type)}
                                    </Badge>
                                    <Badge variant="outline" className={cn('h-5 border px-2 py-0 text-[10px] font-bold', severity.color)}>
                                      {severity.label}
                                    </Badge>
                                    <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                                      <Clock size={11} className="text-muted-foreground/75" />
                                      {timeAgo(item.created_at)}
                                    </span>
                                  </div>

                                  <h3 className={cn('line-clamp-1 text-xs leading-5 transition-colors font-extrabold text-foreground')}>
                                    {item.title}
                                  </h3>
                                  <p className="line-clamp-1 mt-1 text-[11px] leading-4 text-muted-foreground font-semibold">
                                    {item.description || tAlerts('noDescription')}
                                  </p>
                                  {item.area && (
                                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                      <MapPin size={10} />
                                      <span>{item.area}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Hover quick actions */}
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  {(item.status === 'active' || item.status === 'updated') && (
                                    <Button
                                      size="sm"
                                      className="size-8 rounded-lg p-0 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleResolve(item.id);
                                      }}
                                      disabled={actionLoading === item.id}
                                    >
                                      {actionLoading === item.id ? (
                                        <RefreshCw size={13} className="animate-spin" />
                                      ) : (
                                        <CheckCircle size={13} />
                                      )}
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="size-8 rounded-lg p-0 border-border bg-background hover:bg-muted/50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewDetail(item);
                                    }}
                                  >
                                    <Eye size={13} />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* List Pagination bar */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/60 px-5 py-4 bg-muted/5">
                <span className="text-[10px] font-bold text-muted-foreground">
                  {tAlerts('showingRange', { start: Math.min(filteredAlerts.length, (currentPage - 1) * itemsPerPage + 1), end: Math.min(filteredAlerts.length, currentPage * itemsPerPage), total: filteredAlerts.length })}
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
                      className={cn("size-8 rounded-lg p-0 text-xs font-bold", currentPage === num && "bg-amber-500 hover:bg-amber-600 text-white")}
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
            <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-amber-500/20 via-amber-500 to-amber-500/20" />

            {selectedAlert ? (
              <div className="flex flex-col h-full">
                {/* Panel Header */}
                <div className="border-b border-border/60 px-5 py-4 flex items-center justify-between bg-muted/10">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                      {tAlerts('detailCodePattern')}: #{selectedAlert.alert_number ?? String(selectedAlert.id).padStart(4, '0')}
                    </p>
                    <h2 className="font-black text-sm tracking-tight mt-0.5 truncate text-foreground">
                      {tAlerts('detailTitlePattern')}
                    </h2>
                  </div>
                  <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-wider gap-1", getStatusConfig(selectedAlert.status).color)}>
                    {getStatusConfig(selectedAlert.status).label}
                  </Badge>
                </div>

                {/* Detail Content */}
                <ScrollArea className="flex-1 custom-scroll p-5">
                  {detailLoading ? (
                    <div className="space-y-4">
                      <div className="h-10 w-2/3 rounded-lg bg-muted animate-pulse" />
                      <div className="h-32 rounded-lg bg-muted animate-pulse" />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-14 rounded-lg bg-muted animate-pulse" />
                        <div className="h-14 rounded-lg bg-muted animate-pulse" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Big Title & Icon Area */}
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "flex size-14 shrink-0 items-center justify-center rounded-2xl border text-3xl transition-all duration-300 shadow-md",
                          getTypeConfig(selectedAlert.alert_type).className,
                          getTypeConfig(selectedAlert.alert_type).glowClass
                        )}>
                          {getTypeConfig(selectedAlert.alert_type).icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-black leading-snug text-foreground">
                            {selectedAlert.title}
                          </h3>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <Badge variant="outline" className={cn("text-[10px] font-extrabold border uppercase tracking-wider", getTypeConfig(selectedAlert.alert_type).badgeClass)}>
                              {getTypeLabel(selectedAlert.alert_type)}
                            </Badge>
                            <Badge variant="outline" className={cn("text-[10px] font-extrabold border uppercase tracking-wider", getSeverityConfig(selectedAlert.severity).color)}>
                              {getSeverityConfig(selectedAlert.severity).label}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Content Description */}
                      <div className="rounded-2xl border border-border/50 bg-background/50 p-4 shadow-inner">
                        <p className="text-xs leading-relaxed font-semibold text-muted-foreground whitespace-pre-wrap">
                          {selectedAlert.description || tAlerts('noDescription')}
                        </p>
                      </div>

                      {/* Detailed Meta Blocks */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 rounded-xl border border-border/40 bg-background/25 p-3 flex flex-col gap-1">
                          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Calendar size={12} className="text-amber-500/80" /> {tAlerts('effectiveTime')}
                          </span>
                          <p className="text-xs font-bold text-foreground mt-1">
                            {tAlerts('effectiveStart')} {formatFullDate(selectedAlert.created_at)}
                          </p>
                          <p className="text-xs font-bold text-foreground">
                            {tAlerts('effectiveEnd')} {selectedAlert.effective_until ? formatFullDate(selectedAlert.effective_until) : tAlerts('indefiniteDesc')}
                          </p>
                        </div>

                        {selectedAlert.area && (
                          <div className="col-span-2 rounded-xl border border-border/40 bg-background/25 p-3">
                            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                              <MapPin size={12} className="text-blue-500/80" /> {tAlerts('affectedArea')}
                            </span>
                            <p className="text-xs font-bold text-foreground mt-2 leading-relaxed">
                              {selectedAlert.area}
                            </p>
                            {selectedAlert.address && (
                              <p className="text-[10px] text-muted-foreground font-semibold mt-1">
                                {selectedAlert.address}
                              </p>
                            )}
                          </div>
                        )}

                        {selectedAlert.issuer && (
                          <div className="rounded-xl border border-border/40 bg-background/25 p-3 flex flex-col justify-between">
                            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                              <User size={12} className="text-emerald-500/80" /> {tAlerts('issuer')}
                            </span>
                            <span className="text-xs font-black text-foreground mt-2">
                              {selectedAlert.issuer.name || tAlerts('issuerSystem')}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                              {selectedAlert.issuer.email || 'operator@aegisflow.gov.vn'}
                            </span>
                          </div>
                        )}

                        {selectedAlert.affected_population && (
                          <div className="rounded-xl border border-border/40 bg-background/25 p-3 flex flex-col justify-between">
                            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                              {tAlerts('affectedPopulationLabel')}
                            </span>
                            <span className="text-xs font-black text-foreground mt-2">
                              {tAlerts('affectedPopulationEstimate', { count: selectedAlert.affected_population.toLocaleString() })}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                              {tAlerts('affectedPopulationNote')}
                            </span>
                          </div>
                        )}

                        {selectedAlert.related_incident_id && (
                          <div className="col-span-2 rounded-xl border border-border/40 bg-background/25 p-3">
                            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                              {tAlerts('triggeredByIncident')}
                            </span>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground">
                                {tAlerts('relatedIncident', { id: selectedAlert.related_incident_id })}
                              </span>
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-amber-500 hover:text-amber-600 font-extrabold text-xs"
                                onClick={() => window.open(`/dashboard/incidents?id=${selectedAlert.related_incident_id}`, '_blank')}
                              >
                                {tAlerts('viewIncidentDetail')}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </ScrollArea>

                {/* Resolve Action Panel Footer */}
                {(selectedAlert.status === 'active' || selectedAlert.status === 'updated') && (
                  <div className="border-t border-border/60 px-5 py-4 bg-muted/5 flex gap-2">
                    <Button
                      className="w-full h-11 gap-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                      onClick={() => handleResolve(selectedAlert.id)}
                      disabled={actionLoading === selectedAlert.id}
                    >
                      {actionLoading === selectedAlert.id ? (
                        <RefreshCw size={15} className="animate-spin" />
                      ) : (
                        <CheckCircle size={15} />
                      )}
                      {tAlerts('markResolvedBtn')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-muted/5">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-dashed border-muted-foreground/35 bg-background/50 text-muted-foreground/50 shadow-inner">
                  <Megaphone size={24} />
                </div>
                <h3 className="text-sm font-bold text-foreground">{tAlerts('noAlertSelected')}</h3>
                <p className="mt-1.5 max-w-xs text-xs text-muted-foreground font-semibold">
                  {tAlerts('noAlertSelectedDesc')}
                </p>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Modern Glass Create Alert Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[560px] border-border/50 bg-background/95 backdrop-blur-xl rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-white">
                <Plus size={15} />
              </span>
              {tAlerts('createTitle')}
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-muted-foreground">
              {tAlerts('createDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 my-1.5 max-h-[60vh] overflow-y-auto pr-1.5 custom-scroll">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-muted-foreground tracking-wider">{tAlerts('fieldTitle')}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder={tAlerts('fieldTitlePlaceholder')}
                className="h-10 rounded-xl border-border/60 focus-visible:ring-amber-500 bg-background/50 text-xs font-semibold"
              />
            </div>

            {/* Type & Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-muted-foreground tracking-wider">{tAlerts('fieldType')}</Label>
                <Select value={form.alert_type} onValueChange={(v) => setForm(prev => ({ ...prev, alert_type: v || 'flood_warning' }))}>
                  <SelectTrigger className="h-10 rounded-xl border-border/60 bg-background/50 text-xs font-semibold focus:ring-amber-500">
                    <SelectValue>
                      {getTypeLabel(form.alert_type)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ALERT_TYPE_CONFIG).map(([value, item]) => (
                      <SelectItem key={value} value={value} className="text-xs font-semibold">
                        {item.icon} {getTypeLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-muted-foreground tracking-wider">{tAlerts('fieldSeverity')}</Label>
                <Select value={form.severity} onValueChange={(v) => setForm(prev => ({ ...prev, severity: v || 'medium' }))}>
                  <SelectTrigger className="h-10 rounded-xl border-border/60 bg-background/50 text-xs font-semibold focus:ring-amber-500">
                    <SelectValue>{severityLabels[form.severity]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low" className="text-xs font-semibold">{tAlerts('sevLowLabel')}</SelectItem>
                    <SelectItem value="medium" className="text-xs font-semibold">{tAlerts('sevMediumLabel')}</SelectItem>
                    <SelectItem value="high" className="text-xs font-semibold">{tAlerts('sevHighLabel')}</SelectItem>
                    <SelectItem value="critical" className="text-xs font-semibold">{tAlerts('sevCriticalLabel')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Related incident select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-muted-foreground tracking-wider">{tAlerts('fieldIncident')}</Label>
              <Select
                value={form.incident_id}
                onValueChange={(v) => handleIncidentChange(v || '')}
                disabled={incidentsLoading}
              >
                <SelectTrigger className="h-10 rounded-xl border-border/60 bg-background/50 text-xs font-semibold focus:ring-amber-500">
                  <SelectValue placeholder={incidentsLoading ? tAlerts('fieldIncidentLoading') : tAlerts('selectIncidentPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] w-auto sm:min-w-[480px]">
                  {incidents.map(incident => (
                    <SelectItem key={incident.id} value={String(incident.id)} className="text-xs font-semibold">
                      #{String(incident.id).padStart(4, '0')} · {incident.title}
                      {incident.district?.name ? ` (${incident.district.name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Dynamic incident preview card */}
              {selectedIncident && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.02] p-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-black text-foreground">
                    <MapPin size={13} className="text-amber-500" />
                    #{String(selectedIncident.id).padStart(4, '0')} · {selectedIncident.title}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-semibold">
                    <span>{tAlerts('zone')}: <strong className="text-foreground">{selectedIncident.flood_zone?.name ?? selectedFloodZone?.name ?? '—'}</strong></span>
                    <span>{tAlerts('district')}: <strong className="text-foreground">{selectedIncident.district?.name ?? selectedFloodZone?.district?.name ?? '—'}</strong></span>
                    <span className="col-span-2">{tAlerts('address')}: <strong className="text-foreground">{selectedIncident.address ?? '—'}</strong></span>
                    <span>{tAlerts('waterLevel')}: <strong className="text-foreground">{selectedIncident.water_level_m ?? selectedFloodZone?.current_water_level_m ?? '—'}m</strong></span>
                    <span>{tAlerts('coordinates')}: <strong className="text-foreground">{hasSelectedCoordinates ? `${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)}` : '—'}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Expire time selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-muted-foreground tracking-wider">{tAlerts('fieldEffectiveUntil')}</Label>
              <Input
                type="datetime-local"
                value={form.effective_until}
                onChange={(e) => setForm(prev => ({ ...prev, effective_until: e.target.value }))}
                className="h-10 rounded-xl border-border/60 focus-visible:ring-amber-500 bg-background/50 text-xs font-semibold"
              />
              <p className="text-[10px] text-muted-foreground font-semibold">
                {tAlerts('indefiniteDesc')}
              </p>
            </div>

            {/* Description content */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-muted-foreground tracking-wider">{tAlerts('fieldContent')}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={tAlerts('fieldContentPlaceholder')}
                className="min-h-24 rounded-xl border-border/60 focus-visible:ring-amber-500 bg-background/50 text-xs font-semibold resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              className="h-10 rounded-xl font-bold border-border/60 hover:bg-muted/50 text-xs"
              onClick={() => setIsCreateOpen(false)}
              disabled={submitting}
            >
              {tAlerts('cancelBtn')}
            </Button>
            <Button
              className="h-10 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 text-xs"
              onClick={handleCreateAlert}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <RefreshCw size={13} className="mr-1.5 animate-spin" />
                  {tAlerts('issueCommandLoading')}
                </>
              ) : (
                <>
                  <Send size={13} className="mr-1.5" />
                  {tAlerts('issueCommand')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
