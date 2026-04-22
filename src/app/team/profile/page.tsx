'use client';

import * as React from 'react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, Save, RefreshCw, LogOut, ShieldAlert } from 'lucide-react';

export default function TeamProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState(user?.name ?? '');
  const [phone, setPhone] = React.useState(user?.phone ?? '');

  React.useEffect(() => {
    if (user) { setName(user.name); setPhone(user.phone ?? ''); }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/auth/profile', { name, phone });
      await refreshUser();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-black tracking-tight">Hồ sơ đội viên</h1>

      <Card className="border-border overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-orange-500/20 to-orange-500/5" />
        <CardContent className="pt-0 pb-5 px-5 flex items-end gap-4 -mt-8">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border-4 border-background flex items-center justify-center text-orange-500 font-black text-2xl shadow">
            {user?.name?.charAt(0).toUpperCase() ?? 'T'}
          </div>
          <div className="pb-1">
            <p className="font-black text-lg leading-tight">{user?.name}</p>
            <Badge variant="outline" className="text-[9px] font-bold border-orange-400/50 text-orange-500 mt-0.5">
              <ShieldAlert size={9} className="mr-1" /> Đội cứu hộ
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Thông tin liên lạc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Họ và tên</Label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
              <Input className="pl-8" value={name} onChange={e => setName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Số điện thoại bộ đàm</Label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
              <Input className="pl-8" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Email</Label>
            <div className="relative opacity-60">
              <Mail size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
              <Input className="pl-8 bg-muted cursor-not-allowed" readOnly value={user?.email ?? ''} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={loading} className="w-full gap-2 bg-orange-500 hover:bg-orange-600">
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            Lưu thay đổi
          </Button>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full gap-2 text-red-500 border-red-200 hover:bg-red-50" onClick={logout}>
        <LogOut size={16} /> Đăng xuất
      </Button>
    </div>
  );
}
