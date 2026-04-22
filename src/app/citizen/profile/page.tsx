'use client';

import * as React from 'react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Phone, Mail, Save, RefreshCw, LogOut, ShieldCheck } from 'lucide-react';

export default function CitizenProfilePage() {
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
      <h1 className="text-2xl font-black tracking-tight">Hồ sơ cá nhân</h1>

      {/* Avatar card */}
      <Card className="border-border overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5" />
        <CardContent className="pt-0 pb-5 px-5 flex items-end gap-4 -mt-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border-4 border-background flex items-center justify-center text-primary font-black text-2xl shadow">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="pb-1">
            <p className="font-black text-lg leading-tight">{user?.name}</p>
            <Badge variant="outline" className="text-[9px] font-bold border-primary/30 text-primary mt-0.5">
              <ShieldCheck size={9} className="mr-1" /> Người dân
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Thông tin cá nhân</CardTitle>
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
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Số điện thoại</Label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
              <Input className="pl-8" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901234567" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Email (không thể thay đổi)</Label>
            <div className="relative opacity-60">
              <Mail size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
              <Input className="pl-8 bg-muted cursor-not-allowed" readOnly value={user?.email ?? ''} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={loading} className="w-full gap-2">
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            Lưu thay đổi
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button variant="outline" className="w-full gap-2 text-red-500 border-red-200 hover:bg-red-50" onClick={logout}>
        <LogOut size={16} /> Đăng xuất
      </Button>
    </div>
  );
}
