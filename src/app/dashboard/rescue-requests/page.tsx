'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle, Clock, HeartPulse, Search, Users, XCircle, CheckCircle, MapPin, Phone,
  ChevronLeft, ChevronRight, X, User, Navigation, CheckSquare, Sparkles, FileText
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

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
  photo_urls?: string[];
  assigned_team?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
  location?: { lat: number; lng: number } | null;
  priority_score?: number | null;
}

interface RescueTeam {
  id: number;
  name: string;
  status: string;
}

const ACTIVE_STATUSES = ['pending', 'assigned', 'in_progress'];
const TERMINAL_STATUSES = ['completed', 'cancelled'];

export default function RescueRequestsPage() {
  const t = useTranslations('dashboard.rescueRequests');
  const tEnum = useTranslations('enums');

  const [requests, setRequests] = React.useState<RescueRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('active');
  const [selectedRequest, setSelectedRequest] = React.useState<RescueRequest | null>(null);
  const [actionLoading, setActionLoading] = React.useState<number | null>(null);
  const [teams, setTeams] = React.useState<RescueTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 6;

  const fetchTeams = React.useCallback(async () => {
    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.get('/rescue-teams', { params: { per_page: 100, status: 'available' } });
      setTeams(res.data?.data ?? []);
    } catch { /* silent */ }
  }, []);

  React.useEffect(() => {
    void fetchTeams();
  }, [fetchTeams]);

  const fetchRequests = React.useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const params: Record<string, string | number> = { per_page: 100 };
      if (!['all', 'active'].includes(statusFilter)) params.status = statusFilter;
      const res = await api.get('/rescue-requests', { params });
      setRequests(res.data?.data ?? []);
    } catch {
      // silent
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    void fetchRequests();

    const handler = () => void fetchRequests(false);
    window.addEventListener('aegis:rescue_request:created', handler);
    window.addEventListener('aegis:rescue_request:updated', handler);
    return () => {
      window.removeEventListener('aegis:rescue_request:created', handler);
      window.removeEventListener('aegis:rescue_request:updated', handler);
    };
  }, [fetchRequests]);

  const handleAssign = async (id: number) => {
    setActionLoading(id);
    try {
      const api = (await import('@/lib/api')).default;
      const team = teams.find(t => t.id === Number(selectedTeamId));
      if (selectedTeamId) {
        await api.put(`/rescue-requests/${id}/assign`, { team_id: Number(selectedTeamId) });
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'assigned', assigned_team: team ? { id: team.id, name: team.name } : r.assigned_team } : r));
        if (selectedRequest?.id === id) {
          setSelectedRequest(prev => prev ? { ...prev, status: 'assigned', assigned_team: team ? { id: team.id, name: team.name } : prev.assigned_team } : null);
        }
      } else {
        await api.put(`/rescue-requests/${id}/status`, { status: 'assigned' });
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'assigned' } : r));
        if (selectedRequest?.id === id) {
          setSelectedRequest(prev => prev ? { ...prev, status: 'assigned' } : null);
        }
      }
      toast.success(t('toastAssigned'));
      void fetchTeams();
    } catch {
      // toast is handled by interceptor
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
      if (selectedRequest?.id === id) {
        setSelectedRequest(prev => prev ? { ...prev, status: 'completed' } : null);
      }
      toast.success(t('toastCompleted'));
      void fetchTeams();
    } catch {
      // toast is handled by interceptor
    } finally {
      setActionLoading(null);
    }
  };

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case 'critical': return { color: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/25 bg-rose-500/10', label: tEnum('urgency.critical'), bg: 'bg-rose-500/10' };
      case 'high': return { color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/25 bg-amber-500/10', label: tEnum('urgency.high'), bg: 'bg-amber-500/10' };
      case 'medium': return { color: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/25 bg-yellow-500/10', label: tEnum('urgency.medium'), bg: 'bg-yellow-500/10' };
      default: return { color: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/25 bg-blue-500/10', label: tEnum('urgency.low'), bg: 'bg-blue-500/10' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { border: 'border-yellow-500/20 bg-yellow-500/10', text: 'text-yellow-400', label: tEnum('rescueStatus.pending'), icon: Clock };
      case 'assigned': return { border: 'border-blue-500/20 bg-blue-500/10', text: 'text-blue-400', label: tEnum('rescueStatus.assigned'), icon: CheckCircle };
      case 'in_progress': return { border: 'border-indigo-500/20 bg-indigo-500/10', text: 'text-indigo-400', label: tEnum('rescueStatus.in_progress'), icon: HeartPulse };
      case 'completed': return { border: 'border-emerald-500/20 bg-emerald-500/10', text: 'text-emerald-400', label: tEnum('rescueStatus.completed'), icon: CheckCircle };
      case 'cancelled': return { border: 'border-zinc-500/20 bg-zinc-500/10', text: 'text-zinc-400', label: tEnum('rescueStatus.cancelled'), icon: XCircle };
      default: return { border: 'border-zinc-500/20 bg-zinc-500/10', text: 'text-zinc-400', label: status, icon: Clock };
    }
  };

  const filteredRequests = React.useMemo(() => {
    return requests.filter((r) => {
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' ? ACTIVE_STATUSES.includes(r.status) : r.status === statusFilter);
      const matchesSearch = !search ||
        (r.address || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.caller_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.request_number || '').toLowerCase().includes(search.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  React.useEffect(() => {
    if (filteredRequests.length > 0 && !selectedRequest) {
      setSelectedRequest(filteredRequests[0]);
    }
  }, [filteredRequests, selectedRequest]);

  const isTerminalStatus = (status: RescueRequest['status']) => TERMINAL_STATUSES.includes(status);

  const getMapHref = (request: RescueRequest) => {
    const firstPhoto = request.photo_urls?.find(Boolean);
    const params = new URLSearchParams({
      lat: String(request.location?.lat),
      lng: String(request.location?.lng),
      requestId: String(request.id),
      requestTitle: `Request ${request.request_number}`,
      requestStatus: getStatusConfig(request.status).label,
    });

    if (request.address) params.set('requestAddress', request.address);
    if (request.urgency) params.set('requestUrgency', getUrgencyConfig(request.urgency).label);
    if (request.caller_name) params.set('requestCaller', request.caller_name);
    if (request.caller_phone) params.set('requestPhone', request.caller_phone);
    if (request.people_count != null) params.set('requestPeople', String(request.people_count));
    if (firstPhoto) params.set('requestPhoto', firstPhoto);

    return `/dashboard?${params.toString()}`;
  };

  const stats = React.useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      inProgress: requests.filter(r => r.status === 'in_progress' || r.status === 'assigned').length,
      resolved: requests.filter(r => r.status === 'completed').length,
    };
  }, [requests]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <main className="relative flex w-full flex-col gap-6 px-6 py-6 min-h-0 overflow-hidden">
      {/* Aurora Blurs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-rose-500/[0.04] dark:bg-rose-500/[0.06] rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-purple-500/[0.03] dark:bg-purple-500/[0.05] rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Container */}
      <section className="relative rounded-3xl border border-border/50 bg-card/45 backdrop-blur-md p-5 shadow-sm md:p-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3.5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-rose-500/20 bg-rose-500/5 px-2.5 py-0.5 text-[10px] font-black uppercase text-rose-400 tracking-wider">
                {t('badge')}
              </Badge>
              {stats.pending > 0 && (
                <Badge variant="outline" className="border-rose-500/20 bg-rose-500/10 text-rose-400 text-[10px] font-bold animate-pulse">
                  {t('pendingCountLabel', { count: stats.pending })}
                </Badge>
              )}
            </div>
            <h1 className="flex items-center gap-3.5 text-2xl font-black tracking-tight text-foreground md:text-3xl">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-500/20 transition-all duration-300">
                <AlertTriangle size={21} className="animate-pulse" />
              </span>
              {t('title')}
            </h1>
            <p className="mt-2 text-xs font-semibold text-muted-foreground leading-relaxed">
              {t('desc')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Button
              className="h-10 gap-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/25 border-none"
              onClick={() => toast.info(t('toastAutoReport'))}
            >
              <AlertTriangle size={16} />
              {t('addNew')}
            </Button>
          </div>
        </div>

        {/* Statistical Metrics Grid */}
        <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: t('statsTotal'), value: stats.total, color: 'border-blue-500/20 bg-blue-500/5 text-blue-500' },
            { label: t('statsPending'), value: stats.pending, color: 'border-rose-500/20 bg-rose-500/5 text-rose-500 animate-pulse' },
            { label: t('statsInProgress'), value: stats.inProgress, color: 'border-amber-500/20 bg-amber-500/5 text-amber-500' },
            { label: t('statsResolved'), value: stats.resolved, color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500' }
          ].map((item, idx) => (
            <Card key={idx} className={cn("bg-background/40 border-border/40 p-4 shadow-sm hover:shadow-md transition-all duration-300", item.color)}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</p>
              <p className="mt-2 text-2xl font-black">{item.value}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Main Multi-Column Panel */}
      <section className="grid min-h-0 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Left Filters Sidebar Card */}
        <Card className="h-fit border-border/50 bg-card/45 backdrop-blur-md p-4 shadow-sm flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <Input
              placeholder={t('searchPlaceholder')}
              className="h-10 rounded-xl pl-9 pr-8 border-border focus-visible:ring-rose-500 bg-background/50 text-xs font-semibold text-foreground"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="grid gap-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-2 pb-1">{t('filterLabel')}</span>
            <Select value={statusFilter} onValueChange={(val) => { if (val) setStatusFilter(val); }}>
              <SelectTrigger className="w-full h-9 rounded-xl border-border bg-background/50 text-xs font-semibold focus:ring-rose-500 text-foreground">
                <SelectValue>
                  {statusFilter === 'all' ? t('allStatuses') : statusFilter === 'active' ? t('statusActive') : tEnum(`rescueStatus.${statusFilter}`)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-border">
                <SelectItem value="active" className="text-xs font-semibold">🟠 {t('statusActive')}</SelectItem>
                <SelectItem value="all" className="text-xs font-semibold">{t('allStatuses')}</SelectItem>
                <SelectItem value="pending" className="text-xs font-semibold">🟡 {tEnum('rescueStatus.pending')}</SelectItem>
                <SelectItem value="assigned" className="text-xs font-semibold">🔵 {tEnum('rescueStatus.assigned')}</SelectItem>
                <SelectItem value="in_progress" className="text-xs font-semibold">🟣 {tEnum('rescueStatus.in_progress')}</SelectItem>
                <SelectItem value="completed" className="text-xs font-semibold">🟢 {tEnum('rescueStatus.completed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(statusFilter !== 'active' || search) && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 rounded-xl font-bold border-dashed border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs"
              onClick={() => {
                setSearch('');
                setStatusFilter('active');
              }}
            >
              <X className="mr-1.5" size={13} /> {t('clearFilter')}
            </Button>
          )}
        </Card>

        {/* Master-Detail Split Grid */}
        <div className="grid min-h-[580px] gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
          {/* Master List Card */}
          <Card className="overflow-hidden border-border/50 bg-card/45 backdrop-blur-md shadow-sm flex flex-col">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5 bg-muted/10">
              <h2 className="font-black text-sm tracking-tight">{t('listTitle')}</h2>
              <Badge variant="outline" className="border-rose-500/20 bg-rose-500/5 text-rose-400 text-[10px] font-bold flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                {t('liveBroadcast')}
              </Badge>
            </div>

            <ScrollArea className="flex-1 h-[580px] custom-scroll bg-transparent">
              {loading ? (
                <div className="space-y-4 p-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 bg-muted/30 border border-border/50 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="flex min-h-[460px] flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-border bg-muted/40 text-muted-foreground shadow-inner">
                    <HeartPulse size={28} />
                  </div>
                  <h3 className="text-base font-black tracking-tight text-foreground">{t('noRequests')}</h3>
                  <p className="mt-2.5 max-w-xs text-xs font-semibold leading-relaxed text-muted-foreground">
                    {t('noRequestsDesc')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                  {paginatedRequests.map((request) => {
                    const urgency = getUrgencyConfig(request.urgency);
                    const status = getStatusConfig(request.status);
                    const active = selectedRequest?.id === request.id;

                    return (
                      <div
                        key={request.id}
                        onClick={() => setSelectedRequest(request)}
                        className={cn(
                          'relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer select-none bg-card/10',
                          active
                            ? 'border-rose-500/35 bg-rose-500/[0.04] ring-1 ring-rose-500/20'
                            : 'border-border/60 hover:border-border hover:bg-muted/10',
                        )}
                      >
                        {active && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 rounded-l" />
                        )}

                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0 flex items-start gap-2.5">
                            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border text-white text-lg", urgency.color)}>
                              <HeartPulse size={16} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs font-extrabold text-foreground truncate">{request.address || t('hiddenAddress')}</h3>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate font-semibold">
                                <Users size={10} />
                                {t('trappedPeople', { count: request.people_count })}
                              </p>
                            </div>
                          </div>
                          
                          <Badge variant="outline" className={cn("text-[8px] h-4 font-black uppercase tracking-wider gap-1 shrink-0", urgency.border, urgency.text)}>
                            {urgency.label}
                          </Badge>
                        </div>

                        <p className="text-[10px] text-muted-foreground font-semibold line-clamp-2 leading-relaxed mb-3">
                          {request.description || t('noDescription')}
                        </p>

                        <div className="flex items-center justify-between mt-auto text-[10px] font-bold text-muted-foreground border-t border-border/50 pt-2.5">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className={cn("text-[8px] h-4.5 font-bold uppercase gap-0.5", status.border, status.text)}>
                              {request.status === 'pending' && <span className="size-1 rounded-full bg-yellow-500 mr-0.5" />}
                              {status.label}
                            </Badge>
                            {request.priority_score != null && (
                              <Badge variant="outline" className={cn(
                                "text-[8px] h-4.5 font-black gap-0.5",
                                request.priority_score >= 75 ? 'border-purple-500/20 bg-purple-500/10 text-purple-400' :
                                request.priority_score >= 50 ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' :
                                'border-blue-500/20 bg-blue-500/10 text-blue-400'
                              )}>
                                <Sparkles size={8} /> {request.priority_score}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[9px] text-muted-foreground flex items-center gap-1 font-semibold">
                            <Clock size={10} />
                            {new Date(request.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* List Pagination Indicators */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/50 px-5 py-4 bg-muted/10">
                <span className="text-[10px] font-bold text-muted-foreground">
                  {t('paginationInfo', {
                    start: Math.min(filteredRequests.length, (currentPage - 1) * itemsPerPage + 1),
                    end: Math.min(filteredRequests.length, currentPage * itemsPerPage),
                    total: filteredRequests.length
                  })}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-8 rounded-lg p-0 border-border hover:bg-muted"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={15} />
                  </Button>
                  {getPageNumbers().map((num, i) => (
                    <Button
                      key={i}
                      variant={currentPage === num ? 'default' : 'outline'}
                      size="sm"
                      className={cn("size-8 rounded-lg p-0 text-xs font-bold border-border hover:bg-muted", currentPage === num && "bg-rose-600 hover:bg-rose-500 text-white border-none")}
                      onClick={() => typeof num === 'number' && setCurrentPage(num)}
                      disabled={typeof num !== 'number'}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-8 rounded-lg p-0 border-border hover:bg-muted"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={15} />
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Active Detail card panel */}
          <Card className="relative overflow-hidden border-border/50 bg-card/45 backdrop-blur-md shadow-sm flex flex-col">
            <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-rose-500/20 via-rose-500 to-rose-500/20" />

            {selectedRequest ? (
              <div className="flex flex-col h-full">
                {/* Panel Header */}
                <div className="border-b border-border/50 px-5 py-4 flex items-center justify-between bg-muted/10">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                      {t('requestNumber')} {selectedRequest.request_number}
                    </p>
                    <h2 className="font-black text-sm tracking-tight mt-0.5 truncate text-foreground">
                      {t('detailTitle')}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-wider gap-1", getUrgencyConfig(selectedRequest.urgency).border, getUrgencyConfig(selectedRequest.urgency).text)}>
                      {t('urgencyLabel', { urgency: getUrgencyConfig(selectedRequest.urgency).label })}
                    </Badge>
                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-wider gap-1", getStatusConfig(selectedRequest.status).border, getStatusConfig(selectedRequest.status).text)}>
                      {getStatusConfig(selectedRequest.status).label}
                    </Badge>
                  </div>
                </div>

                {/* Detail Content */}
                <ScrollArea className="flex-1 custom-scroll p-5">
                  <div className="space-y-6">
                    {/* Big Title & Icon */}
                    <div className="flex items-start gap-4">
                      <div className={cn("flex size-14 shrink-0 items-center justify-center rounded-2xl border text-white text-3xl shadow-md", getUrgencyConfig(selectedRequest.urgency).color)}>
                        <HeartPulse size={24} className="animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-black leading-snug text-foreground">
                          {selectedRequest.address || t('floodedScene')}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-[10px] font-extrabold border uppercase tracking-wider border-rose-500/20 bg-rose-500/5 text-rose-400">
                            {t('peopleCountLabel', { count: selectedRequest.people_count })}
                          </Badge>
                          {selectedRequest.assigned_team && (
                            <Badge variant="outline" className="text-[10px] font-extrabold border uppercase tracking-wider border-blue-500/20 bg-blue-500/5 text-blue-400">
                              {t('assignedTeamLabel')} {selectedRequest.assigned_team.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Priority Score */}
                    {selectedRequest.priority_score != null && (
                      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
                        <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mb-3">
                          <Sparkles size={12} className="text-purple-400" /> Điểm ưu tiên AI
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="relative flex size-16 shrink-0 items-center justify-center">
                            <svg className="size-16 -rotate-90" viewBox="0 0 64 64">
                              <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6" className="text-purple-500/10" />
                              <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6"
                                strokeDasharray={`${2 * Math.PI * 26}`}
                                strokeDashoffset={`${2 * Math.PI * 26 * (1 - selectedRequest.priority_score / 100)}`}
                                strokeLinecap="round"
                                className={cn(
                                  selectedRequest.priority_score >= 75 ? 'text-rose-500' :
                                  selectedRequest.priority_score >= 50 ? 'text-amber-500' : 'text-blue-500'
                                )}
                              />
                            </svg>
                            <span className={cn(
                              "absolute text-base font-black",
                              selectedRequest.priority_score >= 75 ? 'text-rose-400' :
                              selectedRequest.priority_score >= 50 ? 'text-amber-400' : 'text-blue-400'
                            )}>
                              {selectedRequest.priority_score}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-black",
                              selectedRequest.priority_score >= 75 ? 'text-rose-400' :
                              selectedRequest.priority_score >= 50 ? 'text-amber-400' : 'text-blue-400'
                            )}>
                              {selectedRequest.priority_score >= 75 ? 'Ưu tiên cao — Cần cứu hộ ngay' :
                               selectedRequest.priority_score >= 50 ? 'Ưu tiên trung bình' : 'Ưu tiên thấp'}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                              AI chấm điểm dựa trên: số người, mức độ khẩn, mực nước, thời gian chờ
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Detailed Situation Report */}
                    <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
                      <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <FileText size={12} className="text-rose-400" /> {t('descriptionLabel')}
                      </p>
                      <p className="text-xs font-semibold text-foreground leading-relaxed">
                        {selectedRequest.description || t('noDescription')}
                      </p>
                    </div>

                    {/* Quick Caller Profile Card */}
                    <div className="rounded-2xl border border-border bg-muted/20 p-3.5 space-y-3">
                      <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                        {t('callerInfoLabel')}
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                          <User size={16} />
                        </div>
                        <div className="text-xs font-semibold text-foreground">
                          <p className="font-extrabold">{selectedRequest.caller_name || t('callerDefault')}</p>
                          {selectedRequest.caller_phone ? (
                            <a href={`tel:${selectedRequest.caller_phone}`} className="text-rose-400 font-bold hover:underline flex items-center gap-1 mt-1">
                              <Phone size={12} />
                              {selectedRequest.caller_phone}
                            </a>
                          ) : (
                            <p className="text-muted-foreground font-semibold mt-0.5">{t('noPhone')}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Photos grid attachment if exists */}
                    {selectedRequest.photo_urls && selectedRequest.photo_urls.filter(Boolean).length > 0 && (
                      <div className="rounded-2xl border border-border bg-muted/20 p-3.5 space-y-2.5">
                        <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                          {t('photosLabel')}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedRequest.photo_urls.filter(Boolean).map((url, idx) => (
                            <div key={idx} className="relative aspect-video rounded-xl bg-muted border border-border overflow-hidden group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={`Photo ${idx + 1}`} className="object-cover w-full h-full hover:scale-105 transition-transform duration-300" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata Coordinates */}
                    <div className="rounded-2xl border border-border bg-muted/20 p-3.5 text-xs">
                      <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                        <MapPin size={12} className="text-rose-400" /> {t('coordsLabel')}
                      </p>
                      <p className="font-semibold text-foreground">{selectedRequest.address || t('hiddenAddress')}</p>
                      {selectedRequest.location && selectedRequest.location.lat != null && selectedRequest.location.lng != null && (
                        <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                          <span>{t('latitudeLabel', { lat: selectedRequest.location.lat.toFixed(5) })}</span>
                          <span>{t('longitudeLabel', { lng: selectedRequest.location.lng.toFixed(5) })}</span>
                        </div>
                      )}
                    </div>

                    {/* Operational check action controller */}
                    <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                      <p className="text-xs font-bold text-foreground flex items-center gap-2">
                        <Sparkles size={14} className="text-rose-400 animate-pulse" />
                        {t('dispatchTitle')}
                      </p>
                      
                      {selectedRequest.status === 'pending' && teams.length > 0 && (
                        <Select value={selectedTeamId} onValueChange={(val) => setSelectedTeamId(val ?? '')}>
                          <SelectTrigger className="w-full h-9 rounded-xl border-border bg-background/50 text-xs font-semibold focus:ring-rose-500 text-foreground mb-2">
                            <SelectValue placeholder={t('selectTeamPlaceholder')}>
                              {teams.find(team => String(team.id) === selectedTeamId)?.name}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="border-border">
                            {teams.map(team => (
                              <SelectItem key={team.id} value={String(team.id)} className="text-xs font-semibold">
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      <div className="flex gap-2">
                        {selectedRequest.status === 'pending' && (
                          <Button
                            size="sm"
                            className="flex-1 h-9 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
                            onClick={() => handleAssign(selectedRequest.id)}
                            disabled={actionLoading === selectedRequest.id}
                          >
                            <CheckSquare size={13} className="mr-1" />
                            {actionLoading === selectedRequest.id ? t('saving') : t('acceptBtn')}
                          </Button>
                        )}
                        {selectedRequest.status === 'assigned' && (
                          <Button
                            size="sm"
                            className="flex-1 h-9 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                            onClick={() => handleResolve(selectedRequest.id)}
                            disabled={actionLoading === selectedRequest.id}
                          >
                            <CheckSquare size={13} className="mr-1" />
                            {actionLoading === selectedRequest.id ? t('saving') : t('completeBtn')}
                          </Button>
                        )}
                        {selectedRequest.location && selectedRequest.location.lat != null && selectedRequest.location.lng != null && !isTerminalStatus(selectedRequest.status) && (
                          <Button
                            asChild
                            className="flex-1 h-9 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 border border-border text-foreground"
                          >
                            <Link href={getMapHref(selectedRequest)}>
                              <Navigation size={13} className="mr-1" />
                              {t('viewMapBtn')}
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-transparent">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-muted-foreground shadow-inner">
                  <HeartPulse size={24} />
                </div>
                <h3 className="text-sm font-bold text-foreground">{t('noRequestSelected')}</h3>
                <p className="mt-1.5 max-w-xs text-xs text-muted-foreground font-semibold">
                  {t('noRequestSelectedDesc')}
                </p>
              </div>
            )}
          </Card>
        </div>
      </section>
    </main>
  );
}
