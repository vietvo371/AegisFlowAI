'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Activity, Droplets, Thermometer, Wind, Gauge, MapPin,
  Search, Filter, Plus, Eye, Bell, Battery, Wifi
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

interface Sensor {
  id: number;
  name: string;
  type: 'water_level' | 'rainfall' | 'wind' | 'humidity' | 'temperature' | 'combined';
  status: string;
  location?: string | { lat?: number | string | null; lng?: number | string | null } | null;
  latitude?: number;
  longitude?: number;
  unit?: string;
  metadata?: {
    station_label?: string;
    address?: string;
    latitude?: number | string;
    longitude?: number | string;
  } | null;
  readings: {
    water_level?: number;
    rainfall?: number;
    temperature?: number;
    humidity?: number;
    wind_speed?: number;
    pressure?: number;
  };
  battery?: number;
  last_reading?: string;
  zone?: string;
  district?: { id: number; name: string } | null;
  flood_zone?: { id: number; name: string } | null;
}

export default function SensorsPage() {
  const t = useTranslations('dashboard');
  const [sensors, setSensors] = React.useState<Sensor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');

  React.useEffect(() => {
    const fetchSensors = async () => {
      setLoading(true);
      try {
        const api = (await import('@/lib/api')).default;
        const params: any = {};
        if (statusFilter !== 'all') params.status = statusFilter;
        if (typeFilter !== 'all') params.type = typeFilter;
        const res = await api.get('/sensors', { params });
        const mappedSensors = (res.data?.data ?? []).map((s: any) => ({
          ...s,
          readings: {
            [s.type]: s.last_value != null ? parseFloat(s.last_value) : undefined
          },
          last_reading: s.last_reading_at || s.last_reading
        }));
        setSensors(mappedSensors);
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchSensors();

    // Realtime updates
    const handler = (e: CustomEvent) => {
      const data = e.detail;
      setSensors(prev => prev.map(s =>
        s.id === data.sensor_id
          ? { ...s, readings: { ...(s.readings || {}), ...data.readings }, last_reading: new Date().toISOString() }
          : s
      ));
    };
    window.addEventListener('aegis:sensor:reading', handler as EventListener);
    return () => window.removeEventListener('aegis:sensor:reading', handler as EventListener);
  }, [statusFilter, typeFilter]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'online': return { color: 'bg-green-500', text: 'text-green-600', label: 'Trực tuyến' };
      case 'offline': return { color: 'bg-gray-500', text: 'text-gray-600', label: 'Offline' };
      case 'warning': return { color: 'bg-yellow-500', text: 'text-yellow-600', label: 'Cảnh báo' };
      case 'error': return { color: 'bg-red-500', text: 'text-red-600', label: 'Lỗi' };
      default: return { color: 'bg-gray-500', text: 'text-gray-600', label: status };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'water_level': return Droplets;
      case 'rainfall': return Gauge;
      case 'temperature': return Thermometer;
      case 'humidity': return Droplets;
      case 'wind': return Wind;
      default: return Activity;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'water_level': return 'Mực nước';
      case 'rainfall': return 'Lượng mưa';
      case 'temperature': return 'Nhiệt độ';
      case 'humidity': return 'Độ ẩm';
      case 'wind': return 'Gió';
      case 'combined': return 'Đa chức năng';
      default: return type;
    }
  };

  const getLocationString = (sensor: Sensor) => {
    if (sensor.metadata?.station_label && sensor.metadata?.address) {
      return `${sensor.metadata.station_label} · ${sensor.metadata.address}`;
    }
    if (sensor.metadata?.address) return sensor.metadata.address;

    if (sensor.flood_zone?.name && sensor.district?.name) {
      return `${sensor.flood_zone.name} · ${sensor.district.name}`;
    }
    if (sensor.flood_zone?.name) return sensor.flood_zone.name;
    if (sensor.district?.name) return sensor.district.name;

    const { location } = sensor;
    if (typeof location === 'object' && location !== null) {
      const lat = Number(location.lat);
      const lng = Number(location.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    }
    const metadataLat = Number(sensor.metadata?.latitude);
    const metadataLng = Number(sensor.metadata?.longitude);
    if (Number.isFinite(metadataLat) && Number.isFinite(metadataLng)) {
      return `${metadataLat.toFixed(4)}, ${metadataLng.toFixed(4)}`;
    }
    if (typeof location === 'string' && location.trim()) return location;
    return 'Chưa có vị trí';
  };

  const getStatusFilterLabel = (val: string) => {
    switch (val) {
      case 'all': return 'Tất cả';
      case 'online': return 'Trực tuyến';
      case 'warning': return 'Cảnh báo';
      case 'offline': return 'Offline';
      default: return 'Trạng thái';
    }
  };

  const getTypeFilterLabel = (val: string) => {
    switch (val) {
      case 'all': return 'Tất cả loại';
      case 'water_level': return 'Mực nước';
      case 'rainfall': return 'Lượng mưa';
      case 'temperature': return 'Nhiệt độ';
      case 'humidity': return 'Độ ẩm';
      case 'wind': return 'Gió';
      case 'combined': return 'Đa chức năng';
      default: return 'Loại cảm biến';
    }
  };

  const filteredSensors = sensors.filter(sensor =>
    sensor.name.toLowerCase().includes(search.toLowerCase()) ||
    getLocationString(sensor).toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: sensors.length,
    online: sensors.filter(s => s.status === 'online').length,
    offline: sensors.filter(s => s.status === 'offline').length,
    warning: sensors.filter(s => s.status === 'warning').length,
  };

  const avgReadings = {
    water_level: sensors.filter(s => s.readings?.water_level).reduce((acc, s) => acc + (s.readings?.water_level ?? 0), 0) / Math.max(sensors.filter(s => s.readings?.water_level).length, 1),
    temperature: sensors.filter(s => s.readings?.temperature).reduce((acc, s) => acc + (s.readings?.temperature ?? 0), 0) / Math.max(sensors.filter(s => s.readings?.temperature).length, 1),
    humidity: sensors.filter(s => s.readings?.humidity).reduce((acc, s) => acc + (s.readings?.humidity ?? 0), 0) / Math.max(sensors.filter(s => s.readings?.humidity).length, 1),
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6 custom-scroll">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cảm biến</h1>
          <p className="text-sm text-muted-foreground">Giám sát các thiết bị cảm biến</p>
        </div>
        <Button className="gap-2">
          <Plus size={16} />
          Thêm cảm biến
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Tổng cảm biến', value: stats.total, icon: Activity, color: 'text-blue-600 bg-blue-100' },
          { label: 'Trực tuyến', value: stats.online, icon: Wifi, color: 'text-green-600 bg-green-100' },
          { label: 'Cảnh báo', value: stats.warning, icon: Bell, color: 'text-yellow-600 bg-yellow-100' },
          { label: 'Offline', value: stats.offline, icon: Wifi, color: 'text-gray-600 bg-gray-100' },
          { label: 'Mực nước TB', value: `${avgReadings.water_level.toFixed(1)}m`, icon: Droplets, color: 'text-cyan-600 bg-cyan-100' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center shrink-0`}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
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
          <SelectTrigger className="w-full sm:w-[140px]">
            <span className="flex-1 text-left truncate">{getStatusFilterLabel(statusFilter)}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="online">Trực tuyến</SelectItem>
            <SelectItem value="warning">Cảnh báo</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <span className="flex-1 text-left truncate">{getTypeFilterLabel(typeFilter)}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            <SelectItem value="water_level">Mực nước</SelectItem>
            <SelectItem value="rainfall">Lượng mưa</SelectItem>
            <SelectItem value="temperature">Nhiệt độ</SelectItem>
            <SelectItem value="humidity">Độ ẩm</SelectItem>
            <SelectItem value="wind">Gió</SelectItem>
            <SelectItem value="combined">Đa chức năng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sensors Grid */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Lưới</TabsTrigger>
          <TabsTrigger value="list">Danh sách</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="h-40 bg-muted rounded-lg animate-pulse" />
                  </CardContent>
                </Card>
              ))
            ) : filteredSensors.length > 0 ? (
              filteredSensors.map((sensor, i) => {
                const status = getStatusConfig(sensor.status);
                const TypeIcon = getTypeIcon(sensor.type);

                return (
                  <motion.div
                    key={sensor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                              <TypeIcon size={20} className="text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">{sensor.name}</h3>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin size={10} />
                                <span className="truncate max-w-[160px]">{getLocationString(sensor)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${status.color}`} />
                            <span className={`text-[10px] ${status.text}`}>{status.label}</span>
                          </div>
                        </div>

                        {/* Readings */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {sensor.readings?.water_level !== undefined && (
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <p className="text-[10px] text-muted-foreground">Mực nước</p>
                              <p className="font-bold text-sm">{sensor.readings.water_level}m</p>
                            </div>
                          )}
                          {sensor.readings?.temperature !== undefined && (
                            <div className="p-2 bg-orange-50 rounded-lg">
                              <p className="text-[10px] text-muted-foreground">Nhiệt độ</p>
                              <p className="font-bold text-sm">{sensor.readings.temperature}°C</p>
                            </div>
                          )}
                          {sensor.readings?.humidity !== undefined && (
                            <div className="p-2 bg-purple-50 rounded-lg">
                              <p className="text-[10px] text-muted-foreground">Độ ẩm</p>
                              <p className="font-bold text-sm">{sensor.readings.humidity}%</p>
                            </div>
                          )}
                          {sensor.readings?.rainfall !== undefined && (
                            <div className="p-2 bg-cyan-50 rounded-lg">
                              <p className="text-[10px] text-muted-foreground">Lượng mưa</p>
                              <p className="font-bold text-sm">{sensor.readings.rainfall}mm</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">{getTypeLabel(sensor.type)}</Badge>
                          {sensor.battery && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Battery size={12} />
                              <span>{sensor.battery}%</span>
                            </div>
                          )}
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
                    <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">Không tìm thấy cảm biến nào</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="p-4 font-medium">Tên</th>
                      <th className="p-4 font-medium">Loại</th>
                      <th className="p-4 font-medium">Vị trí</th>
                      <th className="p-4 font-medium">Trạng thái</th>
                      <th className="p-4 font-medium">Giá trị</th>
                      <th className="p-4 font-medium">Pin</th>
                      <th className="p-4 font-medium">Cập nhật</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td className="p-4"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></td>
                          <td className="p-4"><div className="h-4 w-20 bg-muted rounded animate-pulse" /></td>
                          <td className="p-4"><div className="h-4 w-32 bg-muted rounded animate-pulse" /></td>
                          <td className="p-4"><div className="h-4 w-16 bg-muted rounded animate-pulse" /></td>
                          <td className="p-4"><div className="h-4 w-12 bg-muted rounded animate-pulse" /></td>
                          <td className="p-4"><div className="h-4 w-12 bg-muted rounded animate-pulse" /></td>
                          <td className="p-4"><div className="h-4 w-16 bg-muted rounded animate-pulse" /></td>
                        </tr>
                      ))
                    ) : filteredSensors.length > 0 ? (
                      filteredSensors.map((sensor) => {
                        const status = getStatusConfig(sensor.status);
                        return (
                          <tr key={sensor.id} className="border-b border-border hover:bg-muted/50">
                            <td className="p-4 font-medium text-sm">{sensor.name}</td>
                            <td className="p-4"><Badge variant="outline" className="text-xs">{getTypeLabel(sensor.type)}</Badge></td>
                            <td className="p-4 text-sm text-muted-foreground">{getLocationString(sensor)}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${status.color}`} />
                                <span className={`text-xs ${status.text}`}>{status.label}</span>
                              </div>
                            </td>
                            <td className="p-4 text-sm font-medium">
                              {sensor.readings?.water_level !== undefined && `${sensor.readings.water_level}m`}
                              {sensor.readings?.temperature !== undefined && `${sensor.readings.temperature}°C`}
                              {sensor.readings?.humidity !== undefined && `${sensor.readings.humidity}%`}
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {sensor.battery ? `${sensor.battery}%` : '-'}
                            </td>
                            <td className="p-4 text-xs text-muted-foreground">
                              {sensor.last_reading ? new Date(sensor.last_reading).toLocaleTimeString('vi-VN') : '-'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          Không có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
