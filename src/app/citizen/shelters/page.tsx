'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  MapPin, Phone, Users, Building2, Search,
  ShieldCheck, Navigation, LocateFixed,
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

const FACILITY_EMOJI: Record<string, string> = {
  food: '🍚 Thực phẩm',
  water: '💧 Nước sạch',
  medical: '🏥 Y tế',
  electricity: '⚡ Điện',
  toilet: '🚽 Vệ sinh',
  wifi: '📶 Wifi',
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
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-[26px] font-extrabold tracking-tight">Nơi trú ẩn</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tìm nơi trú ẩn gần bạn</p>
      </div>

      {/* Search + GPS */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-12 pl-10 pr-4 bg-white dark:bg-zinc-900 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <button
          onClick={handleGetLocation}
          disabled={locating}
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            userCoords
              ? 'bg-primary text-white shadow-md'
              : 'bg-primary text-white shadow-md hover:shadow-lg'
          }`}
        >
          <LocateFixed size={20} className={locating ? 'animate-spin' : ''} />
        </button>
      </div>

      {userCoords && (
        <p className="text-[11px] text-primary font-medium flex items-center gap-1 mb-3">
          <LocateFixed size={11} /> Đang sắp xếp theo khoảng cách gần nhất
        </p>
      )}

      {/* Shelter List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
              <div className="h-28 bg-muted rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      ) : filteredShelters.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">{t('shelters.noShelters')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredShelters.map(shelter => {
            const available = shelter.available_beds ?? ((shelter.capacity ?? 0) - (shelter.current_occupancy ?? 0));
            const capacity = shelter.capacity ?? 0;
            const occupancyPct = capacity > 0 ? Math.round(((capacity - available) / capacity) * 100) : 0;
            const isFull = available <= 0 || shelter.status === 'full';
            const isClosed = shelter.status === 'closed' || shelter.status === 'maintenance';
            const hasCoords = !!shelter.location?.lat;
            const distance = hasCoords && userCoords
              ? getDistance(shelter.location!.lat, shelter.location!.lng, userCoords.lat, userCoords.lng)
              : null;

            const statusLabel = isClosed
              ? (shelter.status === 'maintenance' ? 'Bảo trì' : 'Đóng cửa')
              : isFull ? 'Gần đầy' : 'Còn chỗ';
            const statusStyle = isClosed
              ? 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
              : isFull
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                : 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400';

            return (
              <div key={shelter.id} className={`bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-border/50 ${isClosed ? 'opacity-60' : ''}`}>
                {/* Name + Status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <h3 className="font-bold text-[15px] leading-snug truncate">{shelter.name}</h3>
                    {shelter.is_flood_safe && (
                      <ShieldCheck size={14} className="text-blue-500 shrink-0" />
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${statusStyle}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Address */}
                {shelter.address && (
                  <div className="flex items-start gap-1.5 text-[13px] text-muted-foreground mb-3">
                    <MapPin size={13} className="shrink-0 mt-0.5" />
                    <span>{shelter.address}</span>
                  </div>
                )}

                {/* Capacity bar */}
                <div className="mb-3">
                  <div className="h-[6px] bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        occupancyPct > 90 ? 'bg-red-500' : occupancyPct > 70 ? 'bg-orange-400' : 'bg-green-500'
                      }`}
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {available}/{capacity} chỗ trống
                  </p>
                </div>

                {/* Facilities */}
                {shelter.facilities && shelter.facilities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {shelter.facilities.map(f => (
                      <span key={f} className="text-[11px] bg-muted/60 text-muted-foreground rounded-lg px-2.5 py-1">
                        {FACILITY_EMOJI[f] ?? f}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer: distance + actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    {distance !== null && (
                      <span className="text-[12px] text-muted-foreground flex items-center gap-1">
                        📍 {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)} km`}
                      </span>
                    )}
                    {shelter.contact_phone && (
                      <a href={`tel:${shelter.contact_phone}`} className="text-[12px] text-primary flex items-center gap-1">
                        <Phone size={11} /> {shelter.contact_phone}
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => openGoogleMaps(shelter)}
                    disabled={!hasCoords}
                    className="text-[12px] font-semibold text-primary border border-primary rounded-lg px-3.5 py-1.5 hover:bg-primary/5 transition-colors disabled:opacity-40"
                  >
                    Chỉ đường
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
