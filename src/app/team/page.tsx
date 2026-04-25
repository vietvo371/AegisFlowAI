'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import {
  MapPin, Phone, Clock, CheckCircle, Truck, AlertTriangle,
  Users, Navigation, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RescueRequest {
  id: number;
  address: string;
  people_count: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved';
  created_at: string;
}

export default function TeamDashboard() {
  const t = useTranslations('team');
  const tMissions = useTranslations('team.missions');
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = React.useState<RescueRequest[]>([]);
  const [assignedRequests, setAssignedRequests] = React.useState<RescueRequest[]>([]);
  const [stats, setStats] = React.useState({ total: 0, today: 0, completed: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const api = (await import('@/lib/api')).default;
        const [pendingRes, assignedRes] = await Promise.allSettled([
          api.get('/rescue-requests', { params: { status: 'pending', per_page: 5 } }),
          api.get('/rescue-requests', { params: { status: 'assigned', team_id: user?.id, per_page: 5 } }),
        ]);

        if (pendingRes.status === 'fulfilled') {
          setPendingRequests(pendingRes.value.data?.data ?? []);
        }
        if (assignedRes.status === 'fulfilled') {
          setAssignedRequests(assignedRes.value.data?.data ?? []);
        }
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const handler = () => fetchData();
    window.addEventListener('aegis:rescue_request:created', handler);
    return () => window.removeEventListener('aegis:rescue_request:created', handler);
  }, [user?.id]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">{tMissions('pending')}</Badge>;
      case 'assigned': return <Badge variant="default">{tMissions('statusOptions.assigned')}</Badge>;
      case 'in_progress': return <Badge variant="default" className="bg-blue-500">{tMissions('statusOptions.in_progress')}</Badge>;
      case 'resolved': return <Badge variant="outline" className="text-green-600 border-green-600">{tMissions('completed')}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {tMissions('title')}, {user?.name ?? t('profile.teamMember')}!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Trực tuyến
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Tổng yêu cầu</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{pendingRequests.length}</p>
            <p className="text-xs text-muted-foreground">{tMissions('pending')}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">{tMissions('completed')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Requests */}
      {assignedRequests.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              {tMissions('active')}
            </CardTitle>
            <Link href="/team/assigned">
              <Button variant="ghost" size="sm" className="text-xs">
                Xem tất cả
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignedRequests.slice(0, 3).map((req) => (
                <Link key={req.id} href={`/team/requests/${req.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
                    <div className={`w-3 h-3 rounded-full ${getUrgencyColor(req.urgency)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{req.address}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Users size={12} />
                        <span>{req.people_count} người</span>
                        <Clock size={12} className="ml-2" />
                        <span>{new Date(req.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    {getStatusBadge(req.status)}
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Yêu cầu chờ tiếp nhận
          </CardTitle>
          <Link href="/team/requests">
            <Button variant="ghost" size="sm" className="text-xs">
              Xem tất cả ({pendingRequests.length})
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.slice(0, 5).map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className={`w-3 h-3 rounded-full ${getUrgencyColor(req.urgency)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{req.address}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Users size={12} />
                      <span>{req.people_count} người</span>
                      <Badge variant="outline" className="text-[10px] h-4 capitalize ml-1">{req.urgency}</Badge>
                    </div>
                  </div>
                  <Button size="sm" className="h-8 text-xs">
                    Tiếp nhận
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Không có yêu cầu nào đang chờ</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/team/map">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Bản đồ</p>
                <p className="text-xs text-muted-foreground">Xem vị trí</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/team/updates">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Cập nhật</p>
                <p className="text-xs text-muted-foreground">Báo cáo tiến độ</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
