'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  HeartPulse, MapPin, Clock, Users, Waves, RefreshCw,
  CheckCircle2, AlertTriangle, Phone, Navigation, ShieldAlert
} from 'lucide-react';

interface RescueRequest {
  id: number;
  request_number?: string;
  caller_name?: string;
  caller_phone?: string;
  urgency: string;
  urgency_label?: string;
  status: string;
  status_label?: string;
  people_count: number;
  vulnerable_groups: string[];
  description?: string;
  address?: string;
  water_level_m?: number;
  priority_score?: number;
  location?: { lat: number; lng: number };
  assigned_team?: { id: number; name: string } | null;
  created_at: string;
}

const URGENCY_COLOR: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-yellow-500',
  low:      'bg-blue-500',
};

export default function TeamMissionsPage() {
  const { user } = useAuth();
  const t = useTranslations('team.missions');
  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rescue-requests', {
        params: { per_page: 30 }
      });
      setRequests(res.data?.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await api.put(`/rescue-requests/${id}/status`, { status });
      fetchRequests();
    } catch (e) { console.error(e); }
    finally { setUpdatingId(null); }
  };

  useEffect(() => {
    fetchRequests();
    const handler = () => fetchRequests();
    window.addEventListener('aegis:rescue_request:created', handler);
    window.addEventListener('aegis:rescue_request:updated', handler);
    return () => {
      window.removeEventListener('aegis:rescue_request:created', handler);
      window.removeEventListener('aegis:rescue_request:updated', handler);
    };
  }, []);

  const pending = requests.filter(r => r.status === 'pending');
  const active  = requests.filter(r => ['assigned', 'in_progress'].includes(r.status));
  const done    = requests.filter(r => ['completed', 'cancelled'].includes(r.status));

  const renderRequest = (req: RescueRequest) => {
    const urgColor = URGENCY_COLOR[req.urgency] ?? URGENCY_COLOR.low;
    const urgLabel = req.urgency_label ?? req.urgency;
    const isUpdating = updatingId === req.id;
    const isDone = ['completed', 'cancelled'].includes(req.status);

    return (
      <Card key={req.id} className="border-border overflow-hidden">
        <div className={`h-1 ${urgColor}`} />
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${urgColor} text-white text-[9px]`}>{urgLabel}</Badge>
                {req.priority_score != null && (
                  <span className="text-[10px] font-mono font-bold text-primary">
                    AI: {Number(req.priority_score).toFixed(0)}/100
                  </span>
                )}
              </div>
              <p className="font-bold text-sm mt-1 leading-snug">
                {req.caller_name ?? t('unknownName')}
              </p>
            </div>
            {req.caller_phone && (
              <a href={`tel:${req.caller_phone}`}>
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 text-primary border-primary/30">
                  <Phone size={14} />
                </Button>
              </a>
            )}
          </div>

          {/* Info */}
          <div className="space-y-1.5 text-xs text-muted-foreground">
            {req.address && (
              <div className="flex items-start gap-1.5">
                <MapPin size={12} className="shrink-0 mt-0.5" />
                <span className="leading-snug">{req.address}</span>
              </div>
            )}
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Users size={11} /> {req.people_count}</span>
              {req.water_level_m != null && (
                <span className="flex items-center gap-1"><Waves size={11} /> {Number(req.water_level_m).toFixed(1)}m</span>
              )}
              <span className="flex items-center gap-1"><Clock size={11} />
                {new Date(req.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
              </span>
            </div>
            {req.vulnerable_groups?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {req.vulnerable_groups.map((g, i) => (
                  <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0">{g}</Badge>
                ))}
              </div>
            )}
            {req.description && (
              <p className="text-[11px] italic leading-snug line-clamp-2">{req.description}</p>
            )}
          </div>

          {/* Navigate button */}
          {req.location && (
            <a
              href={`https://maps.google.com/?q=${req.location.lat},${req.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="w-full gap-2 h-8 text-xs">
                <Navigation size={12} /> {t('navigate')}
              </Button>
            </a>
          )}

          {/* Status update */}
          {!isDone && (
            <Select onValueChange={val => val && handleUpdateStatus(req.id, val)} value={req.status}>
              <SelectTrigger className="h-9 text-xs font-bold">
                {isUpdating
                  ? <span className="flex items-center gap-2"><RefreshCw size={12} className="animate-spin" /> {t('updateStatus')}</span>
                  : <SelectValue placeholder={t('updateStatus')} />
                }
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assigned" className="text-xs">{t('statusOptions.assigned')}</SelectItem>
                <SelectItem value="in_progress" className="text-xs">{t('statusOptions.in_progress')}</SelectItem>
                <SelectItem value="completed" className="text-xs">{t('statusOptions.completed')}</SelectItem>
              </SelectContent>
            </Select>
          )}

          {isDone && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
              <CheckCircle2 size={14} /> {t('completed')}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <ShieldAlert size={22} className="text-orange-500" /> {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('activeSummary', { active: active.length, pending: pending.length })}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchRequests} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw size={24} className="animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* Active missions */}
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wide text-orange-500 flex items-center gap-1.5">
                <AlertTriangle size={12} /> {t('active')} ({active.length})
              </h2>
              {active.map(renderRequest)}
            </div>
          )}

          {/* Pending */}
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <HeartPulse size={12} /> {t('pending')} ({pending.length})
              </h2>
              {pending.map(renderRequest)}
            </div>
          )}

          {/* Done */}
          {done.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 size={12} /> {t('done')} ({done.length})
              </h2>
              {done.slice(0, 3).map(renderRequest)}
            </div>
          )}

          {requests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 size={48} className="text-emerald-500 mb-3 opacity-60" />
              <p className="font-bold text-lg">{t('noMissions')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('waitDispatch')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
