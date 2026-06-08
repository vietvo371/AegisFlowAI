'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, Eye, Layers, MapPin, Droplets, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface FloodZone {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_level_label?: string;
  status: 'monitoring' | 'alert' | 'danger' | 'flooded' | 'receded';
  status_label?: string;
  current_water_level_m?: number | string | null;
  alert_threshold_m?: number | string | null;
  danger_threshold_m?: number | string | null;
  area_km2?: number | string | null;
  population_affected?: number | null;
  centroid?: { lat?: number | string | null; lng?: number | string | null } | null;
  district?: { id: number; name: string } | null;
  updated_at?: string;
}

const RISK_CONFIG = {
  critical: { color: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-50', label: 'Nghiêm trọng' },
  high: { color: 'bg-orange-500', text: 'text-orange-500', bg: 'bg-orange-50', label: 'Nguy cơ cao' },
  medium: { color: 'bg-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Trung bình' },
  low: { color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', label: 'Thấp' },
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function FloodZonesPage() {
  const router = useRouter();
  const [zones, setZones] = React.useState<FloodZone[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('all');
  const [selectedZone, setSelectedZone] = React.useState<FloodZone | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchZones = async () => {
      setLoading(true);
      try {
        const api = (await import('@/lib/api')).default;
        const res = await api.get('/flood-zones', {
          params: {
            risk_level: filter !== 'all' ? filter : undefined,
            search: search || undefined,
            per_page: 50,
          },
        });
        setZones(res.data?.data ?? []);
      } catch {
        // handled by api interceptor
      } finally {
        setLoading(false);
      }
    };

    const timeout = window.setTimeout(fetchZones, 250);
    const handler = () => fetchZones();
    window.addEventListener('aegis:incident:created', handler);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('aegis:incident:created', handler);
    };
  }, [filter, search]);

  const getRiskScore = (zone: FloodZone) => {
    const current = toNumber(zone.current_water_level_m);
    const danger = toNumber(zone.danger_threshold_m) || 3;
    const waterScore = Math.min(70, Math.round((current / danger) * 70));
    const riskBonus = zone.risk_level === 'critical' ? 30 : zone.risk_level === 'high' ? 22 : zone.risk_level === 'medium' ? 12 : 4;
    return Math.min(100, waterScore + riskBonus);
  };

  const handleViewDetail = async (zone: FloodZone) => {
    setSelectedZone(zone);
    setDetailLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.get(`/flood-zones/${zone.id}`);
      setSelectedZone(res.data?.data ?? zone);
    } catch {
      toast.error('Không tải được chi tiết vùng ngập');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenMap = (zone?: FloodZone | null) => {
    const target = zone ?? zones.find(z => z.centroid?.lat && z.centroid?.lng);
    const lat = Number(target?.centroid?.lat);
    const lng = Number(target?.centroid?.lng);

    if (!target || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error('Vùng ngập này chưa có tâm bản đồ để hiển thị');
      return;
    }

    const params = new URLSearchParams({
      zoneId: String(target.id),
      zoneName: target.name,
      lat: String(lat),
      lng: String(lng),
      zoneDistrict: target.district?.name || '',
      zoneStatus: target.status_label || target.status,
      zoneRisk: target.risk_level_label || RISK_CONFIG[target.risk_level]?.label || target.risk_level,
      zoneWater: `${toNumber(target.current_water_level_m).toFixed(2)}m`,
    });
    router.push(`/dashboard?${params.toString()}`);
  };

  const levelCounts = {
    critical: zones.filter(z => z.risk_level === 'critical').length,
    high: zones.filter(z => z.risk_level === 'high').length,
    medium: zones.filter(z => z.risk_level === 'medium').length,
    low: zones.filter(z => z.risk_level === 'low').length,
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6 custom-scroll">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vùng ngập lụt</h1>
          <p className="text-sm text-muted-foreground">Giám sát các khu vực nguy cơ ngập lụt</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => handleOpenMap()}>
          <Layers size={16} />
          Xem bản đồ
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'critical', label: 'Nghiêm trọng', icon: AlertTriangle, color: 'text-red-500 bg-red-100' },
          { key: 'high', label: 'Nguy cơ cao', icon: AlertTriangle, color: 'text-orange-500 bg-orange-100' },
          { key: 'medium', label: 'Trung bình', icon: AlertTriangle, color: 'text-yellow-500 bg-yellow-100' },
          { key: 'low', label: 'Thấp', icon: MapPin, color: 'text-green-500 bg-green-100' },
        ].map((item) => (
          <motion.div key={item.key} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card
              className={`cursor-pointer hover:border-primary/50 transition-colors ${filter === item.key ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => setFilter(filter === item.key ? 'all' : item.key)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center`}>
                  <item.icon size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{levelCounts[item.key as keyof typeof levelCounts]}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Tìm kiếm vùng ngập..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Lọc theo mức" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="critical">Nghiêm trọng</SelectItem>
            <SelectItem value="high">Nguy cơ cao</SelectItem>
            <SelectItem value="medium">Trung bình</SelectItem>
            <SelectItem value="low">Thấp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-24 bg-muted rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : zones.length > 0 ? (
          zones.map((zone, i) => {
            const config = RISK_CONFIG[zone.risk_level] ?? RISK_CONFIG.low;
            const waterLevel = toNumber(zone.current_water_level_m);
            const riskScore = getRiskScore(zone);

            return (
              <motion.div key={zone.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={`hover:shadow-md transition-shadow ${config.bg}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center shrink-0`}>
                        <Droplets size={24} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold">{zone.name}</h3>
                          <Badge variant="outline" className={`${config.text} border-current text-xs`}>
                            {zone.risk_level_label || config.label}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {zone.status_label || zone.status}
                          </Badge>
                        </div>
                        {zone.district?.name && <p className="text-xs text-muted-foreground">{zone.district.name}</p>}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Mực nước</p>
                            <p className="font-semibold">{waterLevel.toFixed(2)}m</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Điểm rủi ro</p>
                            <p className="font-semibold">{riskScore}/100</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Dân cư ảnh hưởng</p>
                            <p className="font-semibold">{zone.population_affected ? zone.population_affected.toLocaleString() : '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Cập nhật</p>
                            <p className="font-semibold text-xs">
                              {zone.updated_at ? new Date(zone.updated_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleViewDetail(zone)}>
                          <Eye size={16} />
                          Chi tiết
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => handleOpenMap(zone)}>
                          <MapPin size={16} />
                          Bản đồ
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">Không tìm thấy vùng ngập nào</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedZone} onOpenChange={(open) => !open && setSelectedZone(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{selectedZone?.name}</DialogTitle>
          </DialogHeader>
          {selectedZone && (
            <div className="space-y-4">
              {detailLoading ? (
                <div className="h-32 rounded-lg bg-muted animate-pulse" />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Mức rủi ro</p>
                      <p className="font-semibold">{selectedZone.risk_level_label || RISK_CONFIG[selectedZone.risk_level]?.label}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Trạng thái</p>
                      <p className="font-semibold">{selectedZone.status_label || selectedZone.status}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Mực nước hiện tại</p>
                      <p className="font-semibold">{toNumber(selectedZone.current_water_level_m).toFixed(2)}m</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Dân cư ảnh hưởng</p>
                      <p className="font-semibold">{selectedZone.population_affected ? selectedZone.population_affected.toLocaleString() : '—'}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border p-3 text-sm space-y-2">
                    <p className="font-semibold">Ngưỡng theo dõi</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Cảnh báo</p>
                        <p className="font-semibold">{toNumber(selectedZone.alert_threshold_m).toFixed(2)}m</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Nguy hiểm</p>
                        <p className="font-semibold">{toNumber(selectedZone.danger_threshold_m).toFixed(2)}m</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-3 text-sm">
                    <p className="font-semibold mb-1">Mô tả</p>
                    <p className="text-muted-foreground">{selectedZone.description || 'Chưa có mô tả chi tiết'}</p>
                  </div>

                  <Button className="w-full gap-2" onClick={() => handleOpenMap(selectedZone)}>
                    <Layers size={16} />
                    Xem vùng này trên OpenMap
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
