'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Search, Home, MapPin, Phone, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Shelter {
  id: number;
  name: string;
  code: string;
  status: 'open' | 'closed' | 'full' | 'maintenance';
  capacity: number;
  current_occupancy: number;
  facilities: string[];
  address: string;
  contact_phone?: string;
  is_flood_safe: boolean;
  district?: { id: number; name: string };
}

export default function SheltersPage() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShelters = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shelters');
      if (res.data?.success) {
        setShelters(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch shelters', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelters();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-emerald-500">Mở cửa</Badge>;
      case 'full': return <Badge className="bg-red-500">Đã Đầy</Badge>;
      case 'maintenance': return <Badge className="bg-orange-500">Bảo trì</Badge>;
      case 'closed': return <Badge variant="outline" className="text-gray-500 line-through">Đóng cửa</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOccupancyColor = (current: number, max: number) => {
    if (max === 0) return 'bg-gray-200';
    const percent = (current / max) * 100;
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 75) return 'bg-orange-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Điểm Tị Nạn</h1>
          <p className="text-muted-foreground mt-1">Giám sát và kiểm soát sức chứa các trạm cư trú an toàn</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="icon" onClick={fetchShelters} disabled={loading}>
             <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
           </Button>
           <Button className="gap-2">
             <Home className="w-4 h-4" /> Thêm điểm mới
           </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Tên hoặc địa chỉ điểm tị nạn..." className="pl-9 h-9 w-full bg-muted/50" />
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px]">Mã</TableHead>
                  <TableHead>Điểm Tị Nạn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[200px]">Sức chứa</TableHead>
                  <TableHead>An toàn</TableHead>
                  <TableHead>Cơ sở vật chất</TableHead>
                  <TableHead className="text-right">Khu vực</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-primary" />
                        Đang lấy thông tin các điểm tị nạn...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : shelters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      Không có điểm tị nạn nào được ghi nhận.
                    </TableCell>
                  </TableRow>
                ) : (
                  shelters.map((shelter) => {
                    const percent = shelter.capacity > 0 ? (shelter.current_occupancy / shelter.capacity) * 100 : 0;
                    return (
                      <TableRow key={shelter.id} className="hover:bg-muted/30 cursor-pointer">
                        <TableCell>
                           <Badge variant="outline" className="font-mono bg-transparent">{shelter.code}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground">{shelter.name}</div>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3 mr-1 inline" />
                            <span className="truncate max-w-[150px]">{shelter.address}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(shelter.status)}</TableCell>
                        <TableCell>
                           <div className="flex flex-col gap-1.5 w-[150px]">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="flex items-center text-muted-foreground"><Users className="w-3 h-3 mr-1" /> {shelter.current_occupancy} / {shelter.capacity}</span>
                                <span>{Math.round(percent)}%</span>
                              </div>
                              <Progress value={percent} className="h-2 w-full" indicatorClassName={getOccupancyColor(shelter.current_occupancy, shelter.capacity)} />
                           </div>
                        </TableCell>
                        <TableCell>
                          {shelter.is_flood_safe ? (
                            <Badge variant="outline" className="text-blue-500 border-blue-200">Cao ráo</Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-500 border-orange-200">Nguy cơ ngập</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                             {(shelter.facilities || []).slice(0, 2).map((fac, i) => (
                               <Badge key={i} variant="secondary" className="px-1.5 py-0 font-normal text-xs">{fac}</Badge>
                             ))}
                             {(shelter.facilities?.length || 0) > 2 && (
                                <span className="text-xs text-muted-foreground">+{shelter.facilities.length - 2}</span>
                             )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                           {shelter.district?.name || 'Chi tiết...'}
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
