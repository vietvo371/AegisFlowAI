'use client';

import * as React from 'react';
import { useTable } from '@/lib/use-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { DataPagination } from '@/components/ui/data-pagination';
import { RefreshCw, Search, Home, MapPin, Users } from 'lucide-react';

interface Shelter {
  id: number; name: string; code: string;
  status: string; capacity: number; current_occupancy: number;
  available_beds?: number; occupancy_percent?: number;
  facilities?: string[]; address?: string;
  contact_phone?: string; is_flood_safe: boolean;
  district?: { id: number; name: string };
}

const STA: Record<string, { cls: string; label: string }> = {
  open:        { cls: 'bg-emerald-500 text-white', label: 'Mở cửa' },
  full:        { cls: 'bg-red-500 text-white', label: 'Đã đầy' },
  maintenance: { cls: 'bg-orange-500 text-white', label: 'Bảo trì' },
  closed:      { cls: 'text-gray-400 line-through', label: 'Đóng cửa' },
};

export default function SheltersPage() {
  const { data: shelters, meta, loading, setFilter, setPage, refresh } = useTable<Shelter>({
    endpoint: '/shelters', perPage: 20,
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Điểm tị nạn</h1>
          <p className="text-muted-foreground mt-1">Giám sát sức chứa các trạm cư trú an toàn</p>
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
              <Input placeholder="Tên hoặc địa chỉ..." className="pl-9 h-9 bg-muted/50"
                onChange={e => setFilter('search', e.target.value)} />
            </div>
            <Select onValueChange={v => setFilter('status', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="open">Mở cửa</SelectItem>
                <SelectItem value="full">Đã đầy</SelectItem>
                <SelectItem value="maintenance">Bảo trì</SelectItem>
                <SelectItem value="closed">Đóng cửa</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={v => setFilter('available_only', v === '1' ? '1' : '')}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Còn chỗ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Tất cả</SelectItem>
                <SelectItem value="1">Còn chỗ trống</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[80px]">Mã</TableHead>
                <TableHead>Điểm tị nạn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[180px]">Sức chứa</TableHead>
                <TableHead>An toàn</TableHead>
                <TableHead>Cơ sở vật chất</TableHead>
                <TableHead className="text-right">Khu vực</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : shelters.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Không có điểm tị nạn nào</TableCell></TableRow>
              ) : shelters.map(s => {
                const sc = STA[s.status];
                const pct = s.occupancy_percent ?? (s.capacity > 0 ? Math.round((s.current_occupancy / s.capacity) * 100) : 0);
                const available = s.available_beds ?? Math.max(0, s.capacity - s.current_occupancy);
                const barColor = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-orange-500' : 'bg-emerald-500';
                return (
                  <TableRow key={s.id} className="hover:bg-muted/30">
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{s.code}</Badge></TableCell>
                    <TableCell>
                      <p className="font-semibold text-sm">{s.name}</p>
                      {s.address && <div className="flex items-center text-xs text-muted-foreground gap-1 mt-0.5"><MapPin size={10} /><span className="truncate max-w-[150px]">{s.address}</span></div>}
                    </TableCell>
                    <TableCell><Badge variant="outline" className={sc?.cls}>{sc?.label ?? s.status}</Badge></TableCell>
                    <TableCell>
                      <div className="space-y-1 w-[150px]">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="flex items-center gap-1"><Users size={11} />{s.current_occupancy}/{s.capacity}</span>
                          <span>{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-1.5" indicatorClassName={barColor} />
                        <p className="text-[10px] text-muted-foreground">{available} chỗ trống</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.is_flood_safe
                        ? <Badge variant="outline" className="text-blue-500 border-blue-200 text-xs">Cao ráo</Badge>
                        : <Badge variant="outline" className="text-orange-500 border-orange-200 text-xs">Nguy cơ ngập</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(s.facilities ?? []).slice(0, 2).map((f, i) => <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0">{f}</Badge>)}
                        {(s.facilities?.length ?? 0) > 2 && <span className="text-xs text-muted-foreground">+{s.facilities!.length - 2}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{s.district?.name ?? '—'}</TableCell>
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
