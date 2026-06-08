'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Bell, Clock, RefreshCw, X, Filter, Zap } from 'lucide-react';
import { CascadeAlertCard } from './CascadeAlertCard';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface CascadeAlert {
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
}

interface CascadeAlertPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAlertClick?: (alert: CascadeAlert) => void;
}

type FilterType = 'all' | 'critical' | 'high' | 'medium' | 'low';
type SortType = 'severity' | 'arrival' | 'depth';

export function CascadeAlertPanel({ isOpen, onClose, onAlertClick }: CascadeAlertPanelProps) {
  const [alerts, setAlerts] = useState<CascadeAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('severity');

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/alerts/active');
      setAlerts(res.data.alerts || []);
    } catch (e) {
      console.error('[CascadeAlertPanel] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen, fetchAlerts]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [isOpen, fetchAlerts]);

  // Filter and sort
  const filteredAlerts = alerts
    .filter(a => filter === 'all' || a.severity === filter)
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (sortBy === 'severity') {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      if (sortBy === 'arrival') {
        return a.arrival_time_minutes - b.arrival_time_minutes;
      }
      if (sortBy === 'depth') {
        return b.water_depth_m - a.water_depth_m;
      }
      return 0;
    });

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 top-20 w-96 max-h-[calc(100vh-120px)] bg-background border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-red-500/10 to-orange-500/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell size={18} className="text-primary" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </div>
          <div>
            <h2 className="font-bold text-sm">Cảnh Báo Ngập Lụt</h2>
            <p className="text-[10px] text-muted-foreground">
              Cập nhật tự động mỗi 30s
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={fetchAlerts}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Summary */}
      {(criticalCount > 0 || highCount > 0) && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-950/30 flex items-center gap-2 text-xs border-b shrink-0">
          <Zap size={14} className="text-red-600" />
          <span className="font-medium text-red-700 dark:text-red-300">
            {criticalCount > 0 && `${criticalCount} vùng nguy cấp`}
            {criticalCount > 0 && highCount > 0 && ' • '}
            {highCount > 0 && `${highCount} vùng nghiêm trọng`}
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="px-4 py-2 border-b flex items-center gap-2 shrink-0 overflow-x-auto">
        <Filter size={12} className="text-muted-foreground shrink-0" />
        <div className="flex gap-1">
          {(['all', 'critical', 'high', 'medium', 'low'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-2 py-1 text-[10px] font-medium rounded-full transition-colors capitalize
                ${filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
                }
              `}
            >
              {f === 'all' ? 'Tất cả' : f}
            </button>
          ))}
        </div>
        
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortType)}
          className="ml-auto text-[10px] bg-muted border rounded px-1 py-0.5"
        >
          <option value="severity">Mức độ</option>
          <option value="arrival">Thời gian</option>
          <option value="depth">Độ sâu</option>
        </select>
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && alerts.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <RefreshCw size={20} className="animate-spin mr-2" />
            <span>Đang tải...</span>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle size={32} className="mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {filter === 'all' ? 'Không có cảnh báo nào' : `Không có cảnh báo ${filter}`}
            </p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <CascadeAlertCard
              key={alert.zone_id}
              alert={alert}
              onNavigate={() => onAlertClick?.(alert)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {alerts.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/30 text-center shrink-0">
          <p className="text-[10px] text-muted-foreground">
            <Clock size={10} className="inline mr-1" />
            Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}
          </p>
        </div>
      )}
    </div>
  );
}
