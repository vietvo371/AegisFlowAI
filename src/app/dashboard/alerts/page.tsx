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

const SEV: Record<string, string> = { critical: 'bg-red-500 animate-pulse', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-blue-500' };
const STA: Record<string, { cls: string; label: string }> = {
  active:   { cls: 'bg-red-500 text-white', label: 'Hiệu lực' },
  updated:  { cls: 'bg-orange-500 text-white', label: 'Đã cập nhật' },
  resolved: { cls: 'bg-emerald-500 text-white', label: 'Đã giải quyết' },
  expired:  { cls: 'text-gray-400', label: 'Hết hạn' },
  draft:    { cls: 'text-muted-foreground', label: 'Nháp' },
};
const TYPE_LABEL: Record<string, string> = {
  flood: 'Lũ lụt', storm: 'Bão', landslide: 'Sạt lở',
  evacuation: 'Sơ tán', system: 'Hệ thống',
  weather: 'Thời tiết', flood_risk: 'Nguy cơ ngập',
  power_outage: 'Mất điện', traffic: 'Giao thông',
};

export default function AlertsPage() {
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
    if (!form.title || !form.description) { toast.error('Vui lòng nhập tiêu đề và nội dung'); return; }
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

  const activeCount = alerts.filter(a => a.status === 'active').length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cảnh báo cộng đồng</h1>
          <p className="text-muted-foreground mt-1">Quản lý và ban hành cảnh báo thiên tai</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Megaphone size={16} /> Ban hành cảnh báo
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm tiêu đề cảnh báo..." className="pl-9 h-9 bg-muted/50"
                onChange={e => setFilter('search', e.target.value)} />
            </div>
            <Select onValueChange={v => setFilter('status', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang hiệu lực</SelectItem>
                <SelectItem value="resolved">Đã giải quyết</SelectItem>
                <SelectItem value="expired">Hết hạn</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={v => setFilter('severity', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Mức độ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="critical">Đặc biệt nguy hiểm</SelectItem>
                <SelectItem value="high">Nghiêm trọng</SelectItem>
                <SelectItem value="medium">Cảnh báo</SelectItem>
                <SelectItem value="low">Lưu ý</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={v => setFilter('alert_type', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Loại" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="flood">Lũ lụt</SelectItem>
                <SelectItem value="storm">Bão</SelectItem>
                <SelectItem value="landslide">Sạt lở</SelectItem>
                <SelectItem value="evacuation">Sơ tán</SelectItem>
              </SelectContent>
            </Select>
            {activeCount > 0 && <span className="text-sm font-medium text-red-500 whitespace-nowrap">{activeCount} đang hiệu lực</span>}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[110px]">Mã CB</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Mức độ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hiệu lực</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : alerts.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Không có cảnh báo nào</TableCell></TableRow>
              ) : alerts.map(a => {
                const sc = STA[a.status];
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
                    <TableCell><span className="text-xs text-muted-foreground">{TYPE_LABEL[a.alert_type] ?? a.alert_type}</span></TableCell>
                    <TableCell><Badge className={`${SEV[a.severity]} text-white`}>{a.severity}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={sc?.cls}>{sc?.label ?? a.status}</Badge></TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      <div className="flex items-center justify-end gap-1">
                        <Calendar size={11} />
                        {new Date(a.effective_from).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </div>
                      {!a.effective_until && <div className="text-[10px] text-red-400">Vô thời hạn</div>}
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
            <DialogTitle>Ban hành cảnh báo cộng đồng</DialogTitle>
            <DialogDescription>Thông báo tức thì đến toàn bộ người dùng và đơn vị tiếp nhận</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="space-y-1.5"><Label>Tiêu đề *</Label>
              <Input placeholder="VD: Sơ tán khẩn cấp vùng ngập lụt" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Loại *</Label>
                <Select value={form.alert_type} onValueChange={v => setForm(f => ({ ...f, alert_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flood">Lũ lụt</SelectItem>
                    <SelectItem value="storm">Bão</SelectItem>
                    <SelectItem value="landslide">Sạt lở</SelectItem>
                    <SelectItem value="evacuation">Sơ tán</SelectItem>
                    <SelectItem value="system">Hệ thống</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Mức độ *</Label>
                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Lưu ý</SelectItem>
                    <SelectItem value="medium">Cảnh báo</SelectItem>
                    <SelectItem value="high">Nghiêm trọng</SelectItem>
                    <SelectItem value="critical">Đặc biệt nguy hiểm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Thời điểm hiệu lực</Label>
                <Input type="datetime-local" value={form.effective_from} onChange={e => setForm(f => ({ ...f, effective_from: e.target.value }))} />
              </div>
              <div className="space-y-1.5"><Label>Hết hạn (tùy chọn)</Label>
                <Input type="datetime-local" value={form.effective_until} onChange={e => setForm(f => ({ ...f, effective_until: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5"><Label>Nội dung *</Label>
              <Textarea placeholder="Hướng dẫn an toàn cho người dân..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="min-h-[80px] resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleCreate} disabled={submitting}>
              {submitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              <Megaphone size={14} className="mr-2" /> Phát lệnh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
