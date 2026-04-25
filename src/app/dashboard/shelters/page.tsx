'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Home, MapPin, Phone, Users, Bed, Utensils, Search,
  Filter, Plus, Eye, Star, ChevronDown, Waves
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

interface Shelter {
  id: number;
  name: string;
  address: string;
  district?: string;
  capacity: number;
  current_occupancy: number;
  status: 'available' | 'full' | 'closed';
  amenities: string[];
  contact_phone: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  rating?: number;
  last_updated?: string;
}

export default function SheltersPage() {
  const t = useTranslations('dashboard');
  const [shelters, setShelters] = React.useState<Shelter[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  React.useEffect(() => {
    const fetchShelters = async () => {
      setLoading(true);
      try {
        const api = (await import('@/lib/api')).default;
        const params: any = {};
        if (statusFilter !== 'all') params.status = statusFilter;
        const res = await api.get('/shelters', { params });
        setShelters(res.data?.data ?? []);
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchShelters();
  }, [statusFilter]);

  const getStatusConfig = (status: string, occupancy: number, capacity: number) => {
    const occupancyRate = (occupancy / capacity) * 100;
    if (status === 'closed') return { color: 'bg-gray-500', text: 'text-gray-600', bg: 'bg-gray-50', label: 'Đóng cửa' };
    if (occupancyRate >= 90) return { color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', label: 'Gần đầy' };
    if (occupancyRate >= 70) return { color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', label: 'Còn trống ít' };
    return { color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', label: 'Còn trống' };
  };

  const filteredShelters = shelters.filter(shelter =>
    shelter.name.toLowerCase().includes(search.toLowerCase()) ||
    shelter.address.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: shelters.length,
    available: shelters.filter(s => s.status !== 'closed').length,
    totalCapacity: shelters.reduce((acc, s) => acc + s.capacity, 0),
    totalOccupancy: shelters.reduce((acc, s) => acc + s.current_occupancy, 0),
  };

  const occupancyPercentage = stats.totalCapacity > 0
    ? Math.round((stats.totalOccupancy / stats.totalCapacity) * 100)
    : 0;

  return (
    <div className="h-full overflow-auto p-6 space-y-6 custom-scroll">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Điểm sơ tán</h1>
          <p className="text-sm text-muted-foreground">Quản lý và giám sát các điểm sơ tán</p>
        </div>
        <Button className="gap-2">
          <Plus size={16} />
          Thêm điểm sơ tán
        </Button>
      </div>

      {/* Overall Capacity */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Waves size={18} className="text-blue-600" />
                Tổng quan công suất
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.totalOccupancy ?? 0} / {stats.totalCapacity ?? 0} người
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">{occupancyPercentage}%</p>
              <p className="text-xs text-muted-foreground">Đã sử dụng</p>
            </div>
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng điểm', value: stats.total, icon: Home, color: 'text-blue-600 bg-blue-100' },
          { label: 'Đang hoạt động', value: stats.available, icon: Star, color: 'text-green-600 bg-green-100' },
          { label: 'Người đang ở', value: stats.totalOccupancy, icon: Users, color: 'text-orange-600 bg-orange-100' },
          { label: 'Còn trống', value: stats.totalCapacity - stats.totalOccupancy, icon: Bed, color: 'text-purple-600 bg-purple-100' },
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
                  <p className="text-2xl font-bold">{stat.value ? stat.value.toLocaleString() : '0'}</p>
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
            placeholder="Tìm kiếm tên, địa chỉ..."
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
            <SelectItem value="available">Còn trống</SelectItem>
            <SelectItem value="nearly_full">Gần đầy</SelectItem>
            <SelectItem value="full">Đầy</SelectItem>
            <SelectItem value="closed">Đóng cửa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Shelters List */}
      <div className="grid md:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-48 bg-muted rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : filteredShelters.length > 0 ? (
          filteredShelters.map((shelter, i) => {
            const status = getStatusConfig(shelter.status, shelter.current_occupancy, shelter.capacity);
            const occupancyRate = Math.round((shelter.current_occupancy / shelter.capacity) * 100);

            return (
              <motion.div
                key={shelter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${status.bg} flex items-center justify-center`}>
                          <Home size={24} className={status.text} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{shelter.name}</h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin size={12} />
                            <span className="truncate max-w-[200px]">{shelter.address}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={`${status.text} bg-opacity-10`} style={{ backgroundColor: 'var(--tw-bg-opacity, 0.1)' }}>
                        {status.label}
                      </Badge>
                    </div>

                    {/* Capacity Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Sức chứa</span>
                        <span className="font-medium">{shelter.current_occupancy} / {shelter.capacity} người</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${occupancyRate >= 90 ? 'bg-red-500' : occupancyRate >= 70 ? 'bg-orange-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {shelter.amenities.slice(0, 4).map((amenity, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                          {amenity}
                        </span>
                      ))}
                      {shelter.amenities.length > 4 && (
                        <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                          +{shelter.amenities.length - 4}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={14} className="text-muted-foreground" />
                        <a href={`tel:${shelter.contact_phone}`} className="text-primary hover:underline">
                          {shelter.contact_phone}
                        </a>
                      </div>
                      {shelter.distance && (
                        <span className="text-xs text-muted-foreground">
                          {shelter.distance < 1 ? `${Math.round(shelter.distance * 1000)}m` : `${shelter.distance.toFixed(1)}km`}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1 gap-1">
                        <Eye size={14} />
                        Chi tiết
                      </Button>
                      <Button size="sm" className="flex-1 gap-1">
                        <MapPin size={14} />
                        Chỉ đường
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
                <Home className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Không tìm thấy điểm sơ tán nào</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
