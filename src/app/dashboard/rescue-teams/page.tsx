'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Shield, MapPin, Phone, Users, Truck, CheckCircle,
  XCircle, Search, Plus, Eye, Activity
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RescueTeam {
  id: number;
  name: string;
  code?: string;
  type?: string;
  team_type?: string;
  team_type_label?: string;
  status: 'available' | 'busy' | 'offline';
  members_count?: number;
  personnel_count?: number;
  vehicles_count?: number;
  vehicle_count?: number;
  current_location?: string;
  current_latitude?: number | string | null;
  current_longitude?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  location?: { lat?: number | string | null; lng?: number | string | null } | null;
  active_requests?: number;
  active_missions?: number;
  completed_requests?: number;
  phone?: string;
  rating?: number;
  district?: { id: number; name: string } | null;
  specializations?: string[];
  equipment?: string[];
  members?: Array<{ id: number; name?: string; role?: string; is_available?: boolean }>;
  last_location_update?: string;
}

export default function RescueTeamsPage() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [teams, setTeams] = React.useState<RescueTeam[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [selectedTeam, setSelectedTeam] = React.useState<RescueTeam | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const api = (await import('@/lib/api')).default;
        const params: any = {};
        if (statusFilter !== 'all') params.status = statusFilter;
        const res = await api.get('/rescue-teams', { params });
        setTeams(res.data?.data ?? []);
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [statusFilter]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available': return { color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', label: 'Sẵn sàng' };
      case 'busy': return { color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', label: 'Đang bận' };
      case 'offline': return { color: 'bg-gray-500', text: 'text-gray-500', bg: 'bg-gray-50', label: 'Offline' };
      default: return { color: 'bg-gray-500', text: 'text-gray-500', bg: 'bg-gray-50', label: status };
    }
  };

  const getTypeIcon = (type?: string) => {
    if (!type) return '🛡️';
    switch (type.toLowerCase()) {
      case 'fire': return '🚒';
      case 'medical': return '🚑';
      case 'flood': return '🚤';
      case 'search': return '🔍';
      default: return '🛡️';
    }
  };

  const getTeamType = (team: RescueTeam) => team.team_type_label || team.team_type || team.type || 'rescue';
  const getMemberCount = (team: RescueTeam) => team.personnel_count ?? team.members_count ?? team.members?.length ?? 0;
  const getVehicleCount = (team: RescueTeam) => team.vehicle_count ?? team.vehicles_count ?? 0;
  const getActiveCount = (team: RescueTeam) => team.active_missions ?? team.active_requests ?? 0;
  const getFallbackCoords = (team: RescueTeam) => {
    const key = `${team.code ?? ''} ${team.name ?? ''} ${team.district?.name ?? ''}`.toLowerCase();
    if (key.includes('liên chiểu') || key.includes('lien chieu') || key.includes('rescue-001')) return { lat: 16.0698, lng: 108.1467 };
    if (key.includes('cẩm lệ') || key.includes('cam le') || key.includes('rescue-002')) return { lat: 16.0089, lng: 108.1876 };
    if (key.includes('y tế') || key.includes('hai châu') || key.includes('hải châu') || key.includes('rescue-003')) return { lat: 16.0678, lng: 108.2208 };
    if (key.includes('hòa vang') || key.includes('hoà vang') || key.includes('hoa vang') || key.includes('rescue-004')) return { lat: 15.9801, lng: 108.1156 };
    if (key.includes('thanh khê') || key.includes('thanh khe') || key.includes('rescue-005')) return { lat: 16.0589, lng: 108.1934 };
    return null;
  };
  const getTeamLat = (team: RescueTeam) => {
    const value = team.location?.lat ?? team.current_latitude ?? team.latitude ?? getFallbackCoords(team)?.lat;
    const lat = value === null || value === undefined ? undefined : Number(value);
    return Number.isFinite(lat) ? lat : undefined;
  };
  const getTeamLng = (team: RescueTeam) => {
    const value = team.location?.lng ?? team.current_longitude ?? team.longitude ?? getFallbackCoords(team)?.lng;
    const lng = value === null || value === undefined ? undefined : Number(value);
    return Number.isFinite(lng) ? lng : undefined;
  };

  const handleAddTeam = () => {
    toast.info('Backend hiện chưa mở API tạo đội cứu hộ. Cần thêm route POST /rescue-teams trước.');
  };

  const handleViewDetail = async (team: RescueTeam) => {
    setSelectedTeam(team);
    setDetailLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.get(`/rescue-teams/${team.id}`);
      setSelectedTeam(res.data?.data ?? team);
    } catch {
      toast.error('Không tải được chi tiết đội cứu hộ');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleTrackTeam = (team: RescueTeam) => {
    const lat = getTeamLat(team);
    const lng = getTeamLng(team);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error('Đội này chưa có tọa độ GPS để theo dõi trên bản đồ');
      return;
    }

    const params = new URLSearchParams({
      teamId: String(team.id),
      teamName: team.name,
      lat: String(lat),
      lng: String(lng),
    });
    router.push(`/dashboard?${params.toString()}`);
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(search.toLowerCase()) ||
    team.current_location?.toLowerCase().includes(search.toLowerCase()) ||
    team.district?.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: teams.length,
    available: teams.filter(t => t.status === 'available').length,
    busy: teams.filter(t => t.status === 'busy').length,
    offline: teams.filter(t => t.status === 'offline').length,
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6 custom-scroll">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đội cứu hộ</h1>
          <p className="text-sm text-muted-foreground">Quản lý và giám sát các đội cứu hộ</p>
        </div>
        <Button className="gap-2" onClick={handleAddTeam}>
          <Plus size={16} />
          Thêm đội mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng đội', value: stats.total, icon: Shield, color: 'text-blue-600 bg-blue-100' },
          { label: 'Sẵn sàng', value: stats.available, icon: CheckCircle, color: 'text-green-600 bg-green-100' },
          { label: 'Đang bận', value: stats.busy, icon: Activity, color: 'text-orange-600 bg-orange-100' },
          { label: 'Offline', value: stats.offline, icon: XCircle, color: 'text-gray-600 bg-gray-100' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Tìm kiếm tên, vị trí..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Lọc trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="available">Sẵn sàng</SelectItem>
            <SelectItem value="busy">Đang bận</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Teams Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-40 bg-muted rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : filteredTeams.length > 0 ? (
          filteredTeams.map((team, i) => {
            const status = getStatusConfig(team.status);
            const teamType = getTeamType(team);
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
	                        <div className={`w-12 h-12 rounded-xl ${status.bg} flex items-center justify-center text-2xl`}>
	                          {getTypeIcon(team.team_type || team.type)}
	                        </div>
	                        <div>
	                          <h3 className="font-semibold">{team.name}</h3>
	                          <p className="text-xs text-muted-foreground">{teamType}</p>
	                        </div>
                      </div>
                      <Badge className={`${status.text} bg-opacity-10`} style={{ backgroundColor: 'var(--tw-bg-opacity, 0.1)' }}>
                        <span className={`w-2 h-2 rounded-full ${status.color} mr-1`} />
                        {status.label}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
	                      <div className="flex items-center gap-2 text-sm">
	                        <Users size={14} className="text-muted-foreground" />
	                        <span>{getMemberCount(team)} thành viên</span>
	                      </div>
	                      <div className="flex items-center gap-2 text-sm">
	                        <Truck size={14} className="text-muted-foreground" />
	                        <span>{getVehicleCount(team)} phương tiện</span>
	                      </div>
	                      {(team.current_location || team.district?.name) && (
	                        <div className="flex items-center gap-2 text-sm">
	                          <MapPin size={14} className="text-muted-foreground" />
	                          <span className="truncate">{team.current_location || team.district?.name}</span>
	                        </div>
	                      )}
	                      {team.phone && (
	                        <div className="flex items-center gap-2 text-sm">
	                          <Phone size={14} className="text-muted-foreground" />
	                          <a href={`tel:${team.phone}`} className="text-primary hover:underline">{team.phone}</a>
	                        </div>
	                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
	                          <Activity size={12} className="text-orange-500" />
	                          {getActiveCount(team)} đang xử lý
	                        </span>
	                        <span className="flex items-center gap-1">
	                          <CheckCircle size={12} className="text-green-500" />
	                          {team.completed_requests ?? 0} hoàn thành
	                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
	                      <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleViewDetail(team)}>
	                        <Eye size={14} />
	                        Chi tiết
	                      </Button>
	                      <Button size="sm" className="flex-1 gap-1" onClick={() => handleTrackTeam(team)}>
	                        <MapPin size={14} />
	                        Theo dõi
	                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Không tìm thấy đội cứu hộ nào</p>
              </CardContent>
            </Card>
          </div>
	        )}
	      </div>

	      <Dialog open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeam(null)}>
	        <DialogContent className="sm:max-w-[520px]">
	          <DialogHeader>
	            <DialogTitle>{selectedTeam?.name}</DialogTitle>
	          </DialogHeader>
	          {selectedTeam && (
	            <div className="space-y-4">
	              {detailLoading ? (
	                <div className="h-28 rounded-lg bg-muted animate-pulse" />
	              ) : (
	                <>
	                  <div className="grid grid-cols-2 gap-3 text-sm">
	                    <div className="rounded-lg border p-3">
	                      <p className="text-xs text-muted-foreground">Mã đội</p>
	                      <p className="font-semibold">{selectedTeam.code || `#${selectedTeam.id}`}</p>
	                    </div>
	                    <div className="rounded-lg border p-3">
	                      <p className="text-xs text-muted-foreground">Loại đội</p>
	                      <p className="font-semibold">{getTeamType(selectedTeam)}</p>
	                    </div>
	                    <div className="rounded-lg border p-3">
	                      <p className="text-xs text-muted-foreground">Nhân sự</p>
	                      <p className="font-semibold">{getMemberCount(selectedTeam)} thành viên</p>
	                    </div>
	                    <div className="rounded-lg border p-3">
	                      <p className="text-xs text-muted-foreground">Phương tiện</p>
	                      <p className="font-semibold">{getVehicleCount(selectedTeam)} xe/thuyền</p>
	                    </div>
	                  </div>

	                  <div className="rounded-lg border p-3 text-sm space-y-2">
	                    <div className="flex items-center gap-2">
	                      <Phone size={14} className="text-muted-foreground" />
	                      {selectedTeam.phone ? (
	                        <a href={`tel:${selectedTeam.phone}`} className="text-primary hover:underline">{selectedTeam.phone}</a>
	                      ) : (
	                        <span className="text-muted-foreground">Chưa có số liên hệ</span>
	                      )}
	                    </div>
	                    <div className="flex items-center gap-2">
	                      <MapPin size={14} className="text-muted-foreground" />
	                      <span>{selectedTeam.current_location || selectedTeam.district?.name || 'Chưa có vị trí mô tả'}</span>
	                    </div>
	                  </div>

	                  {selectedTeam.members && selectedTeam.members.length > 0 && (
	                    <div className="rounded-lg border p-3">
	                      <p className="text-sm font-semibold mb-2">Thành viên</p>
	                      <div className="space-y-2">
	                        {selectedTeam.members.map((member) => (
	                          <div key={member.id} className="flex items-center justify-between text-sm">
	                            <span>{member.name || 'Chưa đặt tên'}</span>
	                            <Badge variant={member.is_available ? 'default' : 'secondary'}>
	                              {member.role || (member.is_available ? 'Sẵn sàng' : 'Bận')}
	                            </Badge>
	                          </div>
	                        ))}
	                      </div>
	                    </div>
	                  )}

	                  <Button className="w-full gap-2" onClick={() => handleTrackTeam(selectedTeam)}>
	                    <MapPin size={14} />
	                    Theo dõi trên bản đồ
	                  </Button>
	                </>
	              )}
	            </div>
	          )}
	        </DialogContent>
	      </Dialog>
	    </div>
	  );
	}
