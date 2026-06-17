'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from 'react';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { useTable } from '@/lib/use-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  RefreshCw, Search, Plus, MapPin, CheckCircle2, Route,
  ChevronLeft, ChevronRight, X, Activity, AlertTriangle, Clock,
  Bell, HeartPulse
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Incident {
  id: number; title: string; description?: string;
  type?: string; type_label?: string;
  severity: string; severity_label?: string;
  status: string; status_label?: string;
  source?: string; address?: string;
  location?: { lat: number; lng: number };
  geometry?: { type: 'Point'; coordinates?: [number, number] };
  district?: { id: number; name: string };
  flood_zone?: { id: number; name: string };
  assignee?: { id: number; name: string };
  reporter?: { id: number; name: string };
  events?: Array<{ id: number; event_type: string; description?: string; actor?: string; created_at?: string }>;
  water_level_m?: number; rainfall_mm?: number; created_at: string;
}

const SEV_TEXT: Record<string, string> = {
  critical: 'text-rose-600 dark:text-rose-400 border-rose-500/25 bg-rose-500/10',
  high: 'text-amber-600 dark:text-amber-400 border-amber-500/25 bg-amber-500/10',
  medium: 'text-yellow-600 dark:text-yellow-400 border-yellow-500/25 bg-yellow-500/10',
  low: 'text-blue-600 dark:text-blue-400 border-blue-500/25 bg-blue-500/10',
};

const STA_CLS: Record<string, string> = {
  reported:      'text-muted-foreground border-border bg-muted/30',
  verified:      'text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/10',
  responding:    'text-indigo-600 dark:text-indigo-400 border-indigo-500/20 bg-indigo-500/10',
  resolved:      'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
  closed:        'text-muted-foreground/80 border-border/50 bg-muted/20',
};

