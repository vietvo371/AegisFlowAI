'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Users, Search, Plus, Edit, Shield,
  Mail, Phone, CheckCircle, XCircle, UserCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UserData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: UserStatus;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  last_login_at?: string;
  is_active?: boolean;
  roles?: Array<{ id: number; name: string; slug?: string }>;
}

interface UserForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  status: UserStatus;
}

type UserStatus = 'active' | 'inactive';
type UserRole = 'city_admin' | 'rescue_operator' | 'ai_operator' | 'rescue_team' | 'citizen';

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; color: string }> = [
  { value: 'city_admin', label: 'Quản trị', color: 'text-purple-600 bg-purple-100' },
  { value: 'rescue_operator', label: 'Điều phối', color: 'text-blue-600 bg-blue-100' },
  { value: 'ai_operator', label: 'AI Operator', color: 'text-cyan-600 bg-cyan-100' },
  { value: 'rescue_team', label: 'Đội cứu hộ', color: 'text-orange-600 bg-orange-100' },
  { value: 'citizen', label: 'Công dân', color: 'text-gray-600 bg-gray-100' },
];

const STATUS_OPTIONS: Array<{ value: UserStatus; label: string }> = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Không hoạt động' },
];

const selectPopupProps = {
  align: 'start' as const,
  alignItemWithTrigger: false,
  collisionAvoidance: { side: 'none' as const, align: 'shift' as const, fallbackAxisSide: 'none' as const },
};

