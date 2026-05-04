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
  ShieldCheck, Navigation, LocateFixed, Utensils, Droplets,
  HeartPulse, Zap, Toilet, Wifi
} from 'lucide-react';

interface Shelter {
  id: number;
  name: string;
  code?: string;
  address?: string;
  location?: { lat: number; lng: number } | null;
  capacity?: number;
  current_occupancy?: number;
  available_beds?: number;
  status?: string;
  is_flood_safe?: boolean;
  facilities?: string[];
  contact_phone?: string;
  district?: { name: string } | string;
}

const STATUS_COLORS: Record<string, string> = {
  open:        'bg-emerald-500',
  full:        'bg-red-500',
  maintenance: 'bg-yellow-500',
  closed:      'bg-gray-500',
};

const FACILITY_ICONS: Record<string, React.ReactNode> = {
  food:        <Utensils size={11} />,
  water:       <Droplets size={11} />,
  medical:     <HeartPulse size={11} />,
  electricity: <Zap size={11} />,
  toilet:      <Toilet size={11} />,
  wifi:        <Wifi size={11} />,
};

function getDistance(lat: number, lng: number, userLat: number, userLng: number): number {
  const R = 6371;
  const dLat = (lat - userLat) * Math.PI / 180;
  const dLng = (lng - userLng) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 + Math.cos(userLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function CitizenSheltersPage() {
  const t = useTranslations('citizen');
  const [shelters, setShelters] = React.useState<Shelter[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [userCoords, setUserCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = React.useState(false);

  const fetchShelters = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shelters', { params: { per_page: 100 } });
      setShelters(res.data?.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { fetchShelters(); }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) { toast.error(t('map.toastNoGps')); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success(t('map.toastGotLocation'));
        setLocating(false);
      },
      () => { toast.error(t('map.toastGpsError')); setLocating(false); }
    );
  };

  const openGoogleMaps = (shelter: Shelter) => {
    const lat = shelter.location?.lat;
    const lng = shelter.location?.lng;
    if (!lat || !lng) { toast.error(t('map.toastNoCoords')); return; }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  // Filter + sort by distance if GPS available
  const filteredShelters = React.useMemo(() => {
    const districtName = (s: Shelter) => typeof s.district === 'object' ? s.district?.name ?? '' : s.district ?? '';
    const filtered = shelters.filter(s =>
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.address?.toLowerCase().includes(search.toLowerCase()) ||
      districtName(s).toLowerCase().includes(search.toLowerCase())
    );

    if (userCoords) {
      return [...filtered].sort((a, b) => {
        const dA = a.location ? getDistance(a.location.lat, a.location.lng, userCoords.lat, userCoords.lng) : 999;
        const dB = b.location ? getDistance(b.location.lat, b.location.lng, userCoords.lat, userCoords.lng) : 999;
        return dA - dB;
      });
    }
    return filtered;
  }, [shelters, search, userCoords]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Building2 size={22} className="text-primary" />
            {t('shelters.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('shelters.subtitle', { count: filteredShelters.length })}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchShelters} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Search + GPS */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
          <Input className="pl-8" placeholder={t('shelters.searchPlaceholder')}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="icon" onClick={handleGetLocation} disabled={locating}
          className={userCoords ? 'border-primary text-primary bg-primary/5' : ''}
          title={userCoords ? 'GPS đã bật — sắp xếp theo khoảng cách' : 'Lấy vị trí để sắp xếp gần nhất'}>
          <LocateFixed size={16} className={locating ? 'animate-spin' : ''} />
        </Button>
      </div>

      {userCoords && (
        <p className="text-[11px] text-primary font-medium flex items-center gap-1">
          <LocateFixed size={11} /> Đang sắp xếp theo khoảng cách gần nhất
        </p>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-4"><div className="h-28 bg-muted rounded-lg animate-pulse" /></CardContent></Card>
          ))}
        </div>
      ) : filteredShelters.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          <Building2 size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">{t('shelters.noShelters')}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filteredShelters.map(shelter => {
            const available = shelter.available_beds ?? ((shelter.capacity ?? 0) - (shelter.current_occupancy ?? 0));
            const capacity = shelter.capacity ?? 0;
            const occupancyPct = capacity > 0 ? Math.round(((capacity - available) / capacity) * 100) : 0;
            const isFull = available <= 0 || shelter.status === 'full';
            const isClosed = shelter.status === 'closed' || shelter.status === 'maintenance';
            const statusKey = isClosed ? shelter.status! : (isFull ? 'full' : 'open');
            const statusColor = STATUS_COLORS[statusKey] ?? 'bg-emerald-500';
            const hasCoords = !!shelter.location?.lat;
            const distance = hasCoords && userCoords
              ? getDistance(shelter.location!.lat, shelter.location!.lng, userCoords.lat, userCoords.lng)
              : null;

            return (
              <Card key={shelter.id} className={`overflow-hidden transition-colors hover:border-primary/40 ${isClosed ? 'opacity-60' : ''}`}>
                <CardContent className="p-4 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-sm leading-snug">{shelter.name}</h3>
                        {shelter.is_flood_safe && (
                          <ShieldCheck size={13} className="text-blue-500 shrink-0" title={t('shelters.floodSafe')} />
                        )}
                      </div>
                      {shelter.code && <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{shelter.code}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge className={`${statusColor} text-white text-[9px]`}>
                        {isClosed ? (shelter.status === 'maintenance' ? 'Bảo trì' : 'Đóng cửa')
                          : isFull ? t('shelters.almostFull') : t('shelters.available')}
                      </Badge>
                      {distance !== null && (
                        <span className="text-[10px] text-muted-foreground">
                          {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  {shelter.address && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin size={11} className="shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{shelter.address}</span>
                    </div>
                  )}

                  {/* Occupancy bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users size={11} />
                        <span className={available < 20 ? 'text-orange-600 font-bold' : ''}>
                          {t('shelters.spotsAvailable', { count: available })}
                        </span>
                        <span className="text-muted-foreground">/ {capacity}</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground">{occupancyPct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${occupancyPct > 90 ? 'bg-red-500' : occupancyPct > 70 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Facilities */}
                  {shelter.facilities && shelter.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {shelter.facilities.map(f => (
                        <span key={f} className="flex items-center gap-1 text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                          {FACILITY_ICONS[f] ?? null}
                          {f}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Contact + Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {shelter.contact_phone && (
                      <a href={`tel:${shelter.contact_phone}`}
                        className="flex items-center gap-1 text-xs text-primary hover:underline mr-auto">
                        <Phone size={11} /> {shelter.contact_phone}
                      </a>
                    )}
                    <Button variant="outline" size="sm" className="gap-1 text-xs h-8"
                      onClick={() => openGoogleMaps(shelter)} disabled={!hasCoords}>
                      <Navigation size={12} /> {t('shelters.directions')}
                    </Button>
                    {hasCoords && (
                      <Link href={`/citizen/map?lat=${shelter.location!.lat}&lng=${shelter.location!.lng}&zoom=16`}>
                        <Button variant="outline" size="sm" className="gap-1 text-xs h-8">
                          <MapPin size={12} /> {t('shelters.viewMap')}
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