export default function IncidentsPage() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id ? params.id[0] : null;
  const t = useTranslations('dashboard');
  const tEnum = useTranslations('enums');

  // Helper functions that use translations
  const getStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
      reported: tEnum('incidentStatus.reported'),
      verified: tEnum('incidentStatus.verified'),
      responding: tEnum('incidentStatus.responding'),
      resolved: tEnum('incidentStatus.resolved'),
      closed: tEnum('incidentStatus.closed'),
    };
    return map[status] ?? status;
  };

  const getSeverityLabel = (severity: string): string => {
    const map: Record<string, string> = {
      low: tEnum('severity.low'),
      medium: tEnum('severity.medium'),
      high: t('incidents.sevHigh'),
      critical: tEnum('severity.critical'),
    };
    return map[severity] ?? severity;
  };

  const getTypeLabel = (type: string): string => {
    const map: Record<string, string> = {
      flood: t('incidents.typeFlood'),
      heavy_rain: t('incidents.typeHeavyRain'),
      landslide: t('incidents.typeLandslide'),
      dam_failure: t('incidents.typeDamFailure'),
      other: t('incidents.typeOther'),
    };
    return map[type] ?? type;
  };

  const { data: incidents, meta, loading, setFilter, setPage, refresh } = useTable<Incident>({
    endpoint: '/incidents', perPage: 20,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ title: '', description: '', type: 'flood', severity: 'medium', lat: '', lng: '', address: '' });

  const handleViewDetail = React.useCallback(async (incident: Incident) => {
    setSelectedIncident(incident);
    setDetailLoading(true);
    try {
      const res = await api.get(`/incidents/${incident.id}`);
      setSelectedIncident(res.data?.data ?? incident);
    } catch {
      toast.error(t('incidents.loadError'));
    } finally {
      setDetailLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    const h = () => refresh();
    window.addEventListener('aegis:incident:created', h);
    return () => window.removeEventListener('aegis:incident:created', h);
  }, [refresh]);

  React.useEffect(() => {
    if (incidents.length > 0 && !selectedIncident && !loading) {
      if (idParam) {
        const found = incidents.find((i) => String(i.id) === idParam);
        if (found) {
          handleViewDetail(found);
        } else {
          // If the ID is not in the current page, fetch it directly
          handleViewDetail({ id: Number(idParam) } as Incident);
        }
      } else {
        setSelectedIncident(incidents[0]);
      }
    }
  }, [incidents, selectedIncident, idParam, loading, handleViewDetail]);

  const handleCreate = async () => {
    if (!form.title || !form.lat || !form.lng) { toast.error(t('incidents.validationError')); return; }
    setSubmitting(true);
    try {
      await api.post('/incidents', {
        title: form.title, description: form.description,
        type: form.type, severity: form.severity,
        address: form.address || 'Đà Nẵng',
        latitude: parseFloat(form.lat), longitude: parseFloat(form.lng),
      });
      setIsCreateOpen(false);
      setForm({ title: '', description: '', type: 'flood', severity: 'medium', lat: '', lng: '', address: '' });
      refresh();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleUpdateIncident = async (incident: Incident, payload: Partial<Pick<Incident, 'status' | 'severity'>>) => {
    setSubmitting(true);
    try {
      const res = await api.patch(`/incidents/${incident.id}`, payload);
      const updated = res.data?.data ?? { ...incident, ...payload };
      setSelectedIncident(updated);
      refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenMap = (incident: Incident) => {
    const lat = incident.location?.lat ?? incident.geometry?.coordinates?.[1];
    const lng = incident.location?.lng ?? incident.geometry?.coordinates?.[0];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error(t('incidents.noCoords'));
      return;
    }

    const params = new URLSearchParams({
      incidentId: String(incident.id),
      incidentTitle: incident.title,
      incidentType: getTypeLabel(incident.type ?? ''),
      incidentSeverity: getSeverityLabel(incident.severity),
      incidentStatus: getStatusLabel(incident.status),
      incidentAddress: incident.address ?? '',
      lat: String(lat),
      lng: String(lng),
    });

    router.push(`/dashboard?${params.toString()}`);
  };

  // Pagination meta calculations
  const currentPage = meta?.current_page ?? 1;
  const totalPages = meta?.last_page ?? 1;

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
      {/* Aurora Blurs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violet-500/[0.04] rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Container */}
      <section className="relative rounded-3xl border border-border/50 bg-card/45 backdrop-blur-md p-5 shadow-sm md:p-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500" />
        
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3.5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-violet-500/20 bg-violet-500/5 px-2.5 py-0.5 text-[10px] font-black uppercase text-violet-400 tracking-wider">
                {t('incidents.badge')}
              </Badge>
              <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold">
                {t('incidents.badgeLive')}
              </Badge>
            </div>
            <h1 className="flex items-center gap-3.5 text-2xl font-black tracking-tight text-foreground md:text-3xl">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/20 transition-all duration-300">
                <Activity size={21} className="animate-pulse" />
              </span>
              {t('incidents.pageTitle')}
            </h1>
            <p className="mt-2 text-xs font-semibold text-muted-foreground leading-relaxed">
              {t('incidents.pageDesc')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Button variant="outline" size="icon" className="h-10 w-10 border-border hover:bg-muted text-foreground" onClick={refresh} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              className="h-10 gap-2 rounded-xl font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25 border-none"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={16} />
              {t('incidents.addBtn')}
            </Button>
          </div>
        </div>
      </section>

      {/* Main Multi-Column Panel */}
      <section className="grid min-h-0 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Left Filters Sidebar Card */}
        <Card className="h-fit border-border bg-card/45 backdrop-blur-md p-4 shadow-sm flex flex-col gap-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <Input
              placeholder={t('incidents.searchLabel')}
              className="h-10 rounded-xl pl-9 pr-8 border-border focus-visible:ring-violet-500 bg-background text-xs font-semibold text-foreground"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setFilter('search', e.target.value);
              }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilter('search', '');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Severity selector */}
          <div className="grid gap-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-2 pb-1">{t('incidents.severityLabel')}</span>
            <Select
              value={severityFilter}
              onValueChange={(v) => {
                const value = v ?? 'all';
                setSeverityFilter(value);
                setFilter('severity', value === 'all' ? '' : value);
              }}
            >
              <SelectTrigger className="w-full h-9 rounded-xl border-border bg-background text-xs font-semibold focus:ring-violet-500 text-foreground">
                <SelectValue>
                  {severityFilter === 'all' ? t('incidents.allSeverities') : getSeverityLabel(severityFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                <SelectItem value="all" className="text-xs font-semibold text-foreground">{t('incidents.allSeverities')}</SelectItem>
                <SelectItem value="critical" className="text-xs font-semibold text-foreground">🔴 {tEnum('severity.critical')}</SelectItem>
                <SelectItem value="high" className="text-xs font-semibold text-foreground">🟠 {t('incidents.sevHigh')}</SelectItem>
                <SelectItem value="medium" className="text-xs font-semibold text-foreground">🟡 {tEnum('severity.medium')}</SelectItem>
                <SelectItem value="low" className="text-xs font-semibold text-foreground">🔵 {tEnum('severity.low')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status selector */}
          <div className="grid gap-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-2 pb-1">{t('incidents.statusLabel')}</span>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                const value = v ?? 'all';
                setStatusFilter(value);
                setFilter('status', value === 'all' ? '' : value);
              }}
            >
              <SelectTrigger className="w-full h-9 rounded-xl border-border bg-background text-xs font-semibold focus:ring-violet-500 text-foreground">
                <SelectValue>
                  {statusFilter === 'all' ? t('incidents.allStatuses') : getStatusLabel(statusFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                <SelectItem value="all" className="text-xs font-semibold text-foreground">{t('incidents.allStatuses')}</SelectItem>
                <SelectItem value="reported" className="text-xs font-semibold text-foreground">⚫ {tEnum('incidentStatus.reported')}</SelectItem>
                <SelectItem value="verified" className="text-xs font-semibold text-foreground">🔵 {tEnum('incidentStatus.verified')}</SelectItem>
                <SelectItem value="responding" className="text-xs font-semibold text-foreground">🟣 {tEnum('incidentStatus.responding')}</SelectItem>
                <SelectItem value="resolved" className="text-xs font-semibold text-foreground">🟢 {tEnum('incidentStatus.resolved')}</SelectItem>
                <SelectItem value="closed" className="text-xs font-semibold text-foreground">⚪ {tEnum('incidentStatus.closed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type selector */}
          <div className="grid gap-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-2 pb-1">{t('incidents.typeLabel')}</span>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                const value = v ?? 'all';
                setTypeFilter(value);
                setFilter('type', value === 'all' ? '' : value);
              }}
            >
              <SelectTrigger className="w-full h-9 rounded-xl border-border bg-background text-xs font-semibold focus:ring-violet-500 text-foreground">
                <SelectValue>
                  {typeFilter === 'all' ? t('incidents.allTypes') : getTypeLabel(typeFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                <SelectItem value="all" className="text-xs font-semibold text-foreground">{t('incidents.allTypes')}</SelectItem>
                <SelectItem value="flood" className="text-xs font-semibold text-foreground">🌊 {t('incidents.typeFlood')}</SelectItem>
                <SelectItem value="heavy_rain" className="text-xs font-semibold text-foreground">🌧️ {t('incidents.typeHeavyRain')}</SelectItem>
                <SelectItem value="landslide" className="text-xs font-semibold text-foreground">⛰️ {t('incidents.typeLandslide')}</SelectItem>
                <SelectItem value="dam_failure" className="text-xs font-semibold text-foreground">⚡ {t('incidents.typeDamFailure')}</SelectItem>
                <SelectItem value="other" className="text-xs font-semibold text-foreground">⚙️ {t('incidents.typeOther')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filter button */}
          {(severityFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all' || searchQuery) && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 rounded-xl font-bold border-dashed border-violet-500/40 text-violet-400 hover:bg-violet-500/10 text-xs"
              onClick={() => {
                setSearchQuery('');
                setSeverityFilter('all');
                setStatusFilter('all');
                setTypeFilter('all');
                setFilter('search', '');
                setFilter('severity', '');
                setFilter('status', '');
                setFilter('type', '');
              }}
            >
              <X className="mr-1.5" size={13} /> {t('incidents.clearFilter')}
            </Button>
          )}
        </Card>

        {/* Master-Detail Split Grid */}
        <div className="grid min-h-[580px] gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
          {/* Master List Card */}
          <Card className="overflow-hidden border-border bg-card/45 backdrop-blur-md shadow-sm flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-card/20">
              <h2 className="font-black text-sm tracking-tight">{t('incidents.listTitle')}</h2>
              <Badge variant="outline" className="border-violet-500/20 bg-violet-500/5 text-violet-400 text-[10px] font-bold flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-violet-500 animate-pulse" />
                Live Feed
              </Badge>
            </div>

            <ScrollArea className="flex-1 h-[580px] custom-scroll bg-transparent">
              {loading ? (
                <div className="space-y-4 p-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 bg-card border border-border/50 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : incidents.length === 0 ? (
                <div className="flex min-h-[460px] flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-border/80 bg-muted/30 text-muted-foreground shadow-inner">
                    <AlertTriangle size={28} />
                  </div>
                  <h3 className="text-base font-black tracking-tight text-foreground">{t('table.noData')}</h3>
                  <p className="mt-2.5 max-w-xs text-xs font-semibold leading-relaxed text-muted-foreground">
                    {t('incidents.noIncidentsDesc')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                  {incidents.map((inc) => {
                    const sevCls = SEV_TEXT[inc.severity] ?? SEV_TEXT.low;
                    const staCls = STA_CLS[inc.status] ?? 'text-muted-foreground border-border bg-muted/30';
                    const active = selectedIncident?.id === inc.id;

                    return (
                      <div
                        key={inc.id}
                        onClick={() => handleViewDetail(inc)}
                        className={cn(
                          'relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer select-none bg-card/40',
                          active
                            ? 'border-violet-500/35 bg-violet-500/[0.04] ring-1 ring-violet-500/20'
                            : 'border-border hover:border-border/80 hover:bg-muted/30',
                        )}
                      >
                        {active && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 rounded-l" />
                        )}

                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0 flex items-start gap-2.5">
                            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/5 text-violet-400 text-lg")}>
                              <AlertTriangle size={16} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs font-extrabold text-foreground truncate">{inc.title}</h3>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate font-semibold">
                                <MapPin size={10} />
                                {inc.address || t('incidents.defaultAddress')}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn("text-[8px] h-4 font-black uppercase tracking-wider gap-1 shrink-0", sevCls)}>
                            {getSeverityLabel(inc.severity)}
                          </Badge>
                        </div>

                        <p className="text-[10px] text-muted-foreground font-semibold line-clamp-2 leading-relaxed mb-3">
                          {inc.description || t('incidents.noDescription')}
                        </p>

                        <div className="flex items-center justify-between mt-auto text-[10px] font-bold text-muted-foreground border-t border-border/50 pt-2.5">
                          <Badge variant="outline" className={cn("text-[8px] h-4.5 font-bold uppercase gap-0.5", staCls)}>
                            {getStatusLabel(inc.status)}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground/80 flex items-center gap-1 font-semibold">
                            <Clock size={10} />
                            {new Date(inc.created_at).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                          </span>
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
                  {t('incidents.paginationInfo', { current: currentPage, total: totalPages })}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-8 rounded-lg p-0 border-border hover:bg-muted"
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={15} />
                  </Button>
                  {getPageNumbers().map((num, i) => (
                    <Button
                      key={i}
                      variant={currentPage === num ? 'default' : 'outline'}
                      size="sm"
                      className={cn("size-8 rounded-lg p-0 text-xs font-bold border-border hover:bg-muted", currentPage === num && "bg-violet-600 hover:bg-violet-500 text-white border-none")}
                      onClick={() => typeof num === 'number' && setPage(num)}
                      disabled={typeof num !== 'number'}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-8 rounded-lg p-0 border-border hover:bg-muted"
                    onClick={() => setPage(currentPage + 1)}
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
            <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-violet-500/20 via-violet-500 to-violet-500/20" />

            {selectedIncident ? (
              <div className="flex flex-col h-full">
                {/* Panel Header */}
                <div className="border-b border-border px-5 py-4 flex items-center justify-between bg-card/20">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                      Incident ID: #{String(selectedIncident.id).padStart(4, '0')}
                    </p>
                    <h2 className="font-black text-sm tracking-tight mt-0.5 truncate text-foreground">
                      {t('incidents.detailTitle')}
                    </h2>
                  </div>
                  <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-wider gap-1", STA_CLS[selectedIncident.status] ?? 'text-muted-foreground')}>
                    {getStatusLabel(selectedIncident.status)}
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
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-violet-500/25 bg-violet-500/5 text-3xl shadow-md">
                        <AlertTriangle size={24} className="animate-pulse text-violet-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-black leading-snug text-foreground">
                          {selectedIncident.title}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-[10px] font-extrabold border uppercase tracking-wider border-violet-500/20 bg-violet-500/5 text-violet-400">
                            {t('incidents.typeLabel')}: {getTypeLabel(selectedIncident.type ?? '')}
                          </Badge>
                          {selectedIncident.district?.name && (
                            <Badge variant="outline" className="text-[10px] font-extrabold border uppercase tracking-wider border-border bg-muted/20 text-muted-foreground">
                              {t('incidents.districtLabel')}: {selectedIncident.district.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Operational Check action controller - Inline status & severity update dropdowns */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl border border-border bg-muted/20 p-3">
                        <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">
                          {t('incidents.updateStatusBtn')}
                        </span>
                        <Select
                          value={selectedIncident.status}
                          onValueChange={(status) => handleUpdateIncident(selectedIncident, { status: status ?? selectedIncident.status })}
                          disabled={submitting}
                        >
                          <SelectTrigger className="mt-1.5 h-8 bg-background border-border text-[11px] font-bold text-foreground focus:ring-violet-500">
                            <SelectValue>
                              {getStatusLabel(selectedIncident.status)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-foreground">
                             <SelectItem value="reported" className="text-xs font-semibold">{getStatusLabel('reported')}</SelectItem>
                             <SelectItem value="verified" className="text-xs font-semibold">{getStatusLabel('verified')}</SelectItem>
                             <SelectItem value="responding" className="text-xs font-semibold">{getStatusLabel('responding')}</SelectItem>
                             <SelectItem value="resolved" className="text-xs font-semibold">{getStatusLabel('resolved')}</SelectItem>
                             <SelectItem value="closed" className="text-xs font-semibold">{getStatusLabel('closed')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="rounded-xl border border-border bg-muted/20 p-3">
                        <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">
                          {t('incidents.severityDetailLabel')}
                        </span>
                        <Select
                          value={selectedIncident.severity}
                          onValueChange={(severity) => handleUpdateIncident(selectedIncident, { severity: severity ?? selectedIncident.severity })}
                          disabled={submitting}
                        >
                          <SelectTrigger className="mt-1.5 h-8 bg-background border-border text-[11px] font-bold text-foreground focus:ring-violet-500">
                            <SelectValue>
                              {getSeverityLabel(selectedIncident.severity)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-foreground">
                             <SelectItem value="low" className="text-xs font-semibold">{getSeverityLabel('low')}</SelectItem>
                             <SelectItem value="medium" className="text-xs font-semibold">{getSeverityLabel('medium')}</SelectItem>
                             <SelectItem value="high" className="text-xs font-semibold">{getSeverityLabel('high')}</SelectItem>
                             <SelectItem value="critical" className="text-xs font-semibold">{getSeverityLabel('critical')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Detailed Situation Report */}
                    <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
                      <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        📝 {t('incidents.fieldDesc')}
                      </p>
                      <p className="text-xs font-semibold text-foreground/90 leading-relaxed">
                        {selectedIncident.description || t('incidents.noDescription')}
                      </p>
                    </div>

                    {/* Local sensor indicators if exist */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl border border-border bg-muted/20 p-3 flex flex-col justify-between">
                        <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">🌊 {t('incidents.waterLevelLabel')}</span>
                        <span className="text-sm font-black text-foreground mt-2">
                          {selectedIncident.water_level_m ?? '—'}{selectedIncident.water_level_m != null ? ' m' : ''}
                        </span>
                      </div>

                      <div className="rounded-xl border border-border bg-muted/20 p-3 flex flex-col justify-between">
                        <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">🌧️ {t('incidents.rainfallLabel')}</span>
                        <span className="text-sm font-black text-foreground mt-2">
                          {selectedIncident.rainfall_mm ?? '—'}{selectedIncident.rainfall_mm != null ? ' mm' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Address Contacts location coordinates */}
                    <div className="rounded-2xl border border-border bg-muted/20 p-3.5 text-xs">
                        <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                          <MapPin size={11} className="text-violet-500" /> {t('incidents.locationLabel')}
                        </p>
                      <p className="font-semibold text-foreground">{selectedIncident.address || t('incidents.noAddress')}</p>
                      {(selectedIncident.location?.lat ?? selectedIncident.geometry?.coordinates?.[1]) && (
                        <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                          <span>{t('incidents.latitudeLabel')}: <strong className="text-foreground">{(selectedIncident.location?.lat ?? selectedIncident.geometry?.coordinates?.[1])?.toFixed(5)}</strong></span>
                          <span>{t('incidents.longitudeLabel')}: <strong className="text-foreground">{(selectedIncident.location?.lng ?? selectedIncident.geometry?.coordinates?.[0])?.toFixed(5)}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Events Timeline Log if exists */}
                    {selectedIncident.events && selectedIncident.events.length > 0 && (
                      <div className="rounded-2xl border border-border bg-muted/20 p-3.5 space-y-2.5">
                          <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                            <Clock size={12} className="text-violet-400" /> {t('incidents.eventLogTitle')}
                          </p>
                        <div className="space-y-3 max-h-44 overflow-y-auto custom-scroll pr-1">
                          {selectedIncident.events.map((event) => (
                            <div key={event.id} className="flex items-start gap-2.5 text-[10px] leading-relaxed">
                              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                              <div>
                                <p className="font-semibold text-foreground">{event.description || event.event_type}</p>
                                <p className="text-muted-foreground/80 text-[9px] mt-0.5">
                                  {event.actor ? `${event.actor} · ` : ''}
                                  {event.created_at ? new Date(event.created_at).toLocaleString(undefined) : ''}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shortcut actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        asChild
                        variant="outline"
                        className="gap-2 rounded-xl h-10 text-xs font-bold border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                      >
                        <Link href={`/dashboard/alerts?incident_id=${selectedIncident.id}&incident_title=${encodeURIComponent(selectedIncident.title)}`}>
                          <Bell size={13} />
                          {t('incidents.createAlertBtn')}
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="gap-2 rounded-xl h-10 text-xs font-bold border-rose-500/40 text-rose-500 hover:bg-rose-500/10"
                      >
                        <Link href="/dashboard/rescue-requests">
                          <HeartPulse size={13} />
                          {t('incidents.viewRescueBtn')}
                        </Link>
                      </Button>
                    </div>

                    {/* Map Navigation and resolution button */}
                    <div className="flex gap-2.5">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 rounded-xl h-10 text-xs font-bold border-border text-foreground hover:bg-muted"
                        onClick={() => handleOpenMap(selectedIncident)}
                      >
                        <Route size={14} />
                        {t('incidents.viewMapBtn')}
                      </Button>
                      {selectedIncident.status !== 'resolved' && (
                        <Button
                          className="flex-1 gap-2 rounded-xl h-10 text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white"
                          onClick={() => handleUpdateIncident(selectedIncident, { status: 'resolved' })}
                          disabled={submitting}
                        >
                          <CheckCircle2 size={14} />
                          {t('incidents.updateStatusBtn')}
                        </Button>
                      )}
                    </div>
                  </div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-transparent">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-muted-foreground shadow-inner">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-sm font-bold text-foreground">{t('incidents.noDetailSelected')}</h3>
                <p className="mt-1.5 max-w-xs text-xs text-muted-foreground font-semibold">
                  {t('incidents.noDetailSelectedDesc')}
                </p>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Creation Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('incidents.createTitle')}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">{t('incidents.createDesc')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3 text-xs">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">{t('incidents.fieldName')}</Label>
              <Input
                placeholder={t('incidents.fieldNamePlaceholder')}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="bg-background border-border text-foreground placeholder-muted-foreground/60"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">{t('incidents.fieldType')}</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v ?? '' }))}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    <SelectItem value="flood">{t('incidents.typeFlood')}</SelectItem>
                    <SelectItem value="heavy_rain">{t('incidents.typeHeavyRain')}</SelectItem>
                    <SelectItem value="landslide">{t('incidents.typeLandslide')}</SelectItem>
                    <SelectItem value="dam_failure">{t('incidents.typeDamFailure')}</SelectItem>
                    <SelectItem value="other">{t('incidents.typeOther')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">{t('incidents.fieldSeverity')}</Label>
                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v ?? '' }))}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    <SelectItem value="low">{tEnum('severity.low')}</SelectItem>
                    <SelectItem value="medium">{tEnum('severity.medium')}</SelectItem>
                    <SelectItem value="high">{t('incidents.sevHigh')}</SelectItem>
                    <SelectItem value="critical">{tEnum('severity.critical')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">{t('incidents.fieldAddress')}</Label>
              <Input
                placeholder={t('incidents.fieldAddressPlaceholder')}
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="bg-background border-border text-foreground placeholder-muted-foreground/60"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">{t('incidents.fieldLat')}</Label>
                <Input
                  placeholder="16.0544"
                  value={form.lat}
                  onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                  className="bg-background border-border text-foreground placeholder-muted-foreground/60"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">{t('incidents.fieldLng')}</Label>
                <Input
                  placeholder="108.2022"
                  value={form.lng}
                  onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                  className="bg-background border-border text-foreground placeholder-muted-foreground/60"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">{t('incidents.fieldDesc')}</Label>
              <Textarea
                placeholder={t('incidents.fieldDescPlaceholder')}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="min-h-[70px] resize-none bg-background border-border text-foreground placeholder-muted-foreground/60"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="border-border hover:bg-muted text-foreground"
            >
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="bg-violet-600 hover:bg-violet-500 text-white border-none"
            >
              {submitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              {t('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
