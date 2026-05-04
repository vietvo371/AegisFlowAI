import * as React from 'react';

// Tọa độ trung tâm các quận Đà Nẵng (khớp với OpenWeatherService backend)
const DISTRICTS = [
  { id: 1, name: 'Liên Chiểu',   lat: 16.0748, lon: 108.1522 },
  { id: 2, name: 'Cẩm Lệ',       lat: 15.9741, lon: 108.2022 },
  { id: 3, name: 'Hòa Vang',      lat: 15.9833, lon: 108.1167 },
  { id: 4, name: 'Hải Châu',      lat: 16.0544, lon: 108.2022 },
  { id: 5, name: 'Thanh Khê',     lat: 16.0678, lon: 108.1878 },
  { id: 6, name: 'Sơn Trà',       lat: 16.0678, lon: 108.2378 },
  { id: 7, name: 'Ngũ Hành Sơn', lat: 15.9933, lon: 108.2522 },
];

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getNearestDistrict(lat: number, lon: number) {
  return DISTRICTS.reduce((nearest, d) => {
    const dist = haversine(lat, lon, d.lat, d.lon);
    const nearestDist = haversine(lat, lon, nearest.lat, nearest.lon);
    return dist < nearestDist ? d : nearest;
  });
}

export interface NearestDistrictResult {
  districtId: number | null;
  districtName: string | null;
  loading: boolean;
  // null = not asked yet, false = denied/unavailable
  granted: boolean | null;
}

export function useNearestDistrict(): NearestDistrictResult {
  const [state, setState] = React.useState<NearestDistrictResult>({
    districtId: null,
    districtName: null,
    loading: true,
    granted: null,
  });

  React.useEffect(() => {
    if (!navigator.geolocation) {
      // Geolocation not supported — fallback to Hải Châu (trung tâm TP)
      setState({ districtId: 4, districtName: 'Hải Châu', loading: false, granted: false });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = getNearestDistrict(pos.coords.latitude, pos.coords.longitude);
        setState({ districtId: nearest.id, districtName: nearest.name, loading: false, granted: true });
      },
      () => {
        // Denied or error — fallback to Hải Châu
        setState({ districtId: 4, districtName: 'Hải Châu', loading: false, granted: false });
      },
      { timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  return state;
}
