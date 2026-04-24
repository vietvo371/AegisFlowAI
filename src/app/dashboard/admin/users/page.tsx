'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import {
  Users, Search, Filter, Plus, Edit, Trash2, Shield,
  Mail, Phone, CheckCircle, XCircle, MoreVertical, UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  status: 'active' | 'inactive' | 'suspended';
  avatar_url?: string;
  created_at: string;
  last_login?: string;
}

export default function AdminUsersPage() {
  const t = useTranslations('dashboard');
  const { user } = useAuth();
  const [users, setUsers] = React.useState<UserData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [editUser, setEditUser] = React.useState<UserData | null>(null);

  React.useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const api = (await import('@/lib/api')).default;
        const params: any = {};
        if (roleFilter !== 'all') params.role = roleFilter;
        if (statusFilter !== 'all') params.status = statusFilter;
        const res = await api.get('/users', { params });
        setUsers(res.data?.data ?? []);
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [roleFilter, statusFilter]);

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'city_admin': return { label: 'Quản trị', color: 'text-purple-600 bg-purple-100' };
      case 'rescue_operator': return { label: 'Điều phối', color: 'text-blue-600 bg-blue-100' };
      case 'ai_operator': return { label: 'AI Operator', color: 'text-cyan-600 bg-cyan-100' };
      case 'sensor': return { label: 'Cảm biến', color: 'text-green-600 bg-green-100' };
      case 'rescue_team': return { label: 'Đội cứu hộ', color: 'text-orange-600 bg-orange-100' };
      case 'citizen': return { label: 'Công dân', color: 'text-gray-600 bg-gray-100' };
      default: return { label: role, color: 'text-gray-600 bg-gray-100' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { label: 'Hoạt động', color: 'text-green-600', icon: CheckCircle };
      case 'inactive': return { label: 'Không hoạt động', color: 'text-gray-600', icon: XCircle };
      case 'suspended': return { label: 'Bị khóa', color: 'text-red-600', icon: XCircle };
      default: return { label: status, color: 'text-gray-600', icon: XCircle };
    }
  };

  const handleUpdateStatus = async (userId: number, newStatus: string) => {
    try {
      const api = (await import('@/lib/api')).default;
      await api.patch(`/users/${userId}`, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus as any } : u));
      toast.success('Cập nhật trạng thái thành công');
    } catch (e) {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
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
        <Button className="gap-2">
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
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            <SelectItem value="city_admin">Quản trị</SelectItem>
            <SelectItem value="rescue_operator">Điều phối</SelectItem>
            <SelectItem value="ai_operator">AI Operator</SelectItem>
            <SelectItem value="sensor">Cảm biến</SelectItem>
            <SelectItem value="rescue_team">Đội cứu hộ</SelectItem>
            <SelectItem value="citizen">Công dân</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="inactive">Không hoạt động</SelectItem>
            <SelectItem value="suspended">Bị khóa</SelectItem>
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
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit size={14} />
                            </Button>
                            {u.status === 'active' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                onClick={() => handleUpdateStatus(u.id, 'suspended')}
                              >
                                <XCircle size={14} />
                              </Button>
                            ) : u.status === 'suspended' ? (
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
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
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
                <label className="text-sm font-medium">Vai trò</label>
                <Select defaultValue={editUser.role}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="city_admin">Quản trị</SelectItem>
                    <SelectItem value="rescue_operator">Điều phối</SelectItem>
                    <SelectItem value="ai_operator">AI Operator</SelectItem>
                    <SelectItem value="sensor">Cảm biến</SelectItem>
                    <SelectItem value="citizen">Công dân</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Trạng thái</label>
                <Select defaultValue={editUser.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                    <SelectItem value="suspended">Bị khóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Hủy</Button>
            <Button>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
