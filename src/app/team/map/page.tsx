'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2, MapPin, Phone, Users, Clock, CheckCircle, AlertTriangle, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

const MapComponent = dynamic(() => import('@/components/map/MapComponent'));

interface RescueRequest {
  id: number;
  address: string;
  people_count: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'resolved';
  created_at: string;
  caller_name?: string;
  caller_phone?: string;
  latitude?: number;
  longitude?: number;
  location?: {
    lat?: number | string | null;
    lng?: number | string | null;
  } | null;
  description?: string;
}

function getResponseList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload;

  const root = payload as { data?: unknown } | null | undefined;
  if (Array.isArray(root?.data)) return root.data as T[];

  const nested = root?.data as { data?: unknown } | null | undefined;
  if (Array.isArray(nested?.data)) return nested.data as T[];

  return [];
}

function getResponseItem<T>(payload: unknown): T | null {
  const root = payload as { data?: unknown } | null | undefined;
  const nested = root?.data as { data?: unknown } | null | undefined;

  if (nested?.data && !Array.isArray(nested.data)) return nested.data as T;
  if (root?.data && !Array.isArray(root.data)) return root.data as T;

  return null;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== 'object' || error === null) return fallback;

  const response = (error as { response?: { data?: { message?: unknown } } }).response;
  return typeof response?.data?.message === 'string' ? response.data.message : fallback;
}

