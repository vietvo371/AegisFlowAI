'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2, MapPin, Phone, Users, Clock, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const MapComponent = dynamic(() => import('@/components/map/MapComponent'));

interface RescueRequest {
  id: number;
  address: string;
  people_count: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved';
  created_at: string;
  caller_name?: string;
  caller_phone?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
}

export default function TeamMapPage() {
  const t = useTranslations('team');
  const { user } = useAuth();
  const [rescueRequests, setRescueRequests] = useState<RescueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RescueRequest | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // Fetch rescue requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rescue-requests', {
        params: { status: 'pending,assigned', per_page: 100 }
      });

      const requests = res.data?.data ?? [];
      setRescueRequests(requests);
    } catch (e) {
      console.error('Failed to fetch rescue requests', e);
      toast.error('Lỗi khi tải danh sách yêu cầu cứu hộ');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and real-time updates
  useEffect(() => {
    fetchRequests();

    const handler = () => fetchRequests();
    window.addEventListener('aegis:rescue_request:created', handler);
    window.addEventListener('aegis:rescue_request:updated', handler);

    return () => {
      window.removeEventListener('aegis:rescue_request:created', handler);
      window.removeEventListener('aegis:rescue_request:updated', handler);
    };
  }, []);

  // Handle accept request
  const handleAcceptRequest = async (request: RescueRequest) => {
    if (!request) return;

    setIsAccepting(true);
    try {
      const res = await api.patch(`/rescue-requests/${request.id}`, {
        status: 'in_progress',
        assigned_team_id: user?.id,
      });

      if (res.data?.success) {
        toast.success(`Đã tiếp nhận yêu cầu từ ${request.caller_name || 'người dùng'}`);
        setSelectedRequest(null);
        await fetchRequests();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi khi tiếp nhận yêu cầu');
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

  const getUrgencyLabel = (urgency: string) => {
    const labels: Record<string, string> = {
      'critical': 'Khẩn cấp',
      'high': 'Cao',
      'medium': 'Trung bình',
      'low': 'Thấp'
    };
    return labels[urgency] || urgency;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Chờ tiếp nhận',
      'assigned': 'Đã tiếp nhận',
      'in_progress': 'Đang thực hiện',
      'resolved': 'Hoàn thành'
    };
    return labels[status] || status;
  };

  return (
    <div className="relative w-full h-[calc(100vh-7rem)]">
      {/* Map */}
      <MapComponent />

      {/* Sidebar - Rescue Requests List */}
      <div className="absolute bottom-6 left-6 w-96 max-h-[70vh] bg-white rounded-lg shadow-2xl border border-border overflow-hidden flex flex-col z-10">
        <CardHeader className="pb-3 bg-primary/5 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin size={18} className="text-primary" />
              Yêu cầu cứu hộ
            </CardTitle>
            {loading && <Loader2 size={16} className="animate-spin text-primary" />}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {rescueRequests.length} yêu cầu đang chờ hoặc đã tiếp nhận
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
              Không có yêu cầu cứu hộ nào
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {rescueRequests.map((request) => (
                <Sheet key={request.id} open={selectedRequest?.id === request.id} onOpenChange={(open) => {
                  if (!open) setSelectedRequest(null);
                }}>
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <CardContent className="pt-3 pb-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold flex items-center gap-2">
                              {request.caller_name || 'Người dùng'}
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
                          <Users size={12} /> {request.people_count} người
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

                  {/* Detail Sheet */}
                  <SheetContent side="right" className="w-full sm:w-96">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <AlertTriangle size={18} className="text-orange-500" />
                        Chi tiết yêu cầu
                      </SheetTitle>
                    </SheetHeader>

                    {selectedRequest && (
                      <div className="space-y-4 mt-6">
                        {/* Header */}
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold">{selectedRequest.caller_name || 'Người dùng'}</h3>
                          <div className="flex gap-2">
                            <Badge className={`text-white ${getUrgencyColor(selectedRequest.urgency)}`}>
                              {getUrgencyLabel(selectedRequest.urgency)}
                            </Badge>
                            <Badge variant="outline">
                              {getStatusLabel(selectedRequest.status)}
                            </Badge>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <MapPin size={16} className="text-primary mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">Địa điểm</p>
                              <p className="text-sm">{selectedRequest.address}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Phone size={16} className="text-primary mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">Liên hệ</p>
                              <p className="text-sm">{selectedRequest.caller_phone || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Users size={16} className="text-primary mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">Số người</p>
                              <p className="text-sm">{selectedRequest.people_count}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Clock size={16} className="text-primary mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">Thời gian</p>
                              <p className="text-sm">
                                {new Date(selectedRequest.created_at).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          </div>

                          {selectedRequest.description && (
                            <div className="flex items-start gap-3">
                              <AlertTriangle size={16} className="text-primary mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground">Ghi chú</p>
                                <p className="text-sm">{selectedRequest.description}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        {selectedRequest.status === 'pending' && (
                          <Button
                            className="w-full mt-6"
                            onClick={() => handleAcceptRequest(selectedRequest)}
                            disabled={isAccepting}
                          >
                            {isAccepting ? (
                              <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                Đang tiếp nhận...
                              </>
                            ) : (
                              <>
                                <CheckCircle size={16} className="mr-2" />
                                Tiếp nhận yêu cầu
                              </>
                            )}
                          </Button>
                        )}

                        {selectedRequest.status !== 'pending' && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-6">
                            <p className="text-xs text-blue-700">
                              ✓ Yêu cầu này đã được {getStatusLabel(selectedRequest.status).toLowerCase()}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </SheetContent>
                </Sheet>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map overlay info */}
      <div className="absolute top-6 left-6 z-10">
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="pt-3 pb-3 text-xs text-muted-foreground">
            {rescueRequests.length > 0 && (
              <p>👉 Click các yêu cầu để xem chi tiết</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
