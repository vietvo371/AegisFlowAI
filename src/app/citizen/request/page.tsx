'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  HeartPulse, MapPin, LocateFixed, RefreshCw,
  Clock, CheckCircle2, Phone, Users, Waves
} from 'lucide-react';

interface MyRequest {
  id: number;
  request_number?: string;
  urgency: string;
  status: string;
  status_label?: string;
  urgency_label?: string;
  address?: string;
  people_count: number;
  priority_score?: number;
  assigned_team?: { name: string; phone: string } | null;
  eta_minutes?: number;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  pending:     'bg-yellow-500',
  assigned:    'bg-blue-500',
  in_progress: 'bg-orange-500 animate-pulse',
  completed:   'bg-emerald-500',
  cancelled:   'bg-gray-400',
};

const VULNERABLE_IDS = ['children', 'elderly', 'disabled', 'pregnant'] as const;

export default function CitizenRequestPage() {
  const { user } = useAuth();
  const t = useTranslations('citizen.request');
  const [myRequests, setMyRequests] = useState<MyRequest[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [coords, setCoords] = useState({ lat: 16.0544, lng: 108.2022 });
  const [address, setAddress] = useState('');
  const [vulnerableGroups, setVulnerableGroups] = useState<string[]>([]);
  const [form, setForm] = useState({
    caller_name: user?.name ?? '',
    caller_phone: user?.phone ?? '',
    urgency: 'high',
    category: 'rescue',
    people_count: '1',
    water_level_m: '',
    description: '',
  });

  const fetchMyRequests = async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/rescue-requests');
      setMyRequests(res.data?.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoadingList(false); }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) { toast.error(t('toastNoGps')); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        toast.success(t('toastGotGps'));
        setLocating(false);
      },
      () => { toast.error(t('toastGpsError')); setLocating(false); }
    );
  };

  const toggleVulnerable = (id: string) => {
    setVulnerableGroups(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address && coords.lat === 16.0544) {
      toast.error(t('toastNoGps'));
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/rescue-requests', {
        caller_name: form.caller_name || user?.name,
        caller_phone: form.caller_phone || user?.phone,
        urgency: form.urgency,
        category: form.category,
        people_count: parseInt(form.people_count) || 1,
        water_level_m: form.water_level_m ? parseFloat(form.water_level_m) : undefined,
        description: form.description,
        address: address || 'Đà Nẵng',
        latitude: coords.lat,
        longitude: coords.lng,
        vulnerable_groups: vulnerableGroups,
      });
      toast.success(t('successMsg'));
      setShowForm(false);
      setVulnerableGroups([]);
      setAddress('');
      setCoords({ lat: 16.0544, lng: 108.2022 });
      fetchMyRequests();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('subtitle')}</p>
        </div>
        <Button
          className="gap-2 bg-primary"
          onClick={() => setShowForm(v => !v)}
        >
          <HeartPulse size={16} />
          {showForm ? t('close') : t('send')}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/30 shadow-lg">
          <CardHeader className="pb-2 bg-primary/5 rounded-t-xl">
            <div className="flex items-center gap-2 text-primary font-black">
              <HeartPulse size={18} /> {t('emergencyTitle')}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('fullName')} *</Label>
                  <Input
                    value={form.caller_name}
                    onChange={e => setForm(f => ({ ...f, caller_name: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('phone')}</Label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      value={form.caller_phone}
                      onChange={e => setForm(f => ({ ...f, caller_phone: e.target.value }))}
                      placeholder="0901234567"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('urgencyLevel')} *</Label>
                  <Select value={form.urgency} onValueChange={v => setForm(f => ({ ...f, urgency: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('urgency.low')}</SelectItem>
                      <SelectItem value="medium">{t('urgency.medium')}</SelectItem>
                      <SelectItem value="high">{t('urgency.high')}</SelectItem>
                      <SelectItem value="critical">{t('urgency.critical')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('supportType')} *</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rescue">{t('category.rescue')}</SelectItem>
                      <SelectItem value="evacuation">{t('category.evacuation')}</SelectItem>
                      <SelectItem value="medical">{t('category.medical')}</SelectItem>
                      <SelectItem value="food">{t('category.food')}</SelectItem>
                      <SelectItem value="water">{t('category.water')}</SelectItem>
                      <SelectItem value="shelter">{t('category.shelter')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('peopleCount')}</Label>
                  <div className="relative">
                    <Users size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      type="number" min="1" max="100"
                      className="pl-8"
                      value={form.people_count}
                      onChange={e => setForm(f => ({ ...f, people_count: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('waterLevel')}</Label>
                  <div className="relative">
                    <Waves size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      type="number" step="0.1" min="0"
                      className="pl-8"
                      placeholder="0.5"
                      value={form.water_level_m}
                      onChange={e => setForm(f => ({ ...f, water_level_m: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Vulnerable groups */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('priorityGroups')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {VULNERABLE_IDS.map(id => (
                    <label key={id} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                      <Checkbox
                        checked={vulnerableGroups.includes(id)}
                        onCheckedChange={() => toggleVulnerable(id)}
                      />
                      <span className="text-xs font-medium">{t(`vulnerable.${id}`)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('location')} *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      placeholder={t('locationPlaceholder')}
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={handleGetLocation} disabled={locating} className="shrink-0">
                    <LocateFixed size={16} className={locating ? 'animate-spin text-primary' : ''} />
                  </Button>
                </div>
                {coords.lat !== 16.0544 && (
                  <p className="text-[10px] text-emerald-600 font-medium">
                    {t('gpsConfirm', { lat: coords.lat.toFixed(4), lng: coords.lng.toFixed(4) })}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('situationDesc')}</Label>
                <Textarea
                  placeholder={t('situationPlaceholder')}
                  className="min-h-[80px] resize-none"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full h-12 bg-primary font-black text-base">
                {submitting
                  ? <><RefreshCw size={16} className="animate-spin mr-2" /> {t('sending')}</>
                  : <><HeartPulse size={16} className="mr-2" /> {t('sendFull')}</>
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* My requests */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-sm uppercase tracking-wide text-muted-foreground">{t('myRequests')}</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchMyRequests} disabled={loadingList}>
            <RefreshCw size={14} className={loadingList ? 'animate-spin' : ''} />
          </Button>
        </div>

        {loadingList ? (
          <div className="flex justify-center py-8"><RefreshCw size={20} className="animate-spin text-muted-foreground" /></div>
        ) : myRequests.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-6 text-center text-muted-foreground">
              <HeartPulse size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('noRequests')}</p>
            </CardContent>
          </Card>
        ) : (
          myRequests.map(req => {
            const statusColor = STATUS_COLOR[req.status] ?? STATUS_COLOR.pending;
            const statusLabel = req.status_label ?? t(`status.${req.status}` as any);
            return (
              <Card key={req.id} className="border-border overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm">{req.address ?? t('noAddress')}</p>
                      {req.request_number && (
                        <p className="text-[10px] text-muted-foreground font-mono">{req.request_number}</p>
                      )}
                    </div>
                    <Badge className={`${statusColor} text-white text-[9px] shrink-0`}>{statusLabel}</Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users size={11} /> {req.people_count} {t('people')}</span>
                    <span className="flex items-center gap-1"><Clock size={11} />
                      {new Date(req.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </span>
                    {req.priority_score != null && (
                      <span className="font-mono font-bold text-primary">AI: {Number(req.priority_score).toFixed(0)}/100</span>
                    )}
                  </div>

                  {req.assigned_team && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <div className="text-xs">
                        <span className="font-bold text-emerald-700">{req.assigned_team.name}</span>
                        {req.assigned_team.phone && (
                          <a href={`tel:${req.assigned_team.phone}`} className="ml-2 text-emerald-600 underline">{req.assigned_team.phone}</a>
                        )}
                        {req.eta_minutes && (
                          <span className="ml-2 text-muted-foreground">{t('eta', { minutes: req.eta_minutes })}</span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
