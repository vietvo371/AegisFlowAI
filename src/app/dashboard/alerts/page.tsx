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
import { RefreshCw, Search, Megaphone, AlertCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Alert {
  id: number; alert_number?: string; title: string; description?: string;
  alert_type: string; severity: string; status: string;
  effective_from: string; effective_until?: string; source?: string;
}

const SEV_COLOR: Record<string, string> = {
  critical: 'bg-red-500 animate-pulse', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-blue-500',
};
const STA_CLS: Record<string, string> = {
  active:   'bg-red-500 text-white',
  updated:  'bg-orange-500 text-white',
  resolved: 'bg-emerald-500 text-white',
  expired:  'text-gray-400',
  draft:    'text-muted-foreground',
};

export default function AlertsPage() {
  const t = useTranslations('dashboard');
  const tEnum = useTranslations('enums');

  const { data: alerts, meta, loading, setFilter, setPage, refresh } = useTable<Alert>({
    endpoint: '/alerts', perPage: 20,
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', alert_type: 'flood',
    severity: 'medium', effective_from: '', effective_until: '',
  });

  React.useEffect(() => {
    const h = () => refresh();
    window.addEventListener('aegis:alert:created', h);
    return () => window.removeEventListener('aegis:alert:created', h);
  }, [refresh]);

  const handleCreate = async () => {
    if (!form.title || !form.description) { toast.error(t('alerts.validationError')); return; }
    setSubmitting(true);
    try {
      await api.post('/alerts', {
        ...form,
        effective_from: form.effective_from || new Date().toISOString().slice(0, 16),
        effective_until: form.effective_until || undefined,
      });
      setIsCreateOpen(false);
      setForm({ title: '', description: '', alert_type: 'flood', severity: 'medium', effective_from: '', effective_until: '' });
      refresh();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      active: t('alerts.statusActive'),
      updated: t('alerts.statusUpdated'),
      resolved: t('alerts.statusResolved'),
      expired: t('alerts.statusExpired'),
      draft: t('alerts.statusDraft'),
    };
    return map[status] ?? status;
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      flood: t('alerts.typeFlood'),
      storm: t('alerts.typeStorm'),
      landslide: t('alerts.typeLandslide'),
      evacuation: t('alerts.typeEvacuation'),
      system: t('alerts.typeSystem'),
    };
    return map[type] ?? type;
  };

  const activeCount = alerts.filter(a => a.status === 'active').length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('pages.alerts')}</h1>
          <p className="text-muted-foreground mt-1">{t('alerts.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Megaphone size={16} /> {t('alerts.issueBtn')}
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('alerts.searchPlaceholder')} className="pl-9 h-9 bg-muted/50"
                onChange={e => setFilter('search', e.target.value)} />
            </div>
            <Select onValueChange={v => setFilter('status', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder={t('alerts.statusPlaceholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('table.all')}</SelectItem>
                <SelectItem value="active">{tEnum('alertStatus.active')}</SelectItem>
                <SelectItem value="resolved">{tEnum('alertStatus.resolved')}</SelectItem>
                <SelectItem value="expired">{tEnum('alertStatus.expired')}</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={v => setFilter('severity', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder={t('alerts.severityPlaceholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('table.all')}</SelectItem>
                <SelectItem value="critical">{t('alerts.sevCritical')}</SelectItem>
                <SelectItem value="high">{t('alerts.sevHigh')}</SelectItem>
                <SelectItem value="medium">{t('alerts.sevMedium')}</SelectItem>
                <SelectItem value="low">{t('alerts.sevLow')}</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={v => setFilter('alert_type', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder={t('alerts.typePlaceholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('table.all')}</SelectItem>
                <SelectItem value="flood">{t('alerts.typeFlood')}</SelectItem>
                <SelectItem value="storm">{t('alerts.typeStorm')}</SelectItem>
                <SelectItem value="landslide">{t('alerts.typeLandslide')}</SelectItem>
                <SelectItem value="evacuation">{t('alerts.typeEvacuation')}</SelectItem>
              </SelectContent>
            </Select>
            {activeCount > 0 && (
              <span className="text-sm font-medium text-red-500 whitespace-nowrap">
                {t('alerts.activeCount', { count: activeCount })}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[110px]">{t('alerts.colCode')}</TableHead>
                <TableHead>{t('alerts.colContent')}</TableHead>
                <TableHead>{t('alerts.colType')}</TableHead>
                <TableHead>{t('alerts.colSeverity')}</TableHead>
                <TableHead>{t('alerts.colStatus')}</TableHead>
                <TableHead className="text-right">{t('alerts.colEffective')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : alerts.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">{t('alerts.noAlerts')}</TableCell></TableRow>
              ) : alerts.map(a => {
                const staCls = STA_CLS[a.status];
                return (
                  <TableRow key={a.id} className="hover:bg-muted/30">
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{a.alert_number ?? `#${a.id}`}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <AlertCircle size={15} className={`mt-0.5 shrink-0 ${a.severity === 'critical' ? 'text-red-500' : 'text-orange-500'}`} />
                        <div>
                          <p className="font-semibold text-sm leading-snug">{a.title}</p>
                          {a.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.description}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{getTypeLabel(a.alert_type)}</span></TableCell>
                    <TableCell>
                      <Badge className={`${SEV_COLOR[a.severity]} text-white`}>
                        {tEnum(`severity.${a.severity}` as any, { defaultValue: a.severity })}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={staCls}>{getStatusLabel(a.status)}</Badge></TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      <div className="flex items-center justify-end gap-1">
                        <Calendar size={11} />
                        {new Date(a.effective_from).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </div>
                      {!a.effective_until && <div className="text-[10px] text-red-400">{t('alerts.indefinite')}</div>}
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
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t('alerts.createTitle')}</DialogTitle>
            <DialogDescription>{t('alerts.createDesc')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="space-y-1.5"><Label>{t('alerts.fieldTitle')}</Label>
              <Input placeholder={t('alerts.fieldTitlePlaceholder')} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t('alerts.fieldType')}</Label>
                <Select value={form.alert_type} onValueChange={v => setForm(f => ({ ...f, alert_type: v ?? '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flood">{t('alerts.typeFlood')}</SelectItem>
                    <SelectItem value="storm">{t('alerts.typeStorm')}</SelectItem>
                    <SelectItem value="landslide">{t('alerts.typeLandslide')}</SelectItem>
                    <SelectItem value="evacuation">{t('alerts.typeEvacuation')}</SelectItem>
                    <SelectItem value="system">{t('alerts.typeSystem')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>{t('alerts.fieldSeverity')}</Label>
                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v ?? '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('alerts.sevLow')}</SelectItem>
                    <SelectItem value="medium">{t('alerts.sevMedium')}</SelectItem>
                    <SelectItem value="high">{t('alerts.sevHigh')}</SelectItem>
                    <SelectItem value="critical">{t('alerts.sevCritical')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t('alerts.fieldEffectiveFrom')}</Label>
                <Input type="datetime-local" value={form.effective_from} onChange={e => setForm(f => ({ ...f, effective_from: e.target.value }))} />
              </div>
              <div className="space-y-1.5"><Label>{t('alerts.fieldEffectiveUntil')}</Label>
                <Input type="datetime-local" value={form.effective_until} onChange={e => setForm(f => ({ ...f, effective_until: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5"><Label>{t('alerts.fieldContent')}</Label>
              <Textarea placeholder={t('alerts.fieldContentPlaceholder')} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="min-h-[80px] resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t('actions.cancel')}</Button>
            <Button variant="destructive" onClick={handleCreate} disabled={submitting}>
              {submitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              <Megaphone size={14} className="mr-2" /> {t('alerts.issueCommand')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
