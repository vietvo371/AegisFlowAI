'use client';

import * as React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Mail, Phone, MapPin, User, Save, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', {
        name: formData.name,
        phone: formData.phone,
      });
      if (res.data?.success) {
        await refreshUser();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (formData.new_password !== formData.new_password_confirmation) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (formData.new_password.length < 8) {
      toast.error('Mật khẩu mới phải từ 8 ký tự trở lên!');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/change-password', {
        current_password: formData.current_password,
        new_password: formData.new_password,
        new_password_confirmation: formData.new_password_confirmation,
      });
      if (res.data?.success) {
        setFormData(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
          new_password_confirmation: '',
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-8">Đang tải cấu hình người dùng...</div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt tài khoản</h1>
        <p className="text-muted-foreground mt-1">Quản lý hồ sơ cá nhân và thay đổi mật khẩu an mật</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="md:col-span-1 space-y-6">
           <Card className="border-border overflow-hidden">
             <div className="h-24 bg-primary/10 w-full" />
             <div className="px-6 pb-6 pt-0 relative flex flex-col items-center text-center">
               <div className="w-20 h-20 bg-background rounded-full border-4 border-background flex items-center justify-center -mt-10 overflow-hidden shadow-sm">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/20 text-primary flex items-center justify-center font-bold text-2xl">
                       {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
               </div>
               <h3 className="text-xl font-bold mt-3">{user.name}</h3>
               <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 justify-center"><Mail className="w-3.5 h-3.5" /> {user.email}</p>
               
               <div className="mt-4 flex flex-wrap gap-2 justify-center">
                 <Badge variant="secondary" className="capitalize"><ShieldCheck className="w-3 h-3 mr-1" /> {user.role.replace('_', ' ')}</Badge>
                 {user.status === 'active' ? (
                   <Badge className="bg-emerald-500">Hoạt động</Badge>
                 ) : (
                   <Badge variant="destructive">Khóa</Badge>
                 )}
               </div>
             </div>
           </Card>
        </div>

        {/* Forms */}
        <div className="md:col-span-2 space-y-6">
           <Card className="border-border">
             <CardHeader>
               <CardTitle>Thông tin cá nhân</CardTitle>
               <CardDescription>Cập nhật tên và số điện thoại liên lạc.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="name">Họ và Tên</Label>
                 <div className="relative">
                   <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <Input id="name" name="name" value={formData.name} onChange={handleChange} className="pl-9" />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="phone">Số điện thoại</Label>
                 <div className="relative">
                   <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="pl-9" />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="email">Email đăng nhập (Không thể thay đổi)</Label>
                 <div className="relative opacity-60">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <Input id="email" readOnly value={user.email} className="pl-9 bg-muted cursor-not-allowed" />
                 </div>
               </div>
             </CardContent>
             <CardFooter className="bg-muted/30 pt-4 flex justify-end">
               <Button onClick={updateProfile} disabled={loading} className="gap-2">
                 {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Cập nhật hồ sơ
               </Button>
             </CardFooter>
           </Card>

           <Card className="border-border border-destructive/20">
             <CardHeader>
               <CardTitle className="text-destructive">Thay đổi mật khẩu</CardTitle>
               <CardDescription>Mật khẩu mới yêu cầu từ 8 ký tự trở lên.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="current_password">Mật khẩu hiện tại</Label>
                 <Input id="current_password" type="password" name="current_password" value={formData.current_password} onChange={handleChange} />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="new_password">Mật khẩu mới</Label>
                   <Input id="new_password" type="password" name="new_password" value={formData.new_password} onChange={handleChange} />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="new_password_confirmation">Xác nhận mật khẩu mới</Label>
                   <Input id="new_password_confirmation" type="password" name="new_password_confirmation" value={formData.new_password_confirmation} onChange={handleChange} />
                 </div>
               </div>
             </CardContent>
             <CardFooter className="bg-muted/30 pt-4 flex justify-end">
               <Button variant="destructive" onClick={updatePassword} disabled={loading || !formData.new_password} className="gap-2">
                 {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Đổi mật khẩu
               </Button>
             </CardFooter>
           </Card>
        </div>
      </div>
    </div>
  );
}
