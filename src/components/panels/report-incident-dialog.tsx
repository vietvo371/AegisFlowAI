'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ShieldAlert, MapPin, AlertTriangle, LocateFixed } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export function ReportIncidentDialog() {
  const t = useTranslations('dashboard.sos');
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [locating, setLocating] = React.useState(false);
  const [coords, setCoords] = React.useState({ lat: 16.0544, lng: 108.2022 });
  const [address, setAddress] = React.useState('');

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t('gpsNoSupport'));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        toast.success(t('gpsSuccess'));
        setLocating(false);
      },
      () => {
        toast.error(t('gpsError'));
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const severity = formData.get('severity') as string;
    const description = formData.get('description') as string;
    const addressVal = address || (formData.get('address') as string) || 'Đà Nẵng';

    if (!title || !type || !severity) {
      toast.error(t('validationError'));
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/incidents', {
        title,
        type,
        severity,
        address: addressVal,
        description,
        latitude: coords.lat,
        longitude: coords.lng,
      });
      if (res.data.success) {
        toast.success(t('submitSuccess'));
        setOpen(false);
        setAddress('');
        setCoords({ lat: 16.0544, lng: 108.2022 });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('submitError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black h-12 rounded-xl shadow-lg shadow-rose-200 animate-pulse-subtle" />
        }
      >
        <ShieldAlert className="mr-2 h-5 w-5" />
        {t('triggerBtn')}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl overflow-hidden p-0">
        <div className="bg-rose-600 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              {t('dialogTitle')}
            </DialogTitle>
          </DialogHeader>
          <p className="text-rose-100 text-xs mt-2 font-medium">
            {t('dialogDesc')}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-background">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('fieldTitle')}</Label>
            <Input id="title" name="title" placeholder={t('fieldTitlePlaceholder')} required className="rounded-xl h-11 border-border focus:ring-rose-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('fieldType')}</Label>
              <Select name="type" defaultValue="flood" required>
                <SelectTrigger className="rounded-xl h-11 border-border">
                  <SelectValue placeholder={t('fieldTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flood">{t('typeFlood')}</SelectItem>
                  <SelectItem value="heavy_rain">{t('typeHeavyRain')}</SelectItem>
                  <SelectItem value="landslide">{t('typeLandslide')}</SelectItem>
                  <SelectItem value="dam_failure">{t('typeDamFailure')}</SelectItem>
                  <SelectItem value="other">{t('typeOther')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity" className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('fieldSeverity')}</Label>
              <Select name="severity" defaultValue="high" required>
                <SelectTrigger className="rounded-xl h-11 border-border">
                  <SelectValue placeholder={t('fieldSeverityPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('sevLow')}</SelectItem>
                  <SelectItem value="medium">{t('sevMedium')}</SelectItem>
                  <SelectItem value="high">{t('sevHigh')}</SelectItem>
                  <SelectItem value="critical">{t('sevCritical')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('fieldAddress')}</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  name="address"
                  placeholder={t('fieldAddressPlaceholder')}
                  className="pl-10 rounded-xl h-11 border-border"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl shrink-0"
                onClick={handleGetLocation}
                disabled={locating}
                title={t('gpsTitle')}
              >
                <LocateFixed className={`h-4 w-4 ${locating ? 'animate-spin text-primary' : ''}`} />
              </Button>
            </div>
            {coords.lat !== 16.0544 && (
              <p className="text-[10px] text-emerald-600 font-medium ml-1">
                {t('gpsConfirm', { lat: coords.lat.toFixed(5), lng: coords.lng.toFixed(5) })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('fieldDesc')}</Label>
            <Textarea 
              id="description" 
              name="description" 
              placeholder={t('fieldDescPlaceholder')} 
              className="rounded-xl min-h-[80px] border-border resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-bold">{t('cancel')}</Button>
            <Button type="submit" disabled={loading} className="bg-rose-600 hover:bg-rose-700 text-white px-8 rounded-xl font-black">
              {loading ? t('submitting') : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
