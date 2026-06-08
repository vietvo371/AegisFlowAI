'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { motion, type Variants } from 'framer-motion';
import { ChevronLeft, Truck, Users, Clock, Search, MapPin, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function TeamAssignedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = React.useState<RescueRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    const fetchRequests = async () => {
      try {
        const api = (await import('@/lib/api')).default;
        // Fetch assigned requests for this team
        const res = await api.get('/rescue-requests', { 
          params: { team_id: user?.id, status: 'assigned', per_page: 50 } 
        });
        if (mounted && res.data?.success) {
          setRequests(getResponseList<RescueRequest>(res.data));
        }
      } catch (e) {
        // silent
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (user?.id) {
      fetchRequests();
    }
    return () => { mounted = false; };
  }, [user?.id]);

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
      case 'assigned': return <Badge className="bg-primary hover:bg-primary/90">Đã tiếp nhận</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500 hover:bg-blue-600">Đang thực hiện</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter(req => 
    req.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen -mx-4 -mt-4 p-4 sm:p-6 lg:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto space-y-6"
      >
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700" asChild>
            <Link href="/team">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Truck className="w-6 h-6 text-primary" />
              Nhiệm vụ đang thực hiện
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Danh sách các ca cứu hộ bạn đã tiếp nhận
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="relative z-20">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Tìm kiếm theo địa chỉ..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/40 dark:border-slate-800 rounded-2xl shadow-sm focus-visible:ring-primary/20"
          />
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4 relative z-10">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-24 bg-white/40 dark:bg-slate-800/40 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : filteredRequests.length > 0 ? (
            filteredRequests.map(req => (
              <motion.div 
                key={req.id}
                variants={itemVariants}
                whileHover={{ scale: 1.01, x: 4 }}
                onClick={() => router.push(`/team/requests/${req.id}`)}
                className="group relative flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/50 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-lg transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-blue-600" />
                
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0">
                  <div className={`w-3 h-3 rounded-full ${getUrgencyDot(req.urgency)}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate pr-4">{req.address}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      <Users size={14} /> {req.people_count} người
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {new Date(req.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0">
                  {getStatusBadge(req.status)}
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors relative z-20">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-16 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-slate-800 border-dashed">
              <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Không có nhiệm vụ</h3>
              <p className="text-sm text-slate-500 mt-1">Đội của bạn hiện chưa tiếp nhận nhiệm vụ nào.</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
