'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import MapComponent from '@/components/map/MapComponent';
import { ForecastPanel } from '@/components/panels/forecast-panel';
import { ReliefPanel } from '@/components/panels/relief-panel';
import type { EvacuationRoute } from '@/lib/openmap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CloudRain, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const [evacuationRoute, setEvacuationRoute] = React.useState<EvacuationRoute | null>(null);

  const handleSelectRoute = (route: EvacuationRoute) => {
    setEvacuationRoute(route);
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-0">
      {/* Left Panels - 400px width on desktop */}
      <div className="w-full md:w-[400px] shrink-0 border-r border-border bg-card/50 overflow-auto custom-scroll">
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-black tracking-tight">{t('title')}</h1>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mx-2" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase pr-2">{t('live')}</span>
            </div>
          </div>

          <Tabs defaultValue="forecast" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl h-11 bg-muted/60 p-1">
              <TabsTrigger value="forecast" className="rounded-lg gap-2 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <CloudRain size={14} />
                {t('forecastRadar')}
              </TabsTrigger>
              <TabsTrigger value="relief" className="rounded-lg gap-2 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Navigation size={14} />
                {t('reliefDispatch')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="forecast" className="mt-6 animate-fade-in-up">
              <ForecastPanel />
            </TabsContent>
            
            <TabsContent value="relief" className="mt-6 animate-fade-in-up">
              <ReliefPanel onSelectRoute={handleSelectRoute} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Content - Map */}
      <div className="flex-1 relative bg-muted">
        {/* Map Header Overlay */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-background/90 backdrop-blur-md border border-border shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-bold">{t('floodMap')}</span>
            <span className="text-[10px] text-muted-foreground uppercase ml-1">Đà Nẵng</span>
          </div>
        </div>

        {/* Map Controls Overlay — removed, MapComponent has its own layer panel */}

        {/* The Map */}
        <div className="w-full h-full">
          <MapComponent evacuationRoute={evacuationRoute} />
        </div>
      </div>
    </div>
  );
}
