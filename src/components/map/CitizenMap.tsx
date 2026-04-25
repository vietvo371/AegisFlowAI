'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from '@openmapvn/openmapvn-gl';
import '@openmapvn/openmapvn-gl/dist/maplibre-gl.css';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Layers, LocateFixed, X, AlertTriangle, Building2,
  Droplets, Navigation, Phone, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

interface GeoJsonFeature {
  type: 'Feature';
  id?: number | string;
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: number[] | number[][] | number[][][] };
}

interface MapAlert {
  id: number;
  title: string;
  description?: string;
  alert_type: string;
  severity: string;
  status: string;
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

// ─── Constants ────────────────────────────────────────────────────────────────

const DA_NANG_CENTER: [number, number] = [108.2022, 16.0544];
const DEFAULT_ZOOM = 13;

const OPENMAP_STYLE = `https://tiles.openmap.vn/styles/day-v1/style.json?apikey=${process.env.NEXT_PUBLIC_OPENMAP_API_KEY}`;

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#3B82F6',
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Nguy hiểm',
  high: 'Nghiêm trọng',
  medium: 'Cảnh báo',
  low: 'Thấp',
};

const ALERT_TYPE_ICONS: Record<string, string> = {
  flood_warning: '🌊',
  heavy_rain: '🌧️',
  dam_warning: '⚠️',
  evacuation: '🚨',
  all_clear: '✅',
  weather: '🌤️',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function upsertGeoJSON(m: maplibregl.Map, id: string, data: GeoJsonFeatureCollection) {
  const src = m.getSource(id) as maplibregl.GeoJSONSource | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safe: any = data;
  if (src) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (src as any).setData(safe);
  } else {
    m.addSource(id, { type: 'geojson', data: safe });
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CitizenMap() {
  const t = useTranslations('citizen.map');
  const tLegend = useTranslations('dashboard.legend');
  const searchParams = useSearchParams();

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [locating, setLocating] = useState(false);

  const [alerts, setAlerts] = useState<MapAlert[]>([]);
  const [shelters, setShelters] = useState<MapShelter[]>([]);
  const [floodZones, setFloodZones] = useState<GeoJsonFeatureCollection>({ type: 'FeatureCollection', features: [] });

  const [activeLayers, setActiveLayers] = useState({
    alerts: true,
    shelters: true,
    floodZones: false,
  });

  const [selectedAlert, setSelectedAlert] = useState<MapAlert | null>(null);

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
        setFloodZones(floodRes.value.data ?? { type: 'FeatureCollection', features: [] });
      }
    } catch (e) {
      console.error('[CitizenMap] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load selected alert from URL
  useEffect(() => {
    const alertId = searchParams.get('alert');
    if (alertId && alerts.length > 0) {
      const id = parseInt(alertId);
      const found = alerts.find(a => a.id === id);
      if (found) {
        setSelectedAlert(found);
        if (map.current && mapReady) {
          const coords = found.geometry?.coordinates;
          if (coords && Array.isArray(coords)) {
            const [lng, lat] = coords;
            map.current.flyTo({ center: [lng, lat], zoom: 14, duration: 1200 });
          }
        }
      }
    }
  }, [alerts, searchParams, mapReady]);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: OPENMAP_STYLE,
      center: DA_NANG_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    map.current.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    const ro = new ResizeObserver(() => map.current?.resize());
    ro.observe(mapContainer.current);

    map.current.on('load', () => {
      if (!map.current) return;
      const m = map.current;

      // ── Add custom icons ───────────────────────────────────────────────
      const icons = [
        {
          id: 'icon-alert-critical',
          svg: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="#EF4444" stroke="white" stroke-width="2.5"/>
            <text x="18" y="23" text-anchor="middle" font-size="16" fill="white">🚨</text>
          </svg>`,
        },
        {
          id: 'icon-alert-high',
          svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="#F97316" stroke="white" stroke-width="2.5"/>
            <text x="16" y="21" text-anchor="middle" font-size="14" fill="white">⚠️</text>
          </svg>`,
        },
        {
          id: 'icon-alert-medium',
          svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="12" fill="#EAB308" stroke="white" stroke-width="2"/>
            <text x="14" y="19" text-anchor="middle" font-size="12" fill="white">⚡</text>
          </svg>`,
        },
        {
          id: 'icon-alert-low',
          svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
            <text x="12" y="17" text-anchor="middle" font-size="10" fill="white">ℹ️</text>
          </svg>`,
        },
        {
          id: 'icon-shelter',
          svg: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="#3B82F6" stroke="white" stroke-width="2.5"/>
            <text x="18" y="23" text-anchor="middle" font-size="18" fill="white">🏠</text>
          </svg>`,
        },
        {
          id: 'icon-user-loc',
          svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#22C55E" stroke="white" stroke-width="2"/>
            <circle cx="12" cy="12" r="4" fill="white"/>
          </svg>`,
        },
      ];

      icons.forEach(({ id, svg }) => {
        const img = new Image(24, 24);
        img.onload = () => {
          if (!m.hasImage(id)) m.addImage(id, img);
        };
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      });

      // ── Alerts source & layers ───────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      m.addSource('alerts', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } as any });

      m.addLayer({
        id: 'layer-alerts-circles',
        type: 'circle',
        source: 'alerts',
        paint: {
          'circle-radius': ['match', ['get', 'severity'], 'critical', 14, 'high', 11, 'medium', 8, 6],
          'circle-color': ['match', ['get', 'severity'], 'critical', '#EF4444', 'high', '#F97316', 'medium', '#EAB308', '#3B82F6'],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': 'white',
        },
      });

      m.addLayer({
        id: 'layer-alerts-labels',
        type: 'symbol',
        source: 'alerts',
        layout: {
          'text-field': ['get', 'alert_icon'],
          'text-size': 14,
          'text-allow-overlap': true,
        },
      });

      // ── Shelters source & layers ─────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      m.addSource('shelters', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } as any });

      m.addLayer({
        id: 'layer-shelters',
        type: 'symbol',
        source: 'shelters',
        layout: {
          'icon-image': 'icon-shelter',
          'icon-size': 1,
          'icon-allow-overlap': true,
          'icon-anchor': 'bottom',
        },
      });

      // ── Flood zones source & layers ─────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      m.addSource('flood_zones', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } as any });

      m.addLayer({
        id: 'layer-flood-zones-fill',
        type: 'fill',
        source: 'flood_zones',
        paint: {
          'fill-color': [
            'match', ['get', 'risk_level'],
            'critical', '#EF4444',
            'high',     '#F97316',
            'medium',   '#EAB308',
            '#3B82F6',
          ],
          'fill-opacity': 0.15,
        },
      });

      m.addLayer({
        id: 'layer-flood-zones-outline',
        type: 'line',
        source: 'flood_zones',
        paint: {
          'line-color': [
            'match', ['get', 'risk_level'],
            'critical', '#EF4444',
            'high',     '#F97316',
            '#3B82F6',
          ],
          'line-width': 2,
          'line-opacity': 0.7,
          'line-dasharray': [3, 2],
        },
      });

      setMapReady(true);
    });

    return () => {
      ro.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Load data & update map layers
  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // Real-time updates
  useEffect(() => {
    const handler = () => fetchMapData();
    window.addEventListener('aegis:alert:created', handler);
    return () => window.removeEventListener('aegis:alert:created', handler);
  }, [fetchMapData]);

  // Update GeoJSON sources when data changes
  useEffect(() => {
    if (!mapReady || !map.current) return;
    const m = map.current;

    // Convert alerts to GeoJSON
    const alertFeatures: GeoJsonFeature[] = alerts.map(a => {
      const iconMap: Record<string, string> = {
        critical: '🚨', high: '⚠️', medium: '⚡', low: 'ℹ️',
      };
      // Use centroid or default location
      const coords = a.geometry?.coordinates ?? [108.2022, 16.0544];
      return {
        type: 'Feature',
        id: a.id,
        properties: {
          ...a,
          alert_icon: iconMap[a.severity] ?? 'ℹ️',
        },
        geometry: { type: 'Point', coordinates: coords },
      } as GeoJsonFeature;
    });

    upsertGeoJSON(m, 'alerts', { type: 'FeatureCollection', features: alertFeatures });
    upsertGeoJSON(m, 'shelters', {
      type: 'FeatureCollection',
      features: shelters
        .filter(s => s.latitude && s.longitude)
        .map(s => ({
          type: 'Feature',
          id: s.id,
          properties: { ...s },
          geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] },
        })),
    });
    upsertGeoJSON(m, 'flood_zones', floodZones);

    // Sync visibility
    const alertsVisible = activeLayers.alerts ? 'visible' : 'none';
    const sheltersVisible = activeLayers.shelters ? 'visible' : 'none';
    const floodZonesVisible = activeLayers.floodZones ? 'visible' : 'none';

    if (m.getLayer('layer-alerts-circles')) m.setLayoutProperty('layer-alerts-circles', 'visibility', alertsVisible);
    if (m.getLayer('layer-alerts-labels')) m.setLayoutProperty('layer-alerts-labels', 'visibility', alertsVisible);
    if (m.getLayer('layer-shelters')) m.setLayoutProperty('layer-shelters', 'visibility', sheltersVisible);
    if (m.getLayer('layer-flood-zones-fill')) m.setLayoutProperty('layer-flood-zones-fill', 'visibility', floodZonesVisible);
    if (m.getLayer('layer-flood-zones-outline')) m.setLayoutProperty('layer-flood-zones-outline', 'visibility', floodZonesVisible);
  }, [alerts, shelters, floodZones, activeLayers, mapReady]);

  // Fly to selected alert
  useEffect(() => {
    if (!mapReady || !map.current || !selectedAlert) return;
    const coords = selectedAlert.geometry?.coordinates;
    if (coords && Array.isArray(coords)) {
      const [lng, lat] = coords;
      if (!isNaN(lng) && !isNaN(lat)) {
        map.current.flyTo({ center: [lng, lat], zoom: 14, duration: 1200 });
      }
    }
  }, [selectedAlert, mapReady]);

  // Click handlers
  useEffect(() => {
    if (!mapReady || !map.current) return;
    const m = map.current;

    const onClick = (e: maplibregl.MapMouseEvent) => {
      const features = m.queryRenderedFeatures(e.point, {
        layers: ['layer-alerts-circles', 'layer-shelters'],
      });

      if (!features.length) {
        popupRef.current?.remove();
        setSelectedAlert(null);
        return;
      }

      const feature = features[0];
      const props = feature.properties as Record<string, unknown>;
      const geom = feature.geometry as { coordinates: number[] };

      if (!geom.coordinates) return;

      const isAlert = feature.layer.id === 'layer-alerts-circles';

      if (isAlert) {
        const alert = alerts.find(a => a.id === props.id);
        if (alert) {
          setSelectedAlert(alert);
          const color = SEVERITY_COLORS[alert.severity] ?? '#3B82F6';
          const icon = ALERT_TYPE_ICONS[alert.alert_type] ?? '⚠️';
          popupRef.current?.remove();
          popupRef.current = new maplibregl.Popup({ offset: 15, closeButton: true, maxWidth: '300px' })
            .setLngLat([geom.coordinates[0], geom.coordinates[1]])
            .setHTML(`
<div style="font-family:system-ui,sans-serif;min-width:220px;max-width:300px">
  <div style="font-size:10px;font-weight:700;color:${color};letter-spacing:.08em;margin-bottom:4px">${icon} CẢNH BÁO</div>
  <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:4px;line-height:1.3">${alert.title}</div>
  ${alert.description ? `<div style="font-size:12px;color:#6B7280;margin-bottom:8px">${alert.description}</div>` : ''}
  <div style="background:#F9FAFB;border-radius:8px;padding:10px;border:1px solid #E5E7EB">
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <span style="background:${color}20;color:${color};border:1px solid ${color}40;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:600">${SEVERITY_LABELS[alert.severity] ?? alert.severity}</span>
      <span style="background:#F3F4F6;color:#6B7280;border-radius:4px;padding:2px 8px;font-size:11px">${alert.alert_type.replace('_', ' ')}</span>
    </div>
  </div>
</div>`)
            .addTo(m);
        }
      }
    };

    m.on('click', onClick);
    m.on('click', (e: maplibregl.MapMouseEvent) => {
      const features = m.queryRenderedFeatures(e.point, { layers: ['layer-alerts-circles', 'layer-shelters'] });
      m.getCanvas().style.cursor = features.length ? 'pointer' : '';
    });

    return () => {
      m.off('click', onClick);
    };
  }, [mapReady, alerts]);

  // Locate user
  const handleLocate = () => {
    if (!navigator.geolocation || !map.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        map.current?.flyTo({ center: [longitude, latitude], zoom: 15, duration: 1000 });
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const alertCount = alerts.filter(a => a.status === 'active').length;
  const shelterCount = shelters.length;
  const floodZoneCount = floodZones.features.length;

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Loading */}
      {loading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-background/90 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 flex items-center gap-2 text-xs shadow">
          <RefreshCw size={12} className="animate-spin text-primary" />
          <span>Đang tải...</span>
        </div>
      )}

      {/* Controls — top right */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
        <button
          onClick={handleLocate}
          className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl shadow-lg flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border border-border/50"
          title="Vị trí của tôi"
        >
          <LocateFixed size={18} className={locating ? 'animate-pulse text-primary' : 'text-zinc-700 dark:text-zinc-300'} />
        </button>
        <button
          onClick={fetchMapData}
          className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl shadow-lg flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border border-border/50"
          title="Làm mới"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin text-primary text-zinc-700 dark:text-zinc-300' : 'text-zinc-700 dark:text-zinc-300'} />
        </button>
        <button
          onClick={() => setShowLayers(v => !v)}
          className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl shadow-lg flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border border-border/50"
          title="Lớp bản đồ"
        >
          <Layers size={18} className="text-zinc-700 dark:text-zinc-300" />
        </button>
      </div>

      {/* Layer panel */}
      {showLayers && (
        <div className="absolute top-3 right-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-border/50 z-20 min-w-[200px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-primary" />
              <p className="text-xs font-bold">Lớp bản đồ</p>
            </div>
            <button onClick={() => setShowLayers(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="p-3 space-y-3">
            {[
              { key: 'alerts', icon: <AlertTriangle size={14} className="text-red-500" />, label: 'Cảnh báo', count: alertCount },
              { key: 'shelters', icon: <Building2 size={14} className="text-blue-500" />, label: 'Điểm sơ tán', count: shelterCount },
              { key: 'floodZones', icon: <Droplets size={14} className="text-orange-500" />, label: 'Vùng ngập', count: floodZoneCount },
            ].map(layer => (
              <label key={layer.key} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative w-10 h-6 rounded-full transition-colors bg-muted group-hover:bg-muted/80">
                  <input
                    type="checkbox"
                    checked={activeLayers[layer.key as keyof typeof activeLayers]}
                    onChange={() => setActiveLayers(prev => ({ ...prev, [layer.key]: !prev[layer.key as keyof typeof prev] }))}
                    className="sr-only"
                  />
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${activeLayers[layer.key as keyof typeof activeLayers] ? 'translate-x-4 bg-primary' : 'translate-x-0'}`} />
                </div>
                {layer.icon}
                <span className="text-sm flex-1 font-medium">{layer.label}</span>
                <Badge variant="secondary" className="text-[10px] h-5">{layer.count}</Badge>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Legend — bottom */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur rounded-2xl shadow-xl border border-border/50 px-4 py-2.5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-[10px] text-muted-foreground font-medium">Nguy hiểm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-[10px] text-muted-foreground font-medium">Nghiêm trọng</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-[10px] text-muted-foreground font-medium">Cảnh báo</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-border/50 pl-3">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-[10px] text-muted-foreground font-medium">Điểm sơ tán</span>
          </div>
        </div>
      </div>

      {/* Alert detail card — bottom right */}
      {selectedAlert && (
        <div className="absolute bottom-4 right-4 w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border overflow-hidden z-30">
          <div
            className="p-3 flex items-start justify-between gap-2"
            style={{ backgroundColor: SEVERITY_COLORS[selectedAlert.severity] + '15', borderBottom: `2px solid ${SEVERITY_COLORS[selectedAlert.severity]}40` }}
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
          <div className="px-3 py-2 flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px]">
              {ALERT_TYPE_ICONS[selectedAlert.alert_type] ?? ''} {selectedAlert.alert_type.replace('_', ' ')}
            </Badge>
            <Badge className="text-[10px] text-white" style={{ backgroundColor: SEVERITY_COLORS[selectedAlert.severity] }}>
              {SEVERITY_LABELS[selectedAlert.severity] ?? selectedAlert.severity}
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
