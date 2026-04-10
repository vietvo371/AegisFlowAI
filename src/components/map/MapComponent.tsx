'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from '@openmapvn/openmapvn-gl';
import '@openmapvn/openmapvn-gl/dist/maplibre-gl.css';
import { reverseGeocode, decodePolyline } from '@/lib/openmap';
import type { EvacuationRoute } from '@/lib/openmap';

// ─── Data ────────────────────────────────────────────────────────────────────

const FLOOD_ZONES = [
  {
    id: 'lien-chieu', name: 'Liên Chiểu',
    coords: [
      [108.132, 16.085], [108.140, 16.090], [108.145, 16.105], 
      [108.158, 16.108], [108.165, 16.095], [108.158, 16.085], 
      [108.145, 16.075], [108.132, 16.085]
    ],
    color: '#f04438', opacity: 0.35,
  },
  {
    id: 'cam-le', name: 'Cẩm Lệ (Ven sông)',
    coords: [
      [108.185, 16.015], [108.195, 16.025], [108.210, 16.028], 
      [108.225, 16.020], [108.230, 16.010], [108.215, 16.002], 
      [108.198, 16.005], [108.185, 16.015]
    ],
    color: '#f79009', opacity: 0.28,
  },
  {
    id: 'hoa-vang', name: 'Hoà Vang (Hòa Thọ Tây)',
    coords: [
      [108.155, 16.020], [108.165, 16.030], [108.175, 16.035], 
      [108.180, 16.025], [108.170, 16.015], [108.155, 16.020]
    ],
    color: '#f79009', opacity: 0.24,
  },
];

const MARKERS = [
  { id: 1, lng: 108.145, lat: 16.095, label: 'Cảnh báo: Liên Chiểu', color: '#f04438', type: 'critical' },
  { id: 2, lng: 108.205, lat: 16.022, label: 'Ngập lụt: Sông Cẩm Lệ', color: '#f79009', type: 'warning' },
  { id: 3, lng: 108.168, lat: 16.028, label: 'Sơ tán: THPT Hoà Vang', color: '#17b26a', type: 'shelter' },
  { id: 4, lng: 108.222, lat: 16.058, label: 'Sơ tán: BV Đà Nẵng', color: '#17b26a', type: 'shelter' },
];

export interface MapComponentProps {
  evacuationRoute?: EvacuationRoute | null;
}

