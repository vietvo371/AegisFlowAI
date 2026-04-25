'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, Building2, Droplets, Wind, Navigation,
  LocateFixed, Layers, X, Phone
} from 'lucide-react';
import Link from 'next/link';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

const TYPE_ICONS: Record<string, string> = {
  flood_warning: '🌊',
  heavy_rain: '🌧️',
  dam_warning: '⚠️',
  evacuation: '🚨',
  all_clear: '✅',
  weather: '🌤️',
};

interface MapAlert {
  id: number;
  title: string;
  description?: string;
  alert_type: string;
  severity: string;
  status: string;
  affected_districts?: number[];
  geometry?: any;
  created_at: string;
}

interface MapShelter {
  id: number;
  name: string;
  address: string;
  capacity: number;
  current_occupancy?: number;
  available_spots?: number;
  latitude: number;
  longitude: number;
  type: string;
  facilities?: string[];
}

interface MapFloodZone {
  id: number;
  name: string;
  severity: string;
  risk_level: string;
  geometry: any;
}

interface GeoJSONFeature {
  type: string;
  geometry: { type: string; coordinates: number[] | number[][] | number[][][] };
  properties: Record<string, any>;
}

// FlyTo component to programmatically move the map
function FlyToAlert({ selectedAlert }: { selectedAlert: MapAlert | null }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedAlert) return;
    // Try to get coords from geometry or use Danang center
    const coords = selectedAlert.geometry?.coordinates;
    if (coords && Array.isArray(coords)) {
      const [lng, lat] = coords;
      map.flyTo([lat, lng], 14, { duration: 1.2 });
    } else {
      // Fly to Danang center if no geometry
      map.flyTo([16.0544, 108.2022], 13, { duration: 1.2 });
    }
  }, [selectedAlert, map]);
  return null;
}

