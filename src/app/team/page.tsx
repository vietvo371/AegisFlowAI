'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { motion, type Variants } from 'framer-motion';
import {
  Clock, CheckCircle, Truck, AlertTriangle,
  Users, Navigation, ChevronRight, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface RescueRequest {
  id: number;
  address: string;
  people_count: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved';
  created_at: string;
}

const getResponseList = <T,>(payload: { data?: T[] | { data?: T[] } } | undefined): T[] => {
  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

// Framer Motion Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function TeamDashboard() {
  const t = useTranslations('team');
  const tMissions = useTranslations('team.missions');
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = React.useState<RescueRequest[]>([]);
  const [assignedRequests, setAssignedRequests] = React.useState<RescueRequest[]>([]);
  const [stats, setStats] = React.useState({ total: 0, today: 0, completed: 0 });
  const [loading, setLoading] = React.useState(true);
  const [acceptingId, setAcceptingId] = React.useState<number | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      const api = (await import('@/lib/api')).default;
      const [pendingRes, assignedRes] = await Promise.allSettled([
        api.get('/rescue-requests', { params: { status: 'pending', per_page: 5 } }),
        api.get('/rescue-requests', { params: { status: 'assigned', team_id: user?.id, per_page: 5 } }),
      ]);

      if (pendingRes.status === 'fulfilled') {
        setPendingRequests(getResponseList<RescueRequest>(pendingRes.value.data));
      }
      if (assignedRes.status === 'fulfilled') {
        setAssignedRequests(getResponseList<RescueRequest>(assignedRes.value.data));
      }

      setStats({
        total: (pendingRes.status === 'fulfilled' ? getResponseList<RescueRequest>(pendingRes.value.data).length : 0) +
               (assignedRes.status === 'fulfilled' ? getResponseList<RescueRequest>(assignedRes.value.data).length : 0),
        today: 0,
        completed: 0
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();

    const handler = () => fetchData();
    window.addEventListener('aegis:rescue_request:created', handler);
    return () => window.removeEventListener('aegis:rescue_request:created', handler);
  }, [fetchData]);

  const handleAcceptRequest = async (requestId: number) => {
    setAcceptingId(requestId);
    try {
      const api = (await import('@/lib/api')).default;
      const teamsRes = await api.get('/rescue-teams');
      const teams = getResponseList<{ id: number; status: string }>(teamsRes.data);
      const availableTeam = teams.find((team) => team.status === 'available') ?? teams[0];

      if (!availableTeam) {
        toast.error('Chưa có đội cứu hộ khả dụng');
        return;
      }

      await api.put(`/rescue-requests/${requestId}/assign`, { team_id: availableTeam.id });
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Không tiếp nhận được yêu cầu');
    } finally {
      setAcceptingId(null);
    }
  };

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30';
    }
  };

  const getUrgencyDot = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]';
      case 'high': return 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-200/70 backdrop-blur-sm">{tMissions('pending')}</Badge>;
      case 'assigned': return <Badge className="bg-primary/90 hover:bg-primary shadow-sm shadow-primary/30">{tMissions('statusOptions.assigned')}</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500/90 hover:bg-blue-500 shadow-sm shadow-blue-500/30">{tMissions('statusOptions.in_progress')}</Badge>;
      case 'resolved': return <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10">{tMissions('completed')}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen -mx-4 -mt-4 p-4 sm:p-6 lg:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto space-y-8"
      >
        {/* Welcome Section */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
              {tMissions('title')}, {user?.name ?? t('profile.teamMember')}!
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <Clock size={14} />
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center">
            <div className="px-4 py-2 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-slate-700/50 shadow-sm flex items-center gap-2">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Đang trực tuyến</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { 
              title: 'Tổng yêu cầu', 
              value: stats.total, 
              icon: <Truck className="w-5 h-5" />, 
              colors: 'from-blue-500/10 to-transparent text-blue-600 border-blue-200/50 dark:border-blue-900/30' 
            },
            { 
              title: tMissions('pending'), 
              value: pendingRequests.length, 
              icon: <Activity className="w-5 h-5" />, 
              colors: 'from-orange-500/10 to-transparent text-orange-600 border-orange-200/50 dark:border-orange-900/30' 
            },
            { 
              title: tMissions('completed'), 
              value: stats.completed, 
              icon: <CheckCircle className="w-5 h-5" />, 
              colors: 'from-emerald-500/10 to-transparent text-emerald-600 border-emerald-200/50 dark:border-emerald-900/30' 
            }
          ].map((stat, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`relative overflow-hidden rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border ${stat.colors} shadow-sm p-5`}
            >
              <div className={`absolute top-0 right-0 p-4 opacity-20 ${stat.colors.split(' ')[1]}`}>
                {React.cloneElement(stat.icon as React.ReactElement<{ className?: string }>, { className: 'w-16 h-16 transform rotate-12' })}
              </div>
              <div className="relative z-10 flex flex-col gap-1">
                <div className="flex items-center gap-2 font-medium opacity-80">
                  {stat.icon}
                  <span className="text-xs uppercase tracking-wider font-bold">{stat.title}</span>
                </div>
                <div className="text-4xl font-black mt-2">{stat.value}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Active / Assigned Requests */}
        {assignedRequests.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Truck size={18} />
                </div>
                {tMissions('active')}
              </h2>
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-slate-200/50 text-xs font-semibold" asChild>
                <Link href="/team/assigned">
                  Xem tất cả
                </Link>
              </Button>
            </div>
            
            <div className="grid gap-4">
              {assignedRequests.slice(0, 3).map((req) => (
                <Link key={req.id} href={`/team/requests/${req.id}`}>
                  <motion.div 
                    whileHover={{ scale: 1.01, x: 4 }}
                    className="group relative flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all cursor-pointer overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-blue-600" />
                    
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0">
                      <div className={`w-3 h-3 rounded-full ${getUrgencyDot(req.urgency)}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base text-slate-900 dark:text-slate-100 truncate pr-4">{req.address}</p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          <Users size={14} /> {req.people_count} người
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(req.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0">
                      {getStatusBadge(req.status)}
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Pending Requests */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                <AlertTriangle size={18} />
              </div>
              Yêu cầu chờ tiếp nhận
            </h2>
            <Button variant="ghost" size="sm" className="rounded-full hover:bg-slate-200/50 text-xs font-semibold" asChild>
              <Link href="/team/requests">
                Tất cả ({pendingRequests.length})
              </Link>
            </Button>
          </div>

          <div className="rounded-3xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 shadow-sm p-2">
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : pendingRequests.length > 0 ? (
              <div className="space-y-2">
                {pendingRequests.slice(0, 5).map((req) => (
                  <motion.div 
                    key={req.id} 
                    whileHover={{ scale: 1.005 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${getUrgencyDot(req.urgency)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{req.address}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Users size={12} /> {req.people_count} người
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getUrgencyStyles(req.urgency)}`}>
                            {req.urgency}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleAcceptRequest(req.id)}
                      disabled={acceptingId === req.id}
                      className="w-full sm:w-auto rounded-xl font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all relative z-10"
                    >
                      {acceptingId === req.id ? 'Đang nhận...' : 'Tiếp nhận'}
                    </Button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Tuyệt vời!</h3>
                <p className="text-sm text-slate-500 mt-1">Hiện không có yêu cầu nào đang chờ tiếp nhận.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions / Navigation */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 relative z-20">
          <Link href="/team/map" className="block relative z-10 h-full">
            <motion.div 
              whileHover={{ y: -4 }}
              className="h-full w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col justify-between"
            >
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                <Navigation className="w-32 h-32" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Bản đồ nhiệm vụ</h3>
                  <p className="text-blue-100 text-sm mt-1 font-medium">Xem định vị và dẫn đường</p>
                </div>
              </div>
            </motion.div>
          </Link>
          
          <Link href="/team/requests" className="block relative z-10 h-full">
            <motion.div 
              whileHover={{ y: -4 }}
              className="h-full w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg shadow-emerald-500/20 flex flex-col justify-between"
            >
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                <Activity className="w-32 h-32" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Cập nhật tiến độ</h3>
                  <p className="text-emerald-100 text-sm mt-1 font-medium">Báo cáo tình trạng hiện tại</p>
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>
        
        {/* Footer spacing */}
        <div className="h-8" />
      </motion.div>
    </div>
  );
}
