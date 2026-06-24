'use client';

import { useEffect, useRef } from 'react';
import { getEcho } from '@/lib/echo';
import { useAuth } from '@/lib/auth-context';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';
import { AlertTriangle, Bell } from 'lucide-react';
import api from '@/lib/api';

const isDev = process.env.NODE_ENV === 'development';

function getLinkByRole(type: string, data: Record<string, unknown>, role?: string): string {
  if (role === 'citizen') {
    return '/citizen';
  }
  if (role === 'rescue_team') {
    if ((type === 'rescue' || type === 'incident') && data.id) {
      return `/team/requests/${data.id}`;
    }
    return '/team/requests';
  }
  if (type === 'incident' && data.id) {
    return `/dashboard/incidents/${data.id}`;
  }
  if (type === 'alert') {
    return '/dashboard/alerts';
  }
  if (type === 'rescue') {
    if (data.rescue_request_id) return `/dashboard/rescue-requests`;
    return '/dashboard/rescue-requests';
  }
  if (type === 'prediction' || type === 'recommendation') {
    if (data.id) return `/dashboard/recommendations`;
    return '/dashboard/recommendations';
  }
  return '';
}

function mapNotificationType(backendType: string): 'incident' | 'alert' | 'rescue' | 'prediction' | 'sensor' | 'system' {
  if (backendType === 'IncidentCreated') return 'incident';
  if (backendType === 'AlertCreated') return 'alert';
  if (backendType === 'RescueRequestCreated') return 'rescue';
  if (backendType === 'PredictionReceived') return 'prediction';
  if (backendType === 'RecommendationApproved') return 'prediction';
  if (backendType === 'SensorReadingReceived') return 'sensor';
  if (backendType === 'team_rejected') return 'rescue';
  return 'system';
}

