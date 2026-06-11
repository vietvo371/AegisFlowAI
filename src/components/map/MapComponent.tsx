'use client';

import * as React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
// @openmapvn/openmapvn-gl is a MapLibre GL fork
import maplibregl from '@openmapvn/openmapvn-gl';
import '@openmapvn/openmapvn-gl/dist/maplibre-gl.css';
import api from '@/lib/api';
import { decodePolyline, type EvacuationRoute } from '@/lib/openmap';
import { useFeatureStateAnimation } from '@/hooks/useFeatureStateAnimation';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
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

type LngLatPair = [number, number];

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
  focusTeam?: { id: number; name: string; latitude?: number; longitude?: number } | null;
  focusPoint?: {
    id?: number;
    name: string;
    latitude?: number;
    longitude?: number;
    type?: 'incident' | 'team' | 'shelter' | 'flood_zone' | 'rescue_request';
    subtitle?: string;
    status?: string;
    urgency?: string;
    caller?: string;
    phone?: string;
    peopleCount?: string;
    photoUrl?: string;
    riskLevel?: string;
    waterLevel?: string;
    capacity?: string;
    severity?: string;
  } | null;
  floodZones?: GeoJsonFeatureCollection | null;
  shelters?: any[];
  center?: [number, number];
  zoom?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DA_NANG_CENTER: [number, number] = [108.2022, 16.0544];
const DEFAULT_ZOOM = 12;

// Note: LAYER_GROUPS and LAYER_CONFIGS moved to component-level i18n variables
// layerGroups and layerConfigs are defined inside the component with useTranslations

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

type MapStyleJson = {
  terrain?: unknown;
  sources?: Record<string, { type?: string }>;
  layers?: Array<{ type?: string; source?: string }>;
  [key: string]: unknown;
};

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

function collectLngLatPairs(input: unknown): LngLatPair[] {
  if (!Array.isArray(input)) return [];

  if (
    input.length >= 2
    && typeof input[0] === 'number'
    && typeof input[1] === 'number'
    && Number.isFinite(input[0])
    && Number.isFinite(input[1])
  ) {
    return [[input[0], input[1]]];
  }

  return input.flatMap(collectLngLatPairs);
}

function getFeatureBounds(feature: GeoJsonFeature): maplibregl.LngLatBounds | null {
  const pairs = collectLngLatPairs(feature.geometry?.coordinates);
  if (!pairs.length) return null;

  const bounds = new maplibregl.LngLatBounds(pairs[0], pairs[0]);
  pairs.slice(1).forEach(pair => bounds.extend(pair));
  return bounds;
}

function findFloodZoneFeature(
  collection: GeoJsonFeatureCollection | undefined,
  focusPoint: Props['focusPoint'],
): GeoJsonFeature | null {
  if (!collection?.features?.length || !focusPoint) return null;

  const targetId = focusPoint.id == null ? null : String(focusPoint.id);
  const targetName = focusPoint.name?.trim().toLowerCase();

  return collection.features.find(feature => {
    const featureId = feature.id ?? feature.properties?.id;
    const featureName = String(feature.properties?.name ?? '').trim().toLowerCase();

    return (
      (targetId != null && String(featureId) === targetId)
      || (!!targetName && featureName === targetName)
    );
  }) ?? null;
}

function createFallbackFloodZoneFrame(focusPoint: NonNullable<Props['focusPoint']>, lng: number, lat: number): GeoJsonFeature {
  const latDelta = 0.012;
  const lngDelta = latDelta / Math.max(Math.cos(lat * Math.PI / 180), 0.35);
  const ring: LngLatPair[] = [
    [lng - lngDelta, lat - latDelta],
    [lng + lngDelta, lat - latDelta],
    [lng + lngDelta, lat + latDelta],
    [lng - lngDelta, lat + latDelta],
    [lng - lngDelta, lat - latDelta],
  ];

  return {
    type: 'Feature',
    id: focusPoint.id,
    properties: {
      id: focusPoint.id,
      name: focusPoint.name,
      risk_level: focusPoint.riskLevel,
      status: focusPoint.status,
      color: '#DC2626',
    },
    geometry: { type: 'Polygon', coordinates: [ring] },
  };
}

