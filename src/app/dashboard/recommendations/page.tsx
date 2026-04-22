'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  RefreshCw, BrainCircuit, CheckCircle2, XCircle, Clock,
  Navigation, Megaphone, ShieldAlert, RotateCcw, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Recommendation {
  id: number;
  type: string;
  type_label?: string;
  description: string;
  details?: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  status_label?: string;
  prediction?: { id: number } | null;
  incident?: { id: number; title: string } | null;
  created_at: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  priority_route: <Navigation className="w-4 h-4 text-purple-500" />,
  alert: <Megaphone className="w-4 h-4 text-red-500" />,
  evacuation: <ShieldAlert className="w-4 h-4 text-orange-500" />,
  reroute: <RotateCcw className="w-4 h-4 text-blue-500" />,
};

export default function RecommendationsPage() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<Recommendation | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recommendations');
      if (res.data?.success) setItems(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/recommendations/${id}/approve`);
      fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectTarget || !rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/recommendations/${rejectTarget.id}/reject`, { reason: rejectReason });
      setRejectTarget(null);
      setRejectReason('');
      fetchItems();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="text-orange-500 border-orange-200 animate-pulse">Chờ duyệt</Badge>;
      case 'approved': return <Badge className="bg-emerald-500">Đã duyệt</Badge>;
      case 'rejected': return <Badge variant="destructive">Từ chối</Badge>;
      case 'executed': return <Badge className="bg-blue-500">Đã thực thi</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const filtered = items.filter(i =>
    !search || i.description.toLowerCase().includes(search.toLowerCase()) || i.type.includes(search)
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BrainCircuit className="text-primary" size={28} />
            Đề xuất AI
          </h1>
          <p className="text-muted-foreground mt-1">
            Human-in-the-loop — AI đề xuất, operator phê duyệt trước khi thực thi
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge variant="destructive" className="animate-pulse text-sm px-3 py-1">
              {pendingCount} chờ duyệt
            </Badge>
          )}
          <Button variant="outline" size="icon" onClick={fetchItems} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Chờ duyệt', value: items.filter(i => i.status === 'pending').length, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Đã duyệt', value: items.filter(i => i.status === 'approved').length, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Đã thực thi', value: items.filter(i => i.status === 'executed').length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Từ chối', value: items.filter(i => i.status === 'rejected').length, color: 'text-red-500', bg: 'bg-red-500/10' },
        ].map((s, i) => (
          <Card key={i} className="border-border shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <BrainCircuit className={`w-5 h-5 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm đề xuất..."
              className="pl-9 h-9 bg-muted/50"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[60px]">ID</TableHead>
                  <TableHead className="w-[140px]">Loại</TableHead>
                  <TableHead>Nội dung đề xuất</TableHead>
                  <TableHead>Liên kết</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thời gian</TableHead>
                  <TableHead className="w-[160px] text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Đang tải đề xuất từ AI...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      Chưa có đề xuất nào từ AI.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="text-muted-foreground font-mono text-xs">#{item.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {TYPE_ICONS[item.type] ?? <BrainCircuit className="w-4 h-4 text-muted-foreground" />}
                          <span className="text-xs font-semibold">{item.type_label || item.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium leading-snug max-w-xs">{item.description}</p>
                        {item.details?.action && (
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            action: {item.details.action}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                          {item.prediction && (
                            <span className="font-mono">Prediction #{item.prediction.id}</span>
                          )}
                          {item.incident && (
                            <span className="truncate max-w-[120px]" title={item.incident.title}>
                              {item.incident.title}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(item.created_at).toLocaleString('vi-VN', {
                          hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        {item.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              className="h-8 gap-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                              onClick={() => handleApprove(item.id)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() => setRejectTarget(item)}
                            >
                              <XCircle className="w-3.5 h-3.5" /> Từ chối
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <span className="text-xs text-muted-foreground italic">—</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={() => { setRejectTarget(null); setRejectReason(''); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Từ chối đề xuất #{rejectTarget?.id}</DialogTitle>
            <DialogDescription>
              Nhập lý do để AI học và cải thiện đề xuất trong tương lai.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              {rejectTarget?.description}
            </div>
            <div className="space-y-2">
              <Label>Lý do từ chối *</Label>
              <Textarea
                placeholder="VD: Tuyến đường này đang bị phong tỏa do sự cố khác..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>Hủy</Button>
            <Button variant="destructive" onClick={handleRejectSubmit} disabled={submitting}>
              {submitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
