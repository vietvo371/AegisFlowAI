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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DataPagination } from '@/components/ui/data-pagination';
import { RefreshCw, Search, Clock, Phone, MapPin } from 'lucide-react';

interface RescueRequest {
  id: number; request_number?: string;
  urgency: string; urgency_label?: string;
  status: string; status_label?: string;
  people_count: number; vulnerable_groups: string[];
  description?: string; caller_name?: string; caller_phone?: string;
  priority_score?: number; water_level_m?: number;
  location?: { lat: number; lng: number }; address?: string;
  district?: { id: number; name: string };
  assigned_team?: { id: number; name: string; phone: string } | null;
  eta_minutes?: number; created_at: string;
}

const URGENCY_COLOR: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-blue-500',
};
const STATUS_CLS: Record<string, string> = {
  pending:     'border-orange-200 text-orange-500',
  assigned:    'bg-indigo-500 text-white',
  in_progress: 'bg-blue-500 text-white',
  completed:   'bg-emerald-500 text-white',
  cancelled:   'text-gray-400',
};

export default function RescueRequestsPage() {
  const t = useTranslations('dashboard');
  const tEnum = useTranslations('enums');

  const { data: requests, meta, loading, setFilter, setPage, refresh } = useTable<RescueRequest>({
    endpoint: '/rescue-requests', perPage: 20,
  });
  const [teams, setTeams] = React.useState<any[]>([]);
  const [selected, setSelected] = useState<RescueRequest | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateTeam, setUpdateTeam] = useState('none');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    api.get('/rescue-teams').then(r => setTeams(r.data?.data ?? []));
    const h = () => refresh();
    window.addEventListener('aegis:rescue_request:created', h);
    window.addEventListener('aegis:rescue_request:updated', h);
    return () => {
      window.removeEventListener('aegis:rescue_request:created', h);
      window.removeEventListener('aegis:rescue_request:updated', h);
    };
  }, [refresh]);

  const openAction = (req: RescueRequest) => {
    setSelected(req); setUpdateStatus(req.status);
    setUpdateTeam(req.assigned_team ? String(req.assigned_team.id) : 'none');
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      if (updateStatus !== selected.status)
        await api.put(`/rescue-requests/${selected.id}/status`, { status: updateStatus });
      if (updateTeam !== 'none' && (!selected.assigned_team || updateTeam !== String(selected.assigned_team.id)))
        await api.put(`/rescue-requests/${selected.id}/assign`, { team_id: parseInt(updateTeam) });
      setSelected(null); refresh();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const getStatusLabel = (status: string) => tEnum(`rescueStatus.${status}` as any, { defaultValue: status });
  const getUrgencyLabel = (urgency: string) => tEnum(`urgency.${urgency}` as any, { defaultValue: urgency });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('pages.rescueRequests')}</h1>
          <p className="text-muted-foreground mt-1">{t('rescueRequests.subtitle')}</p>
        </div>
        <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('rescueRequests.searchPlaceholder')} className="pl-9 h-9 bg-muted/50"
                onChange={e => setFilter('search', e.target.value)} />
            </div>
            <Select onValueChange={v => setFilter('status', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder={t('rescueRequests.statusPlaceholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('table.all')}</SelectItem>
                <SelectItem value="pending">{tEnum('rescueStatus.pending')}</SelectItem>
                <SelectItem value="assigned">{tEnum('rescueStatus.assigned')}</SelectItem>
                <SelectItem value="in_progress">{tEnum('rescueStatus.in_progress')}</SelectItem>
                <SelectItem value="completed">{tEnum('rescueStatus.completed')}</SelectItem>
                <SelectItem value="cancelled">{tEnum('rescueStatus.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={v => setFilter('urgency', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder={t('rescueRequests.urgencyPlaceholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('table.all')}</SelectItem>
                <SelectItem value="critical">{tEnum('urgency.critical')}</SelectItem>
                <SelectItem value="high">{tEnum('urgency.high')}</SelectItem>
                <SelectItem value="medium">{tEnum('urgency.medium')}</SelectItem>
                <SelectItem value="low">{tEnum('urgency.low')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[90px]">{t('rescueRequests.colId')}</TableHead>
                  <TableHead>{t('rescueRequests.colStatus')}</TableHead>
                  <TableHead>{t('rescueRequests.colUrgency')}</TableHead>
                  <TableHead>{t('rescueRequests.colContact')}</TableHead>
                  <TableHead>{t('rescueRequests.colPeople')}</TableHead>
                  <TableHead>{t('rescueRequests.colLocation')}</TableHead>
                  <TableHead>{t('rescueRequests.colAiScore')}</TableHead>
                  <TableHead className="text-right">{t('rescueRequests.colTime')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="h-32 text-center">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" />
                  </TableCell></TableRow>
                ) : requests.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">{t('table.noData')}</TableCell></TableRow>
                ) : requests.map(req => {
                  const staCls = STATUS_CLS[req.status];
                  return (
                    <TableRow key={req.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openAction(req)}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{String(req.id).padStart(4, '0')}
                        {req.request_number && <div className="text-[10px]">{req.request_number}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={staCls}>
                          {req.status_label ?? getStatusLabel(req.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${URGENCY_COLOR[req.urgency]} text-white`}>
                          {req.urgency_label ?? getUrgencyLabel(req.urgency)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{req.caller_name ?? '—'}</div>
                        {req.caller_phone && <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={10} />{req.caller_phone}</div>}
                      </TableCell>
                      <TableCell>{req.people_count}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                          <MapPin size={11} />
                          <span className="truncate max-w-[140px]">{req.address ?? `${req.location?.lat?.toFixed(4)}, ${req.location?.lng?.toFixed(4)}`}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {req.priority_score != null
                          ? <span className={`font-mono font-bold text-sm ${Number(req.priority_score) >= 80 ? 'text-red-500' : Number(req.priority_score) >= 60 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                              {Number(req.priority_score).toFixed(0)}
                            </span>
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        <Clock size={11} className="inline mr-1" />
                        {new Date(req.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <DataPagination meta={meta} onPageChange={setPage} />
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{t('rescueRequests.actionTitle', { id: selected?.id ?? 0 })}</DialogTitle>
            <DialogDescription>{t('rescueRequests.actionDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
              <p><span className="font-semibold">{t('rescueRequests.caller')}:</span> {selected?.caller_name} — {selected?.caller_phone}</p>
              <p><span className="font-semibold">{t('rescueRequests.address')}:</span> {selected?.address ?? '—'}</p>
              {selected?.priority_score != null && (
                <p><span className="font-semibold">{t('rescueRequests.aiScore')}:</span> <span className="font-mono text-primary">{Number(selected.priority_score).toFixed(1)}/100</span></p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t('rescueRequests.fieldStatus')}</Label>
              <Select value={updateStatus} onValueChange={v => setUpdateStatus(v ?? '')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{tEnum('rescueStatus.pending')}</SelectItem>
                  <SelectItem value="assigned">{tEnum('rescueStatus.assigned')}</SelectItem>
                  <SelectItem value="in_progress">{tEnum('rescueStatus.in_progress')}</SelectItem>
                  <SelectItem value="completed">{tEnum('rescueStatus.completed')}</SelectItem>
                  <SelectItem value="cancelled">{tEnum('rescueStatus.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {['assigned', 'in_progress'].includes(updateStatus) && (
              <div className="space-y-1.5">
                <Label>{t('rescueRequests.fieldTeam')}</Label>
                <Select value={updateTeam} onValueChange={v => setUpdateTeam(v ?? 'none')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('rescueRequests.keepTeam')}</SelectItem>
                    {teams.filter(t => t.status === 'available').map(team => (
                      <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>{t('actions.close')}</Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}{t('actions.update')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
