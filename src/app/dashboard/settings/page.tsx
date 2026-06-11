'use client';

import * as React from 'react';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import {
  User, Bell, Shield, Palette, Key,
  Save, Camera, AlertTriangle, Loader2, Brain, Clock
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

interface AiSystemSettings {
  prediction_enabled: boolean;
  prediction_interval_minutes: number;
  prediction_horizon_minutes: number;
  seasonality_enabled: boolean;
  last_run_at?: string | null;
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [savingNotifications, setSavingNotifications] = React.useState(false);
  const [loadingSystemSettings, setLoadingSystemSettings] = React.useState(true);
  const [savingSystemSettings, setSavingSystemSettings] = React.useState(false);
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

  const [aiSettings, setAiSettings] = React.useState<AiSystemSettings>({
    prediction_enabled: true,
    prediction_interval_minutes: 15,
    prediction_horizon_minutes: 60,
    seasonality_enabled: true,
    last_run_at: null,
  });

  React.useEffect(() => {
    const fetchSystemSettings = async () => {
      setLoadingSystemSettings(true);
      try {
        const api = (await import('@/lib/api')).default;
        const res = await api.get('/admin/system-settings');
        const ai = res.data?.data?.ai;
        if (ai) {
          setAiSettings({
            prediction_enabled: Boolean(ai.prediction_enabled),
            prediction_interval_minutes: Number(ai.prediction_interval_minutes ?? 15),
            prediction_horizon_minutes: Number(ai.prediction_horizon_minutes ?? 60),
            seasonality_enabled: Boolean(ai.seasonality_enabled),
            last_run_at: ai.last_run_at ?? null,
          });
        }
      } catch {
        toast.error('Không tải được cấu hình hệ thống');
      } finally {
        setLoadingSystemSettings(false);
      }
    };

    fetchSystemSettings();
  }, []);

  const handleSystemSettingsSave = async () => {
    setSavingSystemSettings(true);
    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.put('/admin/system-settings', {
        ai_prediction_enabled: aiSettings.prediction_enabled,
        ai_prediction_interval_minutes: aiSettings.prediction_interval_minutes,
        ai_prediction_horizon_minutes: aiSettings.prediction_horizon_minutes,
        ai_seasonality_enabled: aiSettings.seasonality_enabled,
      });
      const ai = res.data?.data?.ai;
      if (ai) {
        setAiSettings({
          prediction_enabled: Boolean(ai.prediction_enabled),
          prediction_interval_minutes: Number(ai.prediction_interval_minutes ?? 15),
          prediction_horizon_minutes: Number(ai.prediction_horizon_minutes ?? 60),
          seasonality_enabled: Boolean(ai.seasonality_enabled),
          last_run_at: ai.last_run_at ?? null,
        });
      }
      toast.success('Đã lưu cấu hình hệ thống');
    } catch {
      toast.error('Không thể lưu cấu hình hệ thống');
    } finally {
      setSavingSystemSettings(false);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      await api.put('/auth/profile', { name: profile.name, phone: profile.phone });
      await refreshUser();
      toast.success('Cập nhật hồ sơ thành công!');
    } catch {
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
    } catch {
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain size={20} />
              Cấu hình hệ thống AI
            </CardTitle>
            <CardDescription>
              Điều chỉnh lịch chạy dự báo tự động và khung thời gian AI dự báo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-4">
              <div className="flex items-center justify-between rounded-lg border p-4 lg:col-span-2">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">Chạy dự báo tự động</Label>
                  <p className="text-xs text-muted-foreground">
                    Scheduler sẽ tự gửi job dự báo vào queue theo khoảng thời gian bên dưới.
                  </p>
                </div>
                <Switch
                  checked={aiSettings.prediction_enabled}
                  disabled={loadingSystemSettings}
                  onCheckedChange={(checked) =>
                    setAiSettings((settings) => ({ ...settings, prediction_enabled: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Chu kỳ chạy</Label>
                <Select
                  value={String(aiSettings.prediction_interval_minutes)}
                  disabled={loadingSystemSettings}
                  onValueChange={(value) =>
                    setAiSettings((settings) => ({
                      ...settings,
                      prediction_interval_minutes: Number(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Mỗi 1 phút</SelectItem>
                    <SelectItem value="5">Mỗi 5 phút</SelectItem>
                    <SelectItem value="10">Mỗi 10 phút</SelectItem>
                    <SelectItem value="15">Mỗi 15 phút</SelectItem>
                    <SelectItem value="30">Mỗi 30 phút</SelectItem>
                    <SelectItem value="60">Mỗi 1 giờ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Khung dự báo</Label>
                <Select
                  value={String(aiSettings.prediction_horizon_minutes)}
                  disabled={loadingSystemSettings}
                  onValueChange={(value) =>
                    setAiSettings((settings) => ({
                      ...settings,
                      prediction_horizon_minutes: Number(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 phút tới</SelectItem>
                    <SelectItem value="30">30 phút tới</SelectItem>
                    <SelectItem value="60">1 giờ tới</SelectItem>
                    <SelectItem value="120">2 giờ tới</SelectItem>
                    <SelectItem value="240">4 giờ tới</SelectItem>
                    <SelectItem value="1440">24 giờ tới</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Clock size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Dùng dữ liệu mẫu theo tháng/năm</p>
                  <p className="text-xs text-muted-foreground">
                    AI dùng seasonality từ dataset lịch sử, ví dụ mùa mưa Sep-Dec có rủi ro nền cao hơn.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lần chạy gần nhất: {aiSettings.last_run_at ? new Date(aiSettings.last_run_at).toLocaleString('vi-VN') : 'Chưa có'}
                  </p>
                </div>
              </div>
              <Switch
                checked={aiSettings.seasonality_enabled}
                disabled={loadingSystemSettings}
                onCheckedChange={(checked) =>
                  setAiSettings((settings) => ({ ...settings, seasonality_enabled: checked }))
                }
              />
            </div>

            <div className="flex justify-end">
              <Button
                className="gap-2"
                onClick={handleSystemSettingsSave}
                disabled={loadingSystemSettings || savingSystemSettings}
              >
                {savingSystemSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Lưu cấu hình hệ thống
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
