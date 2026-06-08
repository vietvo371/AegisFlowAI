'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Clock, Filter, HeartPulse, Search, Users, XCircle, CheckCircle, MapPin, Phone
} from 'lucide-react';
import Link from 'next/link';
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

interface RescueRequest {
  id: number;
  request_number: string;
  address: string | null;
  people_count: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  description?: string;
  caller_name?: string;
  caller_phone?: string;
  assigned_team?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
  location?: { lat: number; lng: number } | null;
}

export default function RescueRequestsPage() {
  const t = useTranslations('dashboard');
  const [requests, setRequests] = React.useState<RescueRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [actionLoading, setActionLoading] = React.useState<number | null>(null);

  React.useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const api = (await import('@/lib/api')).default;
        const params: any = {};
        if (statusFilter !== 'all') params.status = statusFilter;
        const res = await api.get('/rescue-requests', { params });
        setRequests(res.data?.data ?? []);
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();

    const handler = () => fetchRequests();
    window.addEventListener('aegis:rescue_request:created', handler);
    return () => window.removeEventListener('aegis:rescue_request:created', handler);
  }, [statusFilter]);

  const handleAssign = async (id: number) => {
    setActionLoading(id);
    try {
      const api = (await import('@/lib/api')).default;
      await api.put(`/rescue-requests/${id}/status`, { status: 'assigned' });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'assigned' } : r));
      toast.success('Đã tiếp nhận yêu cầu');
    } catch (e) {
      // toast is handled by interceptor, so no need for toast.error here
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (id: number) => {
    setActionLoading(id);
    try {
      const api = (await import('@/lib/api')).default;
      await api.put(`/rescue-requests/${id}/status`, { status: 'completed' });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r));
      toast.success('Đã hoàn thành yêu cầu');
    } catch (e) {
      // toast is handled by interceptor
    } finally {
      setActionLoading(null);
    }
  };

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case 'critical': return { color: 'bg-red-500', text: 'text-red-500', label: 'Khẩn cấp' };
      case 'high': return { color: 'bg-orange-500', text: 'text-orange-500', label: 'Cao' };
      case 'medium': return { color: 'bg-yellow-500', text: 'text-yellow-600', label: 'Trung bình' };
      default: return { color: 'bg-blue-500', text: 'text-blue-500', label: 'Thấp' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { variant: 'secondary' as const, label: 'Chờ tiếp nhận', icon: Clock };
      case 'assigned': return { variant: 'default' as const, label: 'Đã tiếp nhận', icon: CheckCircle };
      case 'in_progress': return { variant: 'default' as const, label: 'Đang thực hiện', icon: HeartPulse };
      case 'completed': return { variant: 'outline' as const, label: 'Hoàn thành', icon: CheckCircle };
      case 'cancelled': return { variant: 'destructive' as const, label: 'Đã hủy', icon: XCircle };
      default: return { variant: 'secondary' as const, label: status, icon: Clock };
    }
  };

  const filteredRequests = requests.filter(r =>
    (r.address || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.caller_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    resolved: requests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6 custom-scroll">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yêu cầu cứu hộ</h1>
          <p className="text-sm text-muted-foreground">Quản lý và điều phối yêu cầu cứu hộ</p>
        </div>
        <Button className="gap-2">
          <AlertTriangle size={16} />
          Báo cáo mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng yêu cầu', value: stats.total, color: 'bg-blue-100 text-blue-600' },
          { label: 'Chờ tiếp nhận', value: stats.pending, color: 'bg-yellow-100 text-yellow-600' },
          { label: 'Đang thực hiện', value: stats.inProgress, color: 'bg-orange-100 text-orange-600' },
          { label: 'Hoàn thành', value: stats.resolved, color: 'bg-green-100 text-green-600' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center font-bold text-lg`}>
                {stat.value}
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Tìm kiếm địa chỉ, tên..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Lọc trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">Chờ tiếp nhận</SelectItem>
            <SelectItem value="assigned">Đã tiếp nhận</SelectItem>
            <SelectItem value="in_progress">Đang thực hiện</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-24 bg-muted rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : filteredRequests.length > 0 ? (
          filteredRequests.map((request, i) => {
            const urgency = getUrgencyConfig(request.urgency);
            const status = getStatusConfig(request.status);
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${urgency.color} flex items-center justify-center shrink-0`}>
                        <HeartPulse size={24} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold">{request.address}</h3>
                          <Badge className={`${urgency.text} bg-opacity-10`} style={{ backgroundColor: 'var(--tw-bg-opacity, 0.1)' }}>
                            {urgency.label}
                          </Badge>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon size={12} />
                            {status.label}
                          </Badge>
                        </div>
                        {request.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{request.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users size={14} />
                            <span>{request.people_count} người</span>
                          </div>
                          {request.caller_name && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <span>{request.caller_name}</span>
                            </div>
                          )}
                          {request.caller_phone && (
                            <a href={`tel:${request.caller_phone}`} className="flex items-center gap-1 text-primary">
                              <Phone size={14} />
                              <span>{request.caller_phone}</span>
                            </a>
                          )}
                          {request.assigned_team && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <span>Đội: {request.assigned_team.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                            <Clock size={14} />
                            <span>{new Date(request.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleAssign(request.id)}
                            disabled={actionLoading === request.id}
                            className="gap-1"
                          >
                            {actionLoading === request.id ? 'Đang xử lý...' : 'Tiếp nhận'}
                          </Button>
                        )}
                        {request.status === 'assigned' && (
                          <Button
                            size="sm"
                            onClick={() => handleResolve(request.id)}
                            disabled={actionLoading === request.id}
                            className="gap-1"
                          >
                            {actionLoading === request.id ? 'Đang xử lý...' : 'Hoàn thành'}
                          </Button>
                        )}
                        {request.location ? (
                          <Button variant="ghost" size="sm" className="gap-1" asChild>
                            <Link href={`/dashboard?lat=${request.location.lat}&lng=${request.location.lng}&requestId=${request.id}&requestTitle=Yêu cầu ${request.request_number}&requestStatus=${encodeURIComponent(getStatusConfig(request.status).label)}`}>
                              <MapPin size={14} />
                              Bản đồ
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="gap-1 opacity-50 cursor-not-allowed" title="Chưa có thông tin tọa độ GPS">
                            <MapPin size={14} />
                            Bản đồ
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <HeartPulse className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">Không có yêu cầu cứu hộ nào</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
