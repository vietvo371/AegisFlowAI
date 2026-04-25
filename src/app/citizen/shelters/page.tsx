'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  MapPin, Phone, Users, Building2, RefreshCw, Search,
  ShieldCheck, AlertTriangle, Navigation
} from 'lucide-react';

interface Shelter {
  id: number;
  name: string;
  code?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  current_occupancy?: number;
  status?: string;
  is_flood_safe?: boolean;
  facilities?: string[];
  contact_phone?: string;
  district?: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-emerald-500',
  full: 'bg-orange-500',
  maintenance: 'bg-yellow-500',
  closed: 'bg-gray-500',
};

export default function CitizenSheltersPage() {
  const t = useTranslations('citizen');
  const [shelters, setShelters] = React.useState<Shelter[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [userCoords, setUserCoords] = React.useState<{lat: number; lng: number} | null>(null);
  const [locating, setLocating] = React.useState(false);

  const fetchShelters = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shelters');
      setShelters(res.data?.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  React.useEffect(() => {
    fetchShelters();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) { toast.error('Trình duyệt không hỗ trợ GPS'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Đã lấy vị trí');
        setLocating(false);
      },
      () => { toast.error('Không lấy được GPS'); setLocating(false); }
    );
  };

  const openGoogleMaps = (shelter: Shelter) => {
    if (!shelter.latitude || !shelter.longitude) {
      toast.error('Shelter chưa có tọa độ');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${shelter.latitude},${shelter.longitude}`;
    window.open(url, '_blank');
  };

  const filteredShelters = shelters.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.address?.toLowerCase().includes(search.toLowerCase()) ||
    s.district?.toLowerCase().includes(search.toLowerCase())
  );

  const getDistance = (lat: number, lng: number) => {
    if (!userCoords) return null;
    const R = 6371; // km
    const dLat = (lat - userCoords.lat) * Math.PI / 180;
    const dLng = (lng - userCoords.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userCoords.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Building2 size={22} className="text-primary" />
            Điểm sơ tán
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filteredShelters.length} điểm trên địa bàn Đà Nẵng
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchShelters} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Location button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Tìm kiếm điểm sơ tán..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleGetLocation}
          disabled={locating}
          className={userCoords ? 'border-primary text-primary' : ''}
        >
          <Navigation size={16} className={locating ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Còn chỗ</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-muted-foreground">Gần đầy</span>
        </div>
        <div className="flex items-center gap-1">
          <ShieldCheck size={12} className="text-blue-500" />
          <span className="text-muted-foreground">Cao ráo</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="h-24 bg-muted rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredShelters.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Building2 size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Không tìm thấy điểm sơ tán nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredShelters.map(shelter => {
            const available = (shelter.capacity ?? 0) - (shelter.current_occupancy ?? 0);
            const isFull = available <= 0;
            const statusColor = isFull ? 'bg-orange-500' : (STATUS_COLORS[shelter.status ?? 'open'] ?? 'bg-emerald-500');
            const distance = shelter.latitude && shelter.longitude ? getDistance(shelter.latitude, shelter.longitude) : null;

            return (
              <Card key={shelter.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm truncate">{shelter.name}</h3>
                        {shelter.is_flood_safe && (
                          <span title="Cao ráo"><ShieldCheck size={14} className="text-blue-500 shrink-0" /></span>
                        )}
                      </div>
                      {shelter.code && (
                        <p className="text-[10px] text-muted-foreground font-mono">{shelter.code}</p>
                      )}
                    </div>
                    <Badge className={`${statusColor} text-white text-[9px] shrink-0`}>
                      {isFull ? 'Gần đầy' : 'Còn chỗ'}
                    </Badge>
                  </div>

                  {/* Address */}
                  {shelter.address && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <MapPin size={12} className="shrink-0 mt-0.5" />
                      <span>{shelter.address}</span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Users size={12} className="text-muted-foreground" />
                      <span className={available < 10 ? 'text-orange-600 font-bold' : ''}>
                        {available} chỗ trống
                      </span>
                      {shelter.capacity && (
                        <span className="text-muted-foreground">/ {shelter.capacity}</span>
                      )}
                    </div>
                    {distance !== null && distance < 10 && (
                      <Badge variant="outline" className="text-[10px]">
                        {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
                      </Badge>
                    )}
                    {shelter.contact_phone && (
                      <a href={`tel:${shelter.contact_phone}`} className="flex items-center gap-1 text-primary">
                        <Phone size={12} />
                        <span>{shelter.contact_phone}</span>
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => openGoogleMaps(shelter)}
                      disabled={!shelter.latitude || !shelter.longitude}
                    >
                      <Navigation size={12} />
                      Chỉ đường
                    </Button>
                    {shelter.latitude && shelter.longitude && (
                      <Link href={`/citizen/map?shelter=${shelter.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-1">
                          <MapPin size={12} />
                          Xem bản đồ
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
