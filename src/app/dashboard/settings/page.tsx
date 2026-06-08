'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import {
  Settings, User, Bell, Shield, Palette, Globe, Key,
  Mail, Phone, MapPin, Save, Camera, CheckCircle, AlertTriangle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SettingsPage() {
  const t = useTranslations('dashboard');
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [savingNotifications, setSavingNotifications] = React.useState(false);
  const [deletingAccount, setDeletingAccount] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [profile, setProfile] = React.useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  });

  const [notifications, setNotifications] = React.useState(() => {
    try {
      const saved = localStorage.getItem('notification_preferences');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { email: true, push: true, sms: false, alerts: true, rescue_requests: true, predictions: false };
  });

  const [preferences, setPreferences] = React.useState({
    theme: 'system',
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
  });

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      await api.put('/auth/profile', { name: profile.name, phone: profile.phone });
      await refreshUser();
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (e) {
      toast.error('Không thể cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Ảnh tối đa 2MB'); return; }
    setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const formData = new FormData();
      formData.append('avatar', file);
      await api.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      toast.success('Cập nhật ảnh đại diện thành công!');
    } catch {
      toast.error('Không thể cập nhật ảnh đại diện');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsSave = async () => {
    setSavingNotifications(true);
    try {
      localStorage.setItem('notification_preferences', JSON.stringify(notifications));
      toast.success('Cập nhật thông báo thành công!');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const api = (await import('@/lib/api')).default;
      await api.delete('/auth/account');
      toast.success('Tài khoản đã được xóa');
      window.location.href = '/login';
    } catch {
      toast.error('Không thể xóa tài khoản');
      setShowDeleteConfirm(false);
    } finally {
      setDeletingAccount(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('current_password');
    const newPassword = formData.get('new_password');
    const confirmPassword = formData.get('confirm_password');

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }

    setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      e.currentTarget.reset();
    } catch (e) {
      toast.error('Không thể đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6 custom-scroll">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-sm text-muted-foreground">Quản lý tài khoản và tùy chọn</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={20} />
                  Hồ sơ cá nhân
                </CardTitle>
                <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={loading}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <Camera size={14} />
                      Đổi ảnh
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG tối đa 2MB</p>
                  </div>
                </div>

                <Separator />

                {/* Form */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Họ và tên</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vai trò</Label>
                    <Input value={user?.role ?? ''} disabled className="bg-muted" />
                  </div>
                </div>

                <Button onClick={handleProfileUpdate} disabled={loading} className="gap-2">
                  {loading ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <Save size={14} />
                  )}
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Password Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key size={20} />
                  Đổi mật khẩu
                </CardTitle>
                <CardDescription>Cập nhật mật khẩu để bảo vệ tài khoản</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Mật khẩu hiện tại</Label>
                    <Input
                      id="current_password"
                      name="current_password"
                      type="password"
                      required
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new_password">Mật khẩu mới</Label>
                      <Input
                        id="new_password"
                        name="new_password"
                        type="password"
                        minLength={8}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Xác nhận mật khẩu</Label>
                      <Input
                        id="confirm_password"
                        name="confirm_password"
                        type="password"
                        minLength={8}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="gap-2">
                    <Shield size={14} />
                    Đổi mật khẩu
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell size={20} />
                  Thông báo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'email', label: 'Email', description: 'Nhận thông báo qua email' },
                  { key: 'push', label: 'Push notification', description: 'Nhận thông báo trên trình duyệt' },
                  { key: 'sms', label: 'SMS', description: 'Nhận tin nhắn SMS' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Bell size={14} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(checked) =>
                        setNotifications((n: typeof notifications) => ({ ...n, [item.key]: checked }))
                      }
                    />
                  </div>
                ))}

                <Separator />

                <p className="text-sm font-medium">Loại thông báo</p>
                {[
                  { key: 'alerts', label: 'Cảnh báo ngập lụt' },
                  { key: 'rescue_requests', label: 'Yêu cầu cứu hộ' },
                  { key: 'predictions', label: 'Dự báo AI' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-sm">{item.label}</span>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(checked) =>
                        setNotifications((n: typeof notifications) => ({ ...n, [item.key]: checked }))
                      }
                    />
                  </div>
                ))}

                <Button
                  size="sm"
                  className="w-full gap-2 mt-2"
                  onClick={handleNotificationsSave}
                  disabled={savingNotifications}
                >
                  {savingNotifications ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Lưu cài đặt thông báo
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette size={20} />
                  Giao diện
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Chủ đề</Label>
                  <Select
                    value={preferences.theme}
                    onValueChange={(value) =>
                      value && setPreferences(p => ({ ...p, theme: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Sáng</SelectItem>
                      <SelectItem value="dark">Tối</SelectItem>
                      <SelectItem value="system">Hệ thống</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ngôn ngữ</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) =>
                      value && setPreferences(p => ({ ...p, language: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Múi giờ</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(value) =>
                      value && setPreferences(p => ({ ...p, timezone: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Ho_Chi_Minh">Việt Nam (UTC+7)</SelectItem>
                      <SelectItem value="Asia/Bangkok">Thái Lan (UTC+7)</SelectItem>
                      <SelectItem value="Asia/Singapore">Singapore (UTC+8)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Shield size={20} />
                  Vùng nguy hiểm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Xóa tài khoản</p>
                    <p className="text-xs text-muted-foreground">
                      Xóa vĩnh viễn tài khoản và dữ liệu
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Xóa
                  </Button>
                </div>
                {showDeleteConfirm && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-700 font-medium">
                        Bạn chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount}
                        className="gap-1"
                      >
                        {deletingAccount && <Loader2 size={12} className="animate-spin" />}
                        Xác nhận xóa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deletingAccount}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