export default function CitizenMapInner() {
  const t = useTranslations('citizen.map');
  const searchParams = useSearchParams();
  const [alerts, setAlerts] = useState<MapAlert[]>([]);
  const [shelters, setShelters] = useState<MapShelter[]>([]);
  const [floodZones, setFloodZones] = useState<GeoJSONFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLayers, setActiveLayers] = useState({
    alerts: true,
    shelters: true,
    floodZones: false,
  });
  const [selectedAlert, setSelectedAlert] = useState<MapAlert | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [showLayers, setShowLayers] = useState(false);

  // Initialize from URL param
  useEffect(() => {
    const alertId = searchParams.get('alert');
    if (alertId) {
      const id = parseInt(alertId);
      setSelectedAlert(prev => prev?.id === id ? prev : null);
      // Will be set after alerts load
    }
  }, [searchParams]);

  const fetchMapData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, sheltersRes, floodRes] = await Promise.allSettled([
        api.get('/alerts', { params: { status: 'active', per_page: 50 } }),
        api.get('/shelters', { params: { per_page: 100 } }),
        api.get('/flood-zones/geojson'),
      ]);

      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value.data?.data ?? []);
      }
      if (sheltersRes.status === 'fulfilled') {
        setShelters(sheltersRes.value.data?.data ?? []);
      }
      if (floodRes.status === 'fulfilled') {
        const geojson = floodRes.value.data;
        setFloodZones(geojson?.features ?? []);
      }
    } catch (e) {
      console.error('[CitizenMap] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // Set selected alert from URL after alerts load
  useEffect(() => {
    const alertId = searchParams.get('alert');
    if (alertId && alerts.length > 0) {
      const id = parseInt(alertId);
      const found = alerts.find(a => a.id === id);
      if (found) setSelectedAlert(found);
    }
  }, [alerts, searchParams]);

  // Real-time updates
  useEffect(() => {
    const handler = () => fetchMapData();
    window.addEventListener('aegis:alert:created', handler);
    return () => window.removeEventListener('aegis:alert:created', handler);
  }, [fetchMapData]);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const activeAlertCount = alerts.filter(a => a.status === 'active').length;
  const shelterCount = shelters.length;

  return (
    <div className="relative w-full h-full">
      {/* Map */}
      <MapContainer
        center={[16.0544, 108.2022]}
        zoom={13}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Flood zones */}
        {activeLayers.floodZones && floodZones.map((zone, i) => {
          const coords0 = zone.geometry?.coordinates?.[0];
          const coords = Array.isArray(coords0) ? coords0[0] : null;
          if (!coords || !Array.isArray(coords)) return null;
          const [lng, lat] = coords;
          const riskColors: Record<string, string> = {
            high: '#ef444480',
            medium: '#f9731680',
            low: '#eab30850',
          };
          return (
            <CircleMarker
              key={`zone-${i}`}
              center={[lat, lng]}
              radius={40}
              pathOptions={{
                color: riskColors[zone.properties?.risk_level] ?? '#f97316',
                fillColor: riskColors[zone.properties?.risk_level] ?? '#f97316',
                fillOpacity: 0.3,
                weight: 2,
                dashArray: '5, 5',
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{zone.properties?.name ?? 'Vùng ngập'}</p>
                  <p className="text-xs text-muted-foreground">
                    Mức rủi ro: <span className="font-medium">{zone.properties?.risk_level}</span>
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Shelters */}
        {activeLayers.shelters && shelters.map(shelter => {
          if (!shelter.latitude || !shelter.longitude) return null;
          return (
          <Marker
            key={`shelter-${shelter.id}`}
            position={[Number(shelter.latitude), Number(shelter.longitude)]}
            icon={L.divIcon({
              html: `<div style="
                width:36px;height:36px;border-radius:50%;
                background:#3b82f6;border:3px solid white;
                box-shadow:0 2px 8px rgba(0,0,0,0.3);
                display:flex;align-items:center;justify-content:center;
                font-size:16px;
              ">🏠</div>`,
              className: '',
              iconSize: [36, 36],
              iconAnchor: [18, 18],
            })}
          >
            <Popup>
              <div className="text-sm min-w-[200px]">
                <p className="font-bold text-sm mb-1">{shelter.name}</p>
                <p className="text-xs text-muted-foreground mb-2">{shelter.address}</p>
                <div className="flex gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {shelter.available_spots ?? shelter.capacity} chỗ trống
                  </Badge>
                  <Badge variant="secondary" className="text-xs">{shelter.type}</Badge>
                </div>
                <Link href="/citizen/shelters">
                  <Button size="sm" className="w-full text-xs h-7">
                    <Navigation size={10} className="mr-1" /> Chỉ đường
                  </Button>
                </Link>
              </div>
            </Popup>
          </Marker>
          );
        })}

        {/* Alerts */}
        {activeLayers.alerts && alerts.map(alert => {
          const color = SEVERITY_COLORS[alert.severity] ?? '#3b82f6';
          const isSelected = selectedAlert?.id === alert.id;
          return (
            <CircleMarker
              key={`alert-${alert.id}`}
              center={[16.0544 + (Math.random() - 0.5) * 0.02, 108.2022 + (Math.random() - 0.5) * 0.03]}
              radius={isSelected ? 18 : alert.severity === 'critical' ? 16 : alert.severity === 'high' ? 13 : 10}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.7,
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{
                click: () => setSelectedAlert(alert),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{alert.title}</p>
                  {alert.description && (
                    <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                  )}
                  <p className="text-xs mt-2 font-medium">
                    {TYPE_ICONS[alert.alert_type]} {alert.alert_type.replace('_', ' ')}
                    {' · '}
                    <span style={{ color }}>{alert.severity}</span>
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* User location */}
        {userLocation && userLocation.lat && userLocation.lng && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={10}
            pathOptions={{
              color: '#22c55e',
              fillColor: '#22c55e',
              fillOpacity: 0.9,
              weight: 3,
            }}
          >
            <Popup>
              <p className="text-sm font-medium">Vị trí của bạn</p>
            </Popup>
          </CircleMarker>
        )}

        {/* Fly to selected alert */}
        <FlyToAlert selectedAlert={selectedAlert} />
      </MapContainer>

      {/* Top-right controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-[1000]">
        {/* Locate me */}
        <button
          onClick={handleLocate}
          className="w-11 h-11 bg-white dark:bg-zinc-900 rounded-xl shadow-lg flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          title="Vị trí của tôi"
        >
          <LocateFixed size={18} className={locating ? 'animate-pulse text-primary' : 'text-zinc-700 dark:text-zinc-300'} />
        </button>

        {/* Layer toggle */}
        <button
          onClick={() => setShowLayers(!showLayers)}
          className="w-11 h-11 bg-white dark:bg-zinc-900 rounded-xl shadow-lg flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          title="Lớp bản đồ"
        >
          <Layers size={18} className="text-zinc-700 dark:text-zinc-300" />
        </button>
      </div>

      {/* Layer panel */}
      {showLayers && (
        <div className="absolute top-3 right-16 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border p-3 z-[1000] min-w-[180px]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Lớp</p>
            <button onClick={() => setShowLayers(false)} className="p-1 hover:bg-muted rounded">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {[
              { key: 'alerts', icon: <AlertTriangle size={14} className="text-red-500" />, label: 'Cảnh báo', count: activeAlertCount },
              { key: 'shelters', icon: <Building2 size={14} className="text-blue-500" />, label: 'Điểm sơ tán', count: shelterCount },
              { key: 'floodZones', icon: <Droplets size={14} className="text-orange-500" />, label: 'Vùng ngập', count: floodZones.length },
            ].map(layer => (
              <label key={layer.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeLayers[layer.key as keyof typeof activeLayers]}
                  onChange={() => setActiveLayers(prev => ({ ...prev, [layer.key]: !prev[layer.key as keyof typeof prev] }))}
                  className="rounded"
                />
                {layer.icon}
                <span className="text-sm flex-1">{layer.label}</span>
                <Badge variant="secondary" className="text-[10px] h-4">{layer.count}</Badge>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Bottom legend */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur rounded-2xl shadow-xl border px-4 py-2 z-[1000] flex items-center gap-4">
        {[
          { color: '#ef4444', label: 'Nguy hiểm' },
          { color: '#f97316', label: 'Nghiêm trọng' },
          { color: '#eab308', label: 'Cảnh báo' },
          { color: '#3b82f6', label: 'Lưu ý' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 border-l border-border pl-3">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-[11px] font-medium text-muted-foreground">Điểm sơ tán</span>
        </div>
      </div>

      {/* Alert detail card */}
      {selectedAlert && (
        <div className="absolute bottom-4 right-4 w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border overflow-hidden z-[1000]">
          <div className="p-3 border-b flex items-start justify-between gap-2"
            style={{ borderColor: SEVERITY_COLORS[selectedAlert.severity] + '40', backgroundColor: SEVERITY_COLORS[selectedAlert.severity] + '10' }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} style={{ color: SEVERITY_COLORS[selectedAlert.severity] }} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-sm leading-snug">{selectedAlert.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {new Date(selectedAlert.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
            <button onClick={() => setSelectedAlert(null)} className="p-1 hover:bg-muted rounded shrink-0">
              <X size={14} />
            </button>
          </div>
          {selectedAlert.description && (
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground leading-relaxed">{selectedAlert.description}</p>
            </div>
          )}
          <div className="px-3 py-2 flex gap-2">
            <Badge variant="outline" className="text-[10px]">
              {TYPE_ICONS[selectedAlert.alert_type]} {selectedAlert.alert_type.replace('_', ' ')}
            </Badge>
            <Badge className="text-[10px] text-white" style={{ backgroundColor: SEVERITY_COLORS[selectedAlert.severity] }}>
              {selectedAlert.severity}
            </Badge>
          </div>
          <div className="p-3 pt-1 flex gap-2">
            <Link href="/citizen/shelters" className="flex-1">
              <Button size="sm" variant="outline" className="w-full text-xs h-8">
                <Building2 size={12} className="mr-1" /> Điểm sơ tán
              </Button>
            </Link>
            <a href="tel:113" className="flex-1">
              <Button size="sm" className="w-full text-xs h-8 bg-red-600 hover:bg-red-700">
                <Phone size={12} className="mr-1" /> Gọi 113
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
