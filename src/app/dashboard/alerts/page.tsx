'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Search, Megaphone, MapPin, AlertCircle, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Alert {
  id: number;
  alert_number: string;
  title: string;
  description: string;
  alert_type: 'flood' | 'storm' | 'landslide' | 'evacuation' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'updated' | 'resolved' | 'expired';
  effective_from: string;
  effective_until?: string;
  source: string;
  affected_districts?: number[];
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    alert_type: 'flood',
    severity: 'medium',
    effective_from: '',
    effective_until: '',
    source: 'system'
  });

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/alerts');
      if (res.data?.success) {
        setAlerts(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch alerts', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Vui lòng nhập tiêu đề và nội dung cảnh báo');
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        alert_type: formData.alert_type,
        severity: formData.severity,
        status: 'active',
        source: formData.source
      };
      
      // If the user picked a date, format it properly or just pass it to the backend
      // Provide current date fallback if effective_from is empty
      payload.effective_from = formData.effective_from ? formData.effective_from : new Date().toISOString().slice(0,16);
      if (formData.effective_until) {
         payload.effective_until = formData.effective_until;
      }

      const res = await api.post('/alerts', payload);
      if (res.data?.success) {
        setIsCreateOpen(false);
        setFormData({ title: '', description: '', alert_type: 'flood', severity: 'medium', effective_from: '', effective_until: '', source: 'system' });
        fetchAlerts();
        toast.success("Ban hành cảnh báo thành công!");
      }
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra khi tạo cảnh báo');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    const handleNewAlert = () => {
      fetchAlerts();
    };
    
    window.addEventListener('aegis:alert:created', handleNewAlert);
    return () => window.removeEventListener('aegis:alert:created', handleNewAlert);
  }, []);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive" className="animate-pulse">Đặc biệt nghiêm trọng</Badge>;
      case 'high': return <Badge className="bg-orange-500 hover:bg-orange-600">Nghiêm trọng</Badge>;
      case 'medium': return <Badge className="bg-yellow-500 hover:bg-yellow-600 shadow-sm">Cảnh báo</Badge>;
      case 'low': return <Badge className="bg-blue-500 hover:bg-blue-600">Lưu ý</Badge>;
      default: return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-red-500">Đang hiệu lực</Badge>;
      case 'updated': return <Badge className="bg-orange-500">Đã cập nhật</Badge>;
      case 'resolved': return <Badge className="bg-emerald-500">Đã giải quyết</Badge>;
      case 'expired': return <Badge variant="outline" className="text-gray-400">Hết hạn</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
       case 'evacuation': return <Megaphone className="w-5 h-5 text-red-500" />;
       default: return <AlertCircle className="w-5 h-5 text-orange-500" />;
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cảnh Báo Cộng Đồng</h1>
          <p className="text-muted-foreground mt-1">Quản lý và ban hành các cảnh báo thiên tai, dời dân</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="icon" onClick={fetchAlerts} disabled={loading}>
             <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
           </Button>
           <Button className="gap-2 focus:ring-2" onClick={() => setIsCreateOpen(true)}>
             <Megaphone className="w-4 h-4" /> Ban hành cảnh báo
           </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Mã cảnh báo hoặc tiêu đề..." className="pl-9 h-9 w-full bg-muted/50" />
             </div>
             <div className="flex items-center gap-2">
               <span className="text-sm font-medium text-red-500">{alerts.filter(s => s.status === 'active').length} Lệnh Đang Có Hiệu Lực</span>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Mã CB</TableHead>
                  <TableHead className="w-[300px]">Nội dung & Hình thức</TableHead>
                  <TableHead>Mức độ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Nguồn</TableHead>
                  <TableHead className="text-right">Hiệu lệnh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-primary" />
                        Đang đọc dữ liệu thông cáo...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      Hiện tại bình yên. Không có cảnh báo nào tồn tại.
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.map((a) => (
                    <TableRow key={a.id} className="hover:bg-muted/30 cursor-pointer">
                      <TableCell>
                         <Badge variant="outline" className="font-mono bg-transparent border-dashed">{a.alert_number}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-3 items-start">
                           <div className="mt-1">{getIcon(a.alert_type)}</div>
                           <div>
                             <div className="font-semibold text-foreground line-clamp-1">{a.title}</div>
                             <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5" title={a.description}>{a.description}</div>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell>{getSeverityBadge(a.severity)}</TableCell>
                      <TableCell>{getStatusBadge(a.status)}</TableCell>
                      <TableCell>
                         <span className="text-sm font-medium text-muted-foreground">{a.source?.toUpperCase()}</span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        <div className="flex flex-col items-end gap-1">
                           <div className="flex items-center text-xs">
                             <Calendar className="w-3 h-3 mr-1 inline" /> Từ: {new Date(a.effective_from).toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' })}
                           </div>
                           {a.effective_until ? (
                             <div className="text-[10px] text-gray-400">Tới: {new Date(a.effective_until).toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' })}</div>
                           ) : (
                             <div className="text-[10px] text-red-400">Vô thời hạn</div>
                           )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Ban hành cảnh báo cộng đồng</DialogTitle>
            <DialogDescription>
              Tạo và thông báo lệnh cảnh báo lập tức (Push Notifications / Web Socket) tới toàn bộ App của người dân và các đơn vị tiếp nhận.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề cảnh báo</Label>
              <Input id="title" placeholder="VD: Sơ tán khẩn cấp vùng ngập lụt Thảo Điền" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phân loại (Type)</Label>
                <Select value={formData.alert_type} onValueChange={v => setFormData({ ...formData, alert_type: v })}>
                   <SelectTrigger>
                      <SelectValue placeholder="Chọn phân loại" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="flood">Lũ Lụt (Flood)</SelectItem>
                      <SelectItem value="storm">Bão / Gió lốc (Storm)</SelectItem>
                      <SelectItem value="landslide">Sạt lở (Landslide)</SelectItem>
                      <SelectItem value="evacuation">Lệnh Sơ tán (Evacuation)</SelectItem>
                      <SelectItem value="system">Thông báo Hệ thống</SelectItem>
                   </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mức độ nguy hiểm (Severity)</Label>
                <Select value={formData.severity} onValueChange={v => setFormData({ ...formData, severity: v })}>
                   <SelectTrigger>
                      <SelectValue placeholder="Chọn mức độ" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="low">Lưu ý (Low)</SelectItem>
                      <SelectItem value="medium">Cảnh báo (Medium)</SelectItem>
                      <SelectItem value="high">Nghiêm trọng (High)</SelectItem>
                      <SelectItem value="critical">Đặc biệt nghiêm trọng</SelectItem>
                   </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effective_from">Thời điểm hiệu lực</Label>
                <Input id="effective_from" type="datetime-local" value={formData.effective_from} onChange={e => setFormData({ ...formData, effective_from: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="effective_until">Thời điểm hết hạn (Tùy chọn)</Label>
                <Input id="effective_until" type="datetime-local" value={formData.effective_until} onChange={e => setFormData({ ...formData, effective_until: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Thông điệp cốt lõi (Message)</Label>
              <Textarea id="desc" className="h-24" placeholder="Viết các hướng dẫn an toàn, chú ý cho người dân trong vùng ảnh hưởng..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleCreateSubmit} disabled={submitting}>
               {submitting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Megaphone className="w-4 h-4 mr-2" />} Phát lệnh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
