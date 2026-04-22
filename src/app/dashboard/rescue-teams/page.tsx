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
import { RefreshCw, Search, ShieldAlert, Phone, Users, Navigation } from 'lucide-react';

interface RescueTeam {
  id: number; name: string; code: string;
  team_type: string; specializations?: string[];
  vehicle_count: number; personnel_count: number;
  phone?: string; status: string;
  district?: { id: number; name: string };
}

const STA: Record<string, { cls: string; label: string }> = {
  available:   { cls: 'bg-emerald-500 text-white', label: 'Sẵn sàng' },
  on_mission:  { cls: 'bg-orange-500 text-white animate-pulse', label: 'Đang làm nhiệm vụ' },
  resting:     { cls: 'bg-yellow-100 text-yellow-600', label: 'Đang nghỉ' },
  offline:     { cls: 'text-gray-400', label: 'Ngoại tuyến' },
};

const TYPE_LABEL: Record<string, string> = {
  medical: 'Y Tế', fire: 'PCCC', military: 'Quân Đội',
  volunteer: 'Tình Nguyện', special: 'Đặc Nhiệm',
};

export default function RescueTeamsPage() {
  const { data: teams, meta, loading, setFilter, setPage, refresh } = useTable<RescueTeam>({
    endpoint: '/rescue-teams', perPage: 20,
  });

  const availableCount = teams.filter(t => t.status === 'available').length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Đội cứu hộ</h1>
          <p className="text-muted-foreground mt-1">Giám sát và phân công các lực lượng ứng phó khẩn cấp</p>
        </div>
        <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tên đội hoặc mã bộ đàm..." className="pl-9 h-9 bg-muted/50"
                onChange={e => setFilter('search', e.target.value)} />
            </div>
            <Select onValueChange={v => setFilter('status', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="available">Sẵn sàng</SelectItem>
                <SelectItem value="on_mission">Đang làm nhiệm vụ</SelectItem>
                <SelectItem value="resting">Đang nghỉ</SelectItem>
                <SelectItem value="offline">Ngoại tuyến</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={v => setFilter('team_type', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Loại đội" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="medical">Y Tế</SelectItem>
                <SelectItem value="fire">PCCC</SelectItem>
                <SelectItem value="military">Quân Đội</SelectItem>
                <SelectItem value="volunteer">Tình Nguyện</SelectItem>
                <SelectItem value="special">Đặc Nhiệm</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 whitespace-nowrap">
              <ShieldAlert size={14} /> {availableCount} sẵn sàng
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">Mã đội</TableHead>
                <TableHead>Tên đơn vị</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Lực lượng</TableHead>
                <TableHead>Chuyên môn</TableHead>
                <TableHead>Liên lạc</TableHead>
                <TableHead className="text-right">Khu vực</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="h-32 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : teams.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">Không có đội cứu hộ nào</TableCell></TableRow>
              ) : teams.map(team => {
                const sc = STA[team.status];
                return (
                  <TableRow key={team.id} className="hover:bg-muted/30">
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{team.code}</Badge></TableCell>
                    <TableCell className="font-semibold">{team.name}</TableCell>
                    <TableCell><Badge variant="outline" className={sc?.cls}>{sc?.label ?? team.status}</Badge></TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{TYPE_LABEL[team.team_type] ?? team.team_type}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Users size={13} /> {team.personnel_count}
                        <span className="text-muted-foreground text-xs">({team.vehicle_count} xe)</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(team.specializations ?? []).slice(0, 2).map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0">{s}</Badge>
                        ))}
                        {(team.specializations?.length ?? 0) > 2 && <span className="text-xs text-muted-foreground">+{team.specializations!.length - 2}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {team.phone
                        ? <div className="flex items-center gap-1 text-sm"><Phone size={12} className="text-muted-foreground" />{team.phone}</div>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {team.district?.name
                        ? <span className="flex items-center justify-end gap-1"><Navigation size={11} />{team.district.name}</span>
                        : '—'}
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
