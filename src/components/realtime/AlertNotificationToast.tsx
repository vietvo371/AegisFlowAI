'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Bell, CheckCircle2, Info } from 'lucide-react';
import { useAlertEvents } from '@/lib/useAlertEvents';

/**
 * Toast notifications cho alert events
 * Hiển thị theo severity level
 */
export function AlertNotificationToast() {
  useAlertEvents({
    onAlertCreated: (data) => {
      const severityConfig = getSeverityConfig(data.severity);

      toast.custom(
        (id) => (
          <div className={`flex items-start gap-3 p-4 rounded-lg border ${severityConfig.bg} ${severityConfig.border}`}>
            <div className={`${severityConfig.icon} flex-shrink-0`}>
              {severityConfig.icon}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{data.title}</p>
              {data.description && (
                <p className="text-xs text-muted-foreground mt-1">{data.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Khu vực: {Array.isArray(data.affected_districts) ? data.affected_districts.join(', ') : data.affected_districts || 'Không xác định'}
              </p>
            </div>
          </div>
        ),
        {
          duration: severityConfig.duration,
          position: 'top-right',
        }
      );
    },

    onAlertUpdated: (data) => {
      toast.info(`Cảnh báo ${data.alert_number} được cập nhật: ${data.status}`, {
        duration: 3000,
      });
    },

    onAlertResolved: (data) => {
      toast.success(`✅ Cảnh báo ${data.alert_number} đã được giải quyết`, {
        duration: 5000,
      });
    },
  });

  return null;
}

function getSeverityConfig(severity: string) {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
        duration: 10000,
        color: 'text-red-600',
      };
    case 'high':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
        duration: 8000,
        color: 'text-orange-600',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: <Info className="w-5 h-5 text-yellow-600" />,
        duration: 5000,
        color: 'text-yellow-600',
      };
    default:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: <Bell className="w-5 h-5 text-blue-600" />,
        duration: 4000,
        color: 'text-blue-600',
      };
  }
}