export function RealtimeListener() {
  const { user } = useAuth();
  const { addNotification, seedNotifications } = useNotifications();
  const subscribedRef = useRef(false);
  const channelRef = useRef<any>(null);
  const seededRef = useRef(false);

  const userRole = user?.role || user?.roles?.[0];
  const userRoleRef = useRef(userRole);

  useEffect(() => {
    userRoleRef.current = userRole;
  }, [userRole]);

  // Seed notifications from API when user loads
  useEffect(() => {
    if (seededRef.current || !user) return;

    const seed = async () => {
      try {
        const res = await api.get('/notifications', { params: { per_page: 20 } });
        const items = (res.data.data || []).map((n: any) => ({
          id: n.id,
          title: n.title || n.data?.title || 'Thông báo',
          message: n.body || n.data?.description || '',
          type: mapNotificationType(n.type),
          severity: n.data?.severity,
          timestamp: new Date(n.created_at),
          read: !!n.read_at,
          link: getLinkByRole(mapNotificationType(n.type), n.data || {}, userRole),
          data: n.data,
        }));
        seedNotifications(items);
        seededRef.current = true;
        if (isDev) {
          console.log(`[RealtimeListener] 🌱 Seeded ${items.length} notifications from API`);
        }
      } catch (error) {
        console.error('[RealtimeListener] ❌ Seed failed:', error);
      }
    };

    seed();
  }, [user, userRole, seedNotifications]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (subscribedRef.current && channelRef.current) return;
    subscribedRef.current = true;

    try {
      const echo = getEcho();

      if (isDev) {
        console.log('[RealtimeListener] 🔌 Connecting to Reverb...');
        console.log('[RealtimeListener] Key:', process.env.NEXT_PUBLIC_REVERB_KEY);
        console.log('[RealtimeListener] Host:', process.env.NEXT_PUBLIC_REVERB_HOST);
        console.log('[RealtimeListener] Port:', process.env.NEXT_PUBLIC_REVERB_PORT);
      }

      channelRef.current = echo.channel('flood');
      const channel = channelRef.current;

      channel.subscribed(() => {
        if (isDev) {
          console.log('[RealtimeListener] ✅ Subscribed to channel: flood');
        }
      });

      channel.error((error: any) => {
        if (isDev) {
          console.error('[RealtimeListener] ❌ Channel error:', error);
        }
      });

      // 1. Listen IncidentCreated
      channel.listen('.IncidentCreated', (data: any) => {
        if (isDev) {
          console.log('[RealtimeListener] 🔔 IncidentCreated received:', data);
        }

        const link = getLinkByRole('incident', data, userRoleRef.current);
        addNotification({
          title: `Sự cố mới: ${data.title}`,
          message: data.address || 'Không có địa chỉ',
          type: 'incident',
          severity: data.severity,
          link,
          data,
        });

        window.dispatchEvent(new CustomEvent('aegis:incident:created', { detail: data }));

        if (data.severity === 'critical' || data.severity === 'high') {
          toast.warning(
            <div className="flex flex-col gap-1">
              <span className="font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                SỰ CỐ: {data.title}
              </span>
              <span className="text-sm opacity-90">{data.address || 'Không xác định'}</span>
            </div>,
            { duration: 8000, dismissible: true }
          );
        }
      });

      // 2. Listen IncidentResolved
      channel.listen('.IncidentResolved', (data: any) => {
        if (isDev) {
          console.log('[RealtimeListener] ✅ IncidentResolved:', data);
        }
        window.dispatchEvent(new CustomEvent('aegis:incident:resolved', { detail: data }));
      });

      // 3. Listen AlertCreated
      channel.listen('.AlertCreated', (data: any) => {
        if (isDev) {
          console.log('[RealtimeListener] 🔔 AlertCreated received:', data);
        }

        const link = getLinkByRole('alert', data, userRoleRef.current);
        addNotification({
          title: `Cảnh báo: ${data.title}`,
          message: data.description || 'Không có mô tả',
          type: 'alert',
          severity: data.severity,
          link,
          data,
        });

        window.dispatchEvent(new CustomEvent('aegis:alert:created', { detail: data }));

        if (data.severity === 'critical' || data.severity === 'high') {
          const toastFn = data.severity === 'critical' ? toast.error : toast.warning;
          toastFn(
            <div className="flex flex-col gap-1">
              <span className="font-medium flex items-center gap-2">
                <Bell className="w-4 h-4" />
                CẢNH BÁO: {data.title}
              </span>
              <span className="text-sm opacity-90">{data.description || ''}</span>
            </div>,
            { duration: 8000, dismissible: true }
          );
        }
      });

      // 4. Listen AlertUpdated
      channel.listen('.AlertUpdated', (data: any) => {
        if (isDev) {
          console.log('[RealtimeListener] 🔔 AlertUpdated:', data);
        }
        window.dispatchEvent(new CustomEvent('aegis:alert:updated', { detail: data }));
      });

      // 5. Listen AlertResolved
      channel.listen('.AlertResolved', (data: any) => {
        if (isDev) {
          console.log('[RealtimeListener] ✅ AlertResolved:', data);
        }
        window.dispatchEvent(new CustomEvent('aegis:alert:resolved', { detail: data }));
      });

      // 6. Listen RescueRequestCreated
      channel.listen('.RescueRequestCreated', (data: any) => {
        if (isDev) {
          console.log('[RealtimeListener] 🔔 RescueRequestCreated:', data);
        }

        const link = getLinkByRole('rescue', data, userRoleRef.current);
        addNotification({
          title: 'Yêu cầu cứu hộ mới',
          message: `${data.address} - Cần ${data.people_count} người`,
          type: 'rescue',
          link,
          data,
        });

        window.dispatchEvent(new CustomEvent('aegis:rescue_request:created', { detail: data }));
      });

      // 7. Listen RescueRequestUpdated
      channel.listen('.RescueRequestUpdated', (data: any) => {
        if (isDev) {
          console.log('[RealtimeListener] 🔔 RescueRequestUpdated:', data);
        }
        window.dispatchEvent(new CustomEvent('aegis:rescue_request:updated', { detail: data }));
      });

      // 8. Listen PredictionReceived
      channel.listen('.PredictionReceived', (data: any) => {
        if (isDev) {
          console.log('[RealtimeListener] 🧠 PredictionReceived:', data);
        }

        const link = getLinkByRole('prediction', data, userRoleRef.current);
        addNotification({
          title: 'AI dự báo mới',
          message: `Độ tin cậy: ${Math.round((data.confidence || 0) * 100)}%`,
          type: 'prediction',
          link,
          data,
        });

        window.dispatchEvent(new CustomEvent('aegis:prediction:received', { detail: data }));
      });

      // 9. Listen SensorReadingReceived
      channel.listen('.SensorReadingReceived', (data: any) => {
        if (isDev) {
          console.log('[RealtimeListener] 📡 SensorReadingReceived:', data);
        }
        window.dispatchEvent(new CustomEvent('aegis:sensor:reading', { detail: data }));
      });
    } catch (err) {
      console.error('[RealtimeListener] ❌ Failed to connect:', err);
      subscribedRef.current = false;
    }

    return () => {
      if (channelRef.current) {
        try {
          channelRef.current.stopListening('.IncidentCreated');
          channelRef.current.stopListening('.IncidentResolved');
          channelRef.current.stopListening('.AlertCreated');
          channelRef.current.stopListening('.AlertUpdated');
          channelRef.current.stopListening('.AlertResolved');
          channelRef.current.stopListening('.RescueRequestCreated');
          channelRef.current.stopListening('.RescueRequestUpdated');
          channelRef.current.stopListening('.PredictionReceived');
          channelRef.current.stopListening('.SensorReadingReceived');
        } catch (err) {
          console.warn('[RealtimeListener] ⚠️ Cleanup error:', err);
        }
      }
      if (isDev) {
        console.log('[RealtimeListener] 🔌 Cleanup complete');
      }
    };
  }, []);

  // Subscribe kênh private user để nhận team_rejected và các thông báo dành riêng cho admin
  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return;

    let privateChannel: any = null;
    try {
      const echo = getEcho();
      privateChannel = echo.private(`user.${user.id}`);
      privateChannel.listen('.notification.sent', (data: any) => {
        if (isDev) console.log('[RealtimeListener] 🔔 notification.sent (private):', data);

        if (data.type === 'team_rejected') {
          toast.error(
            <div className="flex flex-col gap-1">
              <span className="font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {data.title || '⚠️ Đội từ chối nhiệm vụ'}
              </span>
              <span className="text-sm opacity-90">{data.message || data.noi_dung || ''}</span>
            </div>,
            { duration: 10000, dismissible: true }
          );

          addNotification({
            title: data.title || 'Đội từ chối nhiệm vụ',
            message: data.message || data.noi_dung || '',
            type: 'rescue',
            severity: 'high',
            link: '/dashboard/rescue-requests',
            data,
          });

          // Trigger refresh danh sách rescue requests
          window.dispatchEvent(new CustomEvent('aegis:rescue_request:updated', { detail: data }));
        }
      });

      if (isDev) console.log(`[RealtimeListener] 🔒 Subscribed to private-user.${user.id}`);
    } catch (err) {
      console.warn('[RealtimeListener] ⚠️ Private channel error:', err);
    }

    return () => {
      try {
        privateChannel?.stopListening('.notification.sent');
      } catch { /* ignore */ }
    };
  }, [user?.id, addNotification]);


  return null;
}
