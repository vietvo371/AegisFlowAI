'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAlertEvents } from '@/lib/useAlertEvents';
import { useRealtime } from '@/lib/realtime-context';

/**
 * Component để hiển thị alert updates từ WebSocket
 * Có thể reuse để show toast notifications hoặc update UI
 */
export function AlertListener() {
  const { state } = useRealtime();
  const [alerts, setAlerts] = useState<any[]>([]);

  const handleAlertCreated = useCallback((data: any) => {
    setAlerts(prev => [data, ...prev]);
    console.log('✅ New alert received:', data);
  }, []);

  const handleAlertUpdated = useCallback((data: any) => {
    setAlerts(prev =>
      prev.map(a => (a.id === data.id ? { ...a, ...data } : a))
    );
    console.log('🔄 Alert updated:', data);
  }, []);

  const handleAlertResolved = useCallback((data: any) => {
    setAlerts(prev => prev.filter(a => a.id !== data.id));
    console.log('✔️ Alert resolved:', data);
  }, []);

  useAlertEvents({
    onAlertCreated: handleAlertCreated,
    onAlertUpdated: handleAlertUpdated,
    onAlertResolved: handleAlertResolved,
  });

  useEffect(() => {
    // Log connection status
    if (!state.connected && state.connectionError) {
      console.error('WebSocket connection error:', state.connectionError);
    }
  }, [state.connected, state.connectionError]);

  // Component chỉ để lắng nghe events
  // Không render UI
  return null;
}

/**
 * Example: Alert Toast Component
 * Sử dụng để hiển thị toast notifications cho alerts
 */
export function AlertToastListener() {
  const handleAlertCreated = useCallback((data: any) => {
    // Trigger toast notification
    // toast.warning(`Cảnh báo: ${data.title}`, {
    //   description: data.description,
    // });
    console.log('Show toast for alert:', data);
  }, []);

  const handleAlertResolved = useCallback((data: any) => {
    // Trigger success toast
    // toast.success(`Cảnh báo ${data.alert_number} đã được giải quyết`);
    console.log('Show success toast:', data);
  }, []);

  useAlertEvents({
    onAlertCreated: handleAlertCreated,
    onAlertResolved: handleAlertResolved,
  });

  return null;
}
