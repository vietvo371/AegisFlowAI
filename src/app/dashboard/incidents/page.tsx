'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { useTable } from '@/lib/use-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DataPagination } from '@/components/ui/data-pagination';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Search, Plus, MapPin, Eye, CheckCircle2, Route } from 'lucide-react';
import { toast } from 'sonner';

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

const SEV_COLOR: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-blue-500',
};
const STA_CLS: Record<string, string> = {
  reported:      'text-muted-foreground border-muted',
  verified:      'text-blue-500 border-blue-200',
  responding:    'bg-amber-500 text-white',
  resolved:      'bg-gray-500 text-white',
  closed:        'text-slate-500 border-slate-200',
};

const STATUS_LABELS: Record<string, string> = {
  reported: 'Mới báo cáo',
  verified: 'Đã xác minh',
  responding: 'Đang ứng phó',
  resolved: 'Đã giải quyết',
  closed: 'Đã đóng',
};

const SEVERITY_LABELS: Record<string, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Nghiêm trọng',
};

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  flood: 'Ngập lụt',
  heavy_rain: 'Mưa lớn',
  landslide: 'Sạt lở',
  dam_failure: 'Sự cố đập',
  other: 'Khác',
};

export default function IncidentsPage() {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tEnum = useTranslations('enums');

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
  const [form, setForm] = useState({ title: '', description: '', type: 'flood', severity: 'medium', lat: '', lng: '', address: '' });

  React.useEffect(() => {
    const h = () => refresh();
    window.addEventListener('aegis:incident:created', h);
    return () => window.removeEventListener('aegis:incident:created', h);
  }, [refresh]);

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

  const handleViewDetail = async (incident: Incident) => {
    setSelectedIncident(incident);
    setDetailLoading(true);
    try {
      const res = await api.get(`/incidents/${incident.id}`);
      setSelectedIncident(res.data?.data ?? incident);
    } catch {
      toast.error('Không tải được chi tiết sự cố');
    } finally {
      setDetailLoading(false);
    }
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
      toast.error('Sự cố này chưa có tọa độ');
      return;
    }

    const params = new URLSearchParams({
      incidentId: String(incident.id),
      incidentTitle: incident.title,
      incidentType: incident.type_label ?? INCIDENT_TYPE_LABELS[incident.type ?? ''] ?? incident.type ?? 'Sự cố',
      incidentSeverity: incident.severity_label ?? SEVERITY_LABELS[incident.severity] ?? incident.severity,
      incidentStatus: incident.status_label ?? STATUS_LABELS[incident.status] ?? incident.status,
      incidentAddress: incident.address ?? '',
      lat: String(lat),
      lng: String(lng),
    });

    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="w-full p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('pages.incidents')}</h1>
          <p className="text-muted-foreground mt-1">{t('incidents.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} /> {t('incidents.reportBtn')}
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('incidents.searchPlaceholder')} className="pl-9 h-9 bg-muted/50"
                onChange={e => setFilter('search', e.target.value)} />
            </div>
            <Select
              value={severityFilter}
              onValueChange={(v) => {
                const value = v ?? 'all';
                setSeverityFilter(value);
                setFilter('severity', value === 'all' ? '' : value);
              }}
            >
              <SelectTrigger className="h-9 w-36">
                <SelectValue>
                  {severityFilter === 'all' ? t('incidents.severityPlaceholder') : (SEVERITY_LABELS[severityFilter] ?? severityFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('table.all')}</SelectItem>
                <SelectItem value="critical">{tEnum('severity.critical')}</SelectItem>
                <SelectItem value="high">{t('incidents.sevHigh')}</SelectItem>
                <SelectItem value="medium">{tEnum('severity.medium')}</SelectItem>
                <SelectItem value="low">{tEnum('severity.low')}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                const value = v ?? 'all';
                setStatusFilter(value);
                setFilter('status', value === 'all' ? '' : value);
              }}
            >
              <SelectTrigger className="h-9 w-40">
                <SelectValue>
                  {statusFilter === 'all' ? t('incidents.statusPlaceholder') : (STATUS_LABELS[statusFilter] ?? statusFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('table.all')}</SelectItem>
                <SelectItem value="reported">{tEnum('incidentStatus.reported')}</SelectItem>
                <SelectItem value="verified">{tEnum('incidentStatus.verified')}</SelectItem>
                <SelectItem value="responding">{tEnum('incidentStatus.responding')}</SelectItem>
                <SelectItem value="resolved">{tEnum('incidentStatus.resolved')}</SelectItem>
                <SelectItem value="closed">{tEnum('incidentStatus.closed')}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                const value = v ?? 'all';
                setTypeFilter(value);
                setFilter('type', value === 'all' ? '' : value);
              }}
            >
              <SelectTrigger className="h-9 w-36">
                <SelectValue>
                  {typeFilter === 'all' ? t('incidents.typePlaceholder') : (INCIDENT_TYPE_LABELS[typeFilter] ?? typeFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('table.all')}</SelectItem>
                <SelectItem value="flood">{t('incidents.typeFlood')}</SelectItem>
                <SelectItem value="heavy_rain">{t('incidents.typeHeavyRain')}</SelectItem>
                <SelectItem value="landslide">{t('incidents.typeLandslide')}</SelectItem>
                <SelectItem value="dam_failure">{t('incidents.typeDamFailure')}</SelectItem>
                <SelectItem value="other">{t('incidents.typeOther')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[80px]">{t('incidents.colId')}</TableHead>
                <TableHead>{t('incidents.colName')}</TableHead>
                <TableHead>{t('incidents.colType')}</TableHead>
                <TableHead>{t('incidents.colSeverity')}</TableHead>
                <TableHead>{t('incidents.colStatus')}</TableHead>
                <TableHead>{t('incidents.colLocation')}</TableHead>
                <TableHead className="text-right">{t('incidents.colTime')}</TableHead>
                <TableHead className="w-[110px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="h-32 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : incidents.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">{t('table.noData')}</TableCell></TableRow>
              ) : incidents.map(inc => {
                const staCls = STA_CLS[inc.status] ?? 'text-muted-foreground border-muted';
                const staLabel = inc.status_label ?? STATUS_LABELS[inc.status] ?? inc.status;
                return (
                  <TableRow key={inc.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs text-muted-foreground">#{String(inc.id).padStart(4, '0')}</TableCell>
                    <TableCell className="font-semibold">{inc.title}</TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{inc.type_label ?? inc.type}</span></TableCell>
                    <TableCell>
                      <Badge className={`${SEV_COLOR[inc.severity]} text-white`}>
                        {inc.severity_label ?? SEVERITY_LABELS[inc.severity] ?? inc.severity}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={staCls}>{staLabel}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center text-xs text-muted-foreground gap-1">
                        <MapPin size={11} />
                        <span className="truncate max-w-[160px]">{inc.address ?? `${inc.location?.lat?.toFixed(4)}, ${inc.location?.lng?.toFixed(4)}`}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(inc.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="Xem chi tiết sự cố" onClick={() => handleViewDetail(inc)} />}>
                              <Eye size={15} />
                            </TooltipTrigger>
                            <TooltipContent>Xem chi tiết</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="Mở sự cố trên bản đồ" onClick={() => handleOpenMap(inc)} />}>
                              <MapPin size={15} />
                            </TooltipTrigger>
                            <TooltipContent>Mở trên bản đồ</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <DataPagination meta={meta} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t('incidents.createTitle')}</DialogTitle>
            <DialogDescription>{t('incidents.createDesc')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="space-y-1.5"><Label>{t('incidents.fieldName')}</Label>
              <Input placeholder={t('incidents.fieldNamePlaceholder')} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t('incidents.fieldType')}</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v ?? '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flood">{t('incidents.typeFlood')}</SelectItem>
                    <SelectItem value="heavy_rain">{t('incidents.typeHeavyRain')}</SelectItem>
                    <SelectItem value="landslide">{t('incidents.typeLandslide')}</SelectItem>
                    <SelectItem value="dam_failure">{t('incidents.typeDamFailure')}</SelectItem>
                    <SelectItem value="other">{t('incidents.typeOther')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>{t('incidents.fieldSeverity')}</Label>
                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v ?? '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{tEnum('severity.low')}</SelectItem>
                    <SelectItem value="medium">{tEnum('severity.medium')}</SelectItem>
                    <SelectItem value="high">{t('incidents.sevHigh')}</SelectItem>
                    <SelectItem value="critical">{tEnum('severity.critical')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>{t('incidents.fieldAddress')}</Label>
              <Input placeholder={t('incidents.fieldAddressPlaceholder')} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t('incidents.fieldLat')}</Label>
                <Input placeholder="16.0544" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
              </div>
              <div className="space-y-1.5"><Label>{t('incidents.fieldLng')}</Label>
                <Input placeholder="108.2022" value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5"><Label>{t('incidents.fieldDesc')}</Label>
              <Textarea placeholder={t('incidents.fieldDescPlaceholder')} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="min-h-[70px] resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t('actions.cancel')}</Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}{t('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedIncident} onOpenChange={(open) => !open && setSelectedIncident(null)}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{selectedIncident?.title}</DialogTitle>
            <DialogDescription>
              {selectedIncident ? `#${String(selectedIncident.id).padStart(4, '0')} · ${selectedIncident.type_label ?? selectedIncident.type ?? 'Sự cố'}` : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedIncident && (
            <div className="space-y-4">
              {detailLoading ? (
                <div className="h-40 rounded-lg bg-muted animate-pulse" />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Trạng thái</p>
                      <Select
                        value={selectedIncident.status}
                        onValueChange={(status) => handleUpdateIncident(selectedIncident, { status: status ?? selectedIncident.status })}
                        disabled={submitting}
                      >
                        <SelectTrigger className="mt-2 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reported">{STATUS_LABELS.reported}</SelectItem>
                          <SelectItem value="verified">{STATUS_LABELS.verified}</SelectItem>
                          <SelectItem value="responding">{STATUS_LABELS.responding}</SelectItem>
                          <SelectItem value="resolved">{STATUS_LABELS.resolved}</SelectItem>
                          <SelectItem value="closed">{STATUS_LABELS.closed}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Mức độ</p>
                      <Select
                        value={selectedIncident.severity}
                        onValueChange={(severity) => handleUpdateIncident(selectedIncident, { severity: severity ?? selectedIncident.severity })}
                        disabled={submitting}
                      >
                        <SelectTrigger className="mt-2 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">{SEVERITY_LABELS.low}</SelectItem>
                          <SelectItem value="medium">{SEVERITY_LABELS.medium}</SelectItem>
                          <SelectItem value="high">{SEVERITY_LABELS.high}</SelectItem>
                          <SelectItem value="critical">{SEVERITY_LABELS.critical}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-lg border p-3 text-sm space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 text-muted-foreground" />
                      <span>{selectedIncident.address || 'Chưa có địa chỉ'}{selectedIncident.district?.name ? `, ${selectedIncident.district.name}` : ''}</span>
                    </div>
                    {selectedIncident.flood_zone?.name && (
                      <div className="flex items-center gap-2">
                        <DropletIcon />
                        <span>{selectedIncident.flood_zone.name}</span>
                      </div>
                    )}
                    <p className="text-muted-foreground">
                      {selectedIncident.description || 'Chưa có mô tả chi tiết'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Mực nước</p>
                      <p className="font-semibold">{selectedIncident.water_level_m ?? '—'}{selectedIncident.water_level_m != null ? 'm' : ''}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Lượng mưa</p>
                      <p className="font-semibold">{selectedIncident.rainfall_mm ?? '—'}{selectedIncident.rainfall_mm != null ? 'mm' : ''}</p>
                    </div>
                  </div>

                  {selectedIncident.events && selectedIncident.events.length > 0 && (
                    <div className="rounded-lg border p-3">
                      <p className="text-sm font-semibold mb-2">Dòng sự kiện</p>
                      <div className="space-y-2 max-h-44 overflow-y-auto custom-scroll pr-1">
                        {selectedIncident.events.map((event) => (
                          <div key={event.id} className="flex items-start gap-2 text-xs">
                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            <div>
                              <p className="font-medium">{event.description || event.event_type}</p>
                              <p className="text-muted-foreground">
                                {event.actor ? `${event.actor} · ` : ''}
                                {event.created_at ? new Date(event.created_at).toLocaleString('vi-VN') : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2" onClick={() => handleOpenMap(selectedIncident)}>
                      <Route size={15} />
                      Mở bản đồ
                    </Button>
                    {selectedIncident.status !== 'resolved' && (
                      <Button className="flex-1 gap-2" onClick={() => handleUpdateIncident(selectedIncident, { status: 'resolved' })} disabled={submitting}>
                        <CheckCircle2 size={15} />
                        Đánh dấu xử lý xong
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DropletIcon() {
  return <span className="h-3.5 w-3.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 shrink-0" />;
}
