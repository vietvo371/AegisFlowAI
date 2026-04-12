'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from '@openmapvn/openmapvn-gl';
import '@openmapvn/openmapvn-gl/dist/maplibre-gl.css';
import { reverseGeocode, decodePolyline } from '@/lib/openmap';
import type { EvacuationRoute } from '@/lib/openmap';
import api from '@/lib/api';
import echo from '@/lib/echo';
import { toast } from 'sonner';

// ─── Data ────────────────────────────────────────────────────────────────────

export interface MapComponentProps {
  evacuationRoute?: EvacuationRoute | null;
}

export default function MapComponent({ evacuationRoute }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [clickAddress, setClickAddress] = useState<string | null>(null);
  const [mapData, setMapData] = useState<{
    flood_zones: any;
    incidents: any;
    rescue_teams: any;
    shelters: any;
    sensors: any;
  } | null>(null);
  const [layers, setLayers] = useState({
    flood_zones: true,
    incidents: true,
    rescue_teams: true,
    shelters: true,
    sensors: false // Default off to reduce noise
  });
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // 1. Fetch data from API
  const fetchData = async () => {
    try {
      const res = await api.get('/map/all');
      if (res.data?.success) {
        setMapData(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch map data:', error);
    }
  };

  useEffect(() => {
    fetchData();

    // 2. Setup Real-time Listeners
    if (echo) {
      const channel = echo.channel('flood');
      
      const handleEvent = (e?: any) => {
        fetchData();
        
        // FlyTo if it's a new critical incident
        if (e?.incident && e.incident.severity === 'critical' && mapRef.current) {
           const coords = e.incident.location; // Assuming {lat, lng}
           if (coords) {
             mapRef.current.flyTo({
               center: [coords.lng, coords.lat],
               zoom: 15,
               pitch: 60,
               essential: true
             });
           }
        }
      };

      channel.listen('.incident.created', (e: any) => handleEvent(e));
      channel.listen('.flood_zone.updated', () => handleEvent());
      channel.listen('.alert.created', () => handleEvent());
      channel.listen('.rescue_request.created', () => handleEvent());
      channel.listen('.rescue_request.updated', () => handleEvent());
      channel.listen('.prediction.received', () => handleEvent());

      return () => {
        echo?.leaveChannel('flood');
      };
    }
  }, []);

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

  // 3. Update Layers & Markers when mapData changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !mapData) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Sync Flood Zones
    mapData.flood_zones.features.forEach((zone: any) => {
      const sourceId = `zone-${zone.id}`;
      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
      
      const visibility = layers.flood_zones ? 'visible' : 'none';

      if (source) {
        source.setData(zone);
        if (map.getLayer(`${sourceId}-fill`)) map.setLayoutProperty(`${sourceId}-fill`, 'visibility', visibility);
        if (map.getLayer(`${sourceId}-outline`)) map.setLayoutProperty(`${sourceId}-outline`, 'visibility', visibility);
      } else {
        map.addSource(sourceId, { type: 'geojson', data: zone });
        
        map.addLayer({
          id: `${sourceId}-fill`,
          type: 'fill',
          source: sourceId,
          layout: { 'visibility': visibility },
          paint: {
            'fill-color': zone.properties.color || '#f04438',
            'fill-opacity': zone.properties.opacity || 0.3,
          }
        });

        map.addLayer({
          id: `${sourceId}-outline`,
          type: 'line',
          source: sourceId,
          layout: { 'visibility': visibility },
          paint: {
            'line-color': zone.properties.color || '#f04438',
            'line-width': 2,
            'line-opacity': 0.8,
          }
        });
      }
    });

    // Add Incidents as Markers
    if (layers.incidents) {
      mapData.incidents.features.forEach((f: any) => {
        const color = f.properties.severity === 'critical' ? '#EF4444' : '#F59E0B';
        const el = document.createElement('div');
        el.className = 'custom-marker incident-marker';
        el.style.cssText = `
          width: 16px; height: 16px; border-radius: 50%;
          background: ${color}; border: 3px solid white;
          box-shadow: 0 0 20px ${color}88; cursor: pointer; position: relative;
        `;
        
        if (f.properties.severity === 'critical') {
           const ring = document.createElement('div');
           ring.style.cssText = `
             position: absolute; inset: -12px; border-radius: 50%;
             border: 2px solid ${color};
             animation: marker-pulse 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
           `;
           el.appendChild(ring);
        }

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(f.geometry.coordinates)
          .setPopup(new maplibregl.Popup({ offset: 15, closeButton: false, className: 'modern-popup' })
            .setHTML(`
              <div class="popup-content">
                <div class="popup-tag" style="background: ${color}22; color: ${color}">${f.properties.severity_label || f.properties.severity}</div>
                <div class="popup-title">${f.properties.title}</div>
                <div class="popup-desc">${f.properties.address || 'Đang cập nhật vị trí...'}</div>
                <div class="popup-footer">Trạng thái: ${f.properties.status_label || f.properties.status}</div>
              </div>
            `))
          .addTo(map);
        
        markersRef.current.push(marker);
      });
    }

    // Add Shelters as Markers
    if (layers.shelters) {
      mapData.shelters.features.forEach((f: any) => {
        const color = '#10B981';
        const el = document.createElement('div');
        el.className = 'custom-marker shelter-marker';
        el.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="2.5" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>';
        el.style.cssText = `
          width: 28px; height: 28px; border-radius: 10px;
          background: ${color}; display: flex; align-items: center; justify-content: center;
          border: 2.5px solid white; box-shadow: 0 4px 12px ${color}44; cursor: pointer;
        `;
        
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(f.geometry.coordinates)
          .setPopup(new maplibregl.Popup({ offset: 15, closeButton: false, className: 'modern-popup' })
            .setHTML(`
              <div class="popup-content">
                <div class="popup-tag" style="background: ${color}22; color: ${color}">Điểm tị nạn</div>
                <div class="popup-title">${f.properties.name}</div>
                <div class="popup-desc">Sức chứa: ${f.properties.available_beds}/${f.properties.capacity} người</div>
                <div class="popup-footer">Trạng thái: ${f.properties.status === 'open' ? 'Hoạt động' : 'Đầy'}</div>
              </div>
            `))
          .addTo(map);
        
        markersRef.current.push(marker);
      });
    }

    // Add Rescue Teams
    if (layers.rescue_teams) {
      mapData.rescue_teams.features.forEach((f: any) => {
        const color = '#3B82F6';
        const el = document.createElement('div');
        el.className = 'custom-marker team-marker';
        el.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="white" stroke-width="2.5" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>';
        el.style.cssText = `
          width: 24px; height: 24px; border-radius: 50%;
          background: ${color}; display: flex; align-items: center; justify-content: center;
          border: 2px solid white; box-shadow: 0 4px 10px ${color}44; cursor: pointer;
        `;
        
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(f.geometry.coordinates)
          .setPopup(new maplibregl.Popup({ offset: 15, closeButton: false, className: 'modern-popup' })
            .setHTML(`
              <div class="popup-content">
                <div class="popup-tag" style="background: ${color}22; color: ${color}">Đội cứu hộ</div>
                <div class="popup-title">${f.properties.name}</div>
                <div class="popup-desc">Chuyên môn: ${f.properties.team_type}</div>
                <div class="popup-footer">Trạng thái: ${f.properties.status}</div>
              </div>
            `))
          .addTo(map);
        markersRef.current.push(marker);
      });
    }

    // Add Sensors
    if (layers.sensors) {
      mapData.sensors.features.forEach((f: any) => {
        const color = '#8B5CF6';
        const el = document.createElement('div');
        el.style.cssText = `
          width: 10px; height: 10px; border-radius: 50%;
          background: ${color}; border: 1.5px solid white;
          box-shadow: 0 0 8px ${color}44; cursor: pointer;
        `;
        
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(f.geometry.coordinates)
          .setPopup(new maplibregl.Popup({ offset: 10, closeButton: false, className: 'modern-popup' })
            .setHTML(`
              <div class="popup-content">
                <div class="popup-tag" style="background: ${color}22; color: ${color}">Cảm biến</div>
                <div class="popup-title">${f.properties.name}</div>
                <div class="popup-desc">Giá trị: ${f.properties.last_value}m</div>
              </div>
            `))
          .addTo(map);
        markersRef.current.push(marker);
      });
    }

  }, [mapData, loaded, layers]);

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

      {/* Layer Toggle */}
      <div className="absolute top-20 left-4 z-10 flex flex-col gap-2 p-3 rounded-2xl bg-background/90 backdrop-blur-md border border-border shadow-2xl">
         <div className="text-[10px] font-bold text-muted-foreground uppercase px-1 mb-1">Lớp dữ liệu</div>
         {Object.entries(layers).map(([key, value]) => (
            <label key={key} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer transition-colors group">
               <input 
                 type="checkbox" 
                 checked={value} 
                 onChange={() => setLayers(prev => ({ ...prev, [key]: !prev[key as keyof typeof layers] }))}
                 className="w-3.5 h-3.5 rounded border-muted-foreground/30 accent-primary"
               />
               <span className="text-[10px] font-bold text-foreground capitalize group-hover:text-primary transition-colors">
                 {key.replace('_', ' ')}
               </span>
            </label>
         ))}
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
          animation: marker-pulse 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
        }
        .modern-popup .maplibregl-popup-content {
          padding: 0;
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid hsl(var(--border) / 0.5);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.2);
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(12px);
          min-width: 200px;
        }
        .popup-content {
          padding: 12px;
        }
        .popup-tag {
          font-size: 10px; font-weight: 800; text-transform: uppercase; 
          padding: 2px 8px; border-radius: 6px; width: fit-content; margin-bottom: 8px;
        }
        .popup-title {
          font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 4px;
        }
        .popup-desc {
          font-size: 11px; color: #64748b; margin-bottom: 8px; line-height: 1.4;
        }
        .popup-footer {
          font-size: 10px; font-weight: 600; color: #94a3b8; border-top: 1px solid #f1f5f9;
          padding-top: 8px; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .modern-popup .maplibregl-popup-tip {
          display: none;
        }
      `}</style>
    </div>
  );
}
