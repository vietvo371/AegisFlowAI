'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldAlert, Waves, HeartPulse, Map, Bell,
  AlertTriangle, CheckCircle2, Clock, ArrowRight, RefreshCw
} from 'lucide-react';

interface Alert {
  id: number;
  title: string;
  severity: string;
  alert_type: string;
  status: string;
  effective_from: string;
}

interface FloodZone {
  id: number;
  name: string;
  risk_level: string;
  status: string;
  current_water_level_m?: number;
  danger_threshold_m?: number;
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-yellow-500',
  low:      'bg-blue-500',
};

const RISK_COLOR: Record<string, string> = {
  critical: 'text-red-500',
  high:     'text-orange-500',
  medium:   'text-yellow-500',
  low:      'text-emerald-500',
};

export default function CitizenHomePage() {
  const { user } = useAuth();
  const t = useTranslations('citizen.home');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [zones, setZones] = useState<FloodZone[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertRes, zoneRes] = await Promise.all([
        api.get('/alerts', { params: { status: 'active', per_page: 3 } }),
        api.get('/flood-zones', { params: { per_page: 4 } }),
      ]);
      setAlerts(alertRes.data?.data ?? []);
      setZones(zoneRes.data?.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handler = () => fetchData();
    window.addEventListener('aegis:alert:created', handler);
    window.addEventListener('aegis:flood_zone:updated', handler);
    return () => {
      window.removeEventListener('aegis:alert:created', handler);
      window.removeEventListener('aegis:flood_zone:updated', handler);
    };
  }, []);

  const criticalAlert = alerts.find(a => a.severity === 'critical');

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">{t('greeting', { name: user?.name ?? '' })} 👋</h1>
      </div>

      {/* Critical alert banner */}
      {criticalAlert && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 animate-pulse-subtle">
          <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-red-600">{criticalAlert.title}</p>
            <p className="text-xs text-red-500/80 mt-0.5">{t('criticalAlert')}</p>
          </div>
          <Link href="/citizen/alerts">
            <Button size="sm" variant="destructive" className="h-7 text-xs shrink-0">{t('viewAlert')}</Button>
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/citizen/request">
          <div className="p-4 rounded-2xl bg-primary text-primary-foreground flex flex-col gap-3 hover:opacity-90 transition-opacity cursor-pointer h-full">
            <HeartPulse size={24} />
            <div>
              <p className="font-black text-sm">{t('requestRescue')}</p>
              <p className="text-[10px] opacity-80 mt-0.5">{t('requestRescueDesc')}</p>
            </div>
          </div>
        </Link>
        <Link href="/citizen/map">
          <div className="p-4 rounded-2xl bg-muted border border-border flex flex-col gap-3 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <Map size={24} className="text-primary" />
            <div>
              <p className="font-black text-sm">{t('floodMap')}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t('floodMapDesc')}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Active alerts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-sm uppercase tracking-wide text-muted-foreground">{t('activeAlerts')}</h2>
          <Link href="/citizen/alerts" className="text-xs text-primary font-bold flex items-center gap-1">
            {t('viewAll')} <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><RefreshCw size={20} className="animate-spin text-muted-foreground" /></div>
        ) : alerts.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3 text-emerald-600">
              <CheckCircle2 size={20} />
              <p className="text-sm font-semibold">{t('noAlerts')}</p>
            </CardContent>
          </Card>
        ) : (
          alerts.map(alert => (
            <Card key={alert.id} className="border-border overflow-hidden">
              <CardContent className="p-0">
                <div className={`h-1 w-full ${SEVERITY_COLOR[alert.severity] ?? 'bg-gray-400'}`} />
                <div className="p-4 flex items-start gap-3">
                  <AlertTriangle size={18} className={`shrink-0 mt-0.5 ${alert.severity === 'critical' ? 'text-red-500' : 'text-orange-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-snug">{alert.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={11} className="text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(alert.effective_from).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <Badge className={`${SEVERITY_COLOR[alert.severity]} text-white text-[9px] shrink-0`}>
                    {alert.severity}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Flood zones status */}
      <div className="space-y-3">
        <h2 className="font-black text-sm uppercase tracking-wide text-muted-foreground">{t('floodZones')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {loading
            ? [1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)
            : zones.map(zone => {
                const colorClass = RISK_COLOR[zone.risk_level] ?? RISK_COLOR.low;
                const waterLevel = zone.current_water_level_m != null ? Number(zone.current_water_level_m) : null;
                return (
                  <Card key={zone.id} className="border-border">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Waves size={14} className={colorClass} />
                        <span className={`text-[10px] font-black uppercase ${colorClass}`}>{zone.risk_level}</span>
                      </div>
                      <p className="text-xs font-bold leading-tight truncate">{zone.name}</p>
                      {waterLevel != null && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{waterLevel.toFixed(2)}m</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })
          }
        </div>
      </div>

      {/* Emergency numbers */}
      <Card className="border-border bg-muted/30">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{t('emergency')}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {([['114', t('fireService')], ['115', t('ambulance')], ['113', t('police')]] as [string, string][]).map(([num, label]) => (
              <a key={num} href={`tel:${num}`} className="p-2 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors">
                <p className="text-lg font-black text-primary">{num}</p>
                <p className="text-[9px] text-muted-foreground font-bold">{label}</p>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