const roleLabel = (value: string) => ROLE_OPTIONS.find((role) => role.value === value)?.label ?? value;
const statusLabel = (value: string) => STATUS_OPTIONS.find((status) => status.value === value)?.label ?? value;

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<UserData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [editUser, setEditUser] = React.useState<UserData | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState<UserForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'citizen',
    status: 'active',
  });

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const params: Record<string, string | number> = { per_page: 100 };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/admin/users', { params });
      setUsers(res.data?.data ?? []);
    } catch {
      // handled by api interceptor
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, search]);

  React.useEffect(() => {
    const timeout = window.setTimeout(fetchUsers, 250);
    return () => window.clearTimeout(timeout);
  }, [fetchUsers]);

  const getRoleConfig = (role: string) => {
    return ROLE_OPTIONS.find((option) => option.value === role) ?? { label: role || 'Chưa gán', color: 'text-gray-600 bg-gray-100' };
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { label: 'Hoạt động', color: 'text-green-600', icon: CheckCircle };
      case 'inactive': return { label: 'Không hoạt động', color: 'text-gray-600', icon: XCircle };
      default: return { label: status, color: 'text-gray-600', icon: XCircle };
    }
  };

  const handleUpdateStatus = async (userId: number, newStatus: UserStatus) => {
    try {
      const api = (await import('@/lib/api')).default;
      await api.patch(`/admin/users/${userId}`, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus, is_active: newStatus === 'active' } : u));
      toast.success('Cập nhật trạng thái thành công');
    } catch {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const openCreate = () => {
    setForm({ name: '', email: '', phone: '', password: '', role: 'citizen', status: 'active' });
    setIsCreateOpen(true);
  };

  const openEdit = (target: UserData) => {
    setForm({
      name: target.name,
      email: target.email,
      phone: target.phone ?? '',
      password: '',
      role: target.role || target.roles?.[0]?.name || 'citizen',
      status: target.status,
    });
    setEditUser(target);
  };

  const handleCreateUser = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error('Vui lòng nhập tên, email và mật khẩu');
      return;
    }

    setSubmitting(true);
    try {
      const api = (await import('@/lib/api')).default;
      await api.post('/admin/users', {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        password: form.password,
        role: form.role,
      });
      setIsCreateOpen(false);
      fetchUsers();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSubmitting(true);
    try {
      const api = (await import('@/lib/api')).default;
      await api.patch(`/admin/users/${editUser.id}`, {
        name: form.name,
        phone: form.phone || null,
        role: form.role,
        status: form.status,
      });
      setEditUser(null);
      fetchUsers();
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active' || u.is_active === true).length,
    inactive: users.filter(u => u.status === 'inactive' || u.is_active === false).length,
    admins: users.filter(u => u.role === 'city_admin').length,
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6 custom-scroll">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
          <p className="text-sm text-muted-foreground">Quản trị tài khoản và phân quyền</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus size={16} />
          Thêm người dùng
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng người dùng', value: stats.total, icon: Users, color: 'text-blue-600 bg-blue-100' },
          { label: 'Hoạt động', value: stats.active, icon: CheckCircle, color: 'text-green-600 bg-green-100' },
          { label: 'Không hoạt động', value: stats.inactive, icon: XCircle, color: 'text-gray-600 bg-gray-100' },
          { label: 'Quản trị viên', value: stats.admins, icon: Shield, color: 'text-purple-600 bg-purple-100' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Tìm kiếm tên, email..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={(value) => value && setRoleFilter(value)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue>{roleFilter === 'all' ? 'Tất cả vai trò' : roleLabel(roleFilter)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            {ROLE_OPTIONS.map((role) => (
              <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue>{statusFilter === 'all' ? 'Tất cả' : statusLabel(statusFilter)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="p-4 font-medium">Người dùng</th>
                  <th className="p-4 font-medium">Vai trò</th>
                  <th className="p-4 font-medium">Trạng thái</th>
                  <th className="p-4 font-medium">Đăng nhập cuối</th>
                  <th className="p-4 font-medium">Ngày tạo</th>
                  <th className="p-4 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="p-4"><div className="h-8 w-40 bg-muted rounded animate-pulse" /></td>
                      <td className="p-4"><div className="h-6 w-20 bg-muted rounded animate-pulse" /></td>
                      <td className="p-4"><div className="h-6 w-24 bg-muted rounded animate-pulse" /></td>
                      <td className="p-4"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></td>
                      <td className="p-4"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></td>
                      <td className="p-4"><div className="h-8 w-20 bg-muted rounded animate-pulse ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const role = getRoleConfig(u.role);
                    const status = getStatusConfig(u.status);
                    const StatusIcon = status.icon;

                    return (
                      <tr key={u.id} className="border-b border-border hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{u.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail size={10} />
                                {u.email}
                              </p>
                              {u.phone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone size={10} />
                                  {u.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={`${role.color}`}>
                            {role.label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className={`flex items-center gap-1 text-xs ${status.color}`}>
                            <StatusIcon size={14} />
                            <span>{status.label}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {u.last_login ? new Date(u.last_login).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Chưa đăng nhập'}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}>
                              <Edit size={14} />
                            </Button>
                            {u.status === 'active' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                onClick={() => handleUpdateStatus(u.id, 'inactive')}
                              >
                                <XCircle size={14} />
                              </Button>
                            ) : u.status === 'inactive' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700"
                                onClick={() => handleUpdateStatus(u.id, 'active')}
                              >
                                <UserCheck size={14} />
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Không tìm thấy người dùng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin người dùng {editUser?.name}
            </DialogDescription>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên</label>
                <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Số điện thoại</label>
                <Input value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vai trò</label>
                <Select value={form.role} onValueChange={(role) => setForm(prev => ({ ...prev, role: role ?? prev.role }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{roleLabel(form.role)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent {...selectPopupProps}>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Trạng thái</label>
                <Select value={form.status} onValueChange={(status) => setForm(prev => ({ ...prev, status: status as UserForm['status'] }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{statusLabel(form.status)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent {...selectPopupProps}>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Hủy</Button>
            <Button onClick={handleSaveEdit} disabled={submitting}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm người dùng</DialogTitle>
            <DialogDescription>Tạo tài khoản mới và gán vai trò trong hệ thống</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên</label>
              <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Vai trò</label>
              <Select value={form.role} onValueChange={(role) => setForm(prev => ({ ...prev, role: role ?? prev.role }))}>
                <SelectTrigger className="w-full">
                  <SelectValue>{roleLabel(form.role)}</SelectValue>
                </SelectTrigger>
                <SelectContent {...selectPopupProps}>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mật khẩu</label>
              <Input type="password" value={form.password} onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Số điện thoại</label>
              <Input value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
            <Button onClick={handleCreateUser} disabled={submitting}>Tạo người dùng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
