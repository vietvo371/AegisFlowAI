/**
 * AegisFlow AI - Realtime Context
 * Provides realtime state management across the app
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getEcho } from '@/lib/echo';

export interface RealtimeState {
  connected: boolean;
  connectionError: string | null;
  lastIncident: any | null;
  lastAlert: any | null;
  lastRescueRequest: any | null;
  unreadCount: number;
}

interface RealtimeContextType {
  state: RealtimeState;
  reconnect: () => void;
  clearNotifications: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children, token }: { children: ReactNode; token?: string }) {
  const [state, setState] = useState<RealtimeState>({
    connected: false,
    connectionError: null,
    lastIncident: null,
    lastAlert: null,
    lastRescueRequest: null,
    unreadCount: 0,
  });

  const reconnect = useCallback(() => {
    // Force reconnect by getting new echo instance
    try {
      getEcho();
    } catch (e) {
      // Ignore - getEcho only works in browser
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setState(prev => ({ ...prev, unreadCount: 0 }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let channel: any;

    const setupListeners = () => {
      try {
        const echo = getEcho();
        channel = echo.channel('flood');

        channel.listen('.IncidentCreated', (data: any) => {
          setState(prev => ({
            ...prev,
            connected: true,
            lastIncident: data,
            unreadCount: prev.unreadCount + 1,
          }));
        });

        channel.listen('.AlertCreated', (data: any) => {
          setState(prev => ({
            ...prev,
            connected: true,
            lastAlert: data,
            unreadCount: prev.unreadCount + 1,
          }));
          window.dispatchEvent(new CustomEvent('aegis:alert:created', { detail: data }));
        });

        channel.listen('.AlertUpdated', (data: any) => {
          setState(prev => ({
            ...prev,
            connected: true,
            lastAlert: data,
          }));
          window.dispatchEvent(new CustomEvent('aegis:alert:updated', { detail: data }));
        });

        channel.listen('.AlertResolved', (data: any) => {
          setState(prev => ({
            ...prev,
            connected: true,
            lastAlert: data,
          }));
          window.dispatchEvent(new CustomEvent('aegis:alert:resolved', { detail: data }));
        });

        channel.listen('.RescueRequestCreated', (data: any) => {
          setState(prev => ({
            ...prev,
            connected: true,
            lastRescueRequest: data,
            unreadCount: prev.unreadCount + 1,
          }));
        });

        channel.listen('.SensorReadingReceived', (data: any) => {
          setState(prev => ({
            ...prev,
            connected: true,
          }));
          window.dispatchEvent(new CustomEvent('aegis:sensor:reading', { detail: data }));
        });

        setState(prev => ({ ...prev, connected: true, connectionError: null }));

        if (process.env.NODE_ENV === 'development') {
          console.log('[RealtimeProvider] ✅ Connected to flood channel');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[RealtimeProvider] ❌ Failed to connect:', err);
        setState(prev => ({
          ...prev,
          connected: false,
          connectionError: errorMessage
        }));

        // Retry connection after 5 seconds
        setTimeout(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[RealtimeProvider] 🔄 Attempting to reconnect...');
          }
          setupListeners();
        }, 5000);
      }
    };

    setupListeners();

    return () => {
      if (channel) {
        try {
          channel.stopListening('.IncidentCreated');
          channel.stopListening('.AlertCreated');
          channel.stopListening('.AlertUpdated');
          channel.stopListening('.AlertResolved');
          channel.stopListening('.RescueRequestCreated');
          channel.stopListening('.SensorReadingReceived');
          channel.leave();
        } catch (err) {
          console.warn('[RealtimeProvider] ⚠️ Cleanup error:', err);
        }
      }
    };
  }, [token]);

  return (
    <RealtimeContext.Provider value={{ state, reconnect, clearNotifications }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