async function loadOpenMapStyle(): Promise<string | MapStyleJson> {
  try {
    const response = await fetch(OPENMAP_STYLE);
    if (!response.ok) return OPENMAP_STYLE;

    const style = await response.json() as MapStyleJson;
    delete style.terrain;

    const removedSources = new Set<string>();
    for (const [sourceId, source] of Object.entries(style.sources ?? {})) {
      if (source.type === 'raster-dem') {
        removedSources.add(sourceId);
        delete style.sources?.[sourceId];
      }
    }

    style.layers = (style.layers ?? []).filter((layer) => (
      layer.type !== 'hillshade' && (!layer.source || !removedSources.has(layer.source))
    ));

    return style;
  } catch {
    return OPENMAP_STYLE;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MapComponent({ evacuationRoute, focusTeam, focusPoint, floodZones, shelters, center, zoom }: Props) {
  const t = useTranslations('dashboard');
  const tMap = useTranslations('dashboard.mapLayers');
  const tPopup = useTranslations('dashboard.mapPopup');
  const tLegend = useTranslations('dashboard.legend');
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const focusTeamMarkerRef = useRef<maplibregl.Marker | null>(null);

  // ── Layer configs with i18n labels ───────────────────────────────────────
  const layerGroups = [
    { id: 'flood',    label: tMap('floodReport'),   icon: <Droplets size={13} /> },
    { id: 'station', label: tMap('sensorStations'), icon: <Radio size={13} /> },
    { id: 'other',   label: tMap('other'),        icon: <Layers size={13} /> },
  ];

  const layerConfigs = [
    { key: 'flood_streets',        label: tMap('floodStreets'),       count: 296, icon: '🛣️', color: '#3B82F6', defaultOn: true,  group: 'flood' },
    { key: 'flood_points',         label: tMap('floodPoints'),         count: 96,  icon: '💧',  color: '#EF4444', defaultOn: true,  group: 'flood' },
    { key: 'station_rain',        label: tMap('rainStation'),         count: 82,  icon: '☁️', color: '#06B6D4', defaultOn: false, group: 'station' },
    { key: 'station_flood_1m5',   label: tMap('floodTower'),           count: 56,  icon: '📡',  color: '#8B5CF6', defaultOn: false, group: 'station' },
    { key: 'station_flood_3m',    label: tMap('floodAlertTower'),      count: 24,  icon: '⚠️',  color: '#F97316', defaultOn: false, group: 'station' },
    { key: 'station_water_level',  label: tMap('waterLevelStation'),    count: 8,   icon: '⏱️', color: '#0EA5E9', defaultOn: false, group: 'station' },
    { key: 'station_reservoir',    label: tMap('reservoirStation'),     count: 5,   icon: '🌊', color: '#10B981', defaultOn: false, group: 'station' },
    { key: 'flood_zones',         label: tMap('floodZones'),           count: 3,   icon: '🗺️',  color: '#06B6D4', defaultOn: false, group: 'other' },
    { key: 'incidents',           label: tMap('incidents'),             count: 3,   icon: '🛑',  color: '#EF4444', defaultOn: true,  group: 'other' },
    { key: 'shelters',            label: tMap('shelters'),              count: 4,   icon: '🏠',  color: '#22C55E', defaultOn: true,  group: 'other' },
    { key: 'rescue_teams',        label: tMap('rescueTeams'),            count: 5,   icon: '➕',  color: '#F97316', defaultOn: false, group: 'other' },
  ];

  const [activeLayers, setActiveLayers] = useState<Set<LayerKey>>(
    () => new Set(layerConfigs.filter(l => l.defaultOn).map(l => l.key as LayerKey))
  );
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  // ── Feature animation hook ────────────────────────────────────────────────
  const { highlightFeature } = useFeatureStateAnimation({
    map,
    sourceId: 'flood_reports',
    animationDuration: 1000,
  });

  // Listen for real-time flood telemetry updates from simulator
  useEffect(() => {
    const handleFloodTelemetry = (event: CustomEvent) => {
      const { feature_id, zone_id, water_level, severity } = event.detail || {};
      const id = feature_id || zone_id;
      if (id) {
        highlightFeature(id, { water_level, severity });
      }
    };

    window.addEventListener('aegis:flood_telemetry', handleFloodTelemetry as EventListener);
    return () => {
      window.removeEventListener('aegis:flood_telemetry', handleFloodTelemetry as EventListener);
    };
  }, [highlightFeature]);

  // ── Data refs (avoid re-render on fetch) ──────────────────────────────────
  const dataRef = useRef<Record<string, GeoJsonFeatureCollection>>({});

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    let cancelled = false;
    let ro: ResizeObserver | null = null;

    const handleMissingStyleImage = (event: { id?: string }) => {
      const m = map.current;
      const id = event.id;
      if (!m || !id || m.hasImage(id)) return;

      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.roundRect(4, 7, 16, 10, 3);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, 12);
      ctx.lineTo(16, 12);
      ctx.stroke();

      m.addImage(id, ctx.getImageData(0, 0, canvas.width, canvas.height));
    };

    const initMap = async () => {
      const style = await loadOpenMapStyle();
      if (cancelled || !mapContainer.current || map.current) return;

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: style as any,
        center: center ?? DA_NANG_CENTER,
        zoom: zoom ?? DEFAULT_ZOOM,
        attributionControl: false,
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
      map.current.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
      map.current.on('styleimagemissing', handleMissingStyleImage);

      // mapReady sẽ được set sau khi icons load xong trong useEffect tiếp theo

      // Resize map when container size changes (e.g. sidebar toggle)
      ro = new ResizeObserver(() => map.current?.resize());
      ro.observe(mapContainer.current);
      setMapInitialized(true);
    };

    void initMap();

    return () => {
      cancelled = true;
      ro?.disconnect();
      map.current?.off('styleimagemissing', handleMissingStyleImage);
      map.current?.remove();
      map.current = null;
      setMapInitialized(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load SVG icons vào map — chờ load xong rồi mới set mapReady ─────────────
  useEffect(() => {
    const m = map.current;
    if (!m || !mapInitialized) return;

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
            if (!map.current || map.current !== m) return resolve();
            try {
              if (m.hasImage(id)) {
                resolve();
                return;
              }
            } catch {
              resolve();
              return;
            }
            const img = new Image(30, 34);
            img.onload = () => {
              if (!map.current || map.current !== m) return resolve();
              try {
                if (!m.hasImage(id)) m.addImage(id, img);
              } catch {
                // Map can be removed while icons are still loading during route changes.
              }
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
  }, [mapInitialized]);
  const fetchData = useCallback(async () => {
    if (!mapReady) return;
    setLoading(true);
    try {
      const [floodReports, sensorStations, incidents, fetchedFloodZones, fetchedShelters, rescueTeams] =
        await Promise.allSettled([
          api.get<GeoJsonFeatureCollection>('/map/flood-reports'),
          api.get<GeoJsonFeatureCollection>('/map/sensor-stations'),
          api.get<GeoJsonFeatureCollection>('/map/incidents'),
          floodZones ? Promise.resolve({ data: floodZones }) : api.get<GeoJsonFeatureCollection>('/map/flood-zones'),
          shelters?.length ? Promise.resolve({ data: { type: 'FeatureCollection' as const, features: shelters.map((s: any) => ({
            type: 'Feature' as const,
            properties: s,
            geometry: s.location ? { type: 'Point' as const, coordinates: [s.location.lng, s.location.lat] } : { type: 'Point' as const, coordinates: [0, 0] }
          })) } }) : api.get<GeoJsonFeatureCollection>('/map/shelters'),
          api.get<GeoJsonFeatureCollection>('/map/rescue-teams'),
        ]);

      const extract = (r: PromiseSettledResult<any>): GeoJsonFeatureCollection =>
        r.status === 'fulfilled' ? r.value.data : { type: 'FeatureCollection', features: [] };

      dataRef.current = {
        flood_reports:   extract(floodReports),
        sensor_stations: extract(sensorStations),
        incidents:       extract(incidents),
        flood_zones:     extract(fetchedFloodZones),
        shelters:        extract(fetchedShelters),
        rescue_teams:    extract(rescueTeams),
      };
      setDataVersion(v => v + 1);

      renderLayers();
    } finally {
      setLoading(false);
    }
  }, [mapReady, floodZones, shelters]); // eslint-disable-line react-hooks/exhaustive-deps

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
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10,
            ['case', ['boolean', ['feature-state', 'updated'], false], 6, 2],
            15,
            ['case', ['boolean', ['feature-state', 'updated'], false], 6, 4],
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'updated'], false],
            1.0,
            0.85,
          ],
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
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10,
            ['case', ['boolean', ['feature-state', 'updated'], false], 14, 6],
            15,
            ['case', ['boolean', ['feature-state', 'updated'], false], 14, 12],
          ],
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'updated'], false],
            '#F97316', // orange khi animate
            ['coalesce', ['get', 'color'], '#3B82F6'],
          ],
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'updated'], false],
            4,
            2,
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
            1,
          ],
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
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'updated'], false],
            0.35,
            0.12,
          ],
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
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'updated'], false],
            4,
            2,
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'updated'], false],
            1.0,
            0.8,
          ],
          'line-dasharray': [3, 2],
        },
      });
    }

    // Vùng ngập đang được focus từ panel/list: vẽ riêng để luôn thấy rõ khung khu vực.
    if (!m.getSource('selected_flood_zone')) {
      m.addSource('selected_flood_zone', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      } as AnyData);
    }
    if (!m.getLayer('layer-selected-flood-zone-fill')) {
      m.addLayer({
        id: 'layer-selected-flood-zone-fill',
        type: 'fill',
        source: 'selected_flood_zone',
        paint: {
          'fill-color': ['coalesce', ['get', 'color'], '#EF4444'],
          'fill-opacity': 0.22,
        },
      });
    }
    if (!m.getLayer('layer-selected-flood-zone-outline')) {
      m.addLayer({
        id: 'layer-selected-flood-zone-outline',
        type: 'line',
        source: 'selected_flood_zone',
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#DC2626'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 15, 6],
          'line-opacity': 1,
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

  // ── Focus on team ─────────────────────────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;

    if (!focusTeam) {
      focusTeamMarkerRef.current?.remove();
      focusTeamMarkerRef.current = null;
      return;
    }

    // Ensure rescue_teams layer is visible
    setActiveLayers(prev => {
      const next = new Set(prev);
      next.add('rescue_teams');
      return next;
    });

    // Fly to team location if coordinates available
    const lat = Number(focusTeam.latitude);
    const lng = Number(focusTeam.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      m.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 1000,
      });

      const markerEl = document.createElement('div');
      markerEl.style.cssText = `
        width:36px;height:36px;border-radius:50%;
        background:#EA580C;border:3px solid white;
        box-shadow:0 4px 14px rgba(0,0,0,.28);
        display:flex;align-items:center;justify-content:center;
        font-size:17px;
      `;
      markerEl.textContent = '🚒';

      focusTeamMarkerRef.current?.remove();
      focusTeamMarkerRef.current = new maplibregl.Marker({ element: markerEl, anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(m);

      popupRef.current?.remove();
      popupRef.current = new maplibregl.Popup({ offset: 22, closeButton: true, maxWidth: '300px' })
        .setLngLat([lng, lat])
        .setHTML(`
<div style="font-family:system-ui,sans-serif;min-width:220px">
  <div style="font-size:10px;font-weight:700;color:#EA580C;letter-spacing:.08em;margin-bottom:4px">🚒 ĐỘI CỨU HỘ</div>
  <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:12px">${focusTeam.name}</div>
  <div style="background:#F9FAFB;border-radius:8px;padding:12px;border:1px solid #E5E7EB;text-align:center">
    <span style="color:#6B7280;font-size:12px">📍 Đã di chuyển đến vị trí đội</span>
  </div>
</div>`)
        .addTo(m);
    }
  }, [focusTeam, mapReady]);

  // ── Focus on a generic point from dashboard deep links ───────────────────
  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;

    const clearSelectedFloodZone = () => {
      const empty: GeoJsonFeatureCollection = { type: 'FeatureCollection', features: [] };
      upsertSource(m, 'selected_flood_zone', empty);
    };

    if (!focusPoint) {
      clearSelectedFloodZone();
      return;
    }

    const lat = Number(focusPoint.latitude);
    const lng = Number(focusPoint.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (focusPoint.type === 'incident') {
      clearSelectedFloodZone();
      setActiveLayers(prev => {
        const next = new Set(prev);
        next.add('incidents');
        next.add('flood_points');
        return next;
      });
    } else if (focusPoint.type === 'flood_zone') {
      setActiveLayers(prev => {
        const next = new Set(prev);
        next.add('flood_zones');
        return next;
      });
    } else {
      clearSelectedFloodZone();
    }

    if (focusPoint.type === 'flood_zone') {
      const matchedFeature = findFloodZoneFeature(dataRef.current.flood_zones, focusPoint);
      const zoneFeature = matchedFeature && getFeatureBounds(matchedFeature)
        ? matchedFeature
        : createFallbackFloodZoneFrame(focusPoint, lng, lat);

      upsertSource(m, 'selected_flood_zone', {
        type: 'FeatureCollection',
        features: [zoneFeature],
      });

      const bounds = getFeatureBounds(zoneFeature);
      if (bounds) {
        m.fitBounds(bounds, {
          padding: { top: 92, right: 92, bottom: 92, left: 92 },
          maxZoom: 15,
          duration: 1000,
        });
      } else {
        m.flyTo({ center: [lng, lat], zoom: 15, duration: 1000 });
      }
    } else {
      m.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 1000,
      });
    }

    const label = focusPoint.type === 'incident'
      ? '⚠️ SỰ CỐ'
      : focusPoint.type === 'shelter'
        ? '🏠 ĐIỂM SƠ TÁN'
        : focusPoint.type === 'flood_zone'
          ? '🌊 VÙNG NGẬP'
          : focusPoint.type === 'rescue_request'
            ? '🆘 YÊU CẦU CỨU HỘ'
            : '📍 VỊ TRÍ';

    const detailRows = focusPoint.type === 'flood_zone'
      ? `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
    <div style="background:#F9FAFB;border-radius:8px;padding:9px;border:1px solid #E5E7EB">
      <div style="color:#6B7280;font-size:10px;font-weight:700;text-transform:uppercase">Mực nước</div>
      <div style="font-size:14px;font-weight:800;color:#111827">${focusPoint.waterLevel || '—'}</div>
    </div>
    <div style="background:#F9FAFB;border-radius:8px;padding:9px;border:1px solid #E5E7EB">
      <div style="color:#6B7280;font-size:10px;font-weight:700;text-transform:uppercase">Rủi ro</div>
      <div style="font-size:14px;font-weight:800;color:#DC2626">${focusPoint.riskLevel || '—'}</div>
    </div>
  </div>
  <div style="margin-top:8px;color:#6B7280;font-size:12px">Trạng thái: <b style="color:#111827">${focusPoint.status || 'Theo dõi'}</b></div>`
      : focusPoint.type === 'shelter'
        ? `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
    <div style="background:#F9FAFB;border-radius:8px;padding:9px;border:1px solid #E5E7EB">
      <div style="color:#6B7280;font-size:10px;font-weight:700;text-transform:uppercase">Sức chứa</div>
      <div style="font-size:14px;font-weight:800;color:#111827">${focusPoint.capacity || '—'}</div>
    </div>
    <div style="background:#F9FAFB;border-radius:8px;padding:9px;border:1px solid #E5E7EB">
      <div style="color:#6B7280;font-size:10px;font-weight:700;text-transform:uppercase">Trạng thái</div>
      <div style="font-size:14px;font-weight:800;color:#16A34A">${focusPoint.status || '—'}</div>
    </div>
  </div>`
        : focusPoint.type === 'rescue_request'
          ? `
  <div style="background:#F9FAFB;border-radius:8px;padding:12px;border:1px solid #E5E7EB;margin-top:10px">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <tr>
        <td style="color:#6B7280;padding:4px 0;width:42%">Người yêu cầu</td>
        <td style="text-align:right;padding:4px 0"><b style="color:#111827">${focusPoint.caller || '—'}</b></td>
      </tr>
      <tr>
        <td style="color:#6B7280;padding:4px 0;border-top:1px solid #E5E7EB">Số điện thoại</td>
        <td style="text-align:right;padding:4px 0;border-top:1px solid #E5E7EB"><b style="color:#2563EB">${focusPoint.phone || '—'}</b></td>
      </tr>
      <tr>
        <td style="color:#6B7280;padding:4px 0;border-top:1px solid #E5E7EB">Số người</td>
        <td style="text-align:right;padding:4px 0;border-top:1px solid #E5E7EB"><b style="color:#111827">${focusPoint.peopleCount ? `${focusPoint.peopleCount} người` : '—'}</b></td>
      </tr>
      <tr>
        <td style="color:#6B7280;padding:4px 0;border-top:1px solid #E5E7EB">Trạng thái</td>
        <td style="text-align:right;padding:4px 0;border-top:1px solid #E5E7EB"><b style="color:#111827">${focusPoint.status || '—'}</b></td>
      </tr>
      <tr style="border-top:1px solid #E5E7EB">
        <td style="color:#6B7280;padding:4px 0">Mức khẩn cấp</td>
        <td style="text-align:right;padding:4px 0"><b style="color:#DC2626">${focusPoint.urgency || '—'}</b></td>
      </tr>
      <tr style="border-top:1px solid #E5E7EB">
        <td style="color:#6B7280;padding:4px 0;vertical-align:top">Địa điểm</td>
        <td style="text-align:right;color:#374151;padding:4px 0;word-break:break-word">${focusPoint.subtitle || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}</td>
      </tr>
    </table>
  </div>
  ${focusPoint.photoUrl
    ? `<img src="${focusPoint.photoUrl}" alt="Ảnh yêu cầu cứu hộ" style="width:100%;height:128px;object-fit:cover;border-radius:10px;margin-top:10px;border:1px solid #E5E7EB;background:#F3F4F6" />`
    : `<div style="margin-top:10px;border:1px dashed #D1D5DB;border-radius:10px;padding:10px;text-align:center;color:#6B7280;font-size:12px;background:#F9FAFB">Chưa có ảnh đính kèm</div>`}`
        : focusPoint.type === 'incident'
          ? `
  <div style="background:#F9FAFB;border-radius:8px;padding:12px;border:1px solid #E5E7EB;margin-top:10px">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <tr>
        <td style="color:#6B7280;padding:4px 0;width:42%">Mức độ</td>
        <td style="text-align:right;padding:4px 0"><b style="color:#DC2626">${focusPoint.severity || '—'}</b></td>
      </tr>
      <tr style="border-top:1px solid #E5E7EB">
        <td style="color:#6B7280;padding:4px 0">Trạng thái</td>
        <td style="text-align:right;padding:4px 0"><b style="color:#111827">${focusPoint.status || '—'}</b></td>
      </tr>
      <tr style="border-top:1px solid #E5E7EB">
        <td style="color:#6B7280;padding:4px 0;vertical-align:top">Địa điểm</td>
        <td style="text-align:right;color:#374151;padding:4px 0;word-break:break-word">${focusPoint.subtitle || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}</td>
      </tr>
    </table>
  </div>`
      : `
  <div style="background:#F9FAFB;border-radius:8px;padding:12px;border:1px solid #E5E7EB;text-align:center">
    <span style="color:#6B7280;font-size:12px">📍 Vị trí đang được chọn trên OpenMap</span>
  </div>`;

    popupRef.current?.remove();
    popupRef.current = new maplibregl.Popup({ offset: 15, closeButton: true, maxWidth: '320px' })
      .setLngLat([lng, lat])
      .setHTML(`
<div style="font-family:system-ui,sans-serif;min-width:220px">
  <div style="font-size:10px;font-weight:700;color:#DC2626;letter-spacing:.08em;margin-bottom:4px">${label}</div>
  <div style="font-size:15px;font-weight:700;color:#111827">${focusPoint.name}</div>
  ${focusPoint.subtitle ? `<div style="color:#6B7280;font-size:12px;margin-top:2px">${focusPoint.subtitle}</div>` : ''}
  ${detailRows}
</div>`)
      .addTo(m);
  }, [focusPoint, mapReady, dataVersion]);

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
        const typeLabel = isStreet ? tPopup('floodStreets') : tPopup('floodPoints');
        const typeIcon = isStreet ? '🛣️' : '💧';

        // Title: street_name > address
        const title = String(props.street_name ?? props.address ?? '—');
        const wardDistrict = [props.ward_name, props.district_name].filter(Boolean).join(', ');
        const freqLabel = tPopup('frequent');
        const freq = props.is_frequent
          ? `<span style="display:inline-block;background:#FEE2E2;color:#DC2626;border-radius:4px;padding:1px 7px;font-size:10px;font-weight:600;margin-left:6px">${freqLabel}</span>`
          : '';
        const startAddr = String(props.address ?? '—');
        const timeStr = formatTime((props.flood_started_at ?? props.reported_at) as string);
        const floodingLabel = tPopup('flooding');
        const endTimeStr = props.flood_ended_at ? formatTime(props.flood_ended_at as string) : floodingLabel;
        const infoTypeLabel = isStreet ? 'đoạn' : 'điểm';
        const floodInfoLabel = tPopup('floodInfo', { type: infoTypeLabel });
        const floodDepthLabel = tPopup('floodDepth');
        const cmLabel = tPopup('cm');
        const floodStartLocLabel = tPopup('floodStartLocation');
        const floodTimeLabel = tPopup('floodTime');
        const floodStatusLabel = tPopup('floodStatus');
        const recededLabel = tPopup('receded');
        const desc = props.description ? `<div style="color:#6B7280;font-size:12px;margin-top:8px;padding-top:8px;border-top:1px solid #E5E7EB">${String(props.description)}</div>` : '';

        html = `
<div style="font-family:system-ui,sans-serif;width:100%;box-sizing:border-box">
  <div style="font-size:10px;font-weight:700;color:#6B7280;letter-spacing:.08em;margin-bottom:4px">${typeIcon} ${typeLabel}${freq}</div>
  <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px;line-height:1.4;padding-right:4px">${title}</div>
  <div style="font-size:12px;color:#6B7280;margin-bottom:12px">${wardDistrict}</div>
  <div style="background:#F9FAFB;border-radius:8px;padding:12px;border:1px solid #E5E7EB">
    <div style="font-size:11px;font-weight:700;color:#374151;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">${floodInfoLabel}</div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed">
      <tr>
        <td style="color:#6B7280;padding:5px 0;width:45%">${floodDepthLabel}</td>
        <td style="text-align:right;font-weight:700;color:${color};padding:5px 0;font-size:14px">
          ${wl > 0 ? `${wl} <span style="font-size:11px;font-weight:400;color:#6B7280">${cmLabel}</span>` : '<span style="color:#9CA3AF">—</span>'}
        </td>
      </tr>
      ${isStreet ? `
      <tr style="border-top:1px solid #E5E7EB">
        <td style="color:#6B7280;padding:5px 0;vertical-align:top">${floodStartLocLabel}</td>
        <td style="text-align:right;color:#374151;padding:5px 0;word-break:break-word">${startAddr}</td>
      </tr>` : ''}
      <tr style="border-top:1px solid #E5E7EB">
        <td style="color:#6B7280;padding:5px 0">${floodTimeLabel}</td>
        <td style="text-align:right;color:#374151;padding:5px 0">${timeStr}</td>
      </tr>
      <tr style="border-top:1px solid #E5E7EB">
        <td style="color:#6B7280;padding:5px 0">${floodStatusLabel}</td>
        <td style="text-align:right;padding:5px 0">
          ${props.flood_ended_at
            ? `<span style="background:#F3F4F6;color:#6B7280;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:600">${recededLabel}</span>`
            : `<span style="background:#DCFCE7;color:#16A34A;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:600">${floodingLabel}</span>`
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
        const phoneLabel = tPopup('phone');
        const stationHeaderLabel = tPopup('sensorStationHeader');
        const sensorInfoLabel = tPopup('sensorStation');
        const stationTypeLabel = tPopup('stationType');
        const addressLabel = tPopup('address');
        const waterLevelLabel = tPopup('waterLevel');
        const phone = props.phone ? `
      <tr>
        <td style="color:#6B7280;padding:4px 0">${phoneLabel}</td>
        <td style="text-align:right;color:#374151;padding:4px 0">📞 ${String(props.phone)}</td>
      </tr>` : '';

        html = `
