'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  AlertTriangle, MapPin, LocateFixed, RefreshCw,
  Phone, Users, Waves, CheckCircle2, Camera, X, ImagePlus
} from 'lucide-react';

const VULNERABLE_LABELS: Record<string, { vi: string; en: string }> = {
  children: { vi: 'Trẻ em', en: 'Children' },
  elderly: { vi: 'Người cao tuổi', en: 'Elderly' },
  disabled: { vi: 'Người khuyết tật', en: 'Disabled' },
  pregnant: { vi: 'Phụ nữ mang thai', en: 'Pregnant Women' },
};

export default function CitizenSOSPage() {
  const { user } = useAuth();
  const t = useTranslations('dashboard.sos');
  const tCitizen = useTranslations('citizen');
  const locale = 'vi'; // TODO: get from context
  const [submitting, setSubmitting] = React.useState(false);
  const [locating, setLocating] = React.useState(false);
  const [coords, setCoords] = React.useState({ lat: 16.0544, lng: 108.2022 });
  const [address, setAddress] = React.useState('');
  const [vulnerableGroups, setVulnerableGroups] = React.useState<string[]>([]);
  const [success, setSuccess] = React.useState(false);
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = React.useState<{ display: string; lat: number; lng: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();
  
  const [form, setForm] = React.useState({
    title: '',
    type: 'flood',
    severity: 'high',
    description: '',
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) { toast.error(t('gpsNoSupport')); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`
          );
          const data = await res.json();
          const parts = [
            data.address?.house_number,
            data.address?.road,
            data.address?.neighbourhood,
            data.address?.suburb,
            data.address?.city_district,
            data.address?.city,
          ].filter(Boolean);
          setAddress(parts.length > 0 ? parts.join(', ') : `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }

        toast.success(t('gpsSuccess'));
        setLocating(false);
      },
      () => { toast.error(t('gpsError')); setLocating(false); }
    );
  };

  // Auto-detect location on mount (silent — no error toast)
  React.useEffect(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`
          );
          const data = await res.json();
          const parts = [
            data.address?.house_number,
            data.address?.road,
            data.address?.neighbourhood,
            data.address?.suburb,
            data.address?.city_district,
            data.address?.city,
          ].filter(Boolean);
          setAddress(parts.length > 0 ? parts.join(', ') : `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
        setLocating(false);
      },
      () => { setLocating(false); },
      { timeout: 10000 }
    );
  }, []);

  const toggleVulnerable = (id: string) => {
    setVulnerableGroups(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      toast.error('Tối đa 5 ảnh');
      return;
    }
    const newPhotos = [...photos, ...files].slice(0, 5);
    setPhotos(newPhotos);
    setPhotoPreviews(newPhotos.map(f => URL.createObjectURL(f)));
  };

  const removePhoto = (idx: number) => {
    URL.revokeObjectURL(photoPreviews[idx]);
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];
    const formData = new FormData();
    photos.forEach(f => formData.append('files[]', f));
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data ?? [];
  };

  const handleAddressInput = (val: string) => {
    setAddress(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&addressdetails=1&limit=5&countrycodes=vn&accept-language=vi`
        );
        const data = await res.json();
        setSuggestions(data.map((d: any) => ({
          display: d.display_name,
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
        })));
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    }, 400);
  };

  const selectSuggestion = (s: { display: string; lat: number; lng: number }) => {
    setAddress(s.display);
    setCoords({ lat: s.lat, lng: s.lng });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error(t('validationError'));
      return;
    }
    if (!address && coords.lat === 16.0544) {
      toast.error(t('gpsError'));
      return;
    }

    setSubmitting(true);

    try {
      // Upload ảnh trước
      const photoUrls = await uploadPhotos();

      // Tạo incident
      await api.post('/incidents', {
        title: form.title,
        type: form.type,
        severity: form.severity,
        description: form.description || null,
        address: address || 'Đà Nẵng',
        latitude: coords.lat,
        longitude: coords.lng,
        photo_urls: photoUrls,
      });

      // Tạo rescue request luôn
      await api.post('/rescue-requests', {
        caller_name: user?.name ?? 'Anonymous',
        caller_phone: user?.phone ?? '',
        urgency: form.severity,
        category: 'rescue',
        people_count: 1,
        description: form.description || null,
        address: address || 'Đà Nẵng',
        latitude: coords.lat,
        longitude: coords.lng,
        vulnerable_groups: vulnerableGroups,
        photo_urls: photoUrls,
      });

      setSuccess(true);
      toast.success(t('submitSuccess'));
    } catch (error: any) {
      console.error(error);
      toast.error(t('submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card className="border-emerald-500/30 bg-emerald-50/50">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-black text-emerald-700">{tCitizen('sos.successTitle')}</h2>
            <p className="text-sm text-emerald-600/80">
              {tCitizen('sos.successDesc')}
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/citizen/request">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {tCitizen('sos.viewMyRequest')}
                </Button>
              </Link>
              <Link href={`/citizen/map?lat=${coords.lat}&lng=${coords.lng}&zoom=16`}>
                <Button variant="outline" className="w-full border-blue-300 text-blue-600 hover:bg-blue-50">
                  <MapPin size={16} className="mr-2" />
                  Xem trên bản đồ
                </Button>
              </Link>
              <Link href="/citizen">
                <Button variant="outline" className="w-full">
                  {tCitizen('sos.backHome')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={24} />
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {/* SOS Card */}
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div>
              <p className="font-black text-red-700">{t('warningTitle')}</p>
              <p className="text-xs text-red-600/80">
                {t('warningDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
            {t('fieldTitle')}
          </Label>
          <Input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder={t('fieldTitlePlaceholder')}
            required
            className="font-medium"
          />
        </div>

        {/* Type & Severity */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">
              {t('fieldType')}
            </Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v ?? 'flood' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="flood">{t('typeFlood')}</SelectItem>
                <SelectItem value="heavy_rain">{t('typeHeavyRain')}</SelectItem>
                <SelectItem value="landslide">{t('typeLandslide')}</SelectItem>
                <SelectItem value="dam_failure">{t('typeDamFailure')}</SelectItem>
                <SelectItem value="other">{t('typeOther')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">
              {t('fieldSeverity')}
            </Label>
            <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v ?? 'high' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t('sevLow')}</SelectItem>
                <SelectItem value="medium">{t('sevMedium')}</SelectItem>
                <SelectItem value="high">{t('sevHigh')}</SelectItem>
                <SelectItem value="critical">{t('sevCritical')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
            {t('fieldAddress')}
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder={t('fieldAddressPlaceholder')}
                value={address}
                onChange={e => handleAddressInput(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => selectSuggestion(s)}
                      className="w-full text-left px-3 py-2.5 text-xs hover:bg-muted/60 border-b border-border/30 last:border-0 transition-colors"
                    >
                      <span className="line-clamp-2">{s.display}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button type="button" variant="outline" size="icon" onClick={handleGetLocation} disabled={locating}>
              <LocateFixed size={16} className={locating ? 'animate-spin text-primary' : ''} />
            </Button>
          </div>
          {coords.lat !== 16.0544 && (
            <p className="text-[10px] text-emerald-600 font-medium">
              {t('gpsConfirm', { lat: coords.lat.toFixed(4), lng: coords.lng.toFixed(4) })}
            </p>
          )}
        </div>

        {/* Vulnerable groups */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
            {t('fieldVulnerable')}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {['children', 'elderly', 'disabled', 'pregnant'].map(id => (
              <label key={id} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                <Checkbox
                  checked={vulnerableGroups.includes(id)}
                  onCheckedChange={() => toggleVulnerable(id)}
                />
                <span className="text-xs font-medium">{VULNERABLE_LABELS[id][locale]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
            Hình ảnh hiện trường (tối đa 5)
          </Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={handlePhotoSelect}
          />
          <div className="flex flex-wrap gap-2">
            {photoPreviews.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <ImagePlus size={20} />
                <span className="text-[9px] font-medium">Thêm ảnh</span>
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
            {t('fieldDesc')}
          </Label>
          <Textarea
            placeholder={t('fieldDescPlaceholder')}
            className="min-h-[100px] resize-none"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-14 bg-red-600 hover:bg-red-700 font-black text-base"
        >
          {submitting ? (
            <><RefreshCw size={18} className="animate-spin mr-2" /> {t('submitting')}</>
          ) : (
            <><AlertTriangle size={18} className="mr-2" /> {t('submit')}</>
          )}
        </Button>
      </form>
    </div>
  );
}
