'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Shield, MapPin, Phone, Users, Truck, CheckCircle,
  XCircle, Search, Filter, Plus, Eye, AlertTriangle, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
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
  type: string;
  status: 'available' | 'busy' | 'offline';
  members_count: number;
  vehicles_count: number;
  current_location?: string;
  active_requests: number;
  completed_requests: number;
  phone: string;
  rating?: number;
}

export default function RescueTeamsPage() {
  const t = useTranslations('dashboard');
  const [teams, setTeams] = React.useState<RescueTeam[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

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

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fire': return '🚒';
      case 'medical': return '🚑';
      case 'flood': return '🚤';
      case 'search': return '🔍';
      default: return '🛡️';
    }
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(search.toLowerCase()) ||
    team.current_location?.toLowerCase().includes(search.toLowerCase())
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
        <Button className="gap-2">
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
                          {getTypeIcon(team.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{team.name}</h3>
                          <p className="text-xs text-muted-foreground">{team.type}</p>
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
                        <span>{team.members_count} thành viên</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Truck size={14} className="text-muted-foreground" />
                        <span>{team.vehicles_count} phương tiện</span>
                      </div>
                      {team.current_location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={14} className="text-muted-foreground" />
                          <span className="truncate">{team.current_location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={14} className="text-muted-foreground" />
                        <a href={`tel:${team.phone}`} className="text-primary hover:underline">{team.phone}</a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Activity size={12} className="text-orange-500" />
                          {team.active_requests} đang xử lý
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle size={12} className="text-green-500" />
                          {team.completed_requests} hoàn thành
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1 gap-1">
                        <Eye size={14} />
                        Chi tiết
                      </Button>
                      <Button size="sm" className="flex-1 gap-1">
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
    </div>
  );
}
