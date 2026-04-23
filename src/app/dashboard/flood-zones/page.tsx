'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  RefreshCw, Search, Waves, MapPin, Plus,
  AlertTriangle, TrendingUp, Edit2
} from 'lucide-react';
import { toast } from 'sonner';

interface FloodZone {
  id: number;
  name: string;
  slug: string;
  description?: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_level_label?: string;
  status: 'monitoring' | 'alert' | 'danger' | 'flooded' | 'recovering';
  status_label?: string;
  current_water_level_m?: number;
  alert_threshold_m?: number;
  danger_threshold_m?: number;
  color?: string;
  district?: { id: number; name: string };
  sensors_count?: number;
  is_active: boolean;
}

const RISK_BADGE: Record<string, string> = {
  low: 'bg-blue-500', medium: 'bg-yellow-500', high: 'bg-orange-500', critical: 'bg-red-500',
};
const STATUS_BADGE: Record<string, string> = {
  monitoring: 'bg-emerald-500', alert: 'bg-yellow-500', danger: 'bg-orange-500',
  flooded: 'bg-red-500', recovering: 'bg-blue-500',
};

const EMPTY_FORM = {
  name: '', slug: '', description: '',
  risk_level: 'medium', district_id: '',
  alert_threshold_m: '1.5', danger_threshold_m: '3.0',
  color: '#f79009',
};

