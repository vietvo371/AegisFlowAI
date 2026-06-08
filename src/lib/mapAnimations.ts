/**
 * Tạo paint properties với animation cho các loại layer khác nhau.
 * Kết hợp với feature state 'updated' để animate.
 */

export function withAnimation<T extends Record<string, unknown>>(
  basePaint: T,
  animatedProperty: keyof T,
  normalValue: unknown,
  animatedValue: unknown,
  _animationDuration: string = '1000ms'
): T {
  return {
    ...basePaint,
    [animatedProperty]: [
      'case',
      ['boolean', ['feature-state', 'updated'], false],
      animatedValue,
      normalValue,
    ],
  };
}

export const animatedFloodZoneStyles = {
  fill: (baseOpacity: number = 0.15, animOpacity: number = 0.35) => ({
    'fill-color': [
      'match', ['get', 'risk_level'],
      'critical', '#EF4444',
      'high',     '#F97316',
      'medium',   '#EAB308',
      '#3B82F6',
    ] as unknown as string,
    'fill-opacity': [
      'case',
      ['boolean', ['feature-state', 'updated'], false],
      animOpacity,
      baseOpacity,
    ] as unknown as number,
    'fill-opacity-transition': {
      duration: 800,
      delay: 0,
    },
  }),

  outline: (normalWidth: number = 2, animWidth: number = 4) => ({
    'line-color': [
      'match', ['get', 'risk_level'],
      'critical', '#EF4444',
      'high',     '#F97316',
      '#3B82F6',
    ] as unknown as string,
    'line-width': [
      'case',
      ['boolean', ['feature-state', 'updated'], false],
      animWidth,
      normalWidth,
    ] as unknown as number,
    'line-opacity': [
      'case',
      ['boolean', ['feature-state', 'updated'], false],
      1.0,
      0.8,
    ] as unknown as number,
    'line-width-transition': {
      duration: 600,
      delay: 0,
    },
  }),
};

export const animatedFloodPointStyles = {
  circle: (
    baseRadius: number[] = [10, 5, 15, 10],
    animRadius: number[] = [10, 7, 15, 14]
  ) => ({
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      ...baseRadius,
    ] as unknown as number,
    'circle-color': [
      'case',
      ['boolean', ['feature-state', 'updated'], false],
      '#F97316',
      ['coalesce', ['get', 'color'], '#3B82F6'],
    ] as unknown as string,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#fff',
    'circle-opacity': [
      'case',
      ['boolean', ['feature-state', 'updated'], false],
      1.0,
      0.9,
    ] as unknown as number,
  }),
};

export const animatedIncidentStyles = {
  pulsing: (baseRadius: number = 8) => ({
    'circle-radius': [
      'case',
      ['boolean', ['feature-state', 'updated'], false],
      baseRadius * 1.5,
      baseRadius,
    ] as unknown as number,
    'circle-color': [
      'match', ['get', 'severity'],
      'critical', '#EF4444',
      'high',     '#F97316',
      'medium',   '#EAB308',
      '#3B82F6',
    ] as unknown as string,
    'circle-stroke-width': [
      'case',
      ['boolean', ['feature-state', 'updated'], false],
      4,
      2,
    ] as unknown as number,
    'circle-stroke-color': [
      'case',
      ['boolean', ['feature-state', 'updated'], false],
      '#FCD34D',
      '#fff',
    ] as unknown as string,
    'circle-opacity': [
      'case',
      ['boolean', ['feature-state', 'updated'], false],
      1.0,
      0.85,
    ] as unknown as number,
  }),
};

export function createAnimatedLayerPaint(
  layerType: 'fill' | 'line' | 'circle',
  options: {
    normalValue: unknown;
    animatedValue: unknown;
    property?: string;
    basePaint?: Record<string, unknown>;
  }
): Record<string, unknown> {
  const {
    normalValue,
    animatedValue,
    property = `${layerType}-opacity`,
    basePaint = {},
  } = options;

  return {
    ...basePaint,
    [property]: [
      'case',
      ['boolean', ['feature-state', 'updated'], false],
      animatedValue,
      normalValue,
    ],
    [`${property}-transition`]: {
      duration: 800,
      delay: 0,
    },
  };
}
