'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Navigation, MapPin, ChevronRight, Truck,
  ShieldAlert, Clock, RefreshCw, AlertTriangle
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { EvacuationRoute } from '@/lib/openmap';
import { ReportIncidentDialog } from './report-incident-dialog';
import api from '@/lib/api';

interface RouteItem {
  id: number;
  name: string;
  description?: string;
  distance_m: number;
  estimated_time_display: string;
  is_safe: boolean;
  safety_rating: number;
  is_primary: boolean;
  status: string;
  color?: string;
  polyline?: string;
  start_node?: { id: number; name: string; type: string };
  end_node?: { id: number; name: string; type: string };
}

interface TeamItem {
  id: number;
  name: string;
  team_type: string;
  status: string;
  personnel_count: number;
  vehicle_count: number;
  district?: { id: number; name: string };
}

interface ReliefPanelProps {
  onSelectRoute: (route: EvacuationRoute) => void;
}

export function ReliefPanel({ onSelectRoute }: ReliefPanelProps) {
  const t = useTranslations('dashboard');
  const tR = useTranslations('dashboard.relief');
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [routesRes, teamsRes] = await Promise.all([
        api.get('/evacuation-routes', { params: { safe_only: true, per_page: 5 } }),
        api.get('/rescue-teams', { params: { per_page: 10 } }),
      ]);

      const routeData = routesRes.data?.data?.data ?? routesRes.data?.data ?? [];
      setRoutes(routeData);

      const teamData = teamsRes.data?.data ?? [];
      setTeams(teamData);
    } catch (e) {
      console.error('ReliefPanel fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectRoute = (route: RouteItem) => {
    if (!route.polyline) return;
    onSelectRoute({
      polyline: route.polyline,
      label: route.name,
      origin: { lat: 0, lng: 0 },
      destination: { lat: 0, lng: 0 },
    });
  };

  const availableTeams = teams.filter(t => t.status === 'available');
  const dispatchedTeams = teams.filter(t => t.status === 'on_mission');

  const safetyColor = (rating: number) => {
    if (rating >= 0.8) return 'text-emerald-500';
    if (rating >= 0.5) return 'text-orange-500';
    return 'text-red-500';
  };

  const teamTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      medical: tR('teamTypeMedical'),
      fire: tR('teamTypeFire'),
      military: tR('teamTypeMilitary'),
      volunteer: tR('teamTypeVolunteer'),
      special: tR('teamTypeSpecial'),
    };
    return map[type] ?? type;
  };

  return (
    <div className="space-y-6">
      {/* SOS Button */}
      <div className="px-1">
        <ReportIncidentDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 text-center space-y-1">
          <div className="text-lg font-black text-primary">{availableTeams.length}</div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase">{tR('teamsReady')}</div>
        </div>
        <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center space-y-1">
          <div className="text-lg font-black text-emerald-600">{dispatchedTeams.length}</div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase">{tR('teamsOnMission')}</div>
        </div>
      </div>

      {/* Evacuation Routes */}
      <Card className="border-border shadow-sm">
        <CardHeader className="p-5 pb-0">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            {tR('evacuationTitle')}
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={fetchData} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <RefreshCw size={16} className="animate-spin mr-2" /> {tR('loadingRoutes')}
            </div>
          ) : routes.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              {tR('noRoutes')}
            </div>
          ) : (
            routes.map((route) => (
              <button
                key={route.id}
                onClick={() => handleSelectRoute(route)}
                disabled={!route.polyline}
                className="w-full text-left p-3 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all group flex items-start gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
                  ${route.is_safe ? 'bg-emerald-500/10 text-emerald-600 group-hover:text-primary' : 'bg-orange-500/10 text-orange-500'}`}>
                  {route.is_safe ? <Navigation size={16} /> : <AlertTriangle size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold truncate">{route.name}</span>
                    {route.is_primary && (
                      <Badge className="text-[9px] px-1 py-0 bg-primary/10 text-primary border-0">{tR('primaryBadge')}</Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                    <Clock size={10} />
                    <span>{route.estimated_time_display}</span>
                    <span>·</span>
                    <span>{(route.distance_m / 1000).toFixed(1)}km</span>
                    <span>·</span>
                    <span className={`font-bold ${safetyColor(route.safety_rating)}`}>
                      {tR('safetyPct', { pct: Math.round(route.safety_rating * 100) })}
                    </span>
                  </div>
                  {route.start_node && route.end_node && (
                    <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin size={9} />
                      <span className="truncate">{route.start_node.name} → {route.end_node.name}</span>
                    </div>
                  )}
                </div>
                <ChevronRight size={14} className="mt-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all shrink-0" />
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {/* Rescue Teams */}
      <Card className="border-border shadow-sm">
        <CardHeader className="p-5 pb-0">
          <CardTitle className="text-sm font-bold">{tR('liveForces')}</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-4">
          <ScrollArea className="h-[260px] -mx-1 px-1">
            <div className="space-y-3 pb-4">
              {loading ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <RefreshCw size={16} className="animate-spin mr-2" /> {tR('loadingTeams')}
                </div>
              ) : teams.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  {tR('noTeams')}
                </div>
              ) : (
                teams.slice(0, 6).map((team) => (
                  <div key={team.id} className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        team.status === 'on_mission' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'
                      }`}>
                        {team.team_type === 'medical' ? <Truck size={20} /> : <ShieldAlert size={20} />}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{team.name}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin size={10} /> {team.district?.name ?? '—'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black">{team.personnel_count}</div>
                      <div className="text-[9px] font-bold uppercase text-muted-foreground">
                        {team.status === 'on_mission' ? t('dispatched') : teamTypeLabel(team.team_type)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
