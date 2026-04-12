'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth, User } from '@/lib/auth-context';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Search, ShieldCheck, Mail, Phone, Lock, Edit2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updateRole, setUpdateRole] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      if (res.data?.success || Array.isArray(res.data?.data)) {
        // Có thể API format là wrapper data {data: User[]} hoặc Pagination metadata
        const items = Array.isArray(res.data?.data) ? res.data.data : res.data?.data?.data || [];
        setUsersList(items);
      }
    } catch (error: any) {
      if (error.response?.status !== 403) {
        console.error('Failed to fetch users', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'city_admin') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleEditClick = (u: User) => {
    setSelectedUser(u);
    setUpdateRole(u.role);
    setUpdateStatus(u.status);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await api.put(`/admin/users/${selectedUser.id}`, {
        role: updateRole,
        status: updateStatus
      });
      toast.success('Đã cập nhật thông tin thành viên');
      setSelectedUser(null);
      fetchUsers();
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra khi cập nhật');
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== 'city_admin') {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[50vh] text-center">
         <Lock className="w-16 h-16 text-muted-foreground mb-4" />
         <h1 className="text-2xl font-bold">Không có quyền truy cập</h1>
         <p className="text-muted-foreground mt-2">Trang này dành riêng cho Quản trị viên (City Admin).</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500">Hoạt động</Badge>;
      case 'inactive': return <Badge variant="outline" className="text-gray-500">Chưa kích hoạt</Badge>;
      case 'suspended': return <Badge variant="destructive">Đình chỉ</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'city_admin': return <Badge variant="default" className="bg-primary/20 text-primary border-primary/20"><ShieldCheck className="w-3 h-3 mr-1" /> Quản trị viên</Badge>;
      case 'rescue_operator': return <Badge variant="secondary" className="border-secondary-foreground/20 text-blue-500">Điều phối cứu hộ</Badge>;
      case 'sensor_manager': return <Badge variant="secondary" className="border-secondary-foreground/20 text-orange-500">Kỹ thuật IoT</Badge>;
      case 'citizen': return <Badge variant="outline" className="text-muted-foreground">Người dân</Badge>;
      default: return <Badge variant="outline" className="capitalize">{role.replace('_', ' ')}</Badge>;
    }
  };

  const handleDelete = async (id: number) => {
    if (id === user.id) {
       toast.error("Bạn không thể tự xóa tài khoản của mình!");
       return;
    }
    if (confirm("Hành động này không thể hoàn tác. Xác nhận xóa User ID " + id + "?")) {
       try {
         await api.delete(`/admin/users/${id}`);
         toast.success("Đã xóa người dùng thành công");
         fetchUsers();
       } catch(e) {
         console.error(e);
       }
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cấp Quyền & Nhân Sự</h1>
          <p className="text-muted-foreground mt-1">Quản lý tài khoản truy cập hệ thống và quyền của bộ máy chỉ đạo</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="icon" onClick={fetchUsers} disabled={loading}>
             <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
           </Button>
           <Button className="gap-2 focus:ring-2">
             Tạo tài khoản mới
           </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Email hoặc tên người dùng..." className="pl-9 h-9 w-full bg-muted/50" />
             </div>
             <div className="flex items-center gap-2">
               <span className="text-sm font-medium">{usersList.length} nhân sự hệ thống</span>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Email / Liên hệ</TableHead>
                  <TableHead>Bộ phận (Role)</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-primary" />
                        Đang lấy danh sách phân quyền...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : usersList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      Không tìm thấy dữ liệu.
                    </TableCell>
                  </TableRow>
                ) : (
                  usersList.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/30">
                      <TableCell>
                         <div className="font-mono text-muted-foreground">#{u.id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                             {u.name.charAt(0).toUpperCase()}
                           </div>
                           <div className="font-semibold text-foreground">{u.name} {u.id === user.id && <span className="text-[10px] text-muted-foreground ml-1 font-normal">(Bạn)</span>}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col gap-0.5 text-sm">
                           <div className="flex items-center"><Mail className="w-3 h-3 mr-1.5 text-muted-foreground" /> {u.email}</div>
                           {u.phone && <div className="flex items-center"><Phone className="w-3 h-3 mr-1.5 text-muted-foreground" /> {u.phone}</div>}
                         </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>{getStatusBadge(u.status)}</TableCell>
                      <TableCell className="text-right">
                         <div className="flex items-center justify-end gap-1">
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleEditClick(u)}>
                             <Edit2 className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(u.id)}>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sửa thông tin: {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Cấp quyền mới hoặc thay đổi trạng thái truy cập của nhân sự.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Bộ phận (Role)</Label>
              <Select value={updateRole} onValueChange={(val: string | null) => setUpdateRole(val ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn quyền" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="citizen">Người dân (Citizen)</SelectItem>
                  <SelectItem value="rescue_operator">Điều phối cứu hộ (Operator)</SelectItem>
                  <SelectItem value="sensor_manager">Kỹ thuật IoT (Sensor)</SelectItem>
                  <SelectItem value="city_admin">Quản trị viên (Admin)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={updateStatus} onValueChange={(val: string | null) => setUpdateStatus(val ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động (Active)</SelectItem>
                  <SelectItem value="inactive">Đang chờ (Inactive)</SelectItem>
                  <SelectItem value="suspended">Đình chỉ (Suspended)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Hủy</Button>
            <Button onClick={handleUpdateUser} disabled={submitting}>
              {submitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />} Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
