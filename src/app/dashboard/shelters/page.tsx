'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Home, MapPin, Phone, Users, Search,
  Plus, Waves, Clock, Package,
  ChevronLeft, ChevronRight, X, Sparkles, Navigation
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface Shelter {
  id: number;
  name: string;
  code?: string;
  address: string;
  district?: { id: number; name: string } | string | null;
  shelter_type?: string;
  capacity: number;
  current_occupancy: number;
  available_beds?: number;
  occupancy_percent?: number;
  status: 'open' | 'full' | 'closed' | 'preparing' | 'available';
  status_label?: string;
  amenities?: string[];
  facilities?: string[];
  contact_phone?: string;
  contact_name?: string;
  opening_hours?: string;
  is_flood_safe?: boolean;
  flood_depth_tolerance_m?: number | string;
  location?: { lat?: number | string | null; lng?: number | string | null } | null;
  latitude?: number;
  longitude?: number;
  distance?: number;
  rating?: number;
  last_updated?: string;
  supply_stocks?: Array<{
    supply?: { id: number; name: string; category?: string; unit?: string };
    quantity?: number;
    available_quantity?: number;
  }>;
}

export default function SheltersPage() {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tEnum = useTranslations('enums');
  const [shelters, setShelters] = React.useState<Shelter[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [selectedShelter, setSelectedShelter] = React.useState<Shelter | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [occupancyUpdateValue, setOccupancyUpdateValue] = React.useState('1');
  const [isUpdatingOccupancy, setIsUpdatingOccupancy] = React.useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 6;

  const [createForm, setCreateForm] = React.useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    capacity: '',
    current_occupancy: '0',
    status: 'open',
    shelter_type: 'community_center',
    facilities: 'food, water, medical',
    contact_phone: '',
    contact_name: '',
    opening_hours: '24/7',
    is_flood_safe: true,
  });

  const fetchShelters = React.useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/shelters', { params });
      setShelters(res.data?.data ?? []);
    } catch (e) {
      console.error(e);
      toast.error(t('shelters.toastListError'));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    void fetchShelters();
  }, [fetchShelters]);

  const getStatusConfig = (status: string, occupancy: number, capacity: number) => {
    const occupancyRate = capacity > 0 ? (occupancy / capacity) * 100 : 0;
    if (status === 'closed') return { color: 'bg-zinc-500', text: 'text-zinc-500 dark:text-zinc-400', border: 'border-zinc-500/20 bg-zinc-500/10', bg: 'bg-zinc-500/10', label: t('shelters.statusClosed') };
    if (status === 'preparing') return { color: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20 bg-blue-500/10', bg: 'bg-blue-500/10', label: t('shelters.statusPreparing') };
    if (status === 'full') return { color: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20 bg-rose-500/10', bg: 'bg-rose-500/10', label: t('shelters.statusFull') };
    if (occupancyRate >= 90) return { color: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20 bg-rose-500/10', bg: 'bg-rose-500/10', label: t('shelters.statusNearlyFull') };
    if (occupancyRate >= 70) return { color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20 bg-amber-500/10', bg: 'bg-amber-500/10', label: t('shelters.statusFewSpots') };
    return { color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20 bg-emerald-500/10', bg: 'bg-emerald-500/10', label: t('shelters.statusAvailable') };
  };

  const getDistrictName = (shelter: Shelter) => {
    if (!shelter.district) return '';
    return typeof shelter.district === 'string' ? shelter.district : shelter.district.name;
  };

  const getFacilities = (shelter: Shelter) => (
    Array.isArray(shelter.facilities) ? shelter.facilities : Array.isArray(shelter.amenities) ? shelter.amenities : []
  );

  const getLat = (shelter: Shelter) => {
    const value = shelter.location?.lat ?? shelter.latitude;
    return value === null || value === undefined ? undefined : Number(value);
  };

  const getLng = (shelter: Shelter) => {
    const value = shelter.location?.lng ?? shelter.longitude;
    return value === null || value === undefined ? undefined : Number(value);
  };

  const handleCreateShelter = async () => {
    if (!createForm.name || !createForm.address || !createForm.latitude || !createForm.longitude || !createForm.capacity) {
      toast.error(t('shelters.toastValidationError'));
      return;
    }

    const latitude = Number(createForm.latitude);
    const longitude = Number(createForm.longitude);
    const capacity = Number(createForm.capacity);
    const occupancy = Number(createForm.current_occupancy || 0);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(capacity)) {
      toast.error(t('shelters.toastInvalidCoords'));
      return;
    }

    setCreating(true);
    try {
      const api = (await import('@/lib/api')).default;
      await api.post('/shelters', {
        name: createForm.name,
        address: createForm.address,
        latitude,
        longitude,
        capacity,
        current_occupancy: Number.isFinite(occupancy) ? occupancy : 0,
        status: createForm.status,
        shelter_type: createForm.shelter_type,
        facilities: createForm.facilities.split(',').map((item) => item.trim()).filter(Boolean),
        contact_phone: createForm.contact_phone || undefined,
        contact_name: createForm.contact_name || undefined,
        opening_hours: createForm.opening_hours || undefined,
        is_flood_safe: createForm.is_flood_safe,
      });
      toast.success(t('shelters.toastCreateSuccess'));
      setIsCreateOpen(false);
      setCreateForm({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        capacity: '',
        current_occupancy: '0',
        status: 'open',
        shelter_type: 'community_center',
        facilities: 'food, water, medical',
        contact_phone: '',
        contact_name: '',
        opening_hours: '24/7',
        is_flood_safe: true,
      });
      await fetchShelters();
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { message?: unknown } } })?.response;
      toast.error(typeof response?.data?.message === 'string' ? response.data.message : t('shelters.toastCreateError'));
    } finally {
      setCreating(false);
    }
  };

  const handleViewDetail = async (shelter: Shelter) => {
    setSelectedShelter(shelter);
    setDetailLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.get(`/shelters/${shelter.id}`);
      setSelectedShelter(res.data?.data ?? shelter);
    } catch {
      toast.error(t('shelters.toastDetailError'));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateOccupancy = async (action: 'add' | 'remove' | 'set', value: number) => {
    if (!selectedShelter) return;
    setIsUpdatingOccupancy(true);
    try {
      const api = (await import('@/lib/api')).default;
      const payload = action === 'set' ? { action, occupancy: value } : { action, count: value };
      const res = await api.put(`/shelters/${selectedShelter.id}/occupancy`, payload);
      toast.success(t('shelters.toastUpdateSuccess'));
      const updated = res.data?.data ?? selectedShelter;
      setSelectedShelter(updated);
      setShelters(prev => prev.map(s => s.id === updated.id ? updated : s));
      setOccupancyUpdateValue('1');
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { message?: unknown } } })?.response;
      toast.error(typeof response?.data?.message === 'string' ? response.data.message : t('shelters.toastUpdateError'));
    } finally {
      setIsUpdatingOccupancy(false);
    }
  };

  const handleDirections = (shelter: Shelter) => {
    const lat = getLat(shelter);
    const lng = getLng(shelter);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error(t('shelters.toastNoCoords'));
      return;
    }

    const params = new URLSearchParams({
      shelterId: String(shelter.id),
      shelterName: shelter.name,
      lat: String(lat),
      lng: String(lng),
      shelterAddress: shelter.address || getDistrictName(shelter) || '',
      shelterStatus: shelter.status_label || getStatusConfig(shelter.status, shelter.current_occupancy, shelter.capacity).label,
      shelterCapacity: t('shelters.spotsCount', { occupancy: shelter.current_occupancy, capacity: shelter.capacity }),
    });

    router.push(`/dashboard?${params.toString()}`);
  };

  const filteredShelters = React.useMemo(() => {
    return shelters.filter(shelter =>
      shelter.name.toLowerCase().includes(search.toLowerCase()) ||
      shelter.address.toLowerCase().includes(search.toLowerCase()) ||
      getDistrictName(shelter).toLowerCase().includes(search.toLowerCase())
    );
  }, [shelters, search]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  React.useEffect(() => {
    if (filteredShelters.length > 0 && !selectedShelter) {
      setSelectedShelter(filteredShelters[0]);
    }
  }, [filteredShelters, selectedShelter]);

  const stats = React.useMemo(() => {
    return {
      total: shelters.length,
      available: shelters.filter(s => s.status !== 'closed' && s.status !== 'full').length,
      totalCapacity: shelters.reduce((acc, s) => acc + s.capacity, 0),
      totalOccupancy: shelters.reduce((acc, s) => acc + s.current_occupancy, 0),
    };
  }, [shelters]);

  const occupancyPercentage = stats.totalCapacity > 0
    ? Math.round((stats.totalOccupancy / stats.totalCapacity) * 100)
    : 0;

  const totalPages = Math.ceil(filteredShelters.length / itemsPerPage);
  const paginatedShelters = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredShelters.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredShelters, currentPage]);

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
      case 'all': return t('shelters.allStatuses');
      case 'open': return tEnum('shelterStatus.open');
      case 'preparing': return t('shelters.statusPreparing');
      case 'full': return tEnum('shelterStatus.full');
      case 'closed': return tEnum('shelterStatus.closed');
      default: return t('shelters.statusPlaceholder');
    }
  };

  return (
    <main className="relative flex w-full flex-col gap-6 px-6 py-6 min-h-0 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/[0.04] dark:bg-indigo-500/[0.06] rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-purple-500/[0.03] dark:bg-purple-500/[0.05] rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Container */}
      <section className="relative rounded-3xl border border-border/50 bg-card/45 backdrop-blur-md p-5 shadow-sm md:p-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3.5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-indigo-500/20 bg-indigo-500/5 px-2.5 py-0.5 text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                {t('shelters.badge')}
              </Badge>
              <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold">
                {t('shelters.activeCountLabel', { available: stats.available, total: stats.total })}
              </Badge>
            </div>
            <h1 className="flex items-center gap-3.5 text-2xl font-black tracking-tight text-foreground md:text-3xl">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transition-all duration-300">
                <Home size={21} className="animate-pulse" />
              </span>
              {t('shelters.title')}
            </h1>
            <p className="mt-2 text-xs font-semibold text-muted-foreground leading-relaxed">
              {t('shelters.desc')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Button
              className="h-10 gap-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 border-none"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={16} />
              {t('shelters.addNew')}
            </Button>
          </div>
        </div>

        {/* Statistical Metrics Grid */}
        <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-5">
          {[
            { label: t('shelters.statsTotal'), value: stats.total, color: 'border-blue-500/20 bg-blue-500/5 text-blue-500' },
            { label: t('shelters.statsReady'), value: stats.available, color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500' },
            { label: t('shelters.statsOccupants'), value: t('shelters.peopleSuffix', { count: stats.totalOccupancy.toLocaleString() }), color: 'border-amber-500/20 bg-amber-500/5 text-amber-500' },
            { label: t('shelters.statsMaxCapacity'), value: t('shelters.peopleSuffix', { count: stats.totalCapacity.toLocaleString() }), color: 'border-purple-500/20 bg-purple-500/5 text-purple-505' },
            { label: t('shelters.statsUsageRate'), value: `${occupancyPercentage}%`, color: 'border-rose-500/20 bg-rose-500/5 text-rose-500' }
          ].map((item, idx) => (
            <Card key={idx} className={cn("bg-background/40 border-border/40 p-4 shadow-sm hover:shadow-md transition-all duration-300", item.color)}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</p>
              <p className="mt-2 text-2xl font-black">{item.value}</p>
            </Card>
          ))}
        </div>

        {/* Overall Capacity Bar */}
        <div className="mt-5 rounded-2xl border border-border/40 bg-background/25 p-4">
          <div className="flex justify-between items-center text-xs font-bold text-muted-foreground mb-2">
            <span className="flex items-center gap-1.5"><Waves size={14} className="text-indigo-400" /> {t('shelters.mapTitle')}</span>
            <span>{t('shelters.spotsCount', { occupancy: stats.totalOccupancy, capacity: stats.totalCapacity })}</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
        </div>
      </section>

      {/* Main Multi-Column Panel */}
      <section className="grid min-h-0 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Left Filters Sidebar Card */}
        <Card className="h-fit border-border/50 bg-card/45 backdrop-blur-md p-4 shadow-sm flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <Input
              placeholder={t('shelters.searchPlaceholder')}
              className="h-10 rounded-xl pl-9 pr-8 border-border focus-visible:ring-indigo-500 bg-background/50 text-xs font-semibold text-foreground"
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
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-2 pb-1">{t('shelters.filterLabel')}</span>
            <Select value={statusFilter} onValueChange={(val) => { if (val) setStatusFilter(val); }}>
              <SelectTrigger className="w-full h-9 rounded-xl border-border bg-background/50 text-xs font-semibold focus:ring-indigo-500 text-foreground">
                <SelectValue>
                  {statusFilter === 'all' ? t('shelters.allStatuses') : getStatusFilterLabel(statusFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-border">
                <SelectItem value="all" className="text-xs font-semibold">{t('shelters.allStatuses')}</SelectItem>
                <SelectItem value="open" className="text-xs font-semibold">🟢 {tEnum('shelterStatus.open')}</SelectItem>
                <SelectItem value="preparing" className="text-xs font-semibold">🟡 {t('shelters.statusPreparing')}</SelectItem>
                <SelectItem value="full" className="text-xs font-semibold">🔴 {tEnum('shelterStatus.full')}</SelectItem>
                <SelectItem value="closed" className="text-xs font-semibold">⚫ {tEnum('shelterStatus.closed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(statusFilter !== 'all' || search) && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 rounded-xl font-bold border-dashed border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 text-xs"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
            >
              <X className="mr-1.5" size={13} /> {t('shelters.clearFilter')}
            </Button>
          )}
        </Card>

        {/* Master-Detail Container Split Grid */}
        <div className="grid min-h-[580px] gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
          {/* Master List Card */}
          <Card className="overflow-hidden border-border/50 bg-card/45 backdrop-blur-md shadow-sm flex flex-col">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5 bg-muted/10">
              <h2 className="font-black text-sm tracking-tight">{t('shelters.listTitle')}</h2>
              <Badge variant="outline" className="border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-[10px] font-bold flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-indigo-500 animate-pulse" />
                {t('shelters.realtimeLabel')}
              </Badge>
            </div>

            <ScrollArea className="flex-1 h-[580px] custom-scroll bg-transparent">
              {loading ? (
                <div className="space-y-4 p-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 bg-muted/30 border border-border/50 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : filteredShelters.length === 0 ? (
                <div className="flex min-h-[460px] flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-border bg-muted/40 text-muted-foreground shadow-inner">
                    <Home size={28} />
                  </div>
                  <h3 className="text-base font-black tracking-tight text-foreground">{t('shelters.noShelters')}</h3>
                  <p className="mt-2.5 max-w-xs text-xs font-semibold leading-relaxed text-muted-foreground">
                    {t('shelters.noSheltersDesc')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                  {paginatedShelters.map((shelter) => {
                    const status = getStatusConfig(shelter.status, shelter.current_occupancy, shelter.capacity);
                    const occupancyRate = shelter.capacity > 0 ? Math.round((shelter.current_occupancy / shelter.capacity) * 100) : 0;
                    const active = selectedShelter?.id === shelter.id;

                    return (
                      <div
                        key={shelter.id}
                        onClick={() => handleViewDetail(shelter)}
                        className={cn(
                          'relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer select-none bg-card/10',
                          active
                            ? 'border-indigo-500/35 bg-indigo-500/[0.04] dark:bg-indigo-500/[0.06] ring-1 ring-indigo-500/20'
                            : 'border-border/60 hover:border-border hover:bg-muted/10',
                        )}
                      >
                        {active && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l" />
                        )}

                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0 flex items-start gap-2.5">
                            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-lg")}>
                              <Home size={16} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs font-extrabold text-foreground truncate">{shelter.name}</h3>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate font-semibold">
                                <MapPin size={10} />
                                {shelter.address}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn("text-[8px] h-4 font-black uppercase tracking-wider gap-1 shrink-0", status.border, status.text)}>
                            <span className={cn("size-1 rounded-full", status.color)} />
                            {status.label}
                          </Badge>
                        </div>

                        {/* Capacity meter bar */}
                        <div className="space-y-1 mb-2 mt-1.5">
                          <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                            <span>{t('shelters.shelterCapacity')}</span>
                            <span>{t('shelters.spotsCount', { occupancy: shelter.current_occupancy, capacity: shelter.capacity })}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                occupancyRate >= 90 ? 'bg-rose-500' : occupancyRate >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                              )}
                              style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 text-[10px] font-bold text-muted-foreground border-t border-border/50 pt-2.5">
                          <span className="text-[9px] uppercase tracking-wider opacity-80">{getDistrictName(shelter) || t('dashboard.mapLayers.other')}</span>
                          {shelter.is_flood_safe && (
                            <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-black uppercase">
                              {t('shelters.floodSafe')}
                            </span>
                          )}
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
                  {t('shelters.paginationInfo', {
                    start: Math.min(filteredShelters.length, (currentPage - 1) * itemsPerPage + 1),
                    end: Math.min(filteredShelters.length, currentPage * itemsPerPage),
                    total: filteredShelters.length
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
                      className={cn("size-8 rounded-lg p-0 text-xs font-bold border-border hover:bg-muted", currentPage === num && "bg-indigo-600 hover:bg-indigo-500 text-white border-none")}
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

          {/* Active Detail Card Panel */}
          <Card className="relative overflow-hidden border-border/50 bg-card/45 backdrop-blur-md shadow-sm flex flex-col">
            <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-indigo-500/20 via-indigo-500 to-indigo-500/20" />

            {selectedShelter ? (
              <div className="flex flex-col h-full">
                {/* Panel Header */}
                <div className="border-b border-border/50 px-5 py-4 flex items-center justify-between bg-muted/10">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                      Shelter ID: #{String(selectedShelter.id).padStart(4, '0')}
                    </p>
                    <h2 className="font-black text-sm tracking-tight mt-0.5 truncate text-foreground">
                      {t('shelters.detailTitle')}
                    </h2>
                  </div>
                  <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-wider gap-1", getStatusConfig(selectedShelter.status, selectedShelter.current_occupancy, selectedShelter.capacity).border, getStatusConfig(selectedShelter.status, selectedShelter.current_occupancy, selectedShelter.capacity).text)}>
                    {getStatusConfig(selectedShelter.status, selectedShelter.current_occupancy, selectedShelter.capacity).label}
                  </Badge>
                </div>

                {/* Detail Content */}
                <ScrollArea className="flex-1 custom-scroll p-5">
                  <div className="space-y-6">
                    {/* Big Title & Icon */}
                    <div className="flex items-start gap-4">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/25 bg-indigo-500/5 text-indigo-400 text-3xl shadow-md">
                        <Home size={24} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-black leading-snug text-foreground">
                          {selectedShelter.name}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {selectedShelter.is_flood_safe && (
                            <Badge variant="outline" className="text-[10px] font-extrabold border uppercase tracking-wider border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                              {t('shelters.floodSafe')}
                            </Badge>
                          )}
                          {selectedShelter.code && (
                            <Badge variant="outline" className="text-[10px] font-extrabold border uppercase tracking-wider border-border bg-muted/30 text-foreground">
                              {t('shelters.shelterCode')}: {selectedShelter.code}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Occupancy Indicator Block */}
                    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Users size={12} /> {t('shelters.shelterCapacity')}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {Math.round((selectedShelter.current_occupancy / selectedShelter.capacity) * 100)}%
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-foreground">{selectedShelter.current_occupancy}</span>
                        <span className="text-xs font-bold text-muted-foreground">/ {t('shelters.peopleSuffix', { count: selectedShelter.capacity })}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full mt-3 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (selectedShelter.current_occupancy / selectedShelter.capacity) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* check-in check-out controller */}
                    <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                      <p className="text-xs font-bold text-foreground flex items-center gap-2">
                        <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                        {t('shelters.checkInCheckOutTitle')}
                      </p>
                      
                      {detailLoading ? (
                        <div className="h-10 bg-muted/20 rounded-lg animate-pulse" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={occupancyUpdateValue}
                            onChange={(e) => setOccupancyUpdateValue(e.target.value)}
                            className="w-20 h-9 rounded-xl border-border bg-background text-xs font-semibold text-foreground text-center focus-visible:ring-indigo-500"
                            disabled={isUpdatingOccupancy}
                          />
                          <span className="text-[10px] text-muted-foreground font-bold whitespace-nowrap mr-2">{t('people')}</span>
                          
                          <Button
                            size="sm"
                            className="flex-1 h-9 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                            onClick={() => handleUpdateOccupancy('add', Number(occupancyUpdateValue))}
                            disabled={isUpdatingOccupancy || !Number(occupancyUpdateValue)}
                          >
                            <Plus size={13} className="mr-1" /> {t('shelters.checkInBtn')}
                          </Button>
                          
                          <Button
                            size="sm"
                            className="flex-1 h-9 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 border border-border text-foreground"
                            onClick={() => handleUpdateOccupancy('remove', Number(occupancyUpdateValue))}
                            disabled={isUpdatingOccupancy || !Number(occupancyUpdateValue)}
                          >
                            {t('shelters.checkOutBtn')}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Address & Contacts */}
                    <div className="rounded-2xl border border-border bg-muted/20 p-3.5 text-xs space-y-3">
                      <div className="flex items-start gap-2.5">
                        <MapPin size={14} className="mt-0.5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{selectedShelter.address}{getDistrictName(selectedShelter) ? `, ${getDistrictName(selectedShelter)}` : ''}</span>
                      </div>
                      
                      <div className="flex items-center gap-2.5">
                        <Phone size={14} className="text-muted-foreground" />
                        {selectedShelter.contact_phone ? (
                          <a href={`tel:${selectedShelter.contact_phone}`} className="text-indigo-400 font-bold hover:underline">
                            {selectedShelter.contact_phone} {selectedShelter.contact_name ? `(${selectedShelter.contact_name})` : ''}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">{t('shelters.noContact')}</span>
                        )}
                      </div>

                      {selectedShelter.opening_hours && (
                        <div className="flex items-center gap-2.5">
                          <Clock size={14} className="text-muted-foreground" />
                          <span className="text-foreground font-semibold">{selectedShelter.opening_hours}</span>
                        </div>
                      )}
                    </div>

                    {/* Facilities Tag List */}
                     <div className="rounded-2xl border border-border bg-muted/20 p-3.5">
                       <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2.5">
                         {t('shelters.facilitiesLabel')}
                       </p>
                      <div className="flex flex-wrap gap-1.5">
                        {getFacilities(selectedShelter).length > 0 ? (
                          getFacilities(selectedShelter).map((facility, index) => {
                            const transKey = `facilities.${facility}` as never;
                            const label = tEnum.has?.(transKey) ? tEnum(transKey) : facility;
                            return (
                              <Badge key={`${facility}-${index}`} variant="outline" className="border-border bg-background text-[10px] font-bold text-foreground">
                                {label !== transKey ? label : facility}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-semibold">{t('shelters.facilitiesNone')}</span>
                        )}
                      </div>
                    </div>

                    {/* Supplies Stock (Vật tư hỗ trợ) */}
                    {selectedShelter.supply_stocks && selectedShelter.supply_stocks.length > 0 && (
                       <div className="rounded-2xl border border-border bg-muted/20 p-3.5 space-y-2.5">
                         <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                           <Package size={13} /> {t('shelters.suppliesLabel')}
                         </p>
                        <div className="space-y-1.5">
                          {selectedShelter.supply_stocks.map((stock, index) => (
                            <div key={stock.supply?.id ?? index} className="flex items-center justify-between text-xs border-b border-border/50 pb-1.5 last:border-0 last:pb-0">
                              <span className="font-semibold text-foreground">{stock.supply?.name || t('shelters.suppliesLabel')}</span>
                              <Badge className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 font-bold text-[10px]">
                                {stock.available_quantity ?? stock.quantity ?? 0} {stock.supply?.unit || ''}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2.5">
                      <Button
                        className="w-full gap-2 rounded-xl h-10 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                        onClick={() => handleDirections(selectedShelter)}
                      >
                         <Navigation size={14} />
                         {t('shelters.directionsBtn')}
                       </Button>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            ) : (
               <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-transparent">
                 <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-muted-foreground shadow-inner">
                   <Home size={24} />
                 </div>
                 <h3 className="text-sm font-bold text-foreground">{t('shelters.noShelterSelected')}</h3>
                 <p className="mt-1.5 max-w-xs text-xs text-muted-foreground font-semibold">
                   {t('shelters.noShelterSelectedDesc')}
                 </p>
               </div>
            )}
          </Card>
        </div>
      </section>

      {/* Ambient background glows */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[640px] bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{t('shelters.createDialogTitle')}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('shelters.fieldName')}</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Trường THCS..."
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('shelters.fieldStatus')}</Label>
                <Select value={createForm.status} onValueChange={(status) => setCreateForm((f) => ({ ...f, status: status ?? f.status }))}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-border">
                    <SelectItem value="open">{tEnum('shelterStatus.open')}</SelectItem>
                    <SelectItem value="preparing">{t('shelters.statusPreparing')}</SelectItem>
                    <SelectItem value="full">{tEnum('shelterStatus.full')}</SelectItem>
                    <SelectItem value="closed">{tEnum('shelterStatus.closed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('shelters.fieldAddress')}</Label>
              <Input
                value={createForm.address}
                onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Địa chỉ chi tiết..."
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>{t('shelters.fieldLatitude')}</Label>
                <Input
                  value={createForm.latitude}
                  onChange={(e) => setCreateForm((f) => ({ ...f, latitude: e.target.value }))}
                  placeholder="16.0678"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('shelters.fieldLongitude')}</Label>
                <Input
                  value={createForm.longitude}
                  onChange={(e) => setCreateForm((f) => ({ ...f, longitude: e.target.value }))}
                  placeholder="108.2208"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('shelters.shelterCapacity')}</Label>
                <Input
                  type="number"
                  min="1"
                  value={createForm.capacity}
                  onChange={(e) => setCreateForm((f) => ({ ...f, capacity: e.target.value }))}
                  placeholder="500"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('shelters.fieldOccupancy')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={createForm.current_occupancy}
                  onChange={(e) => setCreateForm((f) => ({ ...f, current_occupancy: e.target.value }))}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('shelters.fieldContactName')}</Label>
                <Input
                  value={createForm.contact_name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, contact_name: e.target.value }))}
                  placeholder="Nguyễn Văn A"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('shelters.fieldContactPhone')}</Label>
                <Input
                  value={createForm.contact_phone}
                  onChange={(e) => setCreateForm((f) => ({ ...f, contact_phone: e.target.value }))}
                  placeholder="090..."
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('shelters.fieldFacilities')}</Label>
                <Input
                  value={createForm.facilities}
                  onChange={(e) => setCreateForm((f) => ({ ...f, facilities: e.target.value }))}
                  placeholder="Thức ăn, nước sạch, y tế..."
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('shelters.fieldHours')}</Label>
                <Input
                  value={createForm.opening_hours}
                  onChange={(e) => setCreateForm((f) => ({ ...f, opening_hours: e.target.value }))}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
              <Checkbox
                checked={createForm.is_flood_safe}
                onCheckedChange={(checked) => setCreateForm((f) => ({ ...f, is_flood_safe: checked === true }))}
                className="border-border data-[state=checked]:bg-indigo-600"
              />
              {t('shelters.fieldFloodSafe')}
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={creating}
              className="border-border hover:bg-muted text-foreground"
            >
              {t('shelters.cancelBtn')}
            </Button>
            <Button
              onClick={handleCreateShelter}
              disabled={creating}
              className="bg-indigo-600 hover:bg-indigo-500 text-white border-none"
            >
              {creating ? t('shelters.savingBtn') : t('shelters.saveBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
