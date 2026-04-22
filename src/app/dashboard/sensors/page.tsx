'use client';

import * as React from 'react';
import { useTable } from '@/lib/use-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataPagination } from '@/components/ui/data-pagination';
import { RefreshCw, Search, Activity, Waves, CloudRain } from 'lucide-react';

interface Sensor {
  id: number; name: string; external_id: string;
  type: string; status: string; unit: string;
  last_value?: number; alert_threshold?: number; danger_threshold?: number;
  last_reading_at?: string;
  flood_zone?: { id: number; name: string };
  district?: { id: number; name: string };
}

const STA: Record<string, { cls: string; label: string }> = {
  online:      { cls: 'bg-emerald-500 text-white', label: 'Trực tuyến' },
  offline:     { cls: 'text-gray-400 line-through', label: 'Mất kết nối' },
  error:       { cls: 'bg-red-500 text-white', label: 'Lỗi' },
  maintenance: { cls: 'bg-yellow-500 text-white', label: 'Bảo trì' },
};

const TYPE_LABEL: Record<string, string> = {
  water_level: 'Mực nước', rainfall: 'Lượng mưa',
  camera: 'Camera AI', wind: 'Gió', temperature: 'Nhiệt độ',
  humidity: 'Độ ẩm', combined: 'Tổng hợp',
};

export default function SensorsPage() {
  const { data: sensors, meta, loading, setFilter, setPage, refresh } = useTable<Sensor>({
    endpoint: '/sensors', perPage: 20,
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cảm biến & IoT</h1>
          <p className="text-muted-foreground mt-1">Hệ thống quan trắc mực nước và thời tiết thời gian thực</p>
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
              <Input placeholder="Tên hoặc mã thiết bị..." className="pl-9 h-9 bg-muted/50"
                onChange={e => setFilter('search', e.target.value)} />
            </div>
            <Select onValueChange={v => setFilter('type', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Loại cảm biến" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="water_level">Mực nước</SelectItem>
                <SelectItem value="rainfall">Lượng mưa</SelectItem>
                <SelectItem value="camera">Camera AI</SelectItem>
                <SelectItem value="wind">Gió</SelectItem>
                <SelectItem value="temperature">Nhiệt độ</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={v => setFilter('status', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="online">Trực tuyến</SelectItem>
                <SelectItem value="offline">Mất kết nối</SelectItem>
                <SelectItem value="error">Lỗi</SelectItem>
                <SelectItem value="maintenance">Bảo trì</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[120px]">Device ID</TableHead>
                <TableHead>Tên thiết bị</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Giá trị đo</TableHead>
                <TableHead>Vùng ngập</TableHead>
                <TableHead className="text-right">Lần đọc cuối</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : sensors.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Chưa có thiết bị IoT nào</TableCell></TableRow>
              ) : sensors.map(s => {
                const sc = STA[s.status];
                const isAlert  = s.alert_threshold  != null && (s.last_value ?? 0) >= s.alert_threshold;
                const isDanger = s.danger_threshold != null && (s.last_value ?? 0) >= s.danger_threshold;
                return (
                  <TableRow key={s.id} className="hover:bg-muted/30">
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{s.external_id}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {s.type === 'water_level' ? <Waves size={15} className="text-blue-500" /> : <CloudRain size={15} className="text-cyan-500" />}
                        <div>
                          <p className="font-semibold text-sm">{s.name}</p>
                          {s.district && <p className="text-xs text-muted-foreground">{s.district.name}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{TYPE_LABEL[s.type] ?? s.type}</span></TableCell>
                    <TableCell><Badge variant="outline" className={sc?.cls}>{sc?.label ?? s.status}</Badge></TableCell>
                    <TableCell>
                      {s.last_value != null
                        ? <span className={`font-mono font-bold ${isDanger ? 'text-red-500' : isAlert ? 'text-orange-500' : 'text-foreground'}`}>
                            {s.last_value} <span className="text-xs font-normal text-muted-foreground">{s.unit}</span>
                          </span>
                        : <span className="text-muted-foreground text-xs italic">Không có dữ liệu</span>
                      }
                      {s.alert_threshold != null && <div className="text-[10px] text-muted-foreground">Ngưỡng: {s.alert_threshold} {s.unit}</div>}
                    </TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{s.flood_zone?.name ?? '—'}</span></TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {s.last_reading_at ? new Date(s.last_reading_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <DataPagination meta={meta} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
