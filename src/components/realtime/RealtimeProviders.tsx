'use client';

import { RealtimeListener } from './RealtimeListener';

/**
 * Realtime listener để nhận WebSocket events
 * Dispatch custom events cho NotificationBell dropdown
 */
export default function RealtimeProviders() {
  return <RealtimeListener />;
}
