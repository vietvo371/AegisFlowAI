/**
 * AegisFlow AI — OpenMap.vn REST API Service
 * Docs: https://docs.openmap.vn/docs/category/rest-api
 */

const BASE_URL = 'https://mapapis.openmap.vn/v1';
const API_KEY = process.env.NEXT_PUBLIC_OPENMAP_API_KEY || '';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

export interface EvacuationRoute {
  polyline: string;
  origin: LatLng;
  destination: LatLng;
  label?: string;
}

export interface RouteResult {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  polyline: string; // encoded polyline from overview_polyline.points
  steps: Array<{
    html_instructions: string;
    distance: { text: string };
    duration: { text: string };
    maneuver: string;
  }>;
}

export interface NearbyPlace {
  place_id: string;
  name: string;
  address: string;
  location: LatLng;
  distance?: number;
}

export interface GeocodedAddress {
  address: string;
  district?: string;
  city?: string;
}

// ─── Routing API ──────────────────────────────────────────────────────────────

/**
 * Fetch evacuation route between two points.
 * GET /direction
 * Docs: https://docs.openmap.vn/docs/rest-apis/routing
 */
export async function fetchEvacuationRoute(
  origin: LatLng,
  destination: LatLng,
  vehicle: 'car' | 'bike' | 'walking' | 'motor' = 'car'
): Promise<RouteResult | null> {
  try {
    const params = new URLSearchParams({
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      vehicle,
      alternatives: 'false',
      apikey: API_KEY,
    });

    const res = await fetch(`${BASE_URL}/direction?${params}`);
    if (!res.ok) throw new Error(`Route API error: ${res.status}`);

    const data = await res.json();
    const route = data?.routes?.[0];
    const leg = route?.legs?.[0];
    if (!leg) return null;

    return {
      distance: leg.distance,
      duration: leg.duration,
      polyline: route.overview_polyline?.points || '',
      steps: leg.steps || [],
    };
  } catch (err) {
    console.error('[AegisFlow] fetchEvacuationRoute error:', err);
    return null;
  }
}

// ─── Nearby API ───────────────────────────────────────────────────────────────

/**
 * Find nearby evacuation points (schools, hospitals) around a flooded area.
 * GET /nearby
 * Docs: https://docs.openmap.vn/docs/rest-apis/nearby
 */
export async function fetchNearbyEvacuationPoints(
  location: LatLng,
  radiusMeters: number = 3000,
  type: string = 'school'
): Promise<NearbyPlace[]> {
  try {
    const params = new URLSearchParams({
      location: `${location.lat},${location.lng}`,
      radius: String(radiusMeters),
      type,
      apikey: API_KEY,
    });

    const res = await fetch(`${BASE_URL}/nearby?${params}`);
    if (!res.ok) throw new Error(`Nearby API error: ${res.status}`);

    const data = await res.json();
    return (data?.results || []).map((p: Record<string, unknown>) => {
      const geometry = p.geometry as { location?: LatLng } | undefined;
      return {
        place_id: p.place_id as string,
        name: p.name as string,
        address: p.formatted_address as string || '',
        location: geometry?.location || { lat: 0, lng: 0 },
      };
    });
  } catch (err) {
    console.error('[AegisFlow] fetchNearbyEvacuationPoints error:', err);
    return [];
  }
}

// ─── Reverse Geocoding API ────────────────────────────────────────────────────

/**
 * Get Vietnamese address from coordinates (for map click popups).
 * GET /reverse-geocoding
 * Docs: https://docs.openmap.vn/docs/rest-apis/reverse-geocode
 */
export async function reverseGeocode(location: LatLng): Promise<GeocodedAddress | null> {
  try {
    // Correct endpoint per docs: GET /geocode/reverse?latlng=lat,lng&apikey=...
    const params = new URLSearchParams({
      latlng: `${location.lat},${location.lng}`,
      apikey: API_KEY,
    });

    const res = await fetch(`${BASE_URL}/geocode/reverse?${params}`);
    if (!res.ok) throw new Error(`Reverse geocode error: ${res.status}`);

    const data = await res.json();
    const result = data?.results?.[0];
    if (!result) return null;

    return {
      address: result.formatted_address || result.address || 'Không xác định',
      district: result.address_components?.find(
        (c: { long_name: string }) => c.long_name?.startsWith('quận') || c.long_name?.startsWith('huyện')
      )?.long_name,
      city: result.address_components?.find(
        (c: { long_name: string }) => c.long_name?.startsWith('thành phố') || c.long_name?.startsWith('tỉnh')
      )?.long_name,
    };
  } catch (err) {
    console.error('[AegisFlow] reverseGeocode error:', err);
    return null;
  }
}

// ─── Polyline decoder ─────────────────────────────────────────────────────────

/**
 * Decode Google-encoded polyline to [lng, lat] coordinate pairs for GeoJSON.
 */
export function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let shift = 0, result = 0, byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;

    shift = 0; result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;

    coords.push([lng / 1e5, lat / 1e5]);
  }
  return coords;
}
