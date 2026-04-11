'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Search, HeartPulse, Clock, Filter, Phone, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface RescueRequest {
  id: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
  people_count: number;
  vulnerable_groups: string[];
  notes: string;
  contact_phone: string;
  location: { lat: number; lng: number };
  address?: string;
  created_at: string;
}

export default function RescueRequestsPage() {
  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rescue-requests');
      if (res.data?.success) {
        setRequests(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch rescue requests', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <Badge variant="destructive" className="animate-pulse">Khẩn cấp</Badge>;
      case 'high': return <Badge className="bg-orange-500 hover:bg-orange-600">Cao</Badge>;
      case 'medium': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Trung bình</Badge>;
      case 'low': return <Badge className="bg-blue-500 hover:bg-blue-600">Thấp</Badge>;
      default: return <Badge variant="outline">{urgency}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="text-orange-500 border-orange-200">Đang chờ</Badge>;
      case 'assigned': return <Badge className="bg-indigo-500 text-white">Đã phân công</Badge>;
      case 'in_progress': return <Badge variant="secondary" className="text-blue-500 border-blue-200">Đang cứu hộ</Badge>;
      case 'resolved': return <Badge className="bg-emerald-500">Hoàn thành</Badge>;
      case 'cancelled': return <Badge variant="outline" className="text-gray-500 line-through">Đã hủy</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yêu cầu cứu trợ</h1>
          <p className="text-muted-foreground mt-1">Quản lý và điều phối các yêu cầu cứu trợ khẩn cấp từ người dân</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="icon" onClick={fetchRequests} disabled={loading}>
             <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
           </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Số điện thoại hoặc nội dung..." className="pl-9 h-9 w-full bg-muted/50" />
             </div>
             <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" className="h-9 gap-2">
                 <Filter className="w-4 h-4" /> Lọc
               </Button>
               <Button variant="default" size="sm" className="h-9 gap-2">
                 <HeartPulse className="w-4 h-4" /> Báo cáo mới
               </Button>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Mức độ</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Số người</TableHead>
                  <TableHead>Loại yếu thế</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead className="text-right">Thời gian tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-primary" />
                        Đang lấy danh sách yêu cầu...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      Không có yêu cầu cứu trợ nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-muted/30 cursor-pointer">
                      <TableCell className="font-medium text-muted-foreground">#{(req.id).toString().padStart(4, '0')}</TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell>{getUrgencyBadge(req.urgency)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-medium">
                          <Phone className="w-3 h-3 text-muted-foreground" /> {req.contact_phone || 'Không rõ'}
                        </div>
                      </TableCell>
                      <TableCell>{req.people_count}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {req.vulnerable_groups?.map((group, i) => (
                             <Badge key={i} variant="secondary" className="text-xs font-normal px-1 py-0">{group}</Badge>
                          )) || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3 mr-1 inline" />
                          <span className="truncate max-w-[150px]">{req.address || `${req.location?.lat?.toFixed(4)}, ${req.location?.lng?.toFixed(4)}`}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm whitespace-nowrap">
                        <Clock className="w-3 h-3 mr-1 inline" />
                        {new Date(req.created_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit', minute: '2-digit'
                        })}
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
