'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import MapComponent from '@/components/map/MapComponent';
import { ForecastPanel } from '@/components/panels/forecast-panel';
import { ReliefPanel } from '@/components/panels/relief-panel';
import type { EvacuationRoute } from '@/lib/openmap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CloudRain, Navigation } from 'lucide-react';

interface SelectedTeam {
  id: number;
  name: string;
  latitude?: number;
  longitude?: number;
}

interface FocusPoint {
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
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();
  const [evacuationRoute, setEvacuationRoute] = React.useState<EvacuationRoute | null>(null);
  const [selectedTeam, setSelectedTeam] = React.useState<SelectedTeam | null>(null);
  const [focusPoint, setFocusPoint] = React.useState<FocusPoint | null>(null);

  // This effect intentionally syncs dashboard focus state from URL deep-link params.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    const hasDeepLinkParams = [
      'teamId',
      'incidentId',
      'zoneId',
      'shelterId',
      'requestId',
    ].some((key) => searchParams.has(key));

    if (!hasDeepLinkParams) {
      setSelectedTeam(null);
      setFocusPoint(null);
      setEvacuationRoute(null);
      return;
    }

    const teamId = Number(searchParams.get('teamId'));
    const lat = Number(searchParams.get('lat'));
    const lng = Number(searchParams.get('lng'));
    const name = searchParams.get('teamName');
    const incidentId = Number(searchParams.get('incidentId'));
    const incidentTitle = searchParams.get('incidentTitle');
    const incidentType = searchParams.get('incidentType');
    const incidentSeverity = searchParams.get('incidentSeverity');
    const incidentStatus = searchParams.get('incidentStatus');
    const incidentAddress = searchParams.get('incidentAddress');
    const zoneId = Number(searchParams.get('zoneId'));
    const zoneName = searchParams.get('zoneName');
    const zoneDistrict = searchParams.get('zoneDistrict');
    const zoneStatus = searchParams.get('zoneStatus');
    const zoneRisk = searchParams.get('zoneRisk');
    const zoneWater = searchParams.get('zoneWater');
    const shelterId = Number(searchParams.get('shelterId'));
    const shelterName = searchParams.get('shelterName');
    const shelterAddress = searchParams.get('shelterAddress');
    const shelterStatus = searchParams.get('shelterStatus');
    const shelterCapacity = searchParams.get('shelterCapacity');
    const requestId = Number(searchParams.get('requestId'));
    const requestTitle = searchParams.get('requestTitle');
    const requestStatus = searchParams.get('requestStatus');
    const requestAddress = searchParams.get('requestAddress');
    const requestUrgency = searchParams.get('requestUrgency');
    const requestCaller = searchParams.get('requestCaller');
    const requestPhone = searchParams.get('requestPhone');
    const requestPeople = searchParams.get('requestPeople');
    const requestPhoto = searchParams.get('requestPhoto');

    if (Number.isFinite(teamId) && Number.isFinite(lat) && Number.isFinite(lng) && name) {
      setSelectedTeam({ id: teamId, name, latitude: lat, longitude: lng });
      setFocusPoint(null);
      setEvacuationRoute(null);
      return;
    }

    if (Number.isFinite(incidentId) && Number.isFinite(lat) && Number.isFinite(lng) && incidentTitle) {
      setFocusPoint({
        id: incidentId,
        name: incidentTitle,
        latitude: lat,
        longitude: lng,
        type: 'incident',
        subtitle: incidentAddress || incidentType || undefined,
        status: incidentStatus || undefined,
        severity: incidentSeverity || undefined,
      });
      setSelectedTeam(null);
      setEvacuationRoute(null);
      return;
    }

    if (Number.isFinite(zoneId) && Number.isFinite(lat) && Number.isFinite(lng) && zoneName) {
      setFocusPoint({
        id: zoneId,
        name: zoneName,
        latitude: lat,
        longitude: lng,
        type: 'flood_zone',
        subtitle: zoneDistrict || undefined,
        status: zoneStatus || undefined,
        riskLevel: zoneRisk || undefined,
        waterLevel: zoneWater || undefined,
      });
      setSelectedTeam(null);
      setEvacuationRoute(null);
      return;
    }

    if (Number.isFinite(shelterId) && Number.isFinite(lat) && Number.isFinite(lng) && shelterName) {
      setFocusPoint({
        id: shelterId,
        name: shelterName,
        latitude: lat,
        longitude: lng,
        type: 'shelter',
        subtitle: shelterAddress || undefined,
        status: shelterStatus || undefined,
        capacity: shelterCapacity || undefined,
      });
      setSelectedTeam(null);
      setEvacuationRoute(null);
      return;
    }

    if (Number.isFinite(requestId) && Number.isFinite(lat) && Number.isFinite(lng) && requestTitle) {
      setFocusPoint({
        id: requestId,
        name: requestTitle,
        latitude: lat,
        longitude: lng,
        type: 'rescue_request',
        subtitle: requestAddress || undefined,
        status: requestStatus || undefined,
        urgency: requestUrgency || undefined,
        caller: requestCaller || undefined,
        phone: requestPhone || undefined,
        peopleCount: requestPeople || undefined,
        photoUrl: requestPhoto || undefined,
      });
      setSelectedTeam(null);
      setEvacuationRoute(null);
      return;
    }
  }, [searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSelectRoute = (route: EvacuationRoute) => {
    setEvacuationRoute(route);
    setSelectedTeam(null);
    setFocusPoint(null);
  };

  const handleSelectTeam = (team: SelectedTeam) => {
    setSelectedTeam(team);
  };

  return (
    <div className="h-full min-h-0 overflow-hidden flex flex-col md:flex-row gap-0">
      {/* Left Panels - 400px width on desktop */}
      <div className="w-full md:w-[400px] lg:w-[420px] shrink-0 border-r border-border bg-card/50 min-h-0 overflow-y-auto custom-scroll">
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
              <ReliefPanel onSelectRoute={handleSelectRoute} onSelectTeam={handleSelectTeam} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Content - Map */}
      <div className="flex-1 min-w-0 min-h-[520px] md:min-h-0 relative bg-muted overflow-hidden">
        {/* Map Header Overlay */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-background/90 backdrop-blur-md border border-border shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-bold">{t('floodMap')}</span>
            <span className="text-[10px] text-muted-foreground uppercase ml-1">{tCommon('cityName')}</span>
          </div>
        </div>

        {/* The Map */}
        <div className="absolute inset-0">
          <MapComponent
            evacuationRoute={evacuationRoute}
            focusTeam={selectedTeam}
            focusPoint={focusPoint}
          />
        </div>
      </div>
    </div>
  );
}
