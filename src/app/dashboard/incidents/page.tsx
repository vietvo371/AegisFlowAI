'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MapPin, Search, Filter, Plus, RefreshCw, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Incident {
  id: number;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'confirmed' | 'resolved' | 'false_alarm';
  location: { lat: number; lng: number };
  address?: string;
  created_at: string;
}

export default function IncidentsPage() {
  const t = useTranslations();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/incidents');
      if (res.data?.success) {
        setIncidents(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch incidents', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Nguy cấp</Badge>;
      case 'high': return <Badge className="bg-orange-500 hover:bg-orange-600">Nghiêm trọng</Badge>;
      case 'medium': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Trung bình</Badge>;
      case 'low': return <Badge className="bg-blue-500 hover:bg-blue-600">Thấp</Badge>;
      default: return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reported': return <Badge variant="outline" className="text-muted-foreground">Mới báo cáo</Badge>;
      case 'investigating': return <Badge variant="secondary" className="text-blue-500 border-blue-200">Đang kiểm tra</Badge>;
      case 'confirmed': return <Badge className="bg-emerald-500">Đã xác nhận</Badge>;
      case 'resolved': return <Badge className="bg-gray-500">Đã giải quyết</Badge>;
      case 'false_alarm': return <Badge variant="outline" className="text-red-500 line-through">Báo giả</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sự cố hiện tại (Incidents)</h1>
          <p className="text-muted-foreground mt-1">Quản lý và cập nhật thông tin các sự cố khẩn cấp trên địa bàn</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchIncidents} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Báo cáo sự cố
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Tìm kiếm tên sự cố..." className="pl-9 h-9 w-full bg-muted/50" />
             </div>
             <Button variant="outline" size="sm" className="h-9 gap-2">
               <Filter className="w-4 h-4" /> Bộ lọc
             </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Tên sự cố</TableHead>
                  <TableHead>Mức độ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead className="text-right">Ngày phân tích</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-primary" />
                        Đang tải dữ liệu...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : incidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      Không tìm thấy dữ liệu sự cố nào
                    </TableCell>
                  </TableRow>
                ) : (
                  incidents.map((incident) => (
                    <TableRow key={incident.id} className="hover:bg-muted/30 cursor-pointer">
                      <TableCell className="font-medium text-muted-foreground">#{(incident.id).toString().padStart(4, '0')}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{incident.title}</div>
                      </TableCell>
                      <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                      <TableCell>{getStatusBadge(incident.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3 mr-1 inline" />
                          <span className="truncate max-w-[200px]">{incident.address || `${incident.location.lat.toFixed(4)}, ${incident.location.lng.toFixed(4)}`}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {new Date(incident.created_at).toLocaleDateString('vi-VN', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                           <Eye className="h-4 w-4" />
                         </Button>
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
