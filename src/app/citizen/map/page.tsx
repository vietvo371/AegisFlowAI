'use client';

import * as React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import {
  fetchEvacuationRoute, fetchNearbyEvacuationPoints,
  reverseGeocode, type LatLng, type EvacuationRoute
} from '@/lib/openmap';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Home, Navigation, MapPin, LocateFixed, RefreshCw,
  ChevronUp, ChevronDown, Waves, Clock, Route,
  AlertTriangle, Phone, X
} from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/map/MapComponent'), { ssr: false });

interface Shelter {
  id: number;
  name: string;
  address: string;
  status: string;
  capacity: number;
  current_occupancy: number;
  available_beds: number;
  is_flood_safe: boolean;
  location?: { lat: number; lng: number };
  contact_phone?: string;
  district?: { name: string };
}

type SheetTab = 'shelters' | 'route' | 'nearby';

export default function CitizenMapPage() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<SheetTab>('shelters');
  const [evacuationRoute, setEvacuationRoute] = useState<EvacuationRoute | null>(null);

  // Route finder state
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  // Nearby state
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyType, setNearbyType] = useState<'school' | 'hospital'>('school');

  const fetchShelters = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shelters', { params: { per_page: 20 } });
      setShelters(res.data?.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchShelters(); }, []);

  // Get user GPS
  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) { toast.error('Trình duyệt không hỗ trợ GPS'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Đã lấy vị trí của bạn');
        setLocating(false);
      },
      () => { toast.error('Không lấy được GPS'); setLocating(false); }
    );
  }, []);

  // Find route to shelter
  const handleFindRoute = async (shelter: Shelter) => {
    if (!userLocation) { toast.error('Vui lòng lấy vị trí GPS trước'); return; }
    if (!shelter.location) { toast.error('Shelter chưa có tọa độ'); return; }

    setSelectedShelter(shelter);
    setRouteLoading(true);
    setRouteInfo(null);

    try {
      const result = await fetchEvacuationRoute(
        userLocation,
        shelter.location,
        'car'
      );

      if (result) {
        setEvacuationRoute({
          polyline: result.polyline,
          origin: userLocation,
          destination: shelter.location,
          label: `→ ${shelter.name}`,
        });
        setRouteInfo({ distance: result.distance.text, duration: result.duration.text });
        setActiveTab('route');
        toast.success(`Tìm được tuyến đường đến ${shelter.name}`);
      } else {
        toast.error('Không tìm được tuyến đường');
      }
    } catch (e) {
      toast.error('Lỗi khi tìm đường');
    } finally {
      setRouteLoading(false);
    }
  };

  // Find nearby evacuation points
  const handleFindNearby = async () => {
    if (!userLocation) { toast.error('Vui lòng lấy vị trí GPS trước'); return; }
    setNearbyLoading(true);
    try {
      const places = await fetchNearbyEvacuationPoints(userLocation, 3000, nearbyType);
      setNearbyPlaces(places);
      if (places.length === 0) toast.info('Không tìm thấy địa điểm gần đây');
    } catch (e) {
      toast.error('Lỗi khi tìm địa điểm');
    } finally {
      setNearbyLoading(false);
    }
  };

  const clearRoute = () => {
    setEvacuationRoute(null);
    setSelectedShelter(null);
    setRouteInfo(null);
  };

  const openGoogleMaps = (dest: LatLng) => {
    const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
    const url = origin
      ? `https://maps.google.com/?saddr=${origin}&daddr=${dest.lat},${dest.lng}`
      : `https://maps.google.com/?q=${dest.lat},${dest.lng}`;
    window.open(url, '_blank');
  };

  const TABS: { id: SheetTab; label: string; icon: React.ElementType }[] = [
    { id: 'shelters', label: 'Tị nạn',   icon: Home },
    { id: 'route',    label: 'Tìm đường', icon: Route },
    { id: 'nearby',   label: 'Gần đây',  icon: MapPin },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] relative">
      {/* Map */}
      <div className="flex-1 relative">
        <MapComponent evacuationRoute={evacuationRoute ?? undefined} />

        {/* Map overlay badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-background/90 backdrop-blur border border-border shadow text-xs font-bold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Bản đồ ngập lụt · Đà Nẵng
          </div>
          {routeInfo && (
            <div className="px-3 py-2 rounded-xl bg-primary/90 backdrop-blur text-primary-foreground text-xs font-bold flex items-center gap-3">
              <Route size={12} />
              <span>{routeInfo.distance}</span>
              <span>·</span>
              <Clock size={12} />
              <span>{routeInfo.duration}</span>
              <button onClick={clearRoute} className="ml-1 opacity-70 hover:opacity-100">
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* GPS button */}
        <button
          onClick={handleGetLocation}
          disabled={locating}
          className="absolute top-3 right-3 z-10 w-10 h-10 rounded-xl bg-background/90 backdrop-blur border border-border shadow flex items-center justify-center text-primary hover:bg-background transition-colors"
        >
          <LocateFixed size={18} className={locating ? 'animate-spin' : ''} />
        </button>

        {userLocation && (
          <div className="absolute top-16 right-3 z-10 px-2 py-1 rounded-lg bg-emerald-500/90 text-white text-[10px] font-bold">
            GPS ✓
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      <div className={`bg-background border-t border-border transition-all duration-300 ${sheetOpen ? 'max-h-72' : 'max-h-12'}`}>
        {/* Sheet handle */}
        <div
          onClick={() => setSheetOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            {TABS.map(tab => (
              <div
                key={tab.id}
                onClick={e => { e.stopPropagation(); setActiveTab(tab.id); setSheetOpen(true); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon size={11} />
                {tab.label}
              </div>
            ))}
          </div>
          {sheetOpen ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronUp size={16} className="text-muted-foreground" />}
        </div>

        {/* Sheet content */}
        {sheetOpen && (
          <div className="overflow-y-auto max-h-56 px-4 pb-4 space-y-2">

            {/* Tab: Shelters */}
            {activeTab === 'shelters' && (
              <>
                {loading ? (
                  <div className="flex justify-center py-4"><RefreshCw size={16} className="animate-spin text-muted-foreground" /></div>
                ) : shelters.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Chưa có dữ liệu điểm tị nạn.</p>
                ) : (
                  shelters.map(s => {
                    const isFull = s.status === 'full' || (s.capacity > 0 && s.current_occupancy >= s.capacity);
                    return (
                      <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-muted/30">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isFull ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          <Home size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{s.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{s.address}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={`text-[9px] ${isFull ? 'bg-red-500' : 'bg-emerald-500'} text-white`}>
                              {isFull ? 'Đầy' : `${s.available_beds} chỗ trống`}
                            </Badge>
                            {s.is_flood_safe && <span className="text-[9px] text-blue-500 font-bold">Cao ráo ✓</span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-primary border-primary/30"
                            onClick={() => handleFindRoute(s)}
                            disabled={routeLoading}
                            title="Tìm đường"
                          >
                            {routeLoading && selectedShelter?.id === s.id
                              ? <RefreshCw size={11} className="animate-spin" />
                              : <Navigation size={11} />
                            }
                          </Button>
                          {s.contact_phone && (
                            <a href={`tel:${s.contact_phone}`}>
                              <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-muted-foreground" title="Gọi điện">
                                <Phone size={11} />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* Tab: Route */}
            {activeTab === 'route' && (
              <div className="space-y-3 pt-1">
                {!userLocation ? (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-xs text-muted-foreground">Cần vị trí GPS để tìm đường</p>
                    <Button size="sm" onClick={handleGetLocation} disabled={locating} className="gap-2">
                      <LocateFixed size={14} className={locating ? 'animate-spin' : ''} />
                      Lấy vị trí GPS
                    </Button>
                  </div>
                ) : !evacuationRoute ? (
                  <div className="text-center py-4 space-y-2">
                    <Route size={28} className="mx-auto text-muted-foreground opacity-40" />
                    <p className="text-xs text-muted-foreground">Chọn điểm tị nạn ở tab "Tị nạn" để tìm đường</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary">
                        <Route size={14} /> Tuyến đường sơ tán
                      </div>
                      {selectedShelter && (
                        <p className="text-xs font-semibold">{selectedShelter.name}</p>
                      )}
                      {routeInfo && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Navigation size={11} /> {routeInfo.distance}</span>
                          <span className="flex items-center gap-1"><Clock size={11} /> {routeInfo.duration}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {selectedShelter?.location && (
                        <Button
                          size="sm"
                          className="flex-1 gap-2 h-9 text-xs"
                          onClick={() => openGoogleMaps(selectedShelter.location!)}
                        >
                          <Navigation size={12} /> Mở Google Maps
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-9 text-xs gap-1" onClick={clearRoute}>
                        <X size={12} /> Xóa
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Nearby */}
            {activeTab === 'nearby' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 p-1 bg-muted rounded-lg flex-1">
                    {(['school', 'hospital'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setNearbyType(t)}
                        className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                          nearbyType === t ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {t === 'school' ? '🏫 Trường học' : '🏥 Bệnh viện'}
                      </button>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleFindNearby}
                    disabled={nearbyLoading || !userLocation}
                    className="h-9 gap-1 text-xs shrink-0"
                  >
                    {nearbyLoading
                      ? <RefreshCw size={12} className="animate-spin" />
                      : <MapPin size={12} />
                    }
                    Tìm
                  </Button>
                </div>

                {!userLocation && (
                  <div className="text-center py-3">
                    <p className="text-xs text-muted-foreground mb-2">Cần GPS để tìm địa điểm gần đây</p>
                    <Button size="sm" variant="outline" onClick={handleGetLocation} disabled={locating} className="gap-2">
                      <LocateFixed size={12} className={locating ? 'animate-spin' : ''} /> Lấy GPS
                    </Button>
                  </div>
                )}

                {nearbyPlaces.length > 0 && (
                  <div className="space-y-2">
                    {nearbyPlaces.slice(0, 5).map((place, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-muted/30">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 text-sm">
                          {nearbyType === 'school' ? '🏫' : '🏥'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{place.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{place.address}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0 shrink-0 text-primary border-primary/30"
                          onClick={() => place.location && openGoogleMaps(place.location)}
                          title="Chỉ đường"
                        >
                          <Navigation size={11} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {nearbyPlaces.length === 0 && !nearbyLoading && userLocation && (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    Nhấn "Tìm" để tìm {nearbyType === 'school' ? 'trường học' : 'bệnh viện'} gần bạn
                  </p>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
