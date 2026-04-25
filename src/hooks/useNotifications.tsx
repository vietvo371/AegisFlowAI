'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import api from '@/lib/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'incident' | 'alert' | 'rescue' | 'prediction' | 'sensor' | 'system';
  severity?: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  data?: Record<string, unknown>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  seedNotifications: (items: Notification[]) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  seeded: boolean;
}

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  seedNotifications: () => {},
  markAsRead: () => {},
  markAllRead: () => {},
  clearAll: () => {},
  seeded: false,
});

const MAX_NOTIFICATIONS = 50;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [seeded, setSeeded] = useState(false);
  const counterRef = useRef(0);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    counterRef.current += 1;
    const newId = `notif-${Date.now()}-${counterRef.current}`;
    const newNotification: Notification = {
      ...n,
      id: newId,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS));
  }, []);

  const seedNotifications = useCallback((items: Notification[]) => {
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const newItems = items.filter(i => !existingIds.has(i.id));
      return [...newItems, ...prev].slice(0, MAX_NOTIFICATIONS);
    });
    setSeeded(true);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    if (!isUuid(id)) return;

    try {
      await api.put(`/notifications/${id}/read`);
    } catch (error) {
      console.error('[useNotifications] markAsRead failed:', error);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    try {
      await api.put('/notifications/read-all');
    } catch (error) {
      console.error('[useNotifications] markAllRead failed:', error);
    }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        seedNotifications,
        markAsRead,
        markAllRead,
        clearAll,
        seeded,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
