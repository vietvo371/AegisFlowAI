'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Search, ShieldAlert, Navigation, Phone, Users, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface RescueTeam {
  id: number;
  name: string;
  code: string;
  team_type: 'medical' | 'fire' | 'military' | 'volunteer' | 'special';
  specializations: string[];
  vehicle_count: number;
  personnel_count: number;
  phone: string;
  status: 'available' | 'on_mission' | 'resting' | 'offline';
  district?: { id: number; name: string };
  heading_to_incident?: { id: number; title: string };
  last_location_update?: string;
}

export default function RescueTeamsPage() {
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rescue-teams');
      if (res.data?.success) {
        setTeams(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch rescue teams', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return <Badge className="bg-emerald-500">Sẵn sàng</Badge>;
      case 'on_mission': return <Badge className="bg-orange-500 animate-pulse">Đang làm nhiệm vụ</Badge>;
      case 'resting': return <Badge variant="secondary" className="text-yellow-600 bg-yellow-100">Đang nghỉ</Badge>;
      case 'offline': return <Badge variant="outline" className="text-gray-400">Ngoại tuyến</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'medical': return 'Y Tế';
      case 'fire': return 'PCCC';
      case 'military': return 'Quân Đội';
      case 'volunteer': return 'Tình Nguyện';
      case 'special': return 'Đặc Nhiệm';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Đội Cứu Hộ</h1>
          <p className="text-muted-foreground mt-1">Giám sát và phân công các lực lượng ứng phó khẩn cấp</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="icon" onClick={fetchTeams} disabled={loading}>
             <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
           </Button>
           <Button className="gap-2">
             <Plus className="w-4 h-4" /> Thêm đơn vị
           </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Tên đội hoặc mã bộ đàm..." className="pl-9 h-9 w-full bg-muted/50" />
             </div>
             <div className="flex items-center gap-2">
               <ShieldAlert className="w-4 h-4 text-orange-500" />
               <span className="text-sm font-medium">{teams.filter(t => t.status === 'available').length} đơn vị sẵn sàng</span>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Mã Đội</TableHead>
                  <TableHead>Tên Đơn Vị</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Phân loai</TableHead>
                  <TableHead>Lực lượng</TableHead>
                  <TableHead>Chuyên môn</TableHead>
                  <TableHead>Liên lạc</TableHead>
                  <TableHead className="text-right">Khu vực</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-primary" />
                        Đang rà soát lực lượng...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : teams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      Không có đội cứu hộ nào trên hệ thống.
                    </TableCell>
                  </TableRow>
                ) : (
                  teams.map((team) => (
                    <TableRow key={team.id} className="hover:bg-muted/30 cursor-pointer">
                      <TableCell className="font-medium">
                         <Badge variant="outline" className="font-mono bg-muted/60">{team.code}</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{team.name}</TableCell>
                      <TableCell>{getStatusBadge(team.status)}</TableCell>
                      <TableCell>{getTypeLabel(team.team_type)}</TableCell>
                      <TableCell>
                         <div className="flex items-center text-sm">
                           <Users className="w-3 h-3 mr-1" /> {team.personnel_count}
                           <span className="text-muted-foreground ml-2">({team.vehicle_count} xe)</span>
                         </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(team.specializations || []).slice(0, 2).map((s, i) => (
                             <Badge key={i} variant="secondary" className="text-[10px] uppercase font-semibold px-1 py-0">{s}</Badge>
                          ))}
                          {(team.specializations?.length || 0) > 2 && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">+{team.specializations.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-medium text-sm">
                          <Phone className="w-3 h-3 text-muted-foreground" /> {team.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm flex justify-end items-center">
                        {team.district?.name ? (
                           <><Navigation className="w-3 h-3 mr-1 inline" /> {team.district.name}</>
                        ) : 'Chưa cập nhật'}
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
