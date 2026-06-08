'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home, MapPin, Phone, Users, Bed, Search,
  Plus, Eye, Star, Waves, Clock, Package
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Shelter {
  id: number;
  name: string;
  code?: string;
  address: string;
  district?: { id: number; name: string } | string | null;
  shelter_type?: string;
  capacity: number;
  current_occupancy: number;
  available_beds?: number;
  occupancy_percent?: number;
  status: 'open' | 'full' | 'closed' | 'preparing' | 'available';
  status_label?: string;
  amenities?: string[];
  facilities?: string[];
  contact_phone?: string;
  contact_name?: string;
  opening_hours?: string;
  is_flood_safe?: boolean;
  flood_depth_tolerance_m?: number | string;
  location?: { lat?: number | string | null; lng?: number | string | null } | null;
  latitude?: number;
  longitude?: number;
  distance?: number;
  rating?: number;
  last_updated?: string;
  supply_stocks?: Array<{
    supply?: { id: number; name: string; category?: string; unit?: string };
    quantity?: number;
    available_quantity?: number;
  }>;
}

export default function SheltersPage() {
  const router = useRouter();
  const [shelters, setShelters] = React.useState<Shelter[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [selectedShelter, setSelectedShelter] = React.useState<Shelter | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [occupancyUpdateValue, setOccupancyUpdateValue] = React.useState('1');
  const [isUpdatingOccupancy, setIsUpdatingOccupancy] = React.useState(false);
  const [createForm, setCreateForm] = React.useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    capacity: '',
    current_occupancy: '0',
    status: 'open',
    shelter_type: 'community_center',
    facilities: 'food, water, medical',
    contact_phone: '',
    contact_name: '',
    opening_hours: '24/7',
    is_flood_safe: true,
  });

  const fetchShelters = React.useCallback(async () => {
    setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/shelters', { params });
      setShelters(res.data?.data ?? []);
    } catch (e) {
      console.error(e);
      toast.error('Không tải được danh sách điểm sơ tán');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    const load = async () => {
      await fetchShelters();
    };

    void load();
  }, [fetchShelters]);

  const getStatusConfig = (status: string, occupancy: number, capacity: number) => {
    const occupancyRate = (occupancy / capacity) * 100;
    if (status === 'closed') return { color: 'bg-gray-500', text: 'text-gray-600', bg: 'bg-gray-50', label: 'Đóng cửa' };
    if (status === 'preparing') return { color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', label: 'Đang chuẩn bị' };
    if (status === 'full') return { color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', label: 'Đã đầy' };
    if (occupancyRate >= 90) return { color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', label: 'Gần đầy' };
    if (occupancyRate >= 70) return { color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', label: 'Còn trống ít' };
    return { color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', label: 'Còn trống' };
  };

  const getDistrictName = (shelter: Shelter) => {
    if (!shelter.district) return '';
    return typeof shelter.district === 'string' ? shelter.district : shelter.district.name;
  };

  const getFacilities = (shelter: Shelter) => (
    Array.isArray(shelter.facilities) ? shelter.facilities : Array.isArray(shelter.amenities) ? shelter.amenities : []
  );

  const getLat = (shelter: Shelter) => {
    const value = shelter.location?.lat ?? shelter.latitude;
    return value === null || value === undefined ? undefined : Number(value);
  };

  const getLng = (shelter: Shelter) => {
    const value = shelter.location?.lng ?? shelter.longitude;
    return value === null || value === undefined ? undefined : Number(value);
  };

  const handleCreateShelter = async () => {
    if (!createForm.name || !createForm.address || !createForm.latitude || !createForm.longitude || !createForm.capacity) {
      toast.error('Vui lòng nhập tên, địa chỉ, tọa độ và sức chứa');
      return;
    }

    const latitude = Number(createForm.latitude);
    const longitude = Number(createForm.longitude);
    const capacity = Number(createForm.capacity);
    const occupancy = Number(createForm.current_occupancy || 0);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(capacity)) {
      toast.error('Tọa độ hoặc sức chứa không hợp lệ');
      return;
    }

    setCreating(true);
    try {
      const api = (await import('@/lib/api')).default;
      await api.post('/shelters', {
        name: createForm.name,
        address: createForm.address,
        latitude,
        longitude,
        capacity,
        current_occupancy: Number.isFinite(occupancy) ? occupancy : 0,
        status: createForm.status,
        shelter_type: createForm.shelter_type,
        facilities: createForm.facilities.split(',').map((item) => item.trim()).filter(Boolean),
        contact_phone: createForm.contact_phone || undefined,
        contact_name: createForm.contact_name || undefined,
        opening_hours: createForm.opening_hours || undefined,
        is_flood_safe: createForm.is_flood_safe,
      });
      toast.success('Đã thêm điểm sơ tán');
      setIsCreateOpen(false);
      setCreateForm({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        capacity: '',
        current_occupancy: '0',
        status: 'open',
        shelter_type: 'community_center',
        facilities: 'food, water, medical',
        contact_phone: '',
        contact_name: '',
        opening_hours: '24/7',
        is_flood_safe: true,
      });
      await fetchShelters();
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { message?: unknown } } })?.response;
      toast.error(typeof response?.data?.message === 'string' ? response.data.message : 'Không tạo được điểm sơ tán');
    } finally {
      setCreating(false);
    }
  };

  const handleViewDetail = async (shelter: Shelter) => {
    setSelectedShelter(shelter);
    setDetailLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.get(`/shelters/${shelter.id}`);
      setSelectedShelter(res.data?.data ?? shelter);
    } catch {
      toast.error('Không tải được chi tiết điểm sơ tán');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateOccupancy = async (action: 'add' | 'remove' | 'set', value: number) => {
    if (!selectedShelter) return;
    setIsUpdatingOccupancy(true);
    try {
      const api = (await import('@/lib/api')).default;
      const payload = action === 'set' ? { action, occupancy: value } : { action, count: value };
      const res = await api.put(`/shelters/${selectedShelter.id}/occupancy`, payload);
      toast.success('Cập nhật số lượng người thành công');
      setSelectedShelter(res.data?.data ?? selectedShelter);
      await fetchShelters();
      setOccupancyUpdateValue('1');
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { message?: unknown } } })?.response;
      toast.error(typeof response?.data?.message === 'string' ? response.data.message : 'Không thể cập nhật số lượng');
    } finally {
      setIsUpdatingOccupancy(false);
    }
  };

  const handleDirections = (shelter: Shelter) => {
    const lat = getLat(shelter);
    const lng = getLng(shelter);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error('Điểm sơ tán này chưa có tọa độ để chỉ đường');
      return;
    }

    const params = new URLSearchParams({
      shelterId: String(shelter.id),
      shelterName: shelter.name,
      lat: String(lat),
      lng: String(lng),
      shelterAddress: shelter.address || getDistrictName(shelter) || '',
      shelterStatus: shelter.status_label || getStatusConfig(shelter.status, shelter.current_occupancy, shelter.capacity).label,
      shelterCapacity: `${shelter.current_occupancy}/${shelter.capacity} người`,
    });

    router.push(`/dashboard?${params.toString()}`);
  };

  const filteredShelters = shelters.filter(shelter =>
    shelter.name.toLowerCase().includes(search.toLowerCase()) ||
    shelter.address.toLowerCase().includes(search.toLowerCase()) ||
    getDistrictName(shelter).toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: shelters.length,
    available: shelters.filter(s => s.status !== 'closed' && s.status !== 'full').length,
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
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
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
            <SelectItem value="open">Mở cửa</SelectItem>
            <SelectItem value="preparing">Đang chuẩn bị</SelectItem>
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
		            const facilities = getFacilities(shelter);

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
		                      {facilities.slice(0, 4).map((amenity, i) => (
		                        <span key={i} className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
		                          {amenity}
		                        </span>
		                      ))}
		                      {facilities.length > 4 && (
		                        <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
		                          +{facilities.length - 4}
		                        </span>
		                      )}
		                      {facilities.length === 0 && (
		                        <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
		                          Chưa cập nhật tiện ích
		                        </span>
		                      )}
		                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
	                      {shelter.contact_phone ? (
	                        <div className="flex items-center gap-2 text-sm">
	                          <Phone size={14} className="text-muted-foreground" />
	                          <a href={`tel:${shelter.contact_phone}`} className="text-primary hover:underline">
	                            {shelter.contact_phone}
	                          </a>
	                        </div>
	                      ) : (
	                        <span className="text-xs text-muted-foreground">Chưa có số liên hệ</span>
	                      )}
                      {shelter.distance && (
                        <span className="text-xs text-muted-foreground">
                          {shelter.distance < 1 ? `${Math.round(shelter.distance * 1000)}m` : `${shelter.distance.toFixed(1)}km`}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
	                      <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleViewDetail(shelter)}>
	                        <Eye size={14} />
	                        Chi tiết
	                      </Button>
	                      <Button size="sm" className="flex-1 gap-1" onClick={() => handleDirections(shelter)}>
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Thêm điểm sơ tán</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên điểm</Label>
                <Input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} placeholder="Trường THCS..." />
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select value={createForm.status} onValueChange={(status) => setCreateForm((f) => ({ ...f, status: status ?? f.status }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Mở cửa</SelectItem>
                    <SelectItem value="preparing">Đang chuẩn bị</SelectItem>
                    <SelectItem value="full">Đã đầy</SelectItem>
                    <SelectItem value="closed">Đóng cửa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input value={createForm.address} onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))} placeholder="Địa chỉ tại Đà Nẵng" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Vĩ độ</Label>
                <Input value={createForm.latitude} onChange={(e) => setCreateForm((f) => ({ ...f, latitude: e.target.value }))} placeholder="16.0678" />
              </div>
              <div className="space-y-2">
                <Label>Kinh độ</Label>
                <Input value={createForm.longitude} onChange={(e) => setCreateForm((f) => ({ ...f, longitude: e.target.value }))} placeholder="108.2208" />
              </div>
              <div className="space-y-2">
                <Label>Sức chứa</Label>
                <Input type="number" min="1" value={createForm.capacity} onChange={(e) => setCreateForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="500" />
              </div>
              <div className="space-y-2">
                <Label>Đang ở</Label>
                <Input type="number" min="0" value={createForm.current_occupancy} onChange={(e) => setCreateForm((f) => ({ ...f, current_occupancy: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Người liên hệ</Label>
                <Input value={createForm.contact_name} onChange={(e) => setCreateForm((f) => ({ ...f, contact_name: e.target.value }))} placeholder="Nguyễn Văn A" />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input value={createForm.contact_phone} onChange={(e) => setCreateForm((f) => ({ ...f, contact_phone: e.target.value }))} placeholder="090..." />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tiện ích</Label>
                <Input value={createForm.facilities} onChange={(e) => setCreateForm((f) => ({ ...f, facilities: e.target.value }))} placeholder="food, water, medical" />
              </div>
              <div className="space-y-2">
                <Label>Giờ mở cửa</Label>
                <Input value={createForm.opening_hours} onChange={(e) => setCreateForm((f) => ({ ...f, opening_hours: e.target.value }))} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={createForm.is_flood_safe} onCheckedChange={(checked) => setCreateForm((f) => ({ ...f, is_flood_safe: checked === true }))} />
              An toàn khi ngập
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={creating}>Hủy</Button>
            <Button onClick={handleCreateShelter} disabled={creating}>
              {creating ? 'Đang lưu...' : 'Lưu điểm sơ tán'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

	      <Dialog open={!!selectedShelter} onOpenChange={(open) => !open && setSelectedShelter(null)}>
	        <DialogContent className="sm:max-w-[560px]">
	          <DialogHeader>
	            <DialogTitle>{selectedShelter?.name}</DialogTitle>
	          </DialogHeader>
	          {selectedShelter && (
	            <div className="space-y-4">
	              {detailLoading ? (
	                <div className="h-32 rounded-lg bg-muted animate-pulse" />
	              ) : (
	                <>
	                  <div className="grid grid-cols-2 gap-3 text-sm">
	                    <div className="rounded-lg border p-3">
	                      <p className="text-xs text-muted-foreground">Mã điểm</p>
	                      <p className="font-semibold">{selectedShelter.code || `#${selectedShelter.id}`}</p>
	                    </div>
	                    <div className="rounded-lg border p-3">
	                      <p className="text-xs text-muted-foreground">Trạng thái</p>
	                      <p className="font-semibold">{selectedShelter.status_label || getStatusConfig(selectedShelter.status, selectedShelter.current_occupancy, selectedShelter.capacity).label}</p>
	                    </div>
	                    <div className="rounded-lg border p-3">
	                      <p className="text-xs text-muted-foreground">Sức chứa</p>
	                      <p className="font-semibold">{selectedShelter.current_occupancy} / {selectedShelter.capacity} người</p>
	                    </div>
	                    <div className="rounded-lg border p-3">
	                      <p className="text-xs text-muted-foreground">Còn trống</p>
	                      <p className="font-semibold">{selectedShelter.available_beds ?? Math.max(0, selectedShelter.capacity - selectedShelter.current_occupancy)} chỗ</p>
	                    </div>
	                  </div>

                      <div className="rounded-lg border p-4 bg-primary/5 space-y-3">
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <Users size={16} /> Cập nhật người ra/vào (Check-in/Check-out)
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={occupancyUpdateValue}
                            onChange={(e) => setOccupancyUpdateValue(e.target.value)}
                            className="w-24 bg-white"
                            disabled={isUpdatingOccupancy}
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap mr-2">người</span>
                          
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleUpdateOccupancy('add', Number(occupancyUpdateValue))}
                            disabled={isUpdatingOccupancy || !Number(occupancyUpdateValue)}
                          >
                            <Plus size={14} className="mr-1" /> Nhận thêm
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => handleUpdateOccupancy('remove', Number(occupancyUpdateValue))}
                            disabled={isUpdatingOccupancy || !Number(occupancyUpdateValue)}
                          >
                            Giảm bớt
                          </Button>
                        </div>
                      </div>

	                  <div className="rounded-lg border p-3 text-sm space-y-2">
	                    <div className="flex items-start gap-2">
	                      <MapPin size={14} className="mt-0.5 text-muted-foreground" />
	                      <span>{selectedShelter.address}{getDistrictName(selectedShelter) ? `, ${getDistrictName(selectedShelter)}` : ''}</span>
	                    </div>
	                    <div className="flex items-center gap-2">
	                      <Phone size={14} className="text-muted-foreground" />
	                      {selectedShelter.contact_phone ? (
	                        <a href={`tel:${selectedShelter.contact_phone}`} className="text-primary hover:underline">{selectedShelter.contact_phone}</a>
	                      ) : (
	                        <span className="text-muted-foreground">Chưa có số liên hệ</span>
	                      )}
	                    </div>
	                    {selectedShelter.opening_hours && (
	                      <div className="flex items-center gap-2">
	                        <Clock size={14} className="text-muted-foreground" />
	                        <span>{selectedShelter.opening_hours}</span>
	                      </div>
	                    )}
	                  </div>

	                  <div className="rounded-lg border p-3">
	                    <p className="text-sm font-semibold mb-2">Tiện ích</p>
	                    <div className="flex flex-wrap gap-2">
	                      {getFacilities(selectedShelter).length > 0 ? getFacilities(selectedShelter).map((facility, index) => (
	                        <Badge key={`${facility}-${index}`} variant="secondary">{facility}</Badge>
	                      )) : (
	                        <span className="text-sm text-muted-foreground">Chưa cập nhật tiện ích</span>
	                      )}
	                    </div>
	                  </div>

	                  {selectedShelter.supply_stocks && selectedShelter.supply_stocks.length > 0 && (
	                    <div className="rounded-lg border p-3">
	                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
	                        <Package size={14} />
	                        Vật tư
	                      </p>
	                      <div className="space-y-2">
	                        {selectedShelter.supply_stocks.map((stock, index) => (
	                          <div key={stock.supply?.id ?? index} className="flex items-center justify-between text-sm">
	                            <span>{stock.supply?.name || 'Vật tư'}</span>
	                            <span className="font-semibold">{stock.available_quantity ?? stock.quantity ?? 0} {stock.supply?.unit || ''}</span>
	                          </div>
	                        ))}
	                      </div>
	                    </div>
	                  )}

	                  <Button className="w-full gap-2" onClick={() => handleDirections(selectedShelter)}>
	                    <MapPin size={14} />
	                    Chỉ đường đến điểm sơ tán
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
