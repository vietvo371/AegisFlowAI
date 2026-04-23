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
import { RefreshCw, Search, Plus, MapPin, Eye } from 'lucide-react';
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

const SEV: Record<string, string> = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-blue-500' };
const STA: Record<string, { cls: string; label: string }> = {
  reported:      { cls: 'text-muted-foreground border-muted', label: 'Mới báo cáo' },
  investigating: { cls: 'text-blue-500 border-blue-200', label: 'Đang kiểm tra' },
  confirmed:     { cls: 'bg-emerald-500 text-white', label: 'Đã xác nhận' },
  resolved:      { cls: 'bg-gray-500 text-white', label: 'Đã giải quyết' },
  false_alarm:   { cls: 'text-red-400 line-through', label: 'Báo giả' },
};

export default function IncidentsPage() {
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
    if (!form.title || !form.lat || !form.lng) { toast.error('Vui lòng nhập tên và tọa độ'); return; }
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
          <h1 className="text-3xl font-bold tracking-tight">Sự cố</h1>
          <p className="text-muted-foreground mt-1">Quản lý và cập nhật các sự cố khẩn cấp</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} /> Báo cáo sự cố
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm tên sự cố..." className="pl-9 h-9 bg-muted/50"
                onChange={e => setFilter('search', e.target.value)} />
            </div>
            <Select onValueChange={v => setFilter('severity', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Mức độ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="critical">Nguy cấp</SelectItem>
                <SelectItem value="high">Nghiêm trọng</SelectItem>
                <SelectItem value="medium">Trung bình</SelectItem>
                <SelectItem value="low">Thấp</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={v => setFilter('status', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="reported">Mới báo cáo</SelectItem>
                <SelectItem value="investigating">Đang kiểm tra</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="resolved">Đã giải quyết</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={v => setFilter('type', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Loại" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="flood">Ngập lụt</SelectItem>
                <SelectItem value="heavy_rain">Mưa lớn</SelectItem>
                <SelectItem value="landslide">Sạt lở</SelectItem>
                <SelectItem value="dam_failure">Sự cố đập</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Tên sự cố</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Mức độ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Địa điểm</TableHead>
                <TableHead className="text-right">Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : incidents.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
              ) : incidents.map(inc => {
                const sc = STA[inc.status];
                return (
                  <TableRow key={inc.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs text-muted-foreground">#{String(inc.id).padStart(4, '0')}</TableCell>
                    <TableCell className="font-semibold">{inc.title}</TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{inc.type_label ?? inc.type}</span></TableCell>
                    <TableCell><Badge className={`${SEV[inc.severity]} text-white`}>{inc.severity_label ?? inc.severity}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={sc?.cls}>{sc?.label ?? inc.status}</Badge></TableCell>
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
            <DialogTitle>Báo cáo sự cố mới</DialogTitle>
            <DialogDescription>Tạo sự cố để các đội cứu hộ nhận thông báo</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="space-y-1.5"><Label>Tên sự cố *</Label>
              <Input placeholder="VD: Ngập nặng tại đường ABC" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Loại *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v ?? "" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flood">Ngập lụt</SelectItem>
                    <SelectItem value="heavy_rain">Mưa lớn</SelectItem>
                    <SelectItem value="landslide">Sạt lở</SelectItem>
                    <SelectItem value="dam_failure">Sự cố đập</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Mức độ *</Label>
                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v ?? "" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Thấp</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="high">Nghiêm trọng</SelectItem>
                    <SelectItem value="critical">Nguy cấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Địa chỉ</Label>
              <Input placeholder="Địa chỉ cụ thể" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Vĩ độ *</Label>
                <Input placeholder="16.0544" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
              </div>
              <div className="space-y-1.5"><Label>Kinh độ *</Label>
                <Input placeholder="108.2022" value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5"><Label>Mô tả</Label>
              <Textarea placeholder="Chi tiết tình huống..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="min-h-[70px] resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
