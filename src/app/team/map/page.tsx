'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/map/MapComponent'), { ssr: false });

export default function TeamMapPage() {
  return (
    <div className="h-[calc(100vh-7rem)]">
      <MapComponent />
    </div>
  );
}
