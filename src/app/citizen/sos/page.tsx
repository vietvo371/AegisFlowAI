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
  Phone, Users, Waves, CheckCircle2, ChevronLeft
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
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        toast.success(t('gpsSuccess'));
        setLocating(false);
      },
      () => { toast.error(t('gpsError')); setLocating(false); }
    );
  };

  const toggleVulnerable = (id: string) => {
    setVulnerableGroups(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề sự cố');
      return;
    }
    if (!address && coords.lat === 16.0544) {
      toast.error(t('gpsError'));
      return;
    }

    setSubmitting(true);

    try {
      // Tạo incident
      await api.post('/incidents', {
        name: form.title,
        type: form.type,
        severity: form.severity,
        description: form.description,
        address: address || 'Đà Nẵng',
        latitude: coords.lat,
        longitude: coords.lng,
      });

      // Tạo rescue request luôn
      await api.post('/rescue-requests', {
        caller_name: user?.name ?? 'Anonymous',
        caller_phone: user?.phone ?? '',
        urgency: form.severity,
        category: 'rescue',
        people_count: 1,
        description: form.description,
        address: address || 'Đà Nẵng',
        latitude: coords.lat,
        longitude: coords.lng,
        vulnerable_groups: vulnerableGroups,
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
            <h2 className="text-xl font-black text-emerald-700">Báo cáo thành công!</h2>
            <p className="text-sm text-emerald-600/80">
              Yêu cầu cứu hộ của bạn đã được gửi. Đội cứu hộ sẽ liên hệ sớm nhất.
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/citizen/request">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Xem yêu cầu của tôi
                </Button>
              </Link>
              <Link href="/citizen">
                <Button variant="outline" className="w-full">
                  Quay về trang chủ
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
        <Link href="/citizen" className="p-2 -ml-2 rounded-lg hover:bg-muted">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={24} />
            Báo cáo khẩn cấp
          </h1>
          <p className="text-sm text-muted-foreground">Gửi báo cáo đến trung tâm điều hành</p>
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
              <p className="font-black text-red-700">KHUYẾN CÁO</p>
              <p className="text-xs text-red-600/80">
                Nếu bạn đang gặp nguy hiểm tính mạng, hãy gọi 113 ngay!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
            Tiêu đề sự cố *
          </Label>
          <Input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="VD: Ngập nặng tại đường ABC..."
            required
            className="font-medium"
          />
        </div>

        {/* Type & Severity */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">
              Loại sự cố
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
              Mức độ nghiêm trọng
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
            Vị trí / Địa chỉ *
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Nhập địa chỉ hoặc lấy GPS"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>
            <Button type="button" variant="outline" size="icon" onClick={handleGetLocation} disabled={locating}>
              <LocateFixed size={16} className={locating ? 'animate-spin text-primary' : ''} />
            </Button>
          </div>
          {coords.lat !== 16.0544 && (
            <p className="text-[10px] text-emerald-600 font-medium">
              ✓ GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </p>
          )}
        </div>

        {/* Vulnerable groups */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
            Nhóm cần ưu tiên (nếu có)
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

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
            Mô tả chi tiết
          </Label>
          <Textarea
            placeholder="Mô tả tình hình, số người cần hỗ trợ..."
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
            <><RefreshCw size={18} className="animate-spin mr-2" /> Đang gửi...</>
          ) : (
            <><AlertTriangle size={18} className="mr-2" /> GỬI BÁO CÁO KHẨN</>
          )}
        </Button>
      </form>
    </div>
  );
}
