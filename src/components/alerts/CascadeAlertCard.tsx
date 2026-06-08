'use client';

import { useState } from 'react';
import { AlertTriangle, Clock, Droplets, MapPin, Navigation, Building2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CascadeAlertCardProps {
  alert: {
    zone_id: string;
    zone_name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    alert_type: string;
    title: string;
    message: string;
    lat: number;
    lng: number;
    arrival_time_minutes: number;
    water_depth_m: number;
    recommended_action: string;
    shelter_nearby?: string;
    shelter_distance_m?: number;
    color: string;
  };
  onDismiss?: () => void;
  onNavigate?: () => void;
}

const SEVERITY_CONFIG = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-500',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    icon: 'text-red-600 dark:text-red-400',
    pulse: true,
  },
  high: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-500',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    icon: 'text-orange-600 dark:text-orange-400',
    pulse: false,
  },
  medium: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-500',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    icon: 'text-yellow-600 dark:text-yellow-400',
    pulse: false,
  },
  low: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-500',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400',
    pulse: false,
  },
};

export function CascadeAlertCard({ alert, onDismiss, onNavigate }: CascadeAlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;

  const getArrivalLabel = (minutes: number) => {
    if (minutes < 1) return 'ĐANG NGẬP';
    if (minutes < 60) return `${Math.round(minutes)} phút`;
    return `${Math.round(minutes / 60)} giờ`;
  };

  return (
    <div
      className={`
        relative rounded-xl border-2 overflow-hidden transition-all duration-300
        ${config.bg} ${config.border}
        ${config.pulse ? 'animate-pulse-subtle' : ''}
      `}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-start gap-3">
        <div className={`mt-0.5 ${config.icon}`}>
          <AlertTriangle size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${config.badge}`}>
              {alert.severity}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {alert.alert_type.replace('_', ' ')}
            </span>
          </div>
          
          <h3 className="font-bold text-sm leading-tight mb-1">
            {alert.title}
          </h3>
          
          <p className="text-xs text-muted-foreground line-clamp-2">
            {alert.message}
          </p>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X size={14} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="px-4 py-2 bg-background/50 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <Clock size={12} className="text-muted-foreground" />
          <span className="font-medium">
            {getArrivalLabel(alert.arrival_time_minutes)}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Droplets size={12} className="text-muted-foreground" />
          <span className="font-medium">
            {alert.water_depth_m.toFixed(1)}m
          </span>
        </div>

        {alert.shelter_nearby && (
          <div className="flex items-center gap-1">
            <Building2 size={12} className="text-green-600" />
            <span className="text-green-600 font-medium">
              {alert.shelter_nearby} ({alert.shelter_distance_m}m)
            </span>
          </div>
        )}
      </div>

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        {expanded ? (
          <>
            <span>Thu gọn</span>
            <ChevronUp size={14} />
          </>
        ) : (
          <>
            <span>Xem chi tiết</span>
            <ChevronDown size={14} />
          </>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Recommended action */}
          <div className="p-3 bg-background/80 rounded-lg border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
              Hành động khuyến nghị
            </p>
            <p className="text-sm font-medium">
              {alert.recommended_action}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {onNavigate && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs"
                onClick={onNavigate}
              >
                <MapPin size={12} className="mr-1" />
                Xem trên bản đồ
              </Button>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${alert.lat},${alert.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button
                size="sm"
                className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700"
              >
                <Navigation size={12} className="mr-1" />
                Chỉ đường
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
