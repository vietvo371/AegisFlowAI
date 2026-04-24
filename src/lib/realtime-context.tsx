/**
 * AegisFlow AI - Realtime Context
 * Provides realtime state management across the app
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getEcho } from '@/lib/echo';

export interface RealtimeState {
  connected: boolean;
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

        channel.listen('.incident.created', (data: any) => {
          setState(prev => ({
            ...prev,
            connected: true,
            lastIncident: data,
            unreadCount: prev.unreadCount + 1,
          }));
        });

        channel.listen('.alert.created', (data: any) => {
          setState(prev => ({
            ...prev,
            connected: true,
            lastAlert: data,
            unreadCount: prev.unreadCount + 1,
          }));
        });

        channel.listen('.rescue_request.created', (data: any) => {
          setState(prev => ({
            ...prev,
            connected: true,
            lastRescueRequest: data,
            unreadCount: prev.unreadCount + 1,
          }));
        });

        channel.listen('.sensor.reading', (data: any) => {
          setState(prev => ({
            ...prev,
            connected: true,
          }));
          window.dispatchEvent(new CustomEvent('aegis:sensor:reading', { detail: data }));
        });

        setState(prev => ({ ...prev, connected: true }));

        if (process.env.NODE_ENV === 'development') {
          console.log('[RealtimeProvider] ✅ Connected to flood channel');
        }
      } catch (err) {
        console.error('[RealtimeProvider] ❌ Failed to connect:', err);
      }
    };

    setupListeners();

    return () => {
      if (channel) {
        try {
          channel.stopListening('.incident.created');
          channel.stopListening('.alert.created');
          channel.stopListening('.rescue_request.created');
          channel.stopListening('.sensor.reading');
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
