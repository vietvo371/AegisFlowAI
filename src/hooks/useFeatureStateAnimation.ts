'use client';

import { useCallback, useRef, useEffect } from 'react';
import type { Map as MapLibreMap } from '@openmapvn/openmapvn-gl';

interface FeatureUpdate {
  id: string | number;
  sourceId: string;
  properties?: Record<string, unknown>;
}

interface UseFeatureStateAnimationOptions {
  map: React.RefObject<MapLibreMap | null>;
  sourceId: string;
  animationDuration?: number;
}

/**
 * Hook để animate features khi có real-time updates.
 * Sử dụng MapLibre feature state để trigger opacity/color transitions.
 *
 * @example
 * const { highlightFeature, clearHighlight } = useFeatureStateAnimation({
 *   map,
 *   sourceId: 'flood_zones',
 *   animationDuration: 800,
 * });
 *
 * // Khi nhận được update từ WebSocket/simulator
 * highlightFeature(featureId, { water_level: newValue });
 */
export function useFeatureStateAnimation({
  map,
  sourceId,
  animationDuration = 1000,
}: UseFeatureStateAnimationOptions) {
  const timersRef = useRef<Map<string | number, NodeJS.Timeout>>(new Map());

  const highlightFeature = useCallback((
    featureId: string | number,
    state: Record<string, unknown> = {}
  ) => {
    if (!map.current) return;

    const existingTimer = timersRef.current.get(String(featureId));
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    map.current.setFeatureState(
      { source: sourceId, id: featureId },
      { ...state, updated: true }
    );

    const timer = setTimeout(() => {
      map.current?.setFeatureState(
        { source: sourceId, id: featureId },
        { updated: false }
      );
      timersRef.current.delete(String(featureId));
    }, animationDuration);

    timersRef.current.set(String(featureId), timer);
  }, [map, sourceId, animationDuration]);

  const highlightFeatures = useCallback((
    featureIds: Array<string | number>,
    state: Record<string, unknown> = {}
  ) => {
    featureIds.forEach(id => highlightFeature(id, state));
  }, [highlightFeature]);

  const clearHighlight = useCallback((featureId?: string | number) => {
    if (!map.current) return;

    if (featureId !== undefined) {
      const timer = timersRef.current.get(String(featureId));
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(String(featureId));
      }
      map.current.setFeatureState(
        { source: sourceId, id: featureId },
        { updated: false }
      );
    } else {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    }
  }, [map, sourceId]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  return { highlightFeature, highlightFeatures, clearHighlight };
}
