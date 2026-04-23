'use client';

import * as React from 'react';
import { useState } from 'react';
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
import { RefreshCw, Search, Plus, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface Incident {
  id: number; title: string; description?: string;
  type?: string; type_label?: string;
  severity: string; severity_label?: string;
  status: string; status_label?: string;
  source?: string; address?: string;
  location?: { lat: number; lng: number };
  district?: { id: number; name: string };
  water_level_m?: number; created_at: string;
}

const SEV_COLOR: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-blue-500',
};
const STA_CLS: Record<string, string> = {
  reported:      'text-muted-foreground border-muted',
  investigating: 'text-blue-500 border-blue-200',
  confirmed:     'bg-emerald-500 text-white',
  resolved:      'bg-gray-500 text-white',
  false_alarm:   'text-red-400 line-through',
};

export default function IncidentsPage() {
  const t = useTranslations('dashboard');
  const tEnum = useTranslations('enums');

  const { data: incidents, meta, loading, setFilter, setPage, refresh } = useTable<Incident>({
    endpoint: '/incidents', perPage: 20,
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
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
            <Select onValueChange={v => setFilter('severity', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder={t('incidents.severityPlaceholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('table.all')}</SelectItem>
                <SelectItem value="critical">{tEnum('severity.critical')}</SelectItem>
                <SelectItem value="high">{t('incidents.sevHigh')}</SelectItem>
                <SelectItem value="medium">{tEnum('severity.medium')}</SelectItem>
                <SelectItem value="low">{tEnum('severity.low')}</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={v => setFilter('status', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder={t('incidents.statusPlaceholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('table.all')}</SelectItem>
                <SelectItem value="reported">{tEnum('incidentStatus.reported')}</SelectItem>
                <SelectItem value="investigating">{tEnum('incidentStatus.investigating')}</SelectItem>
                <SelectItem value="confirmed">{tEnum('incidentStatus.confirmed')}</SelectItem>
                <SelectItem value="resolved">{tEnum('incidentStatus.resolved')}</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={v => setFilter('type', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder={t('incidents.typePlaceholder')} /></SelectTrigger>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : incidents.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">{t('table.noData')}</TableCell></TableRow>
              ) : incidents.map(inc => {
                const staCls = STA_CLS[inc.status];
                const staLabel = inc.status_label ?? tEnum(`incidentStatus.${inc.status}` as any, { defaultValue: inc.status });
                return (
                  <TableRow key={inc.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs text-muted-foreground">#{String(inc.id).padStart(4, '0')}</TableCell>
                    <TableCell className="font-semibold">{inc.title}</TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{inc.type_label ?? inc.type}</span></TableCell>
                    <TableCell>
                      <Badge className={`${SEV_COLOR[inc.severity]} text-white`}>
                        {inc.severity_label ?? tEnum(`severity.${inc.severity}` as any, { defaultValue: inc.severity })}
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
    </div>
  );
}
