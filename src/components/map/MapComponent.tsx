'use client';

import * as React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
// @openmapvn/openmapvn-gl is a MapLibre GL fork
import maplibregl from '@openmapvn/openmapvn-gl';
import '@openmapvn/openmapvn-gl/dist/maplibre-gl.css';
import api from '@/lib/api';
import { decodePolyline, type EvacuationRoute } from '@/lib/openmap';
import { Button } from '@/components/ui/button';
import { Layers, RefreshCw, MapPin, Waves, Droplets, Radio, AlertTriangle, Home, Users, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

interface GeoJsonFeature {
  type: 'Feature';
  id?: number | string;
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
}

type LayerKey =
  | 'flood_streets' | 'flood_points'
  | 'station_rain' | 'station_flood_1m5' | 'station_flood_3m' | 'station_water_level' | 'station_reservoir'
  | 'incidents' | 'shelters' | 'rescue_teams' | 'flood_zones';

interface LayerConfig {
  key: LayerKey;
  label: string;
  count?: number;
  icon: string;   // emoji — simpler for the panel
  color: string;
  defaultOn: boolean;
  group: string;
}

interface LayerGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface Props {
  evacuationRoute?: EvacuationRoute | null;
  center?: [number, number];
  zoom?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DA_NANG_CENTER: [number, number] = [108.2022, 16.0544];
const DEFAULT_ZOOM = 12;

const LAYER_GROUPS: LayerGroup[] = [
  { id: 'flood',    label: 'Báo cáo ngập',    icon: <Droplets size={13} /> },
  { id: 'station',  label: 'Trạm quan trắc',  icon: <Radio size={13} /> },
  { id: 'other',    label: 'Khác',             icon: <Layers size={13} /> },
];

const LAYER_CONFIGS: LayerConfig[] = [
  // Flood reports
  { key: 'flood_streets',        label: 'Đường ngập',          count: 296, icon: '🛣️',  color: '#3B82F6', defaultOn: true,  group: 'flood'   },
  { key: 'flood_points',         label: 'Điểm ngập',           count: 96,  icon: '💧',  color: '#EF4444', defaultOn: true,  group: 'flood'   },
  // Sensor stations — each type separate
  { key: 'station_rain',         label: 'Trạm đo mưa',         count: 82,  icon: '☁️', color: '#06B6D4', defaultOn: false, group: 'station' },
  { key: 'station_flood_1m5',    label: 'Tháp báo ngập',       count: 56,  icon: '📡',  color: '#8B5CF6', defaultOn: false, group: 'station' },
  { key: 'station_flood_3m',     label: 'Tháp báo lũ',         count: 24,  icon: '⚠️',  color: '#F97316', defaultOn: false, group: 'station' },
  { key: 'station_water_level',  label: 'Trạm đo mực nước',    count: 8,   icon: '⏱️', color: '#0EA5E9', defaultOn: false, group: 'station' },
  { key: 'station_reservoir',    label: 'Trạm hồ chứa',        count: 5,   icon: '🌊', color: '#10B981', defaultOn: false, group: 'station' },
  // Other
  { key: 'flood_zones',          label: 'Vùng ngập',           count: 3,   icon: '🗺️',  color: '#06B6D4', defaultOn: false, group: 'other'   },
  { key: 'incidents',            label: 'Sự cố',               count: 3,   icon: '🛑',  color: '#EF4444', defaultOn: true,  group: 'other'   },
  { key: 'shelters',             label: 'Điểm trú ẩn',         count: 4,   icon: '🏠',  color: '#22C55E', defaultOn: true,  group: 'other'   },
  { key: 'rescue_teams',         label: 'Đội cứu hộ',          count: 5,   icon: '➕',  color: '#F97316', defaultOn: false, group: 'other'   },
];

// Map LayerKey → MapLibre layer IDs
const LAYER_MAP: Record<LayerKey, string[]> = {
  flood_streets:       ['layer-flood-streets'],
  flood_points:        ['layer-flood-reports'],
  station_rain:        ['layer-station-rain'],
  station_flood_1m5:   ['layer-station-flood-1m5'],
  station_flood_3m:    ['layer-station-flood-3m'],
  station_water_level: ['layer-station-water-level'],
  station_reservoir:   ['layer-station-reservoir'],
  flood_zones:         ['layer-flood-zones-fill', 'layer-flood-zones-outline'],
  incidents:           ['layer-incidents'],
  shelters:            ['layer-shelters'],
  rescue_teams:        ['layer-rescue-teams'],
};

const OPENMAP_STYLE = `https://tiles.openmap.vn/styles/day-v1/style.json?apikey=${process.env.NEXT_PUBLIC_OPENMAP_API_KEY}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function waterLevelColor(cm: number | null | undefined): string {
  const v = Number(cm ?? 0);
  if (v >= 75) return '#EF4444';
  if (v >= 50) return '#F97316';
  if (v >= 25) return '#3B82F6';
  return '#22C55E';
}

function stationTypeIcon(type: string): string {
  switch (type) {
    case 'flood_tower':          return '🗼';
    case 'water_level':          return '📊';
    case 'flood_warning_tower':  return '⚠️';
    case 'rain_station':         return '🌧️';
    case 'reservoir_waterlevel': return '🏞️';
    default:                     return '📡';
  }
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MapComponent({ evacuationRoute, center, zoom }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const [activeLayers, setActiveLayers] = useState<Set<LayerKey>>(
    () => new Set(LAYER_CONFIGS.filter(l => l.defaultOn).map(l => l.key))
  );
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);

  // ── Data refs (avoid re-render on fetch) ──────────────────────────────────
  const dataRef = useRef<Record<string, GeoJsonFeatureCollection>>({});

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: OPENMAP_STYLE,
      center: center ?? DA_NANG_CENTER,
      zoom: zoom ?? DEFAULT_ZOOM,
      attributionControl: false,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    map.current.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    // mapReady sẽ được set sau khi icons load xong trong useEffect tiếp theo

    // Resize map when container size changes (e.g. sidebar toggle)
    const ro = new ResizeObserver(() => map.current?.resize());
    ro.observe(mapContainer.current);

    return () => {
      ro.disconnect();
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load SVG icons vào map — chờ load xong rồi mới set mapReady ─────────────
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const onMapLoad = async () => {
      const icons: Array<{ id: string; svg: string }> = [
        // Trạm đo mưa — cloud with rain drops
        { id: 'icon-rain', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="#06B6D4" stroke="white" stroke-width="2.5"/>
          <path d="M11 12 C11 10, 12 9, 13.5 9 C14 8, 15 7.5, 16 7.5 C17.5 7.5, 18.5 8.5, 19 9.5 C20.5 9.5, 21.5 10.5, 21.5 12 C21.5 13.5, 20.5 14.5, 19 14.5 L13 14.5 C11.5 14.5, 11 13.5, 11 12 Z" 
                fill="white" stroke="white" stroke-width="0.5"/>
          <line x1="13" y1="17" x2="13" y2="20" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="16" y1="18" x2="16" y2="21" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="19" y1="17" x2="19" y2="20" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        </svg>` },
        
        // Tháp báo ngập — tower/antenna
        { id: 'icon-flood-tower', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="#8B5CF6" stroke="white" stroke-width="2.5"/>
          <path d="M16 8 L16 24" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M13 11 L19 11" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 14 L20 14" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M11 17 L21 17" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <circle cx="16" cy="8" r="2" fill="white"/>
          <path d="M14 22 L18 22 L17 24 L15 24 Z" fill="white"/>
        </svg>` },
        
        // Tháp báo lũ — alert triangle with waves
        { id: 'icon-flood-warning', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
          <path d="M17 3 L32 29 L2 29 Z" fill="#F97316" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M10 22 Q12 20, 14 22 T18 22 T22 22 T24 22" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M17 11 L17 17" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        </svg>` },
        
        // Trạm đo mực nước — gauge/meter
        { id: 'icon-water-level', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="#0EA5E9" stroke="white" stroke-width="2.5"/>
          <circle cx="16" cy="16" r="9" fill="none" stroke="white" stroke-width="2"/>
          <path d="M16 16 L16 9" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M16 16 L21 19" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="16" cy="16" r="2" fill="white"/>
        </svg>` },
        
        // Trạm hồ chứa — water waves
        { id: 'icon-reservoir', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="#10B981" stroke="white" stroke-width="2.5"/>
          <path d="M8 13 Q10 10, 12 13 T16 13 T20 13 T24 13" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M8 17 Q10 14, 12 17 T16 17 T20 17 T24 17" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M8 21 Q10 18, 12 21 T16 21 T20 21 T24 21" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>` },
        
        // Sự cố — alert octagon
        { id: 'icon-incident', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
          <path d="M11 2 L23 2 L32 11 L32 23 L23 32 L11 32 L2 23 L2 11 Z" 
                fill="#EF4444" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M17 11 L17 19" stroke="white" stroke-width="3" stroke-linecap="round"/>
          <circle cx="17" cy="23" r="2" fill="white"/>
        </svg>` },
        
        // Điểm trú ẩn — home/shelter
        { id: 'icon-shelter', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="34" viewBox="0 0 32 34">
          <path d="M16 3 L30 15 L27 15 L27 30 L5 30 L5 15 L2 15 Z" 
                fill="#16A34A" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
          <rect x="12" y="20" width="8" height="10" fill="white" stroke="white" stroke-width="1"/>
          <path d="M16 20 L16 30" stroke="#16A34A" stroke-width="2"/>
          <rect x="10" y="15" width="4" height="6" rx="0.5" fill="white"/>
          <rect x="18" y="15" width="4" height="6" rx="0.5" fill="white"/>
        </svg>` },
        
        // Đội cứu hộ — medical cross / rescue
        { id: 'icon-rescue', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="#EA580C" stroke="white" stroke-width="2.5"/>
          <path d="M16 8 L16 24 M8 16 L24 16" stroke="white" stroke-width="4" stroke-linecap="round"/>
          <circle cx="16" cy="16" r="10" fill="none" stroke="white" stroke-width="2"/>
        </svg>` },
      ];

      // Load tất cả icons — chờ hết rồi mới set mapReady
      await Promise.all(
        icons.map(({ id, svg }) => {
          return new Promise<void>((resolve) => {
            if (m.hasImage(id)) {
              resolve();
              return;
            }
            const img = new Image(30, 34);
            img.onload = () => {
              if (!m.hasImage(id)) m.addImage(id, img);
              resolve();
            };
            img.onerror = () => resolve(); // Nếu lỗi thì vẫn resolve để không block
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
          });
        })
      );

      // Icons đã load xong → set mapReady để trigger renderLayers
      setMapReady(true);
    };

    m.on('load', onMapLoad);

    return () => {
      m.off('load', onMapLoad);
    };
  }, []);
  const fetchData = useCallback(async () => {
    if (!mapReady) return;
    setLoading(true);
    try {
      const [floodReports, sensorStations, incidents, floodZones, shelters, rescueTeams] =
        await Promise.allSettled([
          api.get<GeoJsonFeatureCollection>('/map/flood-reports'),
          api.get<GeoJsonFeatureCollection>('/map/sensor-stations'),
          api.get<GeoJsonFeatureCollection>('/map/incidents'),
          api.get<GeoJsonFeatureCollection>('/map/flood-zones'),
          api.get<GeoJsonFeatureCollection>('/map/shelters'),
          api.get<GeoJsonFeatureCollection>('/map/rescue-teams'),
        ]);

      const extract = (r: PromiseSettledResult<{ data: GeoJsonFeatureCollection }>): GeoJsonFeatureCollection =>
        r.status === 'fulfilled' ? r.value.data : { type: 'FeatureCollection', features: [] };

      dataRef.current = {
        flood_reports:   extract(floodReports),
        sensor_stations: extract(sensorStations),
        incidents:       extract(incidents),
        flood_zones:     extract(floodZones),
        shelters:        extract(shelters),
        rescue_teams:    extract(rescueTeams),
      };

      renderLayers();
    } finally {
      setLoading(false);
    }
  }, [mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Render / update layers ─────────────────────────────────────────────────
  const renderLayers = useCallback(() => {
    const m = map.current;
    if (!m) return;

    // ── flood_reports: point floods (circle) + street floods (line) ──────────
    upsertSource(m, 'flood_reports', dataRef.current.flood_reports);

    // Street floods → line layer
    if (!m.getLayer('layer-flood-streets')) {
      m.addLayer({
        id: 'layer-flood-streets',
        type: 'line',
        source: 'flood_reports',
        filter: ['==', ['geometry-type'], 'LineString'],
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#3B82F6'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 15, 4],
          'line-opacity': 0.85,
        },
      } as AnyData);
    }

    // Point floods → circle layer
    if (!m.getLayer('layer-flood-reports')) {
      m.addLayer({
        id: 'layer-flood-reports',
        type: 'circle',
        source: 'flood_reports',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 6, 15, 12],
          'circle-color': ['coalesce', ['get', 'color'], '#3B82F6'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': 1,
        },
      } as AnyData);
    }

    // ── sensor_stations — symbol icon theo từng loại ─────────────────────────
    upsertSource(m, 'sensor_stations', dataRef.current.sensor_stations);

    const stationLayers: Array<{ id: string; type: string; icon: string }> = [
      { id: 'layer-station-rain',         type: 'rain_station',         icon: 'icon-rain'         },
      { id: 'layer-station-flood-1m5',    type: 'flood_1m5',            icon: 'icon-flood-tower'  },
      { id: 'layer-station-flood-3m',     type: 'flood_3m',             icon: 'icon-flood-warning'},
      { id: 'layer-station-water-level',  type: 'water_level',          icon: 'icon-water-level'  },
      { id: 'layer-station-reservoir',    type: 'reservoir_waterlevel', icon: 'icon-reservoir'    },
    ];
    stationLayers.forEach(({ id, type, icon }) => {
      if (!m.getLayer(id)) {
        m.addLayer({
          id,
          type: 'symbol',
          source: 'sensor_stations',
          filter: ['==', ['get', 'station_type'], type],
          layout: {
            'icon-image': icon,
            'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 15, 1.0],
            'icon-allow-overlap': true,
            'icon-anchor': 'center',
          },
        } as AnyData);
      }
    });

    // ── incidents — tam giác cảnh báo ─────────────────────────────────────
    upsertSource(m, 'incidents', dataRef.current.incidents);
    if (!m.getLayer('layer-incidents')) {
      m.addLayer({
        id: 'layer-incidents',
        type: 'symbol',
        source: 'incidents',
        layout: {
          'icon-image': 'icon-incident',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.7, 15, 1.1],
          'icon-allow-overlap': true,
          'icon-anchor': 'center',
        },
      } as AnyData);
    }

    // ── flood_zones — subtle, tắt mặc định ────────────────────────────────
    upsertSource(m, 'flood_zones', dataRef.current.flood_zones);
    if (!m.getLayer('layer-flood-zones-fill')) {
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
          'fill-opacity': 0.12,
        },
      });
    }
    if (!m.getLayer('layer-flood-zones-outline')) {
      m.addLayer({
        id: 'layer-flood-zones-outline',
        type: 'line',
        source: 'flood_zones',
        paint: {
          'line-color': ['match', ['get', 'risk_level'], 'critical', '#EF4444', 'high', '#F97316', '#3B82F6'],
          'line-width': 2,
          'line-opacity': 0.8,
          'line-dasharray': [3, 2],
        },
      });
    }

    // ── shelters — icon nhà ───────────────────────────────────────────────
    upsertSource(m, 'shelters', dataRef.current.shelters);
    if (!m.getLayer('layer-shelters')) {
      m.addLayer({
        id: 'layer-shelters',
        type: 'symbol',
        source: 'shelters',
        layout: {
          'icon-image': 'icon-shelter',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.7, 15, 1.1],
          'icon-allow-overlap': true,
          'icon-anchor': 'bottom',
        },
      } as AnyData);
    }

    // ── rescue_teams — icon xe cứu hỏa ───────────────────────────────────
    upsertSource(m, 'rescue_teams', dataRef.current.rescue_teams);
    if (!m.getLayer('layer-rescue-teams')) {
      m.addLayer({
        id: 'layer-rescue-teams',
        type: 'symbol',
        source: 'rescue_teams',
        layout: {
          'icon-image': 'icon-rescue',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.7, 15, 1.1],
          'icon-allow-overlap': true,
          'icon-anchor': 'center',
        },
      } as AnyData);
    }

    // Apply visibility
    syncVisibility(m, activeLayers);
  }, [activeLayers]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync layer visibility when activeLayers changes ────────────────────────
  useEffect(() => {
    if (!mapReady || !map.current) return;
    syncVisibility(map.current, activeLayers);
  }, [activeLayers, mapReady]);

  // ── Evacuation route ───────────────────────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;

    if (!evacuationRoute) {
      if (m.getLayer('layer-evac-route')) m.removeLayer('layer-evac-route');
      if (m.getSource('evac_route')) m.removeSource('evac_route');
      return;
    }

    const coords = decodePolyline(evacuationRoute.polyline);
    const geojson: GeoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords },
      }],
    };

    upsertSource(m, 'evac_route', geojson);
    if (!m.getLayer('layer-evac-route')) {
      m.addLayer({
        id: 'layer-evac-route',
        type: 'line',
        source: 'evac_route',
        paint: {
          'line-color': '#22C55E',
          'line-width': 4,
          'line-dasharray': [2, 1],
        },
      });
    }

    // Fit bounds
    if (coords.length > 0) {
      const bounds = coords.reduce(
        (b, c) => b.extend(c as [number, number]),
        new maplibregl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number])
      );
      m.fitBounds(bounds, { padding: 60 });
    }
  }, [evacuationRoute, mapReady]);

  // ── Popup handlers — attach ONCE after map ready ──────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;

    const CLICKABLE = [
      'layer-flood-reports',
      'layer-flood-streets',
      'layer-station-rain',
      'layer-station-flood-1m5',
      'layer-station-flood-3m',
      'layer-station-water-level',
      'layer-station-reservoir',
      'layer-incidents',
      'layer-shelters',
      'layer-rescue-teams',
    ];

    const onClick = (e: maplibregl.MapMouseEvent) => {
      // Query all clickable layers at click point
      const features = m.queryRenderedFeatures(e.point, { layers: CLICKABLE.filter(l => m.getLayer(l)) });
      const feature = features?.[0];
      if (!feature) return;

      const props = feature.properties as Record<string, unknown>;
      const geom = feature.geometry as { type: string; coordinates: number[] | number[][] };
      
      // For LineString pick the midpoint, for Point use coordinates directly
      let lngLat: [number, number];
      if (geom.type === 'LineString') {
        const coords = geom.coordinates as number[][];
        const mid = coords[Math.floor(coords.length / 2)];
        lngLat = [mid[0], mid[1]];
      } else {
        const coords = geom.coordinates as number[];
        lngLat = [coords[0], coords[1]];
      }

      // Fallback to click position if coords are invalid
      if (isNaN(lngLat[0]) || isNaN(lngLat[1])) {
        lngLat = [e.lngLat.lng, e.lngLat.lat];
      }
      const layerId = feature.layer.id;

      let html = '';

      if (layerId === 'layer-flood-reports' || layerId === 'layer-flood-streets') {
        const wl = Number(props.water_level_cm ?? 0);
        const color = waterLevelColor(wl);
        const isStreet = layerId === 'layer-flood-streets' || props.flood_type === 'street';
        const typeLabel = isStreet ? 'ĐƯỜNG NGẬP' : 'ĐIỂM NGẬP';
        const typeIcon = isStreet ? '🛣️' : '💧';

        // Title: street_name > address
        const title = String(props.street_name ?? props.address ?? '—');
        const wardDistrict = [props.ward_name, props.district_name].filter(Boolean).join(', ');
        const freq = props.is_frequent
          ? `<span style="display:inline-block;background:#FEE2E2;color:#DC2626;border-radius:4px;padding:1px 7px;font-size:10px;font-weight:600;margin-left:6px">Thường xuyên</span>`
          : '';
        const startAddr = String(props.address ?? '—');
        const timeStr = formatTime((props.flood_started_at ?? props.reported_at) as string);
        const endTimeStr = props.flood_ended_at ? formatTime(props.flood_ended_at as string) : 'Đang ngập';
        const desc = props.description ? `<div style="color:#6B7280;font-size:12px;margin-top:8px;padding-top:8px;border-top:1px solid #E5E7EB">${String(props.description)}</div>` : '';

        html = `
<div style="font-family:system-ui,sans-serif;width:100%;box-sizing:border-box">
  <div style="font-size:10px;font-weight:700;color:#6B7280;letter-spacing:.08em;margin-bottom:4px">${typeIcon} ${typeLabel}${freq}</div>
  <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px;line-height:1.4;padding-right:4px">${title}</div>
  <div style="font-size:12px;color:#6B7280;margin-bottom:12px">${wardDistrict}</div>
  <div style="background:#F9FAFB;border-radius:8px;padding:12px;border:1px solid #E5E7EB">
    <div style="font-size:11px;font-weight:700;color:#374151;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">Thông tin ${isStreet ? 'đoạn' : 'điểm'} ngập</div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed">
      <tr>
        <td style="color:#6B7280;padding:5px 0;width:45%">Mức ngập</td>
        <td style="text-align:right;font-weight:700;color:${color};padding:5px 0;font-size:14px">
          ${wl > 0 ? `${wl} <span style="font-size:11px;font-weight:400;color:#6B7280">cm</span>` : '<span style="color:#9CA3AF">—</span>'}
        </td>
      </tr>
      ${isStreet ? `
      <tr style="border-top:1px solid #E5E7EB">
        <td style="color:#6B7280;padding:5px 0;vertical-align:top">Địa điểm bắt đầu</td>
        <td style="text-align:right;color:#374151;padding:5px 0;word-break:break-word">${startAddr}</td>
      </tr>` : ''}
      <tr style="border-top:1px solid #E5E7EB">
        <td style="color:#6B7280;padding:5px 0">Thời gian ngập</td>
        <td style="text-align:right;color:#374151;padding:5px 0">${timeStr}</td>
      </tr>
      <tr style="border-top:1px solid #E5E7EB">
        <td style="color:#6B7280;padding:5px 0">Tình trạng</td>
        <td style="text-align:right;padding:5px 0">
          ${props.flood_ended_at
            ? `<span style="background:#F3F4F6;color:#6B7280;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:600">Đã rút</span>`
            : `<span style="background:#DCFCE7;color:#16A34A;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:600">Đang ngập</span>`
          }
        </td>
      </tr>
    </table>
    ${desc}
  </div>
</div>`;
      } else if (layerId === 'layer-sensor-stations' ||
                 layerId === 'layer-station-rain' ||
                 layerId === 'layer-station-flood-1m5' ||
                 layerId === 'layer-station-flood-3m' ||
                 layerId === 'layer-station-water-level' ||
                 layerId === 'layer-station-reservoir') {
        const depth = props.current_depth_m != null ? Number(props.current_depth_m).toFixed(2) : null;
        const icon = stationTypeIcon(String(props.station_type ?? ''));
        const label = String(props.station_type_label ?? props.station_type ?? '—');
        const addr = String(props.address ?? props.area ?? '—');
        const wardDistrict = [props.ward_name, props.district_name].filter(Boolean).join(', ');
        const phone = props.phone ? `
      <tr>
        <td style="color:#6B7280;padding:4px 0">Điện thoại</td>
        <td style="text-align:right;color:#374151;padding:4px 0">📞 ${String(props.phone)}</td>
      </tr>` : '';

        html = `
<div style="font-family:system-ui,sans-serif;width:100%;box-sizing:border-box">
  <div style="font-size:10px;font-weight:700;color:#7C3AED;letter-spacing:.08em;margin-bottom:4px">${icon} TRẠM ĐO</div>
  <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px;line-height:1.4;padding-right:4px">${String(props.name ?? '—')}</div>
  <div style="font-size:12px;color:#6B7280;margin-bottom:12px">${wardDistrict || addr}</div>
  <div style="background:#F9FAFB;border-radius:8px;padding:12px;border:1px solid #E5E7EB">
    <div style="font-size:11px;font-weight:700;color:#374151;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">Thông tin trạm</div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed">
      <tr>
        <td style="color:#6B7280;padding:5px 0;width:45%">Loại trạm</td>
        <td style="text-align:right;color:#374151;padding:5px 0;word-break:break-word">${label}</td>
      </tr>
      <tr style="border-top:1px solid #E5E7EB">
        <td style="color:#6B7280;padding:5px 0;vertical-align:top">Địa chỉ</td>
        <td style="text-align:right;color:#374151;padding:5px 0;word-break:break-word">${addr}</td>
      </tr>
      <tr style="border-top:1px solid #E5E7EB">
        <td style="color:#6B7280;padding:5px 0">Mực nước</td>
        <td style="text-align:right;font-weight:700;color:#7C3AED;padding:5px 0;font-size:14px">
          ${depth ? `${depth} <span style="font-size:11px;font-weight:400;color:#6B7280">m</span>` : '<span style="color:#9CA3AF;font-size:12px;font-weight:400">—</span>'}
        </td>
      </tr>
      ${phone}
    </table>
  </div>
</div>`;
      } else if (layerId === 'layer-incidents') {
        const wardDistrict = [props.ward_name, props.district_name].filter(Boolean).join(', ');
        html = `
<div style="font-family:system-ui,sans-serif;min-width:260px;max-width:320px">
  <div style="font-size:10px;font-weight:700;color:#DC2626;letter-spacing:.08em;margin-bottom:4px">⚠️ SỰ CỐ</div>
  <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:2px;line-height:1.3">${String(props.title ?? 'Sự cố')}</div>
  <div style="font-size:12px;color:#6B7280;margin-bottom:12px">${wardDistrict || String(props.address ?? '—')}</div>
  <div style="background:#F9FAFB;border-radius:8px;padding:12px;border:1px solid #E5E7EB">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <tr>
        <td style="color:#6B7280;padding:4px 0">Trạng thái</td>
        <td style="text-align:right;padding:4px 0"><span style="background:#FEF3C7;color:#D97706;border-radius:4px;padding:1px 7px;font-size:11px;font-weight:600">${String(props.status ?? '—')}</span></td>
      </tr>
      <tr>
        <td style="color:#6B7280;padding:4px 0">Mức độ</td>
        <td style="text-align:right;padding:4px 0"><span style="background:#FEE2E2;color:#DC2626;border-radius:4px;padding:1px 7px;font-size:11px;font-weight:600">${String(props.severity ?? '—')}</span></td>
      </tr>
    </table>
  </div>
</div>`;
      } else if (layerId === 'layer-shelters') {
        const avail = Number(props.available_beds ?? 0);
        const cap = Number(props.capacity ?? 0);
        const pct = cap > 0 ? Math.round((1 - avail / cap) * 100) : 0;
        html = `
<div style="font-family:system-ui,sans-serif;min-width:260px;max-width:320px">
  <div style="font-size:10px;font-weight:700;color:#16A34A;letter-spacing:.08em;margin-bottom:4px">🏠 ĐIỂM TRÚ ẨN</div>
  <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:12px;line-height:1.3">${String(props.name ?? '—')}</div>
  <div style="background:#F9FAFB;border-radius:8px;padding:12px;border:1px solid #E5E7EB">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <tr>
        <td style="color:#6B7280;padding:4px 0">Sức chứa</td>
        <td style="text-align:right;color:#374151;font-weight:600;padding:4px 0">${cap} người</td>
      </tr>
      <tr>
        <td style="color:#6B7280;padding:4px 0">Còn trống</td>
        <td style="text-align:right;font-weight:700;color:#16A34A;padding:4px 0">${avail} chỗ</td>
      </tr>
      <tr><td colspan="2" style="padding:6px 0 2px">
        <div style="background:#E5E7EB;border-radius:99px;height:6px;overflow:hidden">
          <div style="background:#16A34A;height:100%;width:${100-pct}%;border-radius:99px;transition:width .3s"></div>
        </div>
        <div style="font-size:10px;color:#9CA3AF;margin-top:2px;text-align:right">${pct}% đã sử dụng</div>
      </td></tr>
    </table>
  </div>
</div>`;
      } else if (layerId === 'layer-rescue-teams') {
        html = `
<div style="font-family:system-ui,sans-serif;min-width:220px">
  <div style="font-size:10px;font-weight:700;color:#EA580C;letter-spacing:.08em;margin-bottom:4px">🚒 ĐỘI CỨU HỘ</div>
  <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:12px">${String(props.name ?? '—')}</div>
  <div style="background:#F9FAFB;border-radius:8px;padding:12px;border:1px solid #E5E7EB">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <tr>
        <td style="color:#6B7280;padding:4px 0">Trạng thái</td>
        <td style="text-align:right;padding:4px 0"><span style="background:#FED7AA;color:#EA580C;border-radius:4px;padding:1px 7px;font-size:11px;font-weight:600">${String(props.status ?? '—')}</span></td>
      </tr>
      <tr>
        <td style="color:#6B7280;padding:4px 0">Loại đội</td>
        <td style="text-align:right;color:#374151;padding:4px 0">${String(props.team_type ?? '—')}</td>
      </tr>
    </table>
  </div>
</div>`;
      }

      if (!html) return;
      popupRef.current?.remove();
      popupRef.current = new maplibregl.Popup({
        closeButton: true,
        maxWidth: '300px',
        offset: 12,
        anchor: 'bottom',
      })
        .setLngLat(lngLat)
        .setHTML(html)
        .addTo(m);
    };

    const onMouseMove = (e: maplibregl.MapMouseEvent) => {
      const features = m.queryRenderedFeatures(e.point, { layers: CLICKABLE.filter(l => m.getLayer(l)) });
      m.getCanvas().style.cursor = features.length ? 'pointer' : '';
    };

    m.on('click', onClick);
    m.on('mousemove', onMouseMove);

    return () => {
      m.off('click', onClick);
      m.off('mousemove', onMouseMove);
    };
  }, [mapReady]);

  // ── Toggle layer ───────────────────────────────────────────────────────────
  const toggleLayer = (key: LayerKey) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg">
      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-background/90 backdrop-blur-sm border border-border rounded-full px-3 py-1 flex items-center gap-2 text-xs shadow">
          <RefreshCw size={12} className="animate-spin text-primary" />
          <span>Đang tải dữ liệu...</span>
        </div>
      )}

      {/* Layer panel — top right */}
      <div className="absolute top-3 right-12 z-10 flex flex-col items-end gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="h-8 px-3 gap-1.5 shadow-md text-xs font-medium"
          onClick={() => setLayerPanelOpen(v => !v)}
        >
          <Layers size={14} />
          Lớp bản đồ
        </Button>

        {layerPanelOpen && (
          <div className="bg-background/98 backdrop-blur-sm border border-border rounded-xl shadow-xl w-[240px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-muted/40">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Layers size={13} className="text-primary" />
                Lớp dữ liệu
              </div>
              <button onClick={() => setLayerPanelOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>

            {/* Groups */}
            <div className="py-1 max-h-[420px] overflow-y-auto">
              {LAYER_GROUPS.map(group => {
                const groupLayers = LAYER_CONFIGS.filter(c => c.group === group.id);
                return (
                  <div key={group.id}>
                    {/* Group header */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30">
                      {group.icon}
                      {group.label}
                    </div>
                    {/* Layer rows */}
                    {groupLayers.map(cfg => {
                      const on = activeLayers.has(cfg.key);
                      return (
                        <button
                          key={cfg.key}
                          onClick={() => toggleLayer(cfg.key)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/60 transition-colors"
                        >
                          <span className="text-sm w-5 text-center">{cfg.icon}</span>
                          <span className={`flex-1 text-left ${on ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                            {cfg.label}
                            {cfg.count !== undefined && (
                              <span className="ml-1 text-[10px] text-muted-foreground font-normal">({cfg.count})</span>
                            )}
                          </span>
                          {/* Toggle switch */}
                          <span className={`relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                            <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform mt-0.5 ${on ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Refresh button */}
      <div className="absolute bottom-10 left-3 z-10">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 shadow-md"
          onClick={fetchData}
          disabled={loading}
          title="Làm mới dữ liệu"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-10 right-10 z-10 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-2 text-[10px] space-y-1 shadow">
        <div className="font-semibold text-xs mb-1 flex items-center gap-1">
          <MapPin size={11} /> Mực nước ngập
        </div>
        {[
          { color: '#EF4444', label: '≥ 75 cm' },
          { color: '#F97316', label: '≥ 50 cm' },
          { color: '#3B82F6', label: '≥ 25 cm' },
          { color: '#22C55E', label: '< 25 cm'  },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

// ─── MapLibre helpers ─────────────────────────────────────────────────────────

// Use `as any` cast for GeoJSON data to avoid strict maplibre type conflicts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any;

function upsertSource(m: maplibregl.Map, id: string, data?: GeoJsonFeatureCollection) {
  const empty: GeoJsonFeatureCollection = { type: 'FeatureCollection', features: [] };
  const src = m.getSource(id) as maplibregl.GeoJSONSource | undefined;
  if (src) {
    src.setData(data as AnyData ?? empty as AnyData);
  } else {
    m.addSource(id, { type: 'geojson', data: (data ?? empty) as AnyData });
  }
}

function upsertCircleLayer(
  m: maplibregl.Map,
  layerId: string,
  sourceId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paint: Record<string, any>
) {
  if (!m.getLayer(layerId)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    m.addLayer({ id: layerId, type: 'circle', source: sourceId, paint } as any);
  }
}

function syncVisibility(m: maplibregl.Map, active: Set<LayerKey>) {
  (Object.entries(LAYER_MAP) as [LayerKey, string[]][]).forEach(([key, ids]) => {
    const vis = active.has(key) ? 'visible' : 'none';
    ids.forEach(id => {
      if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', vis);
    });
  });
}