export default function FloodZonesPage() {
  const t = useTranslations('dashboard');
  const tEnum = useTranslations('enums');

  const [zones, setZones] = useState<FloodZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FloodZone | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await api.get('/flood-zones', { params: { per_page: 50 } });
      setZones(res.data?.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
    const handler = () => fetchZones();
    window.addEventListener('aegis:flood_zone:updated', handler);
    return () => window.removeEventListener('aegis:flood_zone:updated', handler);
  }, []);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditTarget(null);
    setIsCreateOpen(true);
  };

  const openEdit = (zone: FloodZone) => {
    setForm({
      name: zone.name,
      slug: zone.slug,
      description: zone.description ?? '',
      risk_level: zone.risk_level,
      district_id: zone.district?.id?.toString() ?? '',
      alert_threshold_m: zone.alert_threshold_m?.toString() ?? '1.5',
      danger_threshold_m: zone.danger_threshold_m?.toString() ?? '3.0',
      color: zone.color ?? '#f79009',
    });
    setEditTarget(zone);
    setIsCreateOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.slug || !form.risk_level) {
      toast.error(t('floodZones.validationError'));
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        risk_level: form.risk_level,
        district_id: form.district_id ? parseInt(form.district_id) : undefined,
        alert_threshold_m: parseFloat(form.alert_threshold_m),
        danger_threshold_m: parseFloat(form.danger_threshold_m),
        color: form.color,
      };

      if (editTarget) {
        await api.put(`/flood-zones/${editTarget.id}`, payload);
      } else {
        await api.post('/flood-zones', payload);
      }

      setIsCreateOpen(false);
      fetchZones();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/flood-zones/${id}`, { status });
      fetchZones();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = zones.filter(z =>
    !search ||
    z.name.toLowerCase().includes(search.toLowerCase()) ||
    z.district?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: t('floodZones.statFlooded'),   value: zones.filter(z => z.status === 'flooded').length,    color: 'text-red-500',    bg: 'bg-red-500/10' },
    { label: t('floodZones.statAlert'),     value: zones.filter(z => z.status === 'alert').length,       color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: t('floodZones.statMonitoring'),value: zones.filter(z => z.status === 'monitoring').length,  color: 'text-emerald-500',bg: 'bg-emerald-500/10' },
    { label: t('floodZones.statTotal'),     value: zones.length,                                          color: 'text-primary',    bg: 'bg-primary/10' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Waves className="text-blue-500" size={28} />
            {t('pages.floodZones')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('floodZones.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchZones} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> {t('floodZones.addBtn')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="border-border shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <Waves className={`w-5 h-5 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('floodZones.searchPlaceholder')}
                className="pl-9 h-9 bg-muted/50"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span className="text-sm text-muted-foreground">{t('floodZones.zonesCount', { count: filtered.length })}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>{t('floodZones.colName')}</TableHead>
                  <TableHead>{t('floodZones.colRisk')}</TableHead>
                  <TableHead>{t('floodZones.colStatus')}</TableHead>
                  <TableHead className="w-[200px]">{t('floodZones.colWaterLevel')}</TableHead>
                  <TableHead>{t('floodZones.colThreshold')}</TableHead>
                  <TableHead>{t('floodZones.colArea')}</TableHead>
                  <TableHead className="text-right w-[120px]">{t('floodZones.colAction')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      {t('floodZones.loadingZones')}
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      {t('floodZones.noZones')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(zone => {
                    const riskBadge = RISK_BADGE[zone.risk_level] ?? RISK_BADGE.low;
                    const riskLabel = zone.risk_level_label ?? tEnum(`severity.${zone.risk_level}` as any, { defaultValue: zone.risk_level });
                    const statusBadge = STATUS_BADGE[zone.status] ?? STATUS_BADGE.monitoring;
                    const statusLabel = zone.status_label ?? tEnum(`floodZoneStatus.${zone.status}` as any, { defaultValue: zone.status });
                    const waterLevel = zone.current_water_level_m != null ? Number(zone.current_water_level_m) : null;
                    const alertThreshold = zone.alert_threshold_m != null ? Number(zone.alert_threshold_m) : null;
                    const dangerThreshold = zone.danger_threshold_m != null ? Number(zone.danger_threshold_m) : null;
                    const waterPct = dangerThreshold && waterLevel != null
                      ? Math.min((waterLevel / dangerThreshold) * 100, 100)
                      : 0;
                    const isOverAlert = alertThreshold != null && (waterLevel ?? 0) >= alertThreshold;
                    const isOverDanger = dangerThreshold != null && (waterLevel ?? 0) >= dangerThreshold;

                    return (
                      <TableRow key={zone.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: zone.color ?? '#f79009' }} />
                            <div>
                              <div className="font-semibold text-foreground">{zone.name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">{zone.slug}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${riskBadge} text-white`}>{riskLabel}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusBadge} text-white`}>{statusLabel}</Badge>
                        </TableCell>
                        <TableCell>
                          {waterLevel != null ? (
                            <div className="space-y-1.5 w-[160px]">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className={isOverDanger ? 'text-red-500 font-bold' : isOverAlert ? 'text-orange-500' : 'text-foreground'}>
                                  {waterLevel.toFixed(2)}m
                                </span>
                                <span className="text-muted-foreground">{waterPct.toFixed(0)}%</span>
                              </div>
                              <Progress
                                value={waterPct}
                                className="h-1.5"
                                indicatorClassName={isOverDanger ? 'bg-red-500' : isOverAlert ? 'bg-orange-500' : 'bg-emerald-500'}
                              />
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">{t('floodZones.noWaterData')}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-0.5 text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-yellow-500" />
                              {t('floodZones.alertThreshold')}: {alertThreshold ?? '—'}m
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-red-500" />
                              {t('floodZones.dangerThreshold')}: {dangerThreshold ?? '—'}m
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {zone.district?.name ?? '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Select
                              value={zone.status}
                              onValueChange={val => val && handleUpdateStatus(zone.id, val)}
                            >
                              <SelectTrigger className="h-7 w-[90px] text-[10px] font-bold border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monitoring">{tEnum('floodZoneStatus.monitoring')}</SelectItem>
                                <SelectItem value="alert">{tEnum('floodZoneStatus.alert')}</SelectItem>
                                <SelectItem value="danger">{tEnum('floodZoneStatus.danger')}</SelectItem>
                                <SelectItem value="flooded">{tEnum('floodZoneStatus.flooded')}</SelectItem>
                                <SelectItem value="recovering">{tEnum('floodZoneStatus.recovering')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-blue-500 hover:bg-blue-50"
                              onClick={() => openEdit(zone)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={v => { if (!v) setIsCreateOpen(false); }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? t('floodZones.editTitle', { name: editTarget.name }) : t('floodZones.createTitle')}
            </DialogTitle>
            <DialogDescription>
              {editTarget ? t('floodZones.editDesc') : t('floodZones.createDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('floodZones.fieldName')}</Label>
                <Input
                  placeholder={t('floodZones.fieldNamePlaceholder')}
                  value={form.name}
                  onChange={e => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    setForm(f => ({ ...f, name, slug: f.slug || slug }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('floodZones.fieldSlug')}</Label>
                <Input
                  placeholder={t('floodZones.fieldSlugPlaceholder')}
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('floodZones.fieldRisk')}</Label>
                <Select value={form.risk_level} onValueChange={v => setForm(f => ({ ...f, risk_level: v ?? '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('floodZones.riskLow')}</SelectItem>
                    <SelectItem value="medium">{t('floodZones.riskMedium')}</SelectItem>
                    <SelectItem value="high">{t('floodZones.riskHigh')}</SelectItem>
                    <SelectItem value="critical">{t('floodZones.riskCritical')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('floodZones.fieldColor')}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="flex-1 font-mono text-sm"
                    placeholder="#f79009"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('floodZones.fieldAlertThreshold')}</Label>
                <div className="relative">
                  <AlertTriangle className="absolute left-3 top-2.5 w-4 h-4 text-yellow-500" />
                  <Input
                    type="number" step="0.1" min="0"
                    className="pl-9"
                    value={form.alert_threshold_m}
                    onChange={e => setForm(f => ({ ...f, alert_threshold_m: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('floodZones.fieldDangerThreshold')}</Label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-2.5 w-4 h-4 text-red-500" />
                  <Input
                    type="number" step="0.1" min="0"
                    className="pl-9"
                    value={form.danger_threshold_m}
                    onChange={e => setForm(f => ({ ...f, danger_threshold_m: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('floodZones.fieldDesc')}</Label>
              <Textarea
                placeholder={t('floodZones.fieldDescPlaceholder')}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="min-h-[70px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t('actions.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              {editTarget ? t('actions.update') : t('floodZones.createZoneBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
