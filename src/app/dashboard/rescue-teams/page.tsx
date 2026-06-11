'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Shield, MapPin, Phone, Users, Truck, CheckCircle,
  Search, Plus, Activity, ChevronLeft,
  ChevronRight, X, Navigation, Award
} from 'lucide-react';
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

interface RescueTeam {
  id: number;
  name: string;
  code?: string;
  type?: string;
  team_type?: string;
  team_type_label?: string;
  status: 'available' | 'busy' | 'offline';
  members_count?: number;
  personnel_count?: number;
  vehicles_count?: number;
  vehicle_count?: number;
  current_location?: string;
  current_latitude?: number | string | null;
  current_longitude?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  location?: { lat?: number | string | null; lng?: number | string | null } | null;
  active_requests?: number;
  active_missions?: number;
  completed_requests?: number;
  phone?: string;
  rating?: number;
  district?: { id: number; name: string } | null;
  specializations?: string[];
  equipment?: string[];
  members?: Array<{ id: number; name?: string; role?: string; is_available?: boolean }>;
  last_location_update?: string;
}

export default function RescueTeamsPage() {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tEnum = useTranslations('enums');

  const [teams, setTeams] = React.useState<RescueTeam[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [selectedTeam, setSelectedTeam] = React.useState<RescueTeam | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 6;

  const fetchTeams = React.useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/rescue-teams', { params });
      setTeams(res.data?.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    void fetchTeams();
  }, [fetchTeams]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available': return { color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/20 bg-emerald-500/10', label: tEnum('teamStatus.available'), bg: 'bg-emerald-500/10' };
      case 'busy': return { color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/25 bg-amber-500/10', label: tEnum('teamStatus.busy'), bg: 'bg-amber-500/10' };
      case 'offline': return { color: 'bg-zinc-500', text: 'text-zinc-400', border: 'border-white/[0.08] bg-zinc-500/10', label: tEnum('teamStatus.offline'), bg: 'bg-zinc-500/10' };
      default: return { color: 'bg-zinc-500', text: 'text-zinc-400', border: 'border-white/[0.08] bg-zinc-500/10', label: tEnum.has(`teamStatus.${status}`) ? tEnum(`teamStatus.${status}`) : status, bg: 'bg-zinc-500/10' };
    }
  };

  const getTypeIcon = (type?: string) => {
    if (!type) return '🛡️';
    switch (type.toLowerCase()) {
      case 'fire': return '🚒';
      case 'medical': return '🚑';
      case 'flood': return '🚤';
      case 'search': return '🔍';
      default: return '🛡️';
    }
  };

  const getTeamType = (team: RescueTeam) => {
    const rawType = (team.team_type || team.type || 'rescue').toLowerCase();
    switch (rawType) {
      case 'medical': return t('rescueTeams.typeMedical');
      case 'fire': return t('rescueTeams.typeFire');
      case 'military': return t('rescueTeams.typeMilitary');
      case 'volunteer': return t('rescueTeams.typeVolunteer');
      case 'special': return t('rescueTeams.typeSpecial');
      default: return team.team_type_label || team.team_type || team.type || t('rescueTeams.typeVolunteer');
    }
  };
  const getMemberCount = (team: RescueTeam) => team.personnel_count ?? team.members_count ?? team.members?.length ?? 0;
  const getVehicleCount = (team: RescueTeam) => team.vehicle_count ?? team.vehicles_count ?? 0;
  const getActiveCount = (team: RescueTeam) => team.active_missions ?? team.active_requests ?? 0;
  
  const getFallbackCoords = (team: RescueTeam) => {
    const key = `${team.code ?? ''} ${team.name ?? ''} ${team.district?.name ?? ''}`.toLowerCase();
    if (key.includes('liên chiểu') || key.includes('lien chieu') || key.includes('rescue-001')) return { lat: 16.0698, lng: 108.1467 };
    if (key.includes('cẩm lệ') || key.includes('cam le') || key.includes('rescue-002')) return { lat: 16.0089, lng: 108.1876 };
    if (key.includes('y tế') || key.includes('hai châu') || key.includes('hải châu') || key.includes('rescue-003')) return { lat: 16.0678, lng: 108.2208 };
    if (key.includes('hòa vang') || key.includes('hoà vang') || key.includes('hoa vang') || key.includes('rescue-004')) return { lat: 15.9801, lng: 108.1156 };
    if (key.includes('thanh khê') || key.includes('thanh khe') || key.includes('rescue-005')) return { lat: 16.0589, lng: 108.1934 };
    return null;
  };

  const getTeamLat = (team: RescueTeam) => {
    const value = team.location?.lat ?? team.current_latitude ?? team.latitude ?? getFallbackCoords(team)?.lat;
    const lat = value === null || value === undefined ? undefined : Number(value);
    return Number.isFinite(lat) ? lat : undefined;
  };

  const getTeamLng = (team: RescueTeam) => {
    const value = team.location?.lng ?? team.current_longitude ?? team.longitude ?? getFallbackCoords(team)?.lng;
    const lng = value === null || value === undefined ? undefined : Number(value);
    return Number.isFinite(lng) ? lng : undefined;
  };

  const handleAddTeam = () => {
    toast.info(t('rescueTeams.toastNoApi'));
  };

  const handleViewDetail = async (team: RescueTeam) => {
    setSelectedTeam(team);
    setDetailLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.get(`/rescue-teams/${team.id}`);
      setSelectedTeam(res.data?.data ?? team);
    } catch {
      toast.error(t('rescueTeams.toastDetailError'));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleTrackTeam = (team: RescueTeam) => {
    const lat = getTeamLat(team);
    const lng = getTeamLng(team);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error(t('rescueTeams.toastNoGps'));
      return;
    }

    const params = new URLSearchParams({
      teamId: String(team.id),
      teamName: team.name,
      lat: String(lat),
      lng: String(lng),
    });
    router.push(`/dashboard?${params.toString()}`);
  };

  const filteredTeams = React.useMemo(() => {
    return teams.filter(team =>
      team.name.toLowerCase().includes(search.toLowerCase()) ||
      team.current_location?.toLowerCase().includes(search.toLowerCase()) ||
      team.district?.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [teams, search]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  React.useEffect(() => {
    if (filteredTeams.length > 0 && !selectedTeam) {
      setSelectedTeam(filteredTeams[0]);
    }
  }, [filteredTeams, selectedTeam]);

  const stats = React.useMemo(() => {
    return {
      total: teams.length,
      available: teams.filter(t => t.status === 'available').length,
      busy: teams.filter(t => t.status === 'busy').length,
      offline: teams.filter(t => t.status === 'offline').length,
    };
  }, [teams]);

  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const paginatedTeams = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTeams.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTeams, currentPage]);

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

  const getStatusFilterLabel = (val: string) => {
    switch (val) {
      case 'all': return t('rescueTeams.allStatuses');
      case 'available': return tEnum('teamStatus.available');
      case 'busy': return tEnum('teamStatus.busy');
      case 'offline': return tEnum('teamStatus.offline');
      default: return t('rescueTeams.statusPlaceholder');
    }
  };

  return (
    <main className="relative flex w-full flex-col gap-6 px-6 py-6 min-h-0 overflow-hidden">
      {/* Background blurs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/[0.04] dark:bg-blue-500/[0.06] rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-indigo-500/[0.03] dark:bg-indigo-500/[0.05] rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Container */}
      <section className="relative rounded-3xl border border-border/50 bg-card/45 backdrop-blur-md p-5 shadow-sm md:p-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3.5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-blue-500/20 bg-blue-500/5 px-2.5 py-0.5 text-[10px] font-black uppercase text-blue-400 tracking-wider">
                {t('rescueTeams.badge')}
              </Badge>
              <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold">
                {t('rescueTeams.activeCountLabel', { available: stats.available, total: stats.total })}
              </Badge>
            </div>
            <h1 className="flex items-center gap-3.5 text-2xl font-black tracking-tight text-foreground md:text-3xl">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-all duration-300">
                <Shield size={21} className="animate-pulse" />
              </span>
              {t('rescueTeams.title')}
            </h1>
            <p className="mt-2 text-xs font-semibold text-muted-foreground leading-relaxed">
              {t('rescueTeams.desc')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Button
              className="h-10 gap-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 border-none"
              onClick={handleAddTeam}
            >
              <Plus size={16} />
              {t('rescueTeams.registerNew')}
            </Button>
          </div>
        </div>

        {/* Statistical Metrics Grid */}
        <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: t('rescueTeams.statsTotal'), value: stats.total, color: 'border-blue-500/20 bg-blue-500/5 text-blue-500' },
            { label: t('rescueTeams.statsReady'), value: stats.available, color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500' },
            { label: t('rescueTeams.statsBusy'), value: stats.busy, color: 'border-amber-500/20 bg-amber-500/5 text-amber-500' },
            { label: t('rescueTeams.statsOffline'), value: stats.offline, color: 'border-zinc-500/20 bg-zinc-500/5 text-zinc-500' }
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
              placeholder={t('rescueTeams.searchPlaceholder')}
              className="h-10 rounded-xl pl-9 pr-8 border-border focus-visible:ring-blue-500 bg-background/50 text-xs font-semibold text-foreground"
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
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-2 pb-1">{t('rescueTeams.teamStatusLabel')}</span>
            <Select value={statusFilter} onValueChange={(val) => { if (val) setStatusFilter(val); }}>
              <SelectTrigger className="w-full h-9 rounded-xl border-border bg-background/50 text-xs font-semibold focus:ring-blue-500 text-foreground">
                <SelectValue>
                  {statusFilter === 'all' ? t('rescueTeams.allStatuses') : getStatusFilterLabel(statusFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-border">
                <SelectItem value="all" className="text-xs font-semibold">{t('rescueTeams.allStatuses')}</SelectItem>
                <SelectItem value="available" className="text-xs font-semibold">🟢 {tEnum('teamStatus.available')}</SelectItem>
                <SelectItem value="busy" className="text-xs font-semibold">🟡 {tEnum('teamStatus.busy')}</SelectItem>
                <SelectItem value="offline" className="text-xs font-semibold">⚫ {tEnum('teamStatus.offline')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(statusFilter !== 'all' || search) && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 rounded-xl font-bold border-dashed border-blue-500/40 text-blue-400 hover:bg-blue-500/10 text-xs"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
            >
              <X className="mr-1.5" size={13} /> {t('rescueTeams.clearFilter')}
            </Button>
          )}
        </Card>

        {/* Master-Detail Split Grid */}
        <div className="grid min-h-[580px] gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
          {/* Master List Card */}
          <Card className="overflow-hidden border-border/50 bg-card/45 backdrop-blur-md shadow-sm flex flex-col">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5 bg-muted/10">
              <h2 className="font-black text-sm tracking-tight">{t('rescueTeams.listTitle')}</h2>
              <Badge variant="outline" className="border-blue-500/20 bg-blue-500/5 text-blue-400 text-[10px] font-bold flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                Live GPS Active
              </Badge>
            </div>

            <ScrollArea className="flex-1 h-[580px] custom-scroll bg-transparent">
              {loading ? (
                <div className="space-y-4 p-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 bg-muted/30 border border-border/50 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : filteredTeams.length === 0 ? (
                <div className="flex min-h-[460px] flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-border bg-muted/40 text-muted-foreground shadow-inner">
                    <Shield size={28} />
                  </div>
                  <h3 className="text-base font-black tracking-tight text-foreground">{t('rescueTeams.noTeams')}</h3>
                  <p className="mt-2.5 max-w-xs text-xs font-semibold leading-relaxed text-muted-foreground">
                    {t('rescueTeams.noTeamsDesc')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                  {paginatedTeams.map((team) => {
                    const status = getStatusConfig(team.status);
                    const active = selectedTeam?.id === team.id;

                    return (
                      <div
                        key={team.id}
                        onClick={() => handleViewDetail(team)}
                        className={cn(
                          'relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer select-none bg-card/10',
                          active
                            ? 'border-blue-500/35 bg-blue-500/[0.04] dark:bg-blue-500/[0.06] ring-1 ring-blue-500/20'
                            : 'border-border/60 hover:border-border hover:bg-muted/10',
                        )}
                      >
                        {active && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l" />
                        )}

                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0 flex items-start gap-2.5">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/5 text-xl">
                              {getTypeIcon(team.team_type || team.type)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs font-extrabold text-foreground truncate">{team.name}</h3>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate font-semibold">
                                <MapPin size={10} />
                                {team.current_location || team.district?.name || t('rescueTeams.locationUpdating')}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn("text-[8px] h-4 font-black uppercase tracking-wider gap-1 shrink-0", status.border, status.text)}>
                            <span className={cn("size-1 rounded-full", status.color)} />
                            {status.label}
                          </Badge>
                        </div>

                        {/* Quick metrics indicators */}
                        <div className="grid grid-cols-2 gap-2 mt-2 mb-1.5">
                          <div className="p-2 bg-muted/20 border border-border/50 rounded-xl flex flex-col justify-between">
                            <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wide">{t('rescueTeams.personnel')}</span>
                            <span className="font-extrabold text-xs text-foreground mt-1 flex items-center gap-1">
                              <Users size={12} className="text-muted-foreground" />
                              {t('rescueTeams.peopleCount', { count: getMemberCount(team) })}
                            </span>
                          </div>
                          <div className="p-2 bg-muted/20 border border-border/50 rounded-xl flex flex-col justify-between">
                            <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wide">{t('rescueTeams.vehiclesLabel')}</span>
                            <span className="font-extrabold text-xs text-foreground mt-1 flex items-center gap-1">
                              <Truck size={12} className="text-muted-foreground" />
                              {t('rescueTeams.vehiclesCount', { count: getVehicleCount(team) })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 text-[10px] font-bold text-muted-foreground border-t border-border/50 pt-2.5">
                          <span className="text-[9px] uppercase tracking-wider opacity-80">{getTeamType(team)}</span>
                          <span className="text-[9px] text-amber-400 font-extrabold flex items-center gap-1">
                            <Activity size={10} />
                            {t('rescueTeams.casesCount', { count: getActiveCount(team) })}
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
                  {t('rescueTeams.paginationInfo', {
                    start: Math.min(filteredTeams.length, (currentPage - 1) * itemsPerPage + 1),
                    end: Math.min(filteredTeams.length, currentPage * itemsPerPage),
                    total: filteredTeams.length
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
                      className={cn("size-8 rounded-lg p-0 text-xs font-bold border-border hover:bg-muted", currentPage === num && "bg-blue-600 hover:bg-blue-500 text-white border-none")}
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
            <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-blue-500/20 via-blue-500 to-blue-500/20" />

            {selectedTeam ? (
              <div className="flex flex-col h-full">
                {/* Panel Header */}
                <div className="border-b border-border/50 px-5 py-4 flex items-center justify-between bg-muted/10">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                      Team ID: #{String(selectedTeam.id).padStart(4, '0')}
                    </p>
                    <h2 className="font-black text-sm tracking-tight mt-0.5 truncate text-foreground">
                      {t('rescueTeams.detailTitle')}
                    </h2>
                  </div>
                  <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-wider gap-1", getStatusConfig(selectedTeam.status).border, getStatusConfig(selectedTeam.status).text)}>
                    {getStatusConfig(selectedTeam.status).label}
                  </Badge>
                </div>

                {/* Detail Content */}
                <ScrollArea className="flex-1 custom-scroll p-5">
                  {detailLoading ? (
                    <div className="space-y-4">
                      <div className="h-16 bg-muted/20 border border-border/50 rounded-2xl animate-pulse" />
                      <div className="h-28 bg-muted/20 border border-border/50 rounded-2xl animate-pulse" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Big Title & Icon */}
                      <div className="flex items-start gap-4">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-blue-500/25 bg-blue-500/5 text-3xl shadow-md">
                          {getTypeIcon(selectedTeam.team_type || selectedTeam.type)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-black leading-snug text-foreground">
                            {selectedTeam.name}
                          </h3>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="text-[10px] font-extrabold border uppercase tracking-wider border-blue-500/20 bg-blue-500/5 text-blue-400">
                              {t('rescueTeams.teamTypeLabel', { type: getTeamType(selectedTeam) })}
                            </Badge>
                            {selectedTeam.code && (
                              <Badge variant="outline" className="text-[10px] font-extrabold border uppercase tracking-wider border-border bg-muted/30 text-foreground">
                                {t('rescueTeams.teamCodeLabel', { code: selectedTeam.code })}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mission stats grid */}
                      <div className="grid grid-cols-2 gap-3 text-xs font-bold text-muted-foreground">
                        <div className="rounded-xl border border-border bg-muted/20 p-3 flex flex-col justify-between">
                          <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                            <Activity size={12} className="text-amber-500" /> {t('rescueTeams.activeMissions')}
                          </span>
                          <span className="text-xl font-black text-foreground mt-2">
                            {t('rescueTeams.casesCount', { count: getActiveCount(selectedTeam) })}
                          </span>
                        </div>

                        <div className="rounded-xl border border-border bg-muted/20 p-3 flex flex-col justify-between">
                          <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                            <CheckCircle size={12} className="text-emerald-500" /> {t('rescueTeams.completedMissions')}
                          </span>
                          <span className="text-xl font-black text-foreground mt-2">
                            {t('rescueTeams.casesCount', { count: selectedTeam.completed_requests ?? 0 })}
                          </span>
                        </div>
                      </div>

                      {/* GPS Coordinates description */}
                      <div className="rounded-2xl border border-border bg-muted/20 p-3.5 text-xs space-y-3">
                        <div className="flex items-start gap-2.5">
                          <MapPin size={14} className="mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="font-semibold text-foreground">{t('rescueTeams.currentArea')}</p>
                            <p className="text-muted-foreground mt-0.5">{selectedTeam.current_location || selectedTeam.district?.name || t('rescueTeams.noDescription')}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Phone size={14} className="text-muted-foreground" />
                          {selectedTeam.phone ? (
                            <a href={`tel:${selectedTeam.phone}`} className="text-blue-400 font-bold hover:underline">
                              {selectedTeam.phone}
                            </a>
                          ) : (
                            <span className="text-muted-foreground font-semibold">{t('rescueTeams.noContact')}</span>
                          )}
                        </div>

                        {selectedTeam.location?.lat && selectedTeam.location?.lng && (
                          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                            <span>{t('rescueTeams.latitude')}: <strong className="text-foreground">{Number(selectedTeam.location.lat).toFixed(5)}</strong></span>
                            <span>{t('rescueTeams.longitude')}: <strong className="text-foreground">{Number(selectedTeam.location.lng).toFixed(5)}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Specialization list */}
                      {selectedTeam.specializations && selectedTeam.specializations.length > 0 && (
                        <div className="rounded-2xl border border-border bg-muted/20 p-3.5">
                          <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Award size={13} /> {t('rescueTeams.specializationLabel')}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedTeam.specializations.map((spec, idx) => (
                              <Badge key={idx} variant="outline" className="border-blue-500/20 bg-blue-500/5 text-blue-400 text-[10px] font-bold">
                                {tEnum.has(`specialization.${spec}`) ? tEnum(`specialization.${spec}`) : spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Member listing availability */}
                      {selectedTeam.members && selectedTeam.members.length > 0 && (
                        <div className="rounded-2xl border border-border bg-muted/20 p-3.5">
                          <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Users size={13} /> {t('rescueTeams.membersLabel')}
                          </p>
                          <div className="space-y-2.5">
                            {selectedTeam.members.map((member) => (
                              <div key={member.id} className="flex items-center justify-between text-xs border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                <span className="font-semibold text-foreground">{member.name || t('rescueTeams.member')}</span>
                                <Badge className={cn("text-[9px] font-bold", member.is_available ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border border-border")}>
                                  {member.role || (member.is_available ? tEnum('teamStatus.available') : t('rescueTeams.notAvailable'))}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Map Navigation button */}
                      <div className="flex gap-2.5">
                        <Button
                          className="w-full gap-2 rounded-xl h-10 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white"
                          onClick={() => handleTrackTeam(selectedTeam)}
                        >
                           <Navigation size={14} />
                           {t('rescueTeams.viewGpsRoute')}
                         </Button>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-transparent">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-muted-foreground shadow-inner">
                  <Shield size={24} />
                </div>
                <h3 className="text-sm font-bold text-foreground">{t('rescueTeams.noTeamSelected')}</h3>
                <p className="mt-1.5 max-w-xs text-xs text-muted-foreground font-semibold">
                  {t('rescueTeams.noTeamSelectedDesc')}
                </p>
              </div>
            )}
          </Card>
        </div>
      </section>
    </main>
  );
}
