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

  useEffect(() => {
    fetchAlerts();
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
           <Button className="gap-2 focus:ring-2">
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
    </div>
  );
}