<div style="font-family:system-ui,sans-serif;width:100%;box-sizing:border-box">
  <div style="font-size:10px;font-weight:700;color:#7C3AED;letter-spacing:.08em;margin-bottom:4px">${icon} ${stationHeaderLabel}</div>
  <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px;line-height:1.4;padding-right:4px">${String(props.name ?? '—')}</div>
  <div style="font-size:12px;color:#6B7280;margin-bottom:12px">${wardDistrict || addr}</div>
  <div style="background:#F9FAFB;border-radius:8px;padding:12px;border:1px solid #E5E7EB">
    <div style="font-size:11px;font-weight:700;color:#374151;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">${sensorInfoLabel}</div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed">
      <tr>
        <td style="color:#6B7280;padding:5px 0;width:45%">${stationTypeLabel}</td>
        <td style="text-align:right;color:#374151;padding:5px 0;word-break:break-word">${label}</td>
      </tr>
      <tr style="border-top:1px solid #E5E7EB">
        <td style="color:#6B7280;padding:5px 0;vertical-align:top">${addressLabel}</td>
        <td style="text-align:right;color:#374151;padding:5px 0;word-break:break-word">${addr}</td>
      </tr>
      <tr style="border-top:1px solid #E5E7EB">
        <td style="color:#6B7280;padding:5px 0">${waterLevelLabel}</td>
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
        const severityColor = props.severity === 'critical' ? '#DC2626' : props.severity === 'high' ? '#EA580C' : props.severity === 'medium' ? '#D97706' : '#16A34A';
        const severityBg = props.severity === 'critical' ? '#FEE2E2' : props.severity === 'high' ? '#FFEDD5' : props.severity === 'medium' ? '#FEF3C7' : '#DCFCE7';
        const statusColor = props.status === 'responding' ? '#D97706' : props.status === 'resolved' ? '#16A34A' : '#6B7280';
        const statusBg = props.status === 'responding' ? '#FEF3C7' : props.status === 'resolved' ? '#DCFCE7' : '#F3F4F6';
        const descRow = props.description ? `<tr style="border-top:1px solid #E5E7EB"><td colspan="2" style="color:#374151;padding:6px 0;font-size:12px;line-height:1.5">${String(props.description)}</td></tr>` : '';
        const affectedRow = props.affected_people ? `<tr style="border-top:1px solid #E5E7EB"><td style="color:#6B7280;padding:4px 0">👥 Người bị ảnh hưởng</td><td style="text-align:right;font-weight:600;color:#111827;padding:4px 0">${String(props.affected_people)} người</td></tr>` : '';
        const waterRow = props.water_level_m ? `<tr style="border-top:1px solid #E5E7EB"><td style="color:#6B7280;padding:4px 0">💧 Mực nước</td><td style="text-align:right;font-weight:700;color:#2563EB;padding:4px 0">${Number(props.water_level_m).toFixed(2)} m</td></tr>` : '';
        const timeRow = props.reported_at ? `<tr style="border-top:1px solid #E5E7EB"><td style="color:#6B7280;padding:4px 0">🕐 Báo cáo lúc</td><td style="text-align:right;color:#374151;padding:4px 0">${String(props.reported_at)}</td></tr>` : '';
        html = `
<div style="font-family:system-ui,sans-serif;min-width:270px;max-width:320px">
  <div style="font-size:10px;font-weight:700;color:#DC2626;letter-spacing:.08em;margin-bottom:4px">⚠️ SỰ CỐ · ${String(props.type_label ?? 'Sự cố')}</div>
  <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:2px;line-height:1.3">${String(props.title ?? '—')}</div>
  <div style="font-size:12px;color:#6B7280;margin-bottom:10px">${wardDistrict || String(props.address ?? '—')}</div>
  <div style="display:flex;gap:6px;margin-bottom:10px">
    <span style="background:${severityBg};color:${severityColor};border-radius:5px;padding:2px 9px;font-size:11px;font-weight:700">${String(props.severity_label ?? props.severity ?? '—')}</span>
    <span style="background:${statusBg};color:${statusColor};border-radius:5px;padding:2px 9px;font-size:11px;font-weight:700">${String(props.status_label ?? props.status ?? '—')}</span>
  </div>
  <div style="background:#F9FAFB;border-radius:8px;padding:12px;border:1px solid #E5E7EB">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      ${descRow}
      ${waterRow}
      ${affectedRow}
      ${timeRow}
    </table>
  </div>
  <div style="margin-top:8px;text-align:right">
    <a href="/dashboard/incidents/${String(props.id)}" style="font-size:12px;color:#2563EB;font-weight:600;text-decoration:none">Xem chi tiết →</a>
  </div>
</div>`;
      } else if (layerId === 'layer-shelters') {
        const avail = Number(props.available_beds ?? 0);
        const cap = Number(props.capacity ?? 0);
        const pct = cap > 0 ? Math.round((1 - avail / cap) * 100) : 0;
        html = `
<div style="font-family:system-ui,sans-serif;min-width:260px;max-width:320px">
  <div style="font-size:10px;font-weight:700;color:#16A34A;letter-spacing:.08em;margin-bottom:4px">🏠 ${tPopup('shelter')}</div>
  <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:12px;line-height:1.3">${String(props.name ?? '—')}</div>
  <div style="background:#F9FAFB;border-radius:8px;padding:12px;border:1px solid #E5E7EB">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <tr>
        <td style="color:#6B7280;padding:4px 0">${tPopup('capacity')}</td>
        <td style="text-align:right;color:#374151;font-weight:600;padding:4px 0">${cap} ${tPopup('people')}</td>
      </tr>
      <tr>
        <td style="color:#6B7280;padding:4px 0">${tPopup('available')}</td>
        <td style="text-align:right;font-weight:700;color:#16A34A;padding:4px 0">${avail} ${tPopup('spots')}</td>
      </tr>
      <tr><td colspan="2" style="padding:6px 0 2px">
        <div style="background:#E5E7EB;border-radius:99px;height:6px;overflow:hidden">
          <div style="background:#16A34A;height:100%;width:${100-pct}%;border-radius:99px;transition:width .3s"></div>
        </div>
        <div style="font-size:10px;color:#9CA3AF;margin-top:2px;text-align:right">${pct}% ${tPopup('used')}</div>
      </td></tr>
    </table>
  </div>
</div>`;
      } else if (layerId === 'layer-rescue-teams') {
        html = `
<div style="font-family:system-ui,sans-serif;min-width:220px">
  <div style="font-size:10px;font-weight:700;color:#EA580C;letter-spacing:.08em;margin-bottom:4px">🚒 ${tPopup('rescueTeam')}</div>
  <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:12px">${String(props.name ?? '—')}</div>
  <div style="background:#F9FAFB;border-radius:8px;padding:12px;border:1px solid #E5E7EB">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <tr>
        <td style="color:#6B7280;padding:4px 0">${tPopup('status')}</td>
        <td style="text-align:right;padding:4px 0"><span style="background:#FED7AA;color:#EA580C;border-radius:4px;padding:1px 7px;font-size:11px;font-weight:600">${String(props.status ?? '—')}</span></td>
      </tr>
      <tr>
        <td style="color:#6B7280;padding:4px 0">${tPopup('teamType')}</td>
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
          <span>{t('loading')}</span>
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
          {tMap('title')}
        </Button>

        {layerPanelOpen && (
          <div className="bg-background/98 backdrop-blur-sm border border-border rounded-xl shadow-xl w-[240px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-muted/40">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Layers size={13} className="text-primary" />
                {tMap('dataLayers')}
              </div>
              <button onClick={() => setLayerPanelOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>

            {/* Groups */}
            <div className="py-1 max-h-[420px] overflow-y-auto">
              {layerGroups.map(group => {
                const groupLayers = layerConfigs.filter(c => c.group === group.id);
                return (
                  <div key={group.id}>
                    {/* Group header */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30">
                      {group.icon}
                      {group.label}
                    </div>
                    {/* Layer rows */}
                    {groupLayers.map(cfg => {
                      const on = activeLayers.has(cfg.key as LayerKey);
                      return (
                        <button
                          key={cfg.key}
                          onClick={() => toggleLayer(cfg.key as LayerKey)}
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
          title={t('refresh')}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-10 right-10 z-10 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-2 text-[10px] space-y-1 shadow">
        <div className="font-semibold text-xs mb-1 flex items-center gap-1">
          <MapPin size={11} /> {tLegend('waterLevel')}
        </div>
        {[
          { color: '#EF4444', label: tLegend('above75') },
          { color: '#F97316', label: tLegend('above50') },
          { color: '#3B82F6', label: tLegend('above25') },
          { color: '#22C55E', label: tLegend('below25') },
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
