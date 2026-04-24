'use client';

import { useEffect, useRef } from 'react';
import { getEcho } from '@/lib/echo';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { AlertTriangle, Bell } from 'lucide-react';

const isDev = process.env.NODE_ENV === 'development';

export function RealtimeListener() {
  const { user } = useAuth();
  const subscribedRef = useRef(false);
  const channelRef = useRef<any>(null);

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
            { duration: 8000 }
          );
        }
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
            { duration: 8000 }
          );
        }
      });

      // 4. Lắng nghe Yêu cầu cứu hộ mới
      channel.listen('.RescueRequestCreated', (data: any) => {
        if (isDev) {
          console.log('[RealtimeListener] 🔔 RescueRequestCreated:', data);
        }
        window.dispatchEvent(new CustomEvent('aegis:rescue_request:created', { detail: data }));
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
        window.dispatchEvent(new CustomEvent('aegis:prediction:received', { detail: data }));
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
      // Don't cleanup on unmount - keep the subscription alive
      if (isDev) {
        console.log('[RealtimeListener] 🔌 Listener unmounting (keeping subscription alive)');
      }
    };
  }, []);

  return null;
}
