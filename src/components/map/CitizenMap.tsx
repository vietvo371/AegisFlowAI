'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from '@openmapvn/openmapvn-gl';
import '@openmapvn/openmapvn-gl/dist/maplibre-gl.css';
import api from '@/lib/api';
import { useFeatureStateAnimation } from '@/hooks/useFeatureStateAnimation';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Layers, LocateFixed, X, RefreshCw, Navigation, Phone, Building2, AlertTriangle, Droplets, MapPin, Waves, Map } from 'lucide-react';
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
interface SelectedFeature {
  kind: 'alert' | 'shelter' | 'flood_point' | 'incident';
  props: Record<string, unknown>;
  coords: [number, number];
}

type LayerKey = 'alerts' | 'shelters' | 'flood_zones' | 'flood_points' | 'flood_streets';

function parseJsonProp(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { const p = JSON.parse(val); if (Array.isArray(p)) return p; } catch {} }
  return [];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DA_NANG_CENTER: [number, number] = [108.2022, 16.0544];
const DEFAULT_ZOOM = 13;
const OPENMAP_STYLE = `https://tiles.openmap.vn/styles/day-v1/style.json?apikey=${process.env.NEXT_PUBLIC_OPENMAP_API_KEY}`;

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444', high: '#F97316', medium: '#EAB308', low: '#3B82F6',
};

function waterLevelColor(cm: number): string {
  if (cm >= 75) return '#EF4444';
  if (cm >= 50) return '#F97316';
  if (cm >= 25) return '#3B82F6';
  return '#22C55E';
}

