'use client';

import { useEffect, useRef } from 'react';
import { getEcho } from '@/lib/echo';
import { toast } from 'sonner';
import { AlertTriangle, Bell, Info, HeartPulse } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const isDev = process.env.NODE_ENV === 'development';

/** Unified role check - returns the appropriate link prefix based on user roles */
function getRoleLink(roles: string[], incidentId?: string | number): string {
  if (!incidentId) return '/dashboard/alerts';

  const roleSet = new Set(roles);

  if (
    roleSet.has('city_admin') ||
    roleSet.has('rescue_operator') ||
    roleSet.has('ai_operator') ||
    roleSet.has('urban_planner')
  ) {
    return `/dashboard/incidents/${incidentId}`;
  }

  if (roleSet.has('rescue_team')) {
    return `/team/requests/${incidentId}`;
  }

  if (roleSet.has('citizen')) {
    return `/citizen/alerts/${incidentId}`;
  }

  return '/dashboard/alerts';
}

/** Check if user has a specific role */
function hasRole(roles: string[], ...roleNames: string[]): boolean {
  return roleNames.some(role => roles.includes(role));
}

export function RealtimeListener() {
  const router = useRouter();
  const { user } = useAuth();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    let channel: any;

    try {
      const echo = getEcho();

      if (isDev) {
        console.log('[RealtimeListener] 🔌 Connecting to Reverb...');
        console.log('[RealtimeListener] Key:', process.env.NEXT_PUBLIC_REVERB_KEY);
        console.log('[RealtimeListener] Host:', process.env.NEXT_PUBLIC_REVERB_HOST);
        console.log('[RealtimeListener] Port:', process.env.NEXT_PUBLIC_REVERB_PORT);
      }

      channel = echo.channel('flood');

      // Listen for subscription confirmation
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

      // 1. Lắng nghe Sự cố mới
      channel.listen('.IncidentCreated', (data: any) => {
        if (isDev) {
          console.log('[RealtimeListener] 🔔 IncidentCreated received:', data);
        }

        const roles = (user?.roles || (user?.role ? [user.role] : [])).filter(Boolean) as string[];
        const link = getRoleLink(roles, data.id);

        window.dispatchEvent(new CustomEvent('aegis:incident:created', { detail: data }));

        if (hasRole(roles, 'citizen') && data.severity !== 'critical' && data.severity !== 'high') {
          return;
        }

        const toastFn = data.severity === 'critical' ? toast.error
          : data.severity === 'high' ? toast.warning
          : toast.info;

        toastFn(
          <div className="cursor-pointer w-full flex flex-col gap-1" onClick={() => router.push(link)}>
            <span className="font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              SỰ CỐ MỚI: {data.title}
            </span>
            <span className="text-sm opacity-90">
              {data.address || 'Không xác định'} • Mức độ: {data.severity}
            </span>
          </div>,
          { duration: 10000 }
        );
      });

      // 2. Lắng nghe Sự cố đã giải quyết
      channel.listen('.IncidentResolved', (data: any) => {
        if (isDev) {
          console.log('[RealtimeListener] ✅ IncidentResolved:', data);
        }
        window.dispatchEvent(new CustomEvent('aegis:incident:resolved', { detail: data }));
      });

      // 3. Lắng nghe Cảnh báo mới
      channel.listen('.AlertCreated', (data: any) => {
        if (isDev) {
          console.log('[RealtimeListener] 🔔 AlertCreated received:', data);
        }

        const roles = (user?.roles || (user?.role ? [user.role] : [])).filter(Boolean) as string[];

        window.dispatchEvent(new CustomEvent('aegis:alert:created', { detail: data }));

        if (hasRole(roles, 'citizen') && data.severity !== 'critical' && data.severity !== 'high') {
          return;
        }

        const toastFn = data.severity === 'critical' ? toast.error
          : data.severity === 'high' ? toast.warning
          : toast.info;

        toastFn(
          <div className="cursor-pointer w-full flex flex-col gap-1" onClick={() => router.push('/dashboard/alerts')}>
            <span className="font-medium flex items-center gap-2">
              <Bell className="w-4 h-4" />
              CẢNH BÁO: {data.title}
            </span>
            <span className="text-sm opacity-90">{data.description}</span>
          </div>,
          { duration: 8000 }
        );
      });

      // 4. Lắng nghe Yêu cầu cứu hộ mới
      channel.listen('.RescueRequestCreated', (data: any) => {
        if (isDev) {
          console.log('[RealtimeListener] 🔔 RescueRequestCreated:', data);
        }

        window.dispatchEvent(new CustomEvent('aegis:rescue_request:created', { detail: data }));

        const roles = (user?.roles || (user?.role ? [user.role] : [])).filter(Boolean) as string[];

        if (hasRole(roles, 'city_admin', 'rescue_operator', 'ai_operator')) {
          toast.info(
            <div className="cursor-pointer w-full flex flex-col gap-1" onClick={() => router.push('/dashboard/rescue-requests')}>
              <span className="font-medium flex items-center gap-2">
                <HeartPulse className="w-4 h-4" />
                YÊU CẦU CỨU HỘ MỚI
              </span>
              <span className="text-sm opacity-90">
                Tại: {data.address} • Cần ứng cứu: {data.people_count} người
              </span>
            </div>,
            { duration: 8000 }
          );
        }

        if (hasRole(roles, 'rescue_team') && (data.urgency === 'critical' || data.urgency === 'high')) {
          toast.warning(
            <div className="cursor-pointer w-full flex flex-col gap-1" onClick={() => router.push('/team/requests')}>
              <span className="font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                YÊU CẦU KHẨN CẤP
              </span>
              <span className="text-sm opacity-90">
                Tại: {data.address} • {data.people_count} người
              </span>
            </div>,
            { duration: 10000 }
          );
        }
      });

      // 5. Lắng nghe Cập nhật Yêu cầu cứu hộ
      channel.listen('.RescueRequestUpdated', (data: any) => {
        if (isDev) {
          console.log('[RealtimeListener] 🔔 RescueRequestUpdated:', data);
        }
        window.dispatchEvent(new CustomEvent('aegis:rescue_request:updated', { detail: data }));
      });

      // 6. Lắng nghe Dự báo AI
      channel.listen('.PredictionReceived', (data: any) => {
        if (isDev) {
          console.log('[RealtimeListener] 🧠 PredictionReceived:', data);
        }

        const roles = (user?.roles || (user?.role ? [user.role] : [])).filter(Boolean) as string[];

        if (hasRole(roles, 'city_admin', 'rescue_operator', 'ai_operator', 'urban_planner')) {
          window.dispatchEvent(new CustomEvent('aegis:prediction:received', { detail: data }));

          toast.info(
            <div className="cursor-pointer w-full flex flex-col gap-1" onClick={() => router.push('/dashboard/predictions')}>
              <span className="font-medium flex items-center gap-2">
                <Info className="w-4 h-4" />
                AI vừa cập nhật dự báo mới
              </span>
              <span className="text-sm opacity-90">
                Độ tin cậy: {Math.round((data.confidence || 0) * 100)}%
              </span>
            </div>,
            { duration: 5000 }
          );
        }
      });

      // 7. Lắng nghe Cập nhật Cảm biến
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
      if (channel) {
        try {
          const echo = getEcho();
          echo.leaveChannel('flood');
        } catch (err) {
          console.warn('[RealtimeListener] ⚠️ Cleanup error:', err);
        }
      }
      if (isDev) {
        console.log('[RealtimeListener] 🔌 Cleanup complete');
      }
    };
  }, [router, user]);

  return null;
}
