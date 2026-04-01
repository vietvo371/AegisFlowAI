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
    coords: [[108.132, 16.085], [108.158, 16.085], [108.158, 16.108], [108.132, 16.108], [108.132, 16.085]],
    color: '#f04438', opacity: 0.3,
  },
  {
    id: 'hoa-vang', name: 'Hoà Vang',
    coords: [[107.952, 15.982], [108.012, 15.982], [108.012, 16.048], [107.952, 16.048], [107.952, 15.982]],
    color: '#f79009', opacity: 0.22,
  },
  {
    id: 'son-tra', name: 'Sơn Trà',
    coords: [[108.218, 16.082], [108.255, 16.082], [108.255, 16.118], [108.218, 16.118], [108.218, 16.082]],
    color: '#f79009', opacity: 0.18,
  },
];

const MARKERS = [
  { id: 1, lng: 108.145, lat: 16.096, label: '🔴 Cảnh báo: Liên Chiểu', color: '#f04438' },
  { id: 2, lng: 107.980, lat: 16.010, label: '🟡 Cảnh báo: Hoà Vang', color: '#f79009' },
  { id: 3, lng: 108.207, lat: 16.067, label: '🟢 Sơ tán: THPT Hoà Vang', color: '#17b26a' },
  { id: 4, lng: 108.172, lat: 16.054, label: '🟢 Sơ tán: BV Liên Chiểu', color: '#17b26a' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MapComponentProps {
  evacuationRoute?: EvacuationRoute | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MapComponent({ evacuationRoute }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [clickAddress, setClickAddress] = useState<string | null>(null);

  // ─── Init map ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://maptiles.openmap.vn/styles/day-v1/style.json?apikey=${process.env.NEXT_PUBLIC_OPENMAP_API_KEY || ''}`,
      center: [108.2062, 16.0471],
      zoom: 11.5,
      pitch: 0,
      bearing: 0,
      attributionControl: { compact: true },
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-right');

    map.on('load', () => {
      map.resize();
      setLoaded(true);

      // Flood zones
      FLOOD_ZONES.forEach(zone => {
        map.addSource(zone.id, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { name: zone.name },
            geometry: { type: 'Polygon', coordinates: [zone.coords as [number, number][]] },
          },
        });
        map.addLayer({ id: `${zone.id}-fill`, type: 'fill', source: zone.id, paint: { 'fill-color': zone.color, 'fill-opacity': zone.opacity } });
        map.addLayer({ id: `${zone.id}-outline`, type: 'line', source: zone.id, paint: { 'line-color': zone.color, 'line-width': 2, 'line-opacity': 0.7 } });
      });

      // Route layer (empty until dispatch)
      map.addSource('evacuation-route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
      });
      map.addLayer({
        id: 'evacuation-route-glow',
        type: 'line', source: 'evacuation-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#6938ef', 'line-width': 12, 'line-opacity': 0.15, 'line-blur': 3 },
      });
      map.addLayer({
        id: 'evacuation-route-line',
        type: 'line', source: 'evacuation-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#6938ef', 'line-width': 4, 'line-opacity': 0.9 },
      });

      // Markers
      MARKERS.forEach(m => {
        const el = document.createElement('div');
        el.style.cssText = `width:13px;height:13px;border-radius:50%;background:${m.color};border:2px solid white;cursor:pointer;position:relative;box-shadow:0 1px 4px rgba(0,0,0,0.25)`;
        const pulse = document.createElement('div');
        pulse.style.cssText = `position:absolute;inset:-5px;border-radius:50%;background:${m.color}28;animation:pulse-ring 2s ease-out infinite`;
        el.appendChild(pulse);
        new maplibregl.Marker({ element: el })
          .setLngLat([m.lng, m.lat])
          .setPopup(new maplibregl.Popup({ offset: 12, closeButton: false })
            .setHTML(`<span style="font-family:Inter,sans-serif;font-size:12px;font-weight:500;color:#344054">${m.label}</span>`))
          .addTo(map);
      });

      // Click → reverse geocode
      map.on('click', async (e) => {
        const { lng, lat } = e.lngLat;
        setClickAddress('Đang tra địa chỉ...');
        const result = await reverseGeocode({ lat, lng });
        setClickAddress(result ? result.address : null);
        if (result) setTimeout(() => setClickAddress(null), 5000);
      });
    });

    // ResizeObserver ensures canvas always matches container
    const ro = new ResizeObserver(() => { mapRef.current?.resize(); });
    ro.observe(mapContainer.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ─── Draw route when prop changes ────────────────────────────────────────────

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
        { padding: 80, duration: 1200 }
      );
    }
  }, [evacuationRoute, loaded]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>

      {/* MapLibre canvas — must have explicit width + height per docs */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Loading overlay */}
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f4f3ff', border: '1px solid #d9d6fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <svg style={{ width: 22, height: 22, animation: '__spin 1s linear infinite', color: '#6938ef' }} fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>Đang tải bản đồ...</p>
          <p style={{ fontSize: 11, marginTop: 4, color: '#98a2b3' }}>OpenMap.vn · Đà Nẵng</p>
        </div>
      )}

      {/* Badge */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(8px)', border: '1px solid #eaecf0', boxShadow: '0px 1px 3px rgba(16,24,40,0.1)' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f04438', display: 'inline-block', animation: '__pulse 1.8s ease infinite' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#344054' }}>Real-time Flood Map</span>
        <span style={{ fontSize: 10, color: '#98a2b3' }}>· Đà Nẵng</span>
      </div>

      {/* Address popup */}
      {clickAddress && (
        <div style={{ position: 'absolute', bottom: 56, left: '50%', transform: 'translateX(-50%)', zIndex: 20, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.96)', border: '1px solid #eaecf0', color: '#344054', fontSize: 12, fontWeight: 500, backdropFilter: 'blur(8px)', boxShadow: '0px 4px 8px rgba(16,24,40,0.1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>
          📍 {clickAddress}
        </div>
      )}

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 8, left: 12, zIndex: 10, display: 'flex', alignItems: 'center', gap: 10, padding: '5px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(8px)', border: '1px solid #eaecf0', boxShadow: '0px 1px 3px rgba(16,24,40,0.08)', fontSize: 11, color: '#667085' }}>
        {([['#f04438', 'Nghiêm trọng'], ['#f79009', 'Cao'], ['#17b26a', 'An toàn']] as [string, string][]).map(([c, l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: c + 'a0', display: 'inline-block' }} />
            {l}
          </span>
        ))}
        {evacuationRoute && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4, paddingLeft: 10, borderLeft: '1px solid #eaecf0' }}>
            <span style={{ width: 14, height: 2, background: '#6938ef', borderRadius: 2, display: 'inline-block' }} />
            <span style={{ color: '#6938ef', fontWeight: 600 }}>Tuyến sơ tán</span>
          </span>
        )}
      </div>

      <style>{`
        @keyframes __spin { to { transform: rotate(360deg); } }
        @keyframes __pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.35)} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.7} 70%{transform:scale(2.2);opacity:0} 100%{transform:scale(2.2);opacity:0} }
      `}</style>
    </div>
  );
}