function upsertSource(m: maplibregl.Map, id: string, data: GeoJsonFeatureCollection) {
  const src = m.getSource(id) as maplibregl.GeoJSONSource | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (src) (src as any).setData(data as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  else m.addSource(id, { type: 'geojson', data: data as any });
}

// ─── SVG Icons (same as dashboard MapComponent) ───────────────────────────────

const ICONS = [
  { id: 'icon-shelter', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="34" viewBox="0 0 32 34"><path d="M16 3 L30 15 L27 15 L27 30 L5 30 L5 15 L2 15 Z" fill="#16A34A" stroke="white" stroke-width="2.5" stroke-linejoin="round"/><rect x="12" y="20" width="8" height="10" fill="white" stroke="white" stroke-width="1"/><path d="M16 20 L16 30" stroke="#16A34A" stroke-width="2"/><rect x="10" y="15" width="4" height="6" rx="0.5" fill="white"/><rect x="18" y="15" width="4" height="6" rx="0.5" fill="white"/></svg>` },
  { id: 'icon-alert-critical', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34"><path d="M11 2 L23 2 L32 11 L32 23 L23 32 L11 32 L2 23 L2 11 Z" fill="#EF4444" stroke="white" stroke-width="2.5" stroke-linejoin="round"/><path d="M17 11 L17 19" stroke="white" stroke-width="3" stroke-linecap="round"/><circle cx="17" cy="23" r="2" fill="white"/></svg>` },
  { id: 'icon-alert-high', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34"><path d="M11 2 L23 2 L32 11 L32 23 L23 32 L11 32 L2 23 L2 11 Z" fill="#F97316" stroke="white" stroke-width="2.5" stroke-linejoin="round"/><path d="M17 11 L17 19" stroke="white" stroke-width="3" stroke-linecap="round"/><circle cx="17" cy="23" r="2" fill="white"/></svg>` },
  { id: 'icon-alert-medium', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34"><path d="M11 2 L23 2 L32 11 L32 23 L23 32 L11 32 L2 23 L2 11 Z" fill="#EAB308" stroke="white" stroke-width="2.5" stroke-linejoin="round"/><path d="M17 11 L17 19" stroke="white" stroke-width="3" stroke-linecap="round"/><circle cx="17" cy="23" r="2" fill="white"/></svg>` },
  { id: 'icon-alert-low', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34"><path d="M11 2 L23 2 L32 11 L32 23 L23 32 L11 32 L2 23 L2 11 Z" fill="#3B82F6" stroke="white" stroke-width="2.5" stroke-linejoin="round"/><path d="M17 11 L17 19" stroke="white" stroke-width="3" stroke-linecap="round"/><circle cx="17" cy="23" r="2" fill="white"/></svg>` },
  { id: 'icon-flood-point', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="#3B82F6" stroke="white" stroke-width="2.5"/><path d="M9 14 Q11 11, 13 14 T17 14 T21 14" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M9 18 Q11 15, 13 18 T17 18 T21 18" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/></svg>` },
  { id: 'icon-user-loc', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#22C55E" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="white"/></svg>` },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CitizenMap() {
  const t = useTranslations('citizen.map');
  const searchParams = useSearchParams();

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const dataRef = useRef<Record<string, GeoJsonFeatureCollection>>({});

  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [selected, setSelected] = useState<SelectedFeature | null>(null);
  const [activeLayers, setActiveLayers] = useState<Set<LayerKey>>(
    () => new Set(['alerts', 'shelters', 'flood_zones', 'flood_streets'] as LayerKey[])
  );

  const layerConfigs: Array<{ key: LayerKey; label: string; icon: React.ReactNode; color: string }> = [
    { key: 'flood_zones',   label: t('floodZones'),   icon: <Map size={14} className="text-blue-500" />,     color: '#EF4444' },
    { key: 'flood_streets', label: t('floodStreets'),  icon: <Waves size={14} className="text-blue-500" />,   color: '#3B82F6' },
    { key: 'flood_points',  label: t('floodPoints'),   icon: <Droplets size={14} className="text-blue-500" />, color: '#3B82F6' },
    { key: 'alerts',        label: t('alerts'),        icon: <AlertTriangle size={14} className="text-red-500" />, color: '#EF4444' },
    { key: 'shelters',      label: t('shelters'),      icon: <Building2 size={14} className="text-green-600" />, color: '#16A34A' },
  ];

  // ── Feature animation hook ────────────────────────────────────────────────
  const { highlightFeature, clearHighlight } = useFeatureStateAnimation({
    map,
    sourceId: 'flood_zones',
    animationDuration: 1000,
  });

  // Listen for real-time flood telemetry updates from simulator
  useEffect(() => {
    const handleFloodTelemetry = (event: CustomEvent) => {
      const { zone_id, water_level, severity } = event.detail || {};
      if (zone_id) {
        highlightFeature(zone_id, { water_level, severity });
      }
    };

    window.addEventListener('aegis:flood_telemetry', handleFloodTelemetry as EventListener);
    return () => {
      window.removeEventListener('aegis:flood_telemetry', handleFloodTelemetry as EventListener);
    };
  }, [highlightFeature]);

  const LAYER_MAP: Record<LayerKey, string[]> = {
    flood_zones:   ['layer-flood-zones-fill', 'layer-flood-zones-outline'],
    flood_streets: ['layer-flood-streets'],
    flood_points:  ['layer-flood-points'],
    alerts:        ['layer-alerts'],
    shelters:      ['layer-shelters'],
  };

  // ── Fetch data ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, sheltersRes, floodZonesRes, floodReportsRes] = await Promise.allSettled([
        api.get('/alerts', { params: { status: 'active', per_page: 50 } }),
        api.get('/map/shelters'),
        api.get('/map/flood-zones'),
        api.get('/map/flood-reports'),
      ]);

      const extract = (r: PromiseSettledResult<any>): GeoJsonFeatureCollection =>
        r.status === 'fulfilled' ? r.value.data : { type: 'FeatureCollection', features: [] };

      // Convert alerts list → GeoJSON
      let alertsGeo: GeoJsonFeatureCollection = { type: 'FeatureCollection', features: [] };
      if (alertsRes.status === 'fulfilled') {
        const raw = alertsRes.value.data;
        const items: any[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
        alertsGeo = {
          type: 'FeatureCollection',
          features: items.map((a: any) => ({
            type: 'Feature',
            id: a.id,
            properties: { ...a, icon_id: `icon-alert-${a.severity ?? 'low'}` },
            geometry: a.geometry ?? { type: 'Point', coordinates: [108.2022 + (a.id % 10) * 0.005, 16.0544 + (a.id % 7) * 0.005] },
          })),
        };
      }

      dataRef.current = {
        alerts:       alertsGeo,
        shelters:     extract(sheltersRes),
        flood_zones:  extract(floodZonesRes),
        flood_points: extract(floodReportsRes),
      };

      if (mapReady) renderLayers();
    } catch (e) {
      console.error('[CitizenMap] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch once when mapReady, không re-fetch khi fetchData reference thay đổi
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (mapReady && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchData();
    }
  }, [mapReady, fetchData]);

  // Real-time
  useEffect(() => {
    const h = () => fetchData();
    window.addEventListener('aegis:alert:created', h);
    return () => window.removeEventListener('aegis:alert:created', h);
  }, [fetchData]);

  // ── Render layers ──────────────────────────────────────────────────────────
  const renderLayers = useCallback(() => {
    const m = map.current;
    if (!m) return;

    // Flood zones
    upsertSource(m, 'flood_zones', dataRef.current.flood_zones ?? { type: 'FeatureCollection', features: [] });
    if (!m.getLayer('layer-flood-zones-fill')) {
      m.addLayer({ id: 'layer-flood-zones-fill', type: 'fill', source: 'flood_zones',
        paint: {
          'fill-color': ['match', ['get', 'risk_level'], 'critical', '#EF4444', 'high', '#F97316', 'medium', '#EAB308', '#3B82F6'],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'updated'], false],
            0.35, // animate khi updated
            0.15, // bình thường
          ],
        } });
    }
    if (!m.getLayer('layer-flood-zones-outline')) {
      m.addLayer({ id: 'layer-flood-zones-outline', type: 'line', source: 'flood_zones',
        paint: {
          'line-color': ['match', ['get', 'risk_level'], 'critical', '#EF4444', 'high', '#F97316', '#3B82F6'],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'updated'], false],
            4,   // animate khi updated
            2,   // bình thường
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'updated'], false],
            1.0,
            0.8,
          ],
          'line-dasharray': [3, 2],
        } });
    }

    // Flood reports source (shared for streets + points)
    upsertSource(m, 'flood_reports', dataRef.current.flood_points ?? { type: 'FeatureCollection', features: [] });

    // Flood streets (LineString)
    if (!m.getLayer('layer-flood-streets')) {
      m.addLayer({ id: 'layer-flood-streets', type: 'line', source: 'flood_reports',
        filter: ['==', ['geometry-type'], 'LineString'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#3B82F6'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 15, 5],
          'line-opacity': 0.85,
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }

    // Flood points (circles color-coded by water level)
    if (!m.getLayer('layer-flood-points')) {
      m.addLayer({ id: 'layer-flood-points', type: 'circle', source: 'flood_reports',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 15, 10],
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'updated'], false],
            '#F97316', // orange khi animate
            ['coalesce', ['get', 'color'], '#3B82F6'],
          ],
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'updated'], false],
            4,   // animate khi updated
            2,   // bình thường
          ],
          'circle-stroke-color': [
            'case',
            ['boolean', ['feature-state', 'updated'], false],
            '#FCD34D',
            '#fff',
          ],
          'circle-opacity': [
            'case',
            ['boolean', ['feature-state', 'updated'], false],
            1.0,
            0.9,
          ],
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }

    // Alerts (symbol icons)
    upsertSource(m, 'alerts', dataRef.current.alerts ?? { type: 'FeatureCollection', features: [] });
    if (!m.getLayer('layer-alerts')) {
      m.addLayer({ id: 'layer-alerts', type: 'symbol', source: 'alerts',
        layout: {
          'icon-image': ['coalesce', ['get', 'icon_id'], 'icon-alert-low'],
          'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.7, 15, 1.1],
          'icon-allow-overlap': true, 'icon-anchor': 'center',
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }

    // Shelters (house icon)
    upsertSource(m, 'shelters', dataRef.current.shelters ?? { type: 'FeatureCollection', features: [] });
    if (!m.getLayer('layer-shelters')) {
      m.addLayer({ id: 'layer-shelters', type: 'symbol', source: 'shelters',
        layout: {
          'icon-image': 'icon-shelter',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.7, 15, 1.1],
          'icon-allow-overlap': true, 'icon-anchor': 'bottom',
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }

    syncVisibility(m, activeLayers);
  }, [activeLayers]); // eslint-disable-line react-hooks/exhaustive-deps

  function syncVisibility(m: maplibregl.Map, active: Set<LayerKey>) {
    Object.entries(LAYER_MAP).forEach(([key, layerIds]) => {
      const vis = active.has(key as LayerKey) ? 'visible' : 'none';
      layerIds.forEach(id => { if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', vis); });
    });
  }

  useEffect(() => {
    if (!mapReady || !map.current) return;
    syncVisibility(map.current, activeLayers);
  }, [activeLayers, mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Init map ───────────────────────────────────────────────────────────────
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
    ro.observe(mapContainer.current!);

    map.current.on('load', async () => {
      const m = map.current!;
      await Promise.all(ICONS.map(({ id, svg }) => new Promise<void>(resolve => {
        if (m.hasImage(id)) { resolve(); return; }
        const img = new Image(34, 34);
        img.onload = () => { if (!m.hasImage(id)) m.addImage(id, img); resolve(); };
        img.onerror = () => resolve();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      })));
      setMapReady(true);
    });

    return () => { ro.disconnect(); map.current?.remove(); map.current = null; };
  }, []);

  // Render layers once map is ready
  useEffect(() => {
    if (mapReady) renderLayers();
  }, [mapReady, renderLayers]);

  // ── URL param: focus alert hoặc focus tọa độ từ SOS ──────────────────────
  useEffect(() => {
    if (!mapReady || !map.current) return;

    // Focus tọa độ từ SOS redirect
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const zoom = searchParams.get('zoom');
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        map.current.flyTo({
          center: [lngNum, latNum],
          zoom: zoom ? parseInt(zoom) : 15,
          duration: 1200,
        });
        // Hiện marker vị trí người dùng
        const geo: GeoJsonFeatureCollection = {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lngNum, latNum] } }],
        };
        upsertSource(map.current, 'user_loc', geo);
        if (!map.current.getLayer('layer-user-loc')) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          map.current.addLayer({ id: 'layer-user-loc', type: 'symbol', source: 'user_loc', layout: { 'icon-image': 'icon-user-loc', 'icon-size': 1.2, 'icon-allow-overlap': true } } as any);
        }
        return;
      }
    }

    // Focus alert từ URL
    const alertId = searchParams.get('alert');
    const incidentId = searchParams.get('incident');
    if (!alertId && !incidentId) return;

    const features = dataRef.current.alerts?.features ?? [];
    const targetId = alertId || incidentId;
    const found = features.find(f => String(f.id) === targetId || String(f.properties.id) === targetId);
    if (found) {
      const coords = (found.geometry as any).coordinates as [number, number];
      map.current.flyTo({ center: coords, zoom: 14, duration: 1200 });
      setSelected({ kind: 'alert', props: found.properties, coords });
    } else if (incidentId) {
      api.get(`/incidents/${incidentId}`).then(res => {
        const inc = res.data?.data ?? res.data;
        if (!inc) return;
        const lat = inc.location?.lat ?? 16.0544;
        const lng = inc.location?.lng ?? 108.2022;
        const coords: [number, number] = [lng, lat];
        map.current!.flyTo({ center: coords, zoom: 14, duration: 1200 });
        setSelected({ kind: 'incident', props: inc, coords });
      }).catch(() => {});
    } else if (alertId) {
      // Alert not in GeoJSON yet — fetch directly
      api.get(`/alerts/${alertId}`).then(res => {
        const alert = res.data?.data ?? res.data;
        if (!alert) return;
        const lat = alert.location?.lat ?? alert.geometry?.coordinates?.[1] ?? 16.0544;
        const lng = alert.location?.lng ?? alert.geometry?.coordinates?.[0] ?? 108.2022;
        const coords: [number, number] = [lng, lat];
        map.current!.flyTo({ center: coords, zoom: 14, duration: 1200 });
        setSelected({ kind: 'incident', props: alert, coords });
      }).catch(() => {});
    }
  }, [mapReady, searchParams]);

  // ── Click handlers ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !map.current) return;
    const m = map.current;
    const CLICKABLE = ['layer-alerts', 'layer-shelters', 'layer-flood-points', 'layer-flood-streets'];

    const onClick = (e: maplibregl.MapMouseEvent) => {
      const features = m.queryRenderedFeatures(e.point, { layers: CLICKABLE.filter(l => m.getLayer(l)) });
      if (!features.length) { setSelected(null); return; }

      const feature = features[0];
      const props = feature.properties as Record<string, unknown>;
      const geom = feature.geometry as { coordinates: number[] };
      const coords: [number, number] = [geom.coordinates[0], geom.coordinates[1]];

      if (feature.layer.id === 'layer-alerts') {
        setSelected({ kind: 'alert', props, coords });
        m.flyTo({ center: coords, zoom: 14, duration: 800 });
      } else if (feature.layer.id === 'layer-shelters') {
        setSelected({ kind: 'shelter', props, coords });
        m.flyTo({ center: coords, zoom: 15, duration: 800 });
      } else if (feature.layer.id === 'layer-flood-points' || feature.layer.id === 'layer-flood-streets') {
        setSelected({ kind: 'flood_point', props, coords });
      }
    };

    const onMouseMove = (e: maplibregl.MapMouseEvent) => {
      const f = m.queryRenderedFeatures(e.point, { layers: CLICKABLE.filter(l => m.getLayer(l)) });
      m.getCanvas().style.cursor = f.length ? 'pointer' : '';
    };

    m.on('click', onClick);
    m.on('mousemove', onMouseMove);
    return () => { m.off('click', onClick); m.off('mousemove', onMouseMove); };
  }, [mapReady]);

  // ── Locate user ────────────────────────────────────────────────────────────
  const handleLocate = () => {
    if (!navigator.geolocation || !map.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        map.current?.flyTo({ center: [longitude, latitude], zoom: 15, duration: 1000 });
        // Add user dot
        const m = map.current!;
        const geo: GeoJsonFeatureCollection = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [longitude, latitude] } }] };
        upsertSource(m, 'user_loc', geo);
        if (!m.getLayer('layer-user-loc')) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          m.addLayer({ id: 'layer-user-loc', type: 'symbol', source: 'user_loc', layout: { 'icon-image': 'icon-user-loc', 'icon-size': 1, 'icon-allow-overlap': true } } as any);
        }
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Loading */}
      {loading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-background/90 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 flex items-center gap-2 text-xs shadow">
          <RefreshCw size={12} className="animate-spin text-primary" />
          <span>{t('loading')}</span>
        </div>
      )}

      {/* Controls — top right */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
        <button onClick={handleLocate}
          className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl shadow-lg flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border border-border/50"
          title={t('myLocation')}>
          <LocateFixed size={18} className={locating ? 'animate-pulse text-primary' : 'text-zinc-700 dark:text-zinc-300'} />
        </button>
        <button onClick={fetchData}
          className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl shadow-lg flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border border-border/50"
          title={t('refresh')}>
          <RefreshCw size={18} className={loading ? 'animate-spin text-primary' : 'text-zinc-700 dark:text-zinc-300'} />
        </button>
        <button onClick={() => setShowLayers(v => !v)}
          className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl shadow-lg flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border border-border/50"
          title={t('layers')}>
          <Layers size={18} className="text-zinc-700 dark:text-zinc-300" />
        </button>
      </div>

      {/* Layer panel */}
      {showLayers && (
        <div className="absolute top-3 right-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-border/50 z-20 w-52 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/40">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Layers size={13} className="text-primary" /> {t('layers')}
            </div>
            <button onClick={() => setShowLayers(false)} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>
          <div className="py-1">
            {layerConfigs.map(cfg => {
              const on = activeLayers.has(cfg.key);
              return (
                <button key={cfg.key}
                  onClick={() => setActiveLayers(prev => { const n = new Set(prev); n.has(cfg.key) ? n.delete(cfg.key) : n.add(cfg.key); return n; })}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs hover:bg-muted/60 transition-colors">
                  <span className="w-5 flex items-center justify-center">{cfg.icon}</span>
                  <span className={`flex-1 text-left ${on ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{cfg.label}</span>
                  <span className={`relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                    <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform mt-0.5 ${on ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend — toggle button bottom-left */}
      <div className="absolute bottom-4 left-4 z-10">
        <button
          onClick={() => setShowLegend(v => !v)}
          className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur rounded-xl shadow-xl border border-border/50 px-3 py-2 flex items-center gap-2 text-xs font-medium hover:bg-white dark:hover:bg-zinc-800 transition-colors"
        >
          <MapPin size={13} className="text-primary" />
          {t('legend')}
        </button>

        {showLegend && (
          <div className="absolute bottom-full mb-2 left-0 bg-white/98 dark:bg-zinc-900/98 backdrop-blur rounded-2xl shadow-2xl border border-border/50 p-3 min-w-[180px] animate-in slide-in-from-bottom-2 duration-150">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('legend')}</p>
            <div className="space-y-1.5">
              {/* Alert severities */}
              {[
                { color: '#EF4444', label: t('severity.critical') },
                { color: '#F97316', label: t('severity.high') },
                { color: '#EAB308', label: t('severity.medium') },
                { color: '#3B82F6', label: t('severity.low') },
              ].map(({ color, label }) => (
                <div key={color} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[11px] text-foreground">{label}</span>
                </div>
              ))}
              <div className="border-t border-border/50 my-1.5" />
              {/* Layer icons */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-green-600 flex-shrink-0" />
                <span className="text-[11px] text-foreground">{t('shelters')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-[11px] text-foreground">{t('floodStreets')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-[11px] text-foreground">{t('floodPoints')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom card — Alert */}
      {selected?.kind === 'alert' && (
        <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border overflow-hidden z-30 animate-in slide-in-from-bottom-4 duration-200 max-h-[60vh] overflow-y-auto">
          <div className="px-4 py-3 flex items-start justify-between gap-2"
            style={{ backgroundColor: (SEVERITY_COLORS[String(selected.props.severity)] ?? '#3B82F6') + '18', borderBottom: `2px solid ${SEVERITY_COLORS[String(selected.props.severity)] ?? '#3B82F6'}40` }}>
            <div className="flex items-start gap-2 min-w-0">
              <AlertTriangle size={16} style={{ color: SEVERITY_COLORS[String(selected.props.severity)] ?? '#3B82F6' }} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-sm leading-snug">{String(selected.props.title ?? '—')}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selected.props.severity === 'critical' ? 'bg-red-100 text-red-700' :
                    selected.props.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                    selected.props.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {String(selected.props.severity_label || selected.props.severity || '').toUpperCase()}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {selected.props.created_at ? new Date(String(selected.props.created_at)).toLocaleString('vi-VN') : ''}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="p-1 hover:bg-muted rounded shrink-0"><X size={14} /></button>
          </div>

          {!!selected.props.address && (
            <div className="px-4 pt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin size={12} className="shrink-0" />
              <span>{String(selected.props.address)}</span>
            </div>
          )}

          {!!selected.props.description && (
            <div className="px-4 pt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">{String(selected.props.description)}</p>
            </div>
          )}

          {(() => { const urls = parseJsonProp(selected.props.photo_urls); return urls.length > 0 ? (
            <div className="px-4 pt-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <img src={url} alt="" className="w-24 h-24 rounded-xl object-cover border border-border" />
                  </a>
                ))}
              </div>
            </div>
          ) : null; })()}

          <div className="px-4 pb-4 pt-3 flex gap-2">
            <Link href="/citizen/alerts" className="flex-1">
              <Button size="sm" variant="outline" className="w-full text-xs h-9">
                <AlertTriangle size={12} className="mr-1" /> {t('alerts')}
              </Button>
            </Link>
            <a href="tel:113" className="flex-1">
              <Button size="sm" className="w-full text-xs h-9 bg-red-600 hover:bg-red-700">
                <Phone size={12} className="mr-1" /> {t('callEmergency')}
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* Bottom card — Incident (from SOS/notification) */}
      {selected?.kind === 'incident' && (
        <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border overflow-hidden z-30 animate-in slide-in-from-bottom-4 duration-200 max-h-[60vh] overflow-y-auto">
          <div className="px-4 py-3 flex items-start justify-between gap-2"
            style={{ backgroundColor: (SEVERITY_COLORS[String(selected.props.severity)] ?? '#3B82F6') + '18', borderBottom: `2px solid ${SEVERITY_COLORS[String(selected.props.severity)] ?? '#3B82F6'}40` }}>
            <div className="flex items-start gap-2 min-w-0">
              <AlertTriangle size={16} style={{ color: SEVERITY_COLORS[String(selected.props.severity)] ?? '#3B82F6' }} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-sm leading-snug">{String(selected.props.title ?? '—')}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selected.props.severity === 'critical' ? 'bg-red-100 text-red-700' :
                    selected.props.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                    selected.props.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {String(selected.props.severity ?? '').toUpperCase()}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {selected.props.created_at ? new Date(String(selected.props.created_at)).toLocaleString('vi-VN') : ''}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="p-1 hover:bg-muted rounded shrink-0"><X size={14} /></button>
          </div>

          {!!selected.props.address && (
            <div className="px-4 pt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin size={12} className="shrink-0" />
              <span>{String(selected.props.address)}</span>
            </div>
          )}

          {!!selected.props.description && (
            <div className="px-4 pt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">{String(selected.props.description)}</p>
            </div>
          )}

          {(() => { const urls = parseJsonProp(selected.props.photo_urls); return urls.length > 0 ? (
            <div className="px-4 pt-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <img src={url} alt="" className="w-24 h-24 rounded-xl object-cover border border-border" />
                  </a>
                ))}
              </div>
            </div>
          ) : null; })()}

          {!!selected.props.reporter && (
            <div className="px-4 pt-2 text-[11px] text-muted-foreground">
              Báo cáo bởi: <span className="font-medium text-foreground">{String((selected.props.reporter as any)?.name ?? '—')}</span>
            </div>
          )}

          <div className="px-4 pb-4 pt-3 flex gap-2">
            <Link href="/citizen/alerts" className="flex-1">
              <Button size="sm" variant="outline" className="w-full text-xs h-9">
                <AlertTriangle size={12} className="mr-1" /> {t('alerts')}
              </Button>
            </Link>
            <a href="tel:113" className="flex-1">
              <Button size="sm" className="w-full text-xs h-9 bg-red-600 hover:bg-red-700">
                <Phone size={12} className="mr-1" /> {t('callEmergency')}
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* Bottom card — Shelter */}
      {selected?.kind === 'shelter' && (
        <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border overflow-hidden z-30 animate-in slide-in-from-bottom-4 duration-200">
          <div className="px-4 py-3 flex items-start justify-between gap-2 border-b border-border/50">
            <div className="flex items-start gap-2 min-w-0">
              <Building2 size={16} className="text-green-600 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-sm leading-snug truncate">{String(selected.props.name ?? '—')}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{String(selected.props.address ?? '')}</p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="p-1 hover:bg-muted rounded shrink-0"><X size={14} /></button>
          </div>
          <div className="px-4 py-2 flex gap-4">
            <div className="text-center">
              <p className="text-sm font-bold">{String(selected.props.capacity ?? '—')}</p>
              <p className="text-[10px] text-muted-foreground">{t('capacity')}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-green-600">{String(selected.props.available_beds ?? '—')}</p>
              <p className="text-[10px] text-muted-foreground">{t('available')}</p>
            </div>
            {!!selected.props.is_flood_safe && (
              <span className="self-center text-[10px] text-green-600 border border-green-300 rounded-full px-2 py-0.5">{t('floodSafe')}</span>
            )}
          </div>
          <div className="px-4 pb-4 pt-1 flex gap-2">
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.coords[1]},${selected.coords[0]}`}
              target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button size="sm" className="w-full text-xs h-9 bg-blue-600 hover:bg-blue-700">
                <Navigation size={12} className="mr-1" /> {t('findRoute')}
              </Button>
            </a>
            <a href="tel:113" className="flex-1">
              <Button size="sm" className="w-full text-xs h-9 bg-red-600 hover:bg-red-700">
                <Phone size={12} className="mr-1" /> {t('callEmergency')}
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* Bottom card — Flood point */}
      {selected?.kind === 'flood_point' && (
        <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border overflow-hidden z-30 animate-in slide-in-from-bottom-4 duration-200">
          <div className="px-4 py-3 flex items-start justify-between gap-2 border-b border-border/50">
            <div className="flex items-start gap-2 min-w-0">
              <Droplets size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-sm leading-snug truncate">{String(selected.props.street_name ?? selected.props.address ?? t('floodPoints'))}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {[selected.props.ward_name, selected.props.district_name].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="p-1 hover:bg-muted rounded shrink-0"><X size={14} /></button>
          </div>
          <div className="px-4 py-3 flex items-center gap-4">
            {selected.props.water_level_cm != null && (
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: waterLevelColor(Number(selected.props.water_level_cm)) }}>
                  {String(selected.props.water_level_cm)} <span className="text-xs font-normal text-muted-foreground">cm</span>
                </p>
                <p className="text-[10px] text-muted-foreground">{t('waterLevel')}</p>
              </div>
            )}
            {selected.props.flood_ended_at
              ? <span className="text-[11px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">{t('receded')}</span>
              : <span className="text-[11px] bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">{t('flooding')}</span>
            }
          </div>
          <div className="px-4 pb-4">
            <Button size="sm" variant="outline" className="w-full text-xs h-9" onClick={() => setSelected(null)}>
              {t('close')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
