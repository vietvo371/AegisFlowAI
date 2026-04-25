'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Bell, MapPin, Clock, Users, Navigation,
  X, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAlertEvents } from '@/lib/useAlertEvents';

interface AlertPopupData {
  id: number;
  title: string;
  description?: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_districts?: string[];
  status: string;
}

/**
 * Modal popup hiển thị alert mới với animation
 * Tự động đóng hoặc wait cho user action
 */
export function AlertPopupModal() {
  const [alert, setAlert] = useState<AlertPopupData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useAlertEvents({
    onAlertCreated: (data) => {
      setAlert(data);
      setIsVisible(true);

      // Tự động đóng sau 10 giây (nếu severity low/medium)
      if (data.severity === 'low' || data.severity === 'medium') {
        setTimeout(() => setIsVisible(false), 10000);
      }
    },
  });

  if (!alert) return null;

  const config = getSeverityConfig(alert.severity);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsVisible(false)}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50
              w-full max-w-md rounded-xl shadow-2xl border overflow-hidden`}
          >
            {/* Header */}
            <div className={`${config.bg} ${config.border} border-b px-6 py-4 flex items-start justify-between`}>
              <div className="flex items-start gap-3 flex-1">
                <div className={config.icon}>
                  {config.iconComponent}
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${config.textColor}`}>
                    {alert.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {config.badgeLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="bg-background px-6 py-4 space-y-4">
              {alert.description && (
                <div>
                  <p className="text-sm text-foreground">{alert.description}</p>
                </div>
              )}

              {/* Affected Areas */}
              {Array.isArray(alert.affected_districts) && alert.affected_districts.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                  <MapPin size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Khu vực ảnh hưởng</p>
                    <p className="text-sm text-foreground mt-1">
                      {alert.affected_districts.join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Alert Type Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Loại:</span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${config.badgeBg} ${config.badgeText}`}>
                  {getAlertTypeLabel(alert.alert_type)}
                </span>
              </div>

              {/* Guidance for Citizens */}
              {alert.severity === 'critical' || alert.alert_type === 'evacuation' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-600">Hành động cần thiết</p>
                      <p className="text-sm text-red-700 mt-1">
                        {getActionGuidance(alert.alert_type)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="bg-muted px-6 py-4 flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                Đóng
              </Button>
              <Button
                size="sm"
                className={config.buttonClass}
                onClick={() => {
                  // Navigate to alert details
                  window.location.href = `/dashboard/alerts/${alert.id}`;
                }}
              >
                Xem chi tiết
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function getSeverityConfig(severity: string) {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        iconComponent: <AlertTriangle size={24} className="text-red-600" />,
        icon: 'flex-shrink-0',
        textColor: 'text-red-600',
        badgeLabel: '🚨 Mức độ: Nghiêm trọng',
        badgeBg: 'bg-red-100',
        badgeText: 'text-red-700',
        buttonClass: 'bg-red-600 hover:bg-red-700',
      };
    case 'high':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        iconComponent: <AlertCircle size={24} className="text-orange-600" />,
        icon: 'flex-shrink-0',
        textColor: 'text-orange-600',
        badgeLabel: '⚠️ Mức độ: Cao',
        badgeBg: 'bg-orange-100',
        badgeText: 'text-orange-700',
        buttonClass: 'bg-orange-600 hover:bg-orange-700',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        iconComponent: <Bell size={24} className="text-yellow-600" />,
        icon: 'flex-shrink-0',
        textColor: 'text-yellow-600',
        badgeLabel: 'ℹ️ Mức độ: Trung bình',
        badgeBg: 'bg-yellow-100',
        badgeText: 'text-yellow-700',
        buttonClass: 'bg-yellow-600 hover:bg-yellow-700',
      };
    default:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        iconComponent: <Bell size={24} className="text-blue-600" />,
        icon: 'flex-shrink-0',
        textColor: 'text-blue-600',
        badgeLabel: 'ℹ️ Mức độ: Thấp',
        badgeBg: 'bg-blue-100',
        badgeText: 'text-blue-700',
        buttonClass: 'bg-blue-600 hover:bg-blue-700',
      };
  }
}

function getAlertTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    flood_warning: 'Cảnh báo ngập',
    heavy_rain: 'Mưa lớn',
    dam_warning: 'Cảnh báo đập',
    evacuation: 'Lệnh sơ tán',
    all_clear: 'Dỡ cảnh báo',
    weather: 'Thời tiết',
  };
  return labels[type] || type;
}

function getActionGuidance(alertType: string): string {
  const guidance: Record<string, string> = {
    flood_warning: 'Sơ tán đến địa điểm an toàn. Tránh vùng nước cao.',
    evacuation: 'PHẢI SƠ TÁN NGAY - Theo hướng dẫn cảnh sát giao thông.',
    heavy_rain: 'Ở nhà nếu có thể. Hạn chế đi lại ngoài.',
    dam_warning: 'Sơ tán khỏi khu vực gần đập. Nghe theo hướng dẫn chính quyền.',
    all_clear: 'An toàn - Có thể quay lại bình thường.',
    weather: 'Theo dõi thông tin cảnh báo thêm.',
  };
  return guidance[alertType] || 'Vui lòng kiểm tra thông tin chi tiết';
}