export default function MapComponent({ evacuationRoute }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [clickAddress, setClickAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://maptiles.openmap.vn/styles/day-v1/style.json?apikey=${process.env.NEXT_PUBLIC_OPENMAP_API_KEY || ''}`,
      center: [108.195, 16.055],
      zoom: 12,
      pitch: 45, // 3D tilt
      bearing: -10, // Slight rotation for depth
      antialias: true,
      attributionControl: { compact: true },
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-right');

    map.on('load', () => {
      map.resize();
      
      // 3D Buildings if available in style
      const layers = map.getStyle().layers;
      const labelLayerId = layers?.find(layer => layer.type === 'symbol' && layer.layout?.['text-field'])?.id;

      // Flood zones - Polygon visualization
      FLOOD_ZONES.forEach(zone => {
        map.addSource(zone.id, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { name: zone.name },
            geometry: { type: 'Polygon', coordinates: [zone.coords as [number, number][]] },
          },
        });

        // Glow layer for "modern" look
        map.addLayer({
          id: `${zone.id}-glow`,
          type: 'fill',
          source: zone.id,
          paint: {
            'fill-color': zone.color,
            'fill-opacity': zone.opacity * 0.5,
            'fill-translate': [2, 2],
          }
        });

        map.addLayer({
          id: `${zone.id}-fill`,
          type: 'fill',
          source: zone.id,
          paint: {
            'fill-color': zone.color,
            'fill-opacity': zone.opacity,
            'fill-outline-color': zone.color,
          }
        });

        map.addLayer({
          id: `${zone.id}-outline`,
          type: 'line',
          source: zone.id,
          paint: {
            'line-color': zone.color,
            'line-width': 3,
            'line-opacity': 0.8,
            'line-blur': 2,
          }
        });
      });

      // Route layer
      map.addSource('evacuation-route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
      });

      map.addLayer({
        id: 'evacuation-route-glow',
        type: 'line', source: 'evacuation-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#6938ef', 'line-width': 14, 'line-opacity': 0.2, 'line-blur': 4 },
      });

      map.addLayer({
        id: 'evacuation-route-line',
        type: 'line', source: 'evacuation-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#6938ef', 'line-width': 5, 'line-opacity': 1 },
      });

      // Modern Markers
      MARKERS.forEach(m => {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.cssText = `
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${m.color};
          border: 2.5px solid white;
          box-shadow: 0 0 15px ${m.color}66, 0 2px 4px rgba(0,0,0,0.2);
          cursor: pointer;
          position: relative;
        `;
        
        const ring = document.createElement('div');
        ring.className = 'marker-ring';
        ring.style.cssText = `
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          border: 2px solid ${m.color};
          animation: marker-pulse 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
        `;
        el.appendChild(ring);

        new maplibregl.Marker({ element: el })
          .setLngLat([m.lng, m.lat])
          .setPopup(new maplibregl.Popup({ offset: 15, closeButton: false, className: 'modern-popup' })
            .setHTML(`
              <div style="padding: 4px">
                <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${m.color}; margin-bottom: 2px">${m.type}</div>
                <div style="font-size: 12px; font-weight: 700; color: #1e293b">${m.label}</div>
              </div>
            `))
          .addTo(map);
      });

      map.on('click', async (e) => {
        const { lng, lat } = e.lngLat;
        setClickAddress('Tra cứu địa chỉ...');
        const result = await reverseGeocode({ lat, lng });
        setClickAddress(result ? result.address : null);
        if (result) setTimeout(() => setClickAddress(null), 5000);
      });

      map.on('styleimagemissing', (e) => {
        const id = e.id;
        const width = 1, height = 1;
        const data = new Uint8Array(4);
        map.addImage(id, { width, height, data });
      });

      setLoaded(true);
    });

    const ro = new ResizeObserver(() => { mapRef.current?.resize(); });
    ro.observe(mapContainer.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const source = map.getSource('evacuation-route') as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    if (!evacuationRoute?.polyline) {
      source.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } });
      return;
    }

    const coords = decodePolyline(evacuationRoute.polyline);
    source.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } });

    if (coords.length > 0) {
      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 100, duration: 1500, pitch: 45 }
      );
    }
  }, [evacuationRoute, loaded]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {!loaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm font-bold text-foreground">Đang tải bản đồ...</p>
        </div>
      )}

      {/* Modern Badge */}
      <div className="absolute top-4 left-4 z-10 hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl bg-background/90 backdrop-blur-md border border-border shadow-2xl">
        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        <span className="text-xs font-bold tracking-tight text-foreground">Bản đồ Ngập lụt trực tiếp</span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 px-2 py-0.5 rounded-lg bg-muted border border-border">Đà Nẵng</span>
      </div>

      {clickAddress && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 px-4 py-2.5 rounded-2xl bg-background/95 backdrop-blur-md border border-border shadow-2xl text-xs font-semibold text-foreground animate-fade-in-up">
          <span className="mr-2">📍</span> {clickAddress}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-2xl bg-background/90 backdrop-blur-md border border-border shadow-2xl">
        {[
          ['#f04438', 'Nghiệm trọng'],
          ['#f79009', 'Cao/Cảnh báo'],
          ['#17b26a', 'Điểm an toàn'],
        ].map(([c, l]) => (
          <div key={l} className="flex items-center gap-2">
            <div style={{ background: c }} className="w-2.5 h-2.5 rounded-full shadow-sm" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{l}</span>
          </div>
        ))}
        {evacuationRoute && (
          <div className="flex items-center gap-2 pl-4 border-l border-border ml-2">
            <div className="w-6 h-1 rounded-full bg-primary" />
            <span className="text-[10px] font-bold text-primary uppercase">Tuyến sơ tán</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes marker-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .modern-popup .maplibregl-popup-content {
          padding: 12px;
          border-radius: 16px;
          border: 1px solid hsl(var(--border));
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
        }
        .modern-popup .maplibregl-popup-tip {
          display: none;
        }
      `}</style>
    </div>
  );
}
