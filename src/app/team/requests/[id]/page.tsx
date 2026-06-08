'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, Users } from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface RescueRequest {
  id: number;
  caller_name?: string;
  caller_phone?: string;
  address: string;
  people_count: number;
  urgency: string;
  status: string;
  description?: string;
  location?: { lat?: number | string | null; lng?: number | string | null } | null;
  assigned_team?: { id: number; name: string } | null;
}

interface RescueTeam {
  id: number;
  name: string;
  status: string;
}

const getResponseList = <T,>(payload: { data?: T[] | { data?: T[] } } | undefined): T[] => {
  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

export default function TeamRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = React.useState<RescueRequest | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const fetchRequest = React.useCallback(async () => {
    const res = await api.get(`/rescue-requests/${params.id}`);
    setRequest(res.data?.data ?? res.data);
  }, [params.id]);

  React.useEffect(() => {
    let mounted = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequest()
      .catch(() => {
        if (mounted) setRequest(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [fetchRequest]);

  const getActionLabel = () => {
    if (!request) return 'Tiếp nhận';
    if (request.status === 'pending') return 'Tiếp nhận';
    if (request.status === 'assigned') return 'Bắt đầu xử lý';
    if (request.status === 'in_progress') return 'Hoàn thành';
    return 'Đã hoàn tất';
  };

  const handlePrimaryAction = async () => {
    if (!request || ['completed', 'cancelled'].includes(request.status)) return;

    setSubmitting(true);
    try {
      if (request.status === 'pending') {
        const teamsRes = await api.get('/rescue-teams');
        const teams = getResponseList<RescueTeam>(teamsRes.data);
        const availableTeam = teams.find((team) => team.status === 'available') ?? teams[0];

        if (!availableTeam) {
          toast.error('Chưa có đội cứu hộ khả dụng');
          return;
        }

        await api.put(`/rescue-requests/${request.id}/assign`, { team_id: availableTeam.id });
      } else if (request.status === 'assigned') {
        await api.put(`/rescue-requests/${request.id}/status`, { status: 'in_progress' });
      } else if (request.status === 'in_progress') {
        await api.put(`/rescue-requests/${request.id}/status`, { status: 'completed' });
      }

      await fetchRequest();
    } catch (error) {
      console.error(error);
      toast.error('Không cập nhật được yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  const mapHref = React.useMemo(() => {
    if (!request) return '/team/map';

    const lat = request?.location?.lat;
    const lng = request?.location?.lng;
    if (lat == null || lng == null) return '/team/map';

    return `/team/map?requestId=${request.id}&lat=${lat}&lng=${lng}`;
  }, [request]);

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Đang tải...</div>;
  }

  if (!request) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Button asChild variant="ghost">
          <Link href="/team/requests">
            <ArrowLeft size={16} />
            Quay lại
          </Link>
        </Button>
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Không tìm thấy yêu cầu.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Button asChild variant="ghost">
        <Link href="/team/requests">
          <ArrowLeft size={16} />
          Quay lại
        </Link>
      </Button>

      <div className="rounded-lg border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{request.caller_name ?? 'Yêu cầu cứu hộ'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{request.status}</p>
          </div>
          <Badge variant={request.urgency === 'critical' ? 'destructive' : 'secondary'}>
            {request.urgency}
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 text-sm">
          <div className="flex gap-3">
            <MapPin size={18} className="mt-0.5 text-muted-foreground" />
            <span>{request.address}</span>
          </div>
          {request.caller_phone && (
            <div className="flex gap-3">
              <Phone size={18} className="mt-0.5 text-muted-foreground" />
              <span>{request.caller_phone}</span>
            </div>
          )}
          <div className="flex gap-3">
            <Users size={18} className="mt-0.5 text-muted-foreground" />
            <span>{request.people_count} người cần hỗ trợ</span>
          </div>
          {request.description && (
            <p className="rounded-lg bg-muted p-4 leading-relaxed">{request.description}</p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            disabled={submitting || ['completed', 'cancelled'].includes(request.status)}
            onClick={handlePrimaryAction}
          >
            {submitting ? 'Đang cập nhật...' : getActionLabel()}
          </Button>
          <Button asChild variant="outline">
            <Link href={mapHref}>Mở bản đồ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
