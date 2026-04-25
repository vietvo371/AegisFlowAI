import { useEffect } from 'react';

export type AlertEventHandler = (data: any) => void;

interface UseAlertEventsOptions {
  onAlertCreated?: AlertEventHandler;
  onAlertUpdated?: AlertEventHandler;
  onAlertResolved?: AlertEventHandler;
}

/**
 * Hook để lắng nghe alert events từ WebSocket
 * @example
 * useAlertEvents({
 *   onAlertCreated: (data) => console.log('New alert:', data),
 *   onAlertUpdated: (data) => console.log('Alert updated:', data),
 *   onAlertResolved: (data) => console.log('Alert resolved:', data),
 * });
 */
export function useAlertEvents({
  onAlertCreated,
  onAlertUpdated,
  onAlertResolved,
}: UseAlertEventsOptions = {}) {
  useEffect(() => {
    const handleAlertCreated = (event: CustomEvent) => {
      onAlertCreated?.(event.detail);
    };

    const handleAlertUpdated = (event: CustomEvent) => {
      onAlertUpdated?.(event.detail);
    };

    const handleAlertResolved = (event: CustomEvent) => {
      onAlertResolved?.(event.detail);
    };

    if (typeof window === 'undefined') return;

    window.addEventListener('aegis:alert:created', handleAlertCreated as EventListener);
    window.addEventListener('aegis:alert:updated', handleAlertUpdated as EventListener);
    window.addEventListener('aegis:alert:resolved', handleAlertResolved as EventListener);

    return () => {
      window.removeEventListener('aegis:alert:created', handleAlertCreated as EventListener);
      window.removeEventListener('aegis:alert:updated', handleAlertUpdated as EventListener);
      window.removeEventListener('aegis:alert:resolved', handleAlertResolved as EventListener);
    };
  }, [onAlertCreated, onAlertUpdated, onAlertResolved]);
}