function getRequestCoordinates(request?: RescueRequest | null): { lat: number; lng: number } | null {
  const lat = Number(request?.location?.lat ?? request?.latitude);
  const lng = Number(request?.location?.lng ?? request?.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export default function TeamMapPage() {
  const tMissions = useTranslations('team.missions');
  const tEnums = useTranslations('enums');

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: tEnums('rescueStatus.pending'),
      assigned: tEnums('rescueStatus.assigned'),
      in_progress: tEnums('rescueStatus.in_progress'),
      completed: tEnums('rescueStatus.completed'),
      resolved: tEnums('rescueStatus.completed'),
      cancelled: tEnums('rescueStatus.cancelled'),
    };
    return labels[status] || status;
  };
  const searchParams = useSearchParams();
  const requestId = Number(searchParams.get('requestId'));
  const rawLat = searchParams.get('lat');
  const rawLng = searchParams.get('lng');
  const fallbackLat = rawLat !== null ? Number(rawLat) : NaN;
  const fallbackLng = rawLng !== null ? Number(rawLng) : NaN;
  const [rescueRequests, setRescueRequests] = useState<RescueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RescueRequest | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // Fetch rescue requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/rescue-requests', { params: { per_page: 100 } });
      const allRequests = getResponseList<RescueRequest>(res.data);
      const activeStatuses = new Set(['pending', 'assigned', 'in_progress']);
      const activeRequests = allRequests.filter((request) => activeStatuses.has(request.status));

      let linkedRequest: RescueRequest | null = null;
      if (Number.isFinite(requestId) && requestId > 0) {
        linkedRequest = activeRequests.find((request) => request.id === requestId) ?? null;

        if (!linkedRequest) {
          try {
            const detailRes = await api.get(`/rescue-requests/${requestId}`);
            linkedRequest = getResponseItem<RescueRequest>(detailRes.data);
          } catch (detailError) {
            console.error('Failed to fetch linked rescue request', detailError);
          }
        }
      }

      const nextRequests = linkedRequest && activeStatuses.has(linkedRequest.status)
        ? [linkedRequest, ...activeRequests.filter((request) => request.id !== linkedRequest?.id)]
        : activeRequests;

      setRescueRequests(nextRequests);
      if (linkedRequest) setSelectedRequest(linkedRequest);
    } catch (e) {
      console.error('Failed to fetch rescue requests', e);
      toast.error(tMissions('loadError'));
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  // Initial load and real-time updates
  useEffect(() => {
    const load = async () => {
      await fetchRequests();
    };

    void load();

    const handler = () => fetchRequests();
    window.addEventListener('aegis:rescue_request:created', handler);
    window.addEventListener('aegis:rescue_request:updated', handler);

    return () => {
      window.removeEventListener('aegis:rescue_request:created', handler);
      window.removeEventListener('aegis:rescue_request:updated', handler);
    };
  }, [fetchRequests]);

  const selectedCoordinates = getRequestCoordinates(selectedRequest);
  const focusPoint = useMemo(() => {
    const latCandidate = selectedCoordinates?.lat ?? (Number.isFinite(fallbackLat) ? fallbackLat : undefined);
    const lngCandidate = selectedCoordinates?.lng ?? (Number.isFinite(fallbackLng) ? fallbackLng : undefined);

    if (typeof latCandidate !== 'number' || typeof lngCandidate !== 'number') return null;
    if (!Number.isFinite(latCandidate) || !Number.isFinite(lngCandidate)) return null;

    return {
      id: selectedRequest?.id ?? requestId,
      name: selectedRequest?.caller_name || selectedRequest?.address || tMissions('rescueRequestsTitle'),
      latitude: latCandidate,
      longitude: lngCandidate,
      type: 'rescue_request' as const,
      subtitle: selectedRequest
        ? `${getStatusLabel(selectedRequest.status)} • ${selectedRequest.people_count}`
        : tMissions('rescueRequestsTitle'),
      status: selectedRequest?.status,
    };
  }, [fallbackLat, fallbackLng, requestId, selectedCoordinates?.lat, selectedCoordinates?.lng, selectedRequest]);

  // Handle accept request
  const handleAcceptRequest = async (request: RescueRequest) => {
    if (!request) return;

    setIsAccepting(true);
    try {
      if (request.status === 'pending') {
        const teamsRes = await api.get('/rescue-teams');
        const teams = getResponseList<{ id: number; status?: string }>(teamsRes.data);
        const availableTeam = teams.find((team) => team.status === 'available') ?? teams[0];

        if (!availableTeam) {
          toast.error(tMissions('noAvailableTeam'));
          return;
        }

        await api.put(`/rescue-requests/${request.id}/assign`, { team_id: availableTeam.id });
        toast.success(tMissions('requestAccepted', { name: request.caller_name || '—' }));
      } else if (request.status === 'assigned') {
        await api.put(`/rescue-requests/${request.id}/status`, { status: 'in_progress' });
        toast.success(tMissions('startedProcessing'));
      } else if (request.status === 'in_progress') {
        await api.put(`/rescue-requests/${request.id}/status`, { status: 'completed' });
        toast.success(tMissions('requestCompleted'));
      }

      await fetchRequests();
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, tMissions('requestUpdateError')));
      console.error(e);
    } finally {
      setIsAccepting(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getUrgencyLabel = (urgency: string): string => {
    const labels: Record<string, string> = {
      critical: tEnums('urgency.critical'),
      high: tEnums('urgency.high'),
      medium: tEnums('urgency.medium'),
      low: tEnums('urgency.low'),
    };
    return labels[urgency] || urgency;
  };

  const getPrimaryActionLabel = (status: RescueRequest['status']): string | null => {
    if (status === 'pending') return tMissions('acceptRequest');
    if (status === 'assigned') return tMissions('startProcessing');
    if (status === 'in_progress') return tMissions('completed');
    return null;
  };

  const actionLabel = selectedRequest ? getPrimaryActionLabel(selectedRequest.status) : null;

  return (
    <div className="relative w-full h-[calc(100vh-7rem)]">
      {/* Map */}
      <MapComponent
        focusPoint={focusPoint}
        center={focusPoint ? [focusPoint.longitude, focusPoint.latitude] : undefined}
        zoom={focusPoint ? 14 : undefined}
      />

      {/* Sidebar - Rescue Requests List */}
      <div className="absolute bottom-6 left-6 w-96 max-h-[70vh] bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 overflow-hidden flex flex-col z-10">
        <CardHeader className="pb-3 bg-transparent border-b border-white/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin size={18} className="text-primary" />
              {tMissions('rescueRequestsTitle')}
            </CardTitle>
            {loading && <Loader2 size={16} className="animate-spin text-primary" />}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {tMissions('requestsCount', { count: rescueRequests.length })}
          </p>
        </CardHeader>

        {/* Requests List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-primary" />
            </div>
          ) : rescueRequests.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {tMissions('noRequestsMsg')}
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {rescueRequests.map((request) => (
                <Card
                  key={request.id}
                  className={`cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 border-white/40 border rounded-xl ${selectedRequest?.id === request.id ? 'bg-white ring-2 ring-primary/50' : 'bg-white/60 hover:bg-white'}`}
                  onClick={() => setSelectedRequest(request)}
                >
                  <CardContent className="pt-3 pb-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold flex items-center gap-2">
                            {request.caller_name || tMissions('unknownName')}
                            <Badge variant="outline" className={`text-white ${getUrgencyColor(request.urgency)}`}>
                              {getUrgencyLabel(request.urgency)}
                            </Badge>
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin size={12} /> {request.address}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground" />
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users size={12} /> {request.people_count} {tMissions('peopleLabel')}
                        {request.caller_phone && (
                          <>
                            <span>•</span>
                            <Phone size={12} /> {request.caller_phone}
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map overlay info */}
      <div className="absolute top-6 left-6 z-10">
        <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-sm rounded-xl">
          <CardContent className="pt-3 pb-3 text-xs text-muted-foreground">
            {rescueRequests.length > 0 && (
              <p>👉 {tMissions('clickToViewMsg')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating Detail Card (Right Side) */}
      {selectedRequest && (
        <div className="absolute right-6 top-6 bottom-6 w-[400px] bg-white/80 backdrop-blur-2xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 flex flex-col z-20 overflow-hidden animate-in slide-in-from-right-8 duration-300 fade-in">
          <div className="bg-transparent border-b border-white/20 p-4 flex justify-between items-center shrink-0">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" />
              {tMissions('requestDetailTitle')}
            </h2>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-black/5" onClick={() => setSelectedRequest(null)}>
              <X size={16} />
            </Button>
          </div>
          
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Header */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold">{selectedRequest.caller_name || tMissions('unknownName')}</h3>
              <div className="flex gap-2">
                <Badge className={`text-white ${getUrgencyColor(selectedRequest.urgency)}`}>
                  {getUrgencyLabel(selectedRequest.urgency)}
                </Badge>
                <Badge variant="outline" className="bg-white/50">
                  {getStatusLabel(selectedRequest.status)}
                </Badge>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">{tMissions('locationLabel')}</p>
                  <p className="text-sm font-medium">{selectedRequest.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={16} className="text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">{tMissions('contactLabel')}</p>
                  <p className="text-sm font-medium">{selectedRequest.caller_phone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users size={16} className="text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">{tMissions('peopleLabel')}</p>
                  <p className="text-sm font-medium">{selectedRequest.people_count}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock size={16} className="text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">{tMissions('timeLabel')}</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedRequest.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedRequest.description && (
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{tMissions('notesLabel')}</p>
                    <p className="text-sm font-medium">{selectedRequest.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            {actionLabel && (
              <Button
                className="w-full mt-2 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                size="lg"
                onClick={() => handleAcceptRequest(selectedRequest)}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    {tMissions('updatingMsg')}
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} className="mr-2" />
                    {actionLabel}
                  </>
                )}
              </Button>
            )}

            {!actionLabel && (
              <div className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 rounded-xl p-3 mt-2">
                <p className="text-xs text-emerald-700 font-medium flex items-center">
                  <CheckCircle size={14} className="mr-1.5" />
                  {getStatusLabel(selectedRequest.status)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
