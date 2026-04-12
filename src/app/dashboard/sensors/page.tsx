'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Search, Activity, Waves, CloudRain, Cpu as InputIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Sensor {
  id: number;
  name: string;
  external_id: string;
  type: 'water_level' | 'rainfall' | 'camera' | 'wind' | 'temperature' | 'humidity' | 'combined';
  status: 'online' | 'offline' | 'maintenance' | 'error';
  unit: string;
  last_value?: number;
  alert_threshold?: number;
  danger_threshold?: number;
  last_reading_at?: string;
}

export default function SensorsPage() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSensors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sensors');
      if (res.data?.success) {
        setSensors(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sensors', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensors();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return <Badge className="bg-emerald-500">Đang chạy</Badge>;
      case 'offline': return <Badge variant="outline" className="text-gray-500 line-through">Mất kết nối</Badge>;
      case 'error': return <Badge variant="destructive">Lỗi</Badge>;
      case 'maintenance': return <Badge className="bg-yellow-500">Bảo trì</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'water_level': return <Waves className="w-4 h-4 text-blue-500" />;
      case 'rainfall': return <CloudRain className="w-4 h-4 text-cyan-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeValue = (type: string) => {
    switch (type) {
      case 'water_level': return 'Mực Nước Lũ';
      case 'rainfall': return 'Lượng Mưa';
      case 'camera': return 'Camera AI';
      default: return type.replace('_', ' ').toUpperCase();
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cảm biến & IoT</h1>
          <p className="text-muted-foreground mt-1">Hệ thống quan trắc mực nước, đo lượng mưa và thời tiết thời gian thực</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="icon" onClick={fetchSensors} disabled={loading}>
             <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
           </Button>
           <Button className="gap-2 focus:ring-2">
             <InputIcon className="w-4 h-4" /> Kích hoạt thiết bị
           </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Mã ID hoặc Tên Cảm biến..." className="pl-9 h-9 w-full bg-muted/50" />
             </div>
             <div className="flex items-center gap-2">
               <span className="text-sm font-medium">{sensors.filter(s => s.status === 'online').length} thiết bị trực tuyến</span>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">Device ID</TableHead>
                  <TableHead>Tên Thiết Bị</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thông số đo</TableHead>
                  <TableHead className="text-right">Bản tin đọc cuối</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-primary" />
                        Đang quét trạm quan trắc...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sensors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      Hệ thống chưa kết nối thiết bị IoT nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  sensors.map((s) => {
                    const isAlert = s.alert_threshold && s.last_value && s.last_value >= s.alert_threshold;
                    const isDanger = s.danger_threshold && s.last_value && s.last_value >= s.danger_threshold;
                    
                    return (
                      <TableRow key={s.id} className="hover:bg-muted/30 cursor-pointer">
                        <TableCell>
                           <Badge variant="outline" className="font-mono bg-transparent text-muted-foreground">{s.external_id}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             {getTypeIcon(s.type)}
                             <div>
                               <div className="font-semibold text-foreground">{s.name}</div>
                               <div className="text-xs text-muted-foreground">{getTypeValue(s.type)}</div>
                             </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(s.status)}</TableCell>
                        <TableCell>
                           {s.last_value !== undefined && s.last_value !== null ? (
                              <div className={`font-mono font-bold text-lg ${isDanger ? 'text-red-500' : isAlert ? 'text-orange-500' : 'text-foreground'}`}>
                                {s.last_value} <span className="text-sm font-normal text-muted-foreground">{s.unit}</span>
                              </div>
                           ) : (
                              <span className="text-muted-foreground text-sm italic">Không có dữ liệu</span>
                           )}
                           {s.alert_threshold && (
                             <div className="text-[10px] text-muted-foreground mt-0.5">Ngưỡng: {s.alert_threshold} {s.unit}</div>
                           )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                           {s.last_reading_at ? new Date(s.last_reading_at).toLocaleString('vi-VN') : '-'}
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
    </div>
  );
}
