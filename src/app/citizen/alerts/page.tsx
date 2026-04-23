'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bell, AlertTriangle, CheckCircle2, Clock, Megaphone } from 'lucide-react';

interface Alert {
  id: number;
  title: string;
  description?: string;
  alert_type: string;
  severity: string;
  status: string;
  effective_from: string;
  effective_until?: string;
  source: string;
}

const SEVERITY_BG: Record<string, string> = {
  critical: 'bg-red-500/10 border-red-500/30',
  high:     'bg-orange-500/10 border-orange-500/30',
  medium:   'bg-yellow-500/10 border-yellow-500/30',
  low:      'bg-blue-500/10 border-blue-500/30',
};

const SEVERITY_TEXT: Record<string, string> = {
  critical: 'text-red-600',
  high:     'text-orange-600',
  medium:   'text-yellow-600',
  low:      'text-blue-600',
};

export default function CitizenAlertsPage() {
  const t = useTranslations('citizen.alerts');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params: any = { per_page: 30 };
      if (filter === 'active') params.status = 'active';
      const res = await api.get('/alerts', { params });
      setAlerts(res.data?.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(); }, [filter]);

  useEffect(() => {
    const handler = () => fetchAlerts();
    window.addEventListener('aegis:alert:created', handler);
    return () => window.removeEventListener('aegis:alert:created', handler);
  }, []);

  const activeCount = alerts.filter(a => a.status === 'active').length;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Bell size={22} className="text-primary" /> {t('title')}
            {activeCount > 0 && <Badge variant="destructive" className="text-xs">{activeCount}</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('subtitle')}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchAlerts} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 p-1 bg-muted rounded-xl">
        {(['active', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === f ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
          >
            {f === 'active' ? t('active') : t('all')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw size={24} className="animate-spin text-muted-foreground" /></div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle2 size={48} className="text-emerald-500 mb-3 opacity-60" />
          <p className="font-bold text-lg">{t('noAlerts')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('safeArea')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const bgClass = SEVERITY_BG[alert.severity] ?? SEVERITY_BG.low;
            const textClass = SEVERITY_TEXT[alert.severity] ?? SEVERITY_TEXT.low;
            const severityLabel = t(`severity.${alert.severity}` as any);
            const typeLabel = t(`type.${alert.alert_type}` as any, undefined) ?? alert.alert_type;
            return (
              <Card key={alert.id} className={`border ${bgClass} overflow-hidden`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 shrink-0 ${textClass}`}>
                      {alert.severity === 'critical' || alert.severity === 'high'
                        ? <AlertTriangle size={18} />
                        : <Megaphone size={18} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-black text-sm leading-snug ${textClass}`}>{alert.title}</p>
                        <Badge className={`text-[9px] shrink-0 ${
                          alert.status === 'active' ? 'bg-red-500' : 'bg-gray-400'
                        } text-white`}>
                          {alert.status === 'active' ? t('inEffect') : t('expired')}
                        </Badge>
                      </div>
                      {alert.description && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{alert.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(alert.effective_from).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </span>
                    <span className="font-bold uppercase">{typeLabel}</span>
                    <span className={`font-bold uppercase ${textClass}`}>{severityLabel}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
