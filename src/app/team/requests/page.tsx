'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { motion, type Variants } from 'framer-motion';
import { ChevronLeft, AlertTriangle, Users, Clock, Search, MapPin, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface RescueRequest {
  id: number;
  address: string;
  people_count: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved';
  created_at: string;
  description?: string;
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

export default function TeamRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = React.useState<RescueRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    const fetchRequests = async () => {
      try {
        const api = (await import('@/lib/api')).default;
        const res = await api.get('/rescue-requests', { params: { status: 'pending', per_page: 50 } });
        if (mounted && res.data?.success) {
          setRequests(getResponseList<RescueRequest>(res.data));
        }
      } catch (e) {
        // silent
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchRequests();
    
    return () => { mounted = false; };
  }, []);

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

  const filteredRequests = requests.filter(req => 
    req.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen -mx-4 -mt-4 p-4 sm:p-6 lg:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black">
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
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Yêu cầu chờ tiếp nhận
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Danh sách các ca cần cứu hộ khẩn cấp
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
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-white/40 dark:bg-slate-800/40 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : filteredRequests.length > 0 ? (
            filteredRequests.map(req => (
              <motion.div 
                key={req.id}
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
                className="flex flex-col sm:flex-row gap-4 p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${getUrgencyDot(req.urgency)}`} />
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getUrgencyStyles(req.urgency)}`}>
                      {req.urgency}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    {req.address}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-3 font-medium">
                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      <Users size={14} /> {req.people_count} người
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {new Date(req.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center sm:justify-end shrink-0">
                  <Button 
                    onClick={() => alert(`Đã tiếp nhận yêu cầu #${req.id}`)}
                    className="w-full sm:w-auto rounded-xl font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 h-11 px-6 relative z-20"
                  >
                    Tiếp nhận ngay
                  </Button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-16 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-slate-800 border-dashed">
              <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Không có yêu cầu nào</h3>
              <p className="text-sm text-slate-500 mt-1">Hiện không có yêu cầu cứu hộ nào đang chờ tiếp nhận.</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
