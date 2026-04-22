'use client';

import * as React from 'react';
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
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [locating, setLocating] = React.useState(false);
  const [coords, setCoords] = React.useState({ lat: 16.0544, lng: 108.2022 });
  const [address, setAddress] = React.useState('');

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ định vị GPS');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        toast.success('Đã lấy vị trí GPS thành công');
        setLocating(false);
      },
      () => {
        toast.error('Không thể lấy vị trí. Vui lòng nhập địa chỉ thủ công.');
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
      toast.error('Vui lòng điền đầy đủ tiêu đề, loại sự cố và mức độ');
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
        toast.success('Báo cáo sự cố thành công! Lực lượng chức năng đã được thông báo.');
        setOpen(false);
        setAddress('');
        setCoords({ lat: 16.0544, lng: 108.2022 });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể gửi báo cáo. Vui lòng thử lại.');
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
        SOS — BÁO CÁO SỰ CỐ KHẨN CẤP
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl overflow-hidden p-0">
        <div className="bg-rose-600 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              BÁO CÁO KHẨN CẤP
            </DialogTitle>
          </DialogHeader>
          <p className="text-rose-100 text-xs mt-2 font-medium">
            Thông tin của bạn sẽ được gửi trực tiếp đến trung tâm điều hành cứu hộ AegisFlow.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-background">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Tiêu đề sự cố *</Label>
            <Input id="title" name="title" placeholder="VD: Ngập nặng tại đường ABC..." required className="rounded-xl h-11 border-border focus:ring-rose-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Loại sự cố *</Label>
              <Select name="type" defaultValue="flood" required>
                <SelectTrigger className="rounded-xl h-11 border-border">
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flood">Ngập lụt</SelectItem>
                  <SelectItem value="heavy_rain">Mưa lớn</SelectItem>
                  <SelectItem value="landslide">Sạt lở</SelectItem>
                  <SelectItem value="dam_failure">Sự cố đập</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity" className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Mức độ *</Label>
              <Select name="severity" defaultValue="high" required>
                <SelectTrigger className="rounded-xl h-11 border-border">
                  <SelectValue placeholder="Chọn mức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="critical">Cực kỳ nguy hiểm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Địa chỉ / Vị trí</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  name="address"
                  placeholder="Địa chỉ hiện tại..."
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
                title="Lấy vị trí GPS"
              >
                <LocateFixed className={`h-4 w-4 ${locating ? 'animate-spin text-primary' : ''}`} />
              </Button>
            </div>
            {coords.lat !== 16.0544 && (
              <p className="text-[10px] text-emerald-600 font-medium ml-1">
                ✓ GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Mô tả chi tiết</Label>
            <Textarea 
              id="description" 
              name="description" 
              placeholder="Mô tả tình hình cụ thể, số người cần hỗ trợ..." 
              className="rounded-xl min-h-[80px] border-border resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-bold">Hủy</Button>
            <Button type="submit" disabled={loading} className="bg-rose-600 hover:bg-rose-700 text-white px-8 rounded-xl font-black">
              {loading ? 'Đang gửi...' : 'GỬI BÁO CÁO'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
