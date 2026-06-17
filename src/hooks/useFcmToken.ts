'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { getFcmToken, onForegroundMessage } from '@/lib/firebase';
import api from '@/lib/api';

interface FcmPayload {
  notification?: { title?: string; body?: string };
  data?: Record<string, string>;
}

export function useFcmToken(enabled: boolean) {
  const registered = useRef(false);

  useEffect(() => {
    if (!enabled || registered.current) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const run = async () => {
      try {
        // Inject firebase config into service worker scope
        await injectSwConfig();

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const token = await getFcmToken();
        if (!token) return;

        // Register token with backend
        await api.post('/fcm/register', {
          fcm_token: token,
          device_type: 'web',
          device_name: navigator.userAgent.slice(0, 100),
        });

        registered.current = true;

        // Subscribe to topics for broadcast alerts
        await api.post('/fcm/subscribe', { topic: 'flood_warnings' }).catch(() => {});
        await api.post('/fcm/subscribe', { topic: 'emergency_alerts' }).catch(() => {});

      } catch {
        // Silently fail — push notifications are non-critical
      }
    };

    run();

    // Foreground message handler
    let unsubscribe: (() => void) | undefined;
    onForegroundMessage((payload) => {
      const p = payload as FcmPayload;
      const title = p.notification?.title || 'AegisFlow AI';
      const body = p.notification?.body || '';
      const data = p.data ?? {};

      toast(title, {
        description: body,
        duration: 8000,
        action: data.type ? {
          label: 'Xem ngay',
          onClick: () => {
            const urls: Record<string, string> = {
              alert: '/dashboard/alerts',
              rescue_request: '/team/map',
              incident: '/dashboard/incidents',
            };
            if (urls[data.type]) window.location.href = urls[data.type];
          },
        } : undefined,
      });
    }).then((unsub) => {
      unsubscribe = typeof unsub === 'function' ? unsub : undefined;
    });

    return () => unsubscribe?.();
  }, [enabled]);
}

async function injectSwConfig() {
  if (!('serviceWorker' in navigator)) return;

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
    scope: '/',
  });

  // Pass config to SW via postMessage
  if (reg.active) {
    reg.active.postMessage({ type: 'FIREBASE_CONFIG', config });
  }
}
