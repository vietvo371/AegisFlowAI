'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  MapPin, AlertTriangle, Clock, Eye, Filter, Search,
  ChevronDown, Layers, Droplets, Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FloodZone {
  id: number;
  name: string;
  level: 'safe' | 'warning' | 'danger' | 'critical';
  water_level: number;
  risk_score: number;
  population_affected: number;
  updated_at: string;
}

export default function FloodZonesPage() {
  const t = useTranslations('dashboard');
  const [zones, setZones] = React.useState<FloodZone[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('all');

  React.useEffect(() => {
    const fetchZones = async () => {
      try {
        const api = (await import('@/lib/api')).default;
        const res = await api.get('/flood-zones', { params: { status: filter !== 'all' ? filter : undefined } });
        setZones(res.data?.data ?? []);
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchZones();

    const handler = () => fetchZones();
    window.addEventListener('aegis:incident:created', handler);
    return () => window.removeEventListener('aegis:incident:created', handler);
  }, [filter]);

  const getLevelConfig = (level: string) => {
    switch (level) {
      case 'critical': return { color: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-50', label: 'Nguy hiểm nghiêm trọng' };
      case 'danger': return { color: 'bg-orange-500', text: 'text-orange-500', bg: 'bg-orange-50', label: 'Nguy hiểm' };
      case 'warning': return { color: 'bg-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Cảnh báo' };
      default: return { color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', label: 'An toàn' };
    }
  };

  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(search.toLowerCase())
  );

  const levelCounts = {
    safe: zones.filter(z => z.level === 'safe').length,
    warning: zones.filter(z => z.level === 'warning').length,
    danger: zones.filter(z => z.level === 'danger').length,
    critical: zones.filter(z => z.level === 'critical').length,
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6 custom-scroll">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vùng ngập lụt</h1>
          <p className="text-sm text-muted-foreground">Giám sát các khu vực nguy cơ ngập lụt</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Layers size={16} />
            Xem bản đồ
          </Button>
        </div>
      </div>

      {/* Level Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'critical', label: 'Nghiêm trọng', icon: AlertTriangle, color: 'text-red-500 bg-red-100' },
          { key: 'danger', label: 'Nguy hiểm', icon: AlertTriangle, color: 'text-orange-500 bg-orange-100' },
          { key: 'warning', label: 'Cảnh báo', icon: AlertTriangle, color: 'text-yellow-500 bg-yellow-100' },
          { key: 'safe', label: 'An toàn', icon: MapPin, color: 'text-green-500 bg-green-100' },
        ].map((item) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card
              className={`cursor-pointer hover:border-primary/50 transition-colors ${
                filter === item.key ? 'border-primary bg-primary/5' : ''
              }`}
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

      {/* Filters */}
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
            <SelectItem value="danger">Nguy hiểm</SelectItem>
            <SelectItem value="warning">Cảnh báo</SelectItem>
            <SelectItem value="safe">An toàn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Zones List */}
      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-24 bg-muted rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : filteredZones.length > 0 ? (
          filteredZones.map((zone, i) => {
            const config = getLevelConfig(zone.level);
            return (
              <motion.div
                key={zone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`hover:shadow-md transition-shadow ${config.bg}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center shrink-0`}>
                        <Droplets size={24} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{zone.name}</h3>
                          <Badge variant="outline" className={`${config.text} border-current text-xs`}>
                            {config.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Mực nước</p>
                            <p className="font-semibold">{zone.water_level}m</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Điểm rủi ro</p>
                            <p className="font-semibold">{zone.risk_score}/100</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Dân cư ảnh hưởng</p>
                            <p className="font-semibold">{zone.population_affected.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Cập nhật</p>
                            <p className="font-semibold text-xs">
                              {new Date(zone.updated_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Eye size={16} />
                        Chi tiết
                      </Button>
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
    </div>
  );
}
