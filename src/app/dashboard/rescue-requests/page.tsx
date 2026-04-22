'use client';

import * as React from 'react';
import { useState } from 'react';
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
import { RefreshCw, Search, HeartPulse, Clock, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';

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

const URGENCY_BADGE: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-blue-500',
};
const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  pending:     { cls: 'border-orange-200 text-orange-500', label: 'Đang chờ' },
  assigned:    { cls: 'bg-indigo-500 text-white', label: 'Đã phân công' },
  in_progress: { cls: 'bg-blue-500 text-white', label: 'Đang cứu hộ' },
  completed:   { cls: 'bg-emerald-500 text-white', label: 'Hoàn thành' },
  cancelled:   { cls: 'text-gray-400', label: 'Đã hủy' },
};

export default function RescueRequestsPage() {
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
    return () => { window.removeEventListener('aegis:rescue_request:created', h); window.removeEventListener('aegis:rescue_request:updated', h); };
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

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yêu cầu cứu trợ</h1>
          <p className="text-muted-foreground mt-1">Quản lý và điều phối các yêu cầu cứu trợ khẩn cấp</p>
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
              <Input placeholder="Tìm địa chỉ, tên..." className="pl-9 h-9 bg-muted/50"
                onChange={e => setFilter('search', e.target.value)} />
            </div>
            <Select onValueChange={v => setFilter('status', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Đang chờ</SelectItem>
                <SelectItem value="assigned">Đã phân công</SelectItem>
                <SelectItem value="in_progress">Đang cứu hộ</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={v => setFilter('urgency', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Mức độ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="critical">Khẩn cấp</SelectItem>
                <SelectItem value="high">Cao</SelectItem>
                <SelectItem value="medium">Trung bình</SelectItem>
                <SelectItem value="low">Thấp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[90px]">ID</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Mức độ</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Số người</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead>Điểm AI</TableHead>
                  <TableHead className="text-right">Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="h-32 text-center">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" />
                  </TableCell></TableRow>
                ) : requests.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
                ) : requests.map(req => {
                  const sc = STATUS_BADGE[req.status];
                  return (
                    <TableRow key={req.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openAction(req)}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{String(req.id).padStart(4, '0')}
                        {req.request_number && <div className="text-[10px]">{req.request_number}</div>}
                      </TableCell>
                      <TableCell><Badge variant="outline" className={sc?.cls}>{sc?.label ?? req.status}</Badge></TableCell>
                      <TableCell><Badge className={`${URGENCY_BADGE[req.urgency]} text-white`}>{req.urgency_label ?? req.urgency}</Badge></TableCell>
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

      {/* Action dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Xử lý yêu cầu #{selected?.id}</DialogTitle>
            <DialogDescription>Cập nhật trạng thái hoặc phân công đội cứu hộ</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
              <p><span className="font-semibold">Người gọi:</span> {selected?.caller_name} — {selected?.caller_phone}</p>
              <p><span className="font-semibold">Địa chỉ:</span> {selected?.address ?? '—'}</p>
              {selected?.priority_score != null && <p><span className="font-semibold">Điểm AI:</span> <span className="font-mono text-primary">{Number(selected.priority_score).toFixed(1)}/100</span></p>}
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select value={updateStatus} onValueChange={v => setUpdateStatus(v ?? '')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Đang chờ</SelectItem>
                  <SelectItem value="assigned">Đã phân công</SelectItem>
                  <SelectItem value="in_progress">Đang cứu hộ</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {['assigned', 'in_progress'].includes(updateStatus) && (
              <div className="space-y-1.5">
                <Label>Phân công đội</Label>
                <Select value={updateTeam} onValueChange={v => setUpdateTeam(v ?? 'none')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Giữ nguyên —</SelectItem>
                    {teams.filter(t => t.status === 'available').map(t => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Đóng</Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
