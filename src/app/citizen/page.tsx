'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { useNearestDistrict } from '@/hooks/useNearestDistrict';
import { motion } from 'framer-motion';
import {
  AlertTriangle, MapPin, CloudRain, FileText,
  Bell, ChevronRight, Droplets, Thermometer,
  Home as HomeIcon, Clock, Waves, Wind, Zap,
  ShieldCheck, TrendingUp,
} from 'lucide-react';

interface AlertData {
  id: number;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

interface PredictionData {
  id: number;
  prediction_type: string;
  predicted_value: number;
  confidence: number;
  probability: number;
  severity: string;
  horizon_minutes: number;
  prediction_for: string;
  issued_at: string;
  district?: { name: string };
}

interface SensorData {
  water_level: number | null;
  rainfall: number | null;
  humidity: number | null;
  temperature: number | null;
  wind_speed: number | null;
  updated_at: string;
}

const severityConfig = {
  critical: { border: 'border-l-red-500', badge: 'bg-red-100 text-red-600', badgeDark: 'dark:bg-red-500/20 dark:text-red-400', label: 'Nghiêm trọng', dot: 'bg-red-500' },
  high:     { border: 'border-l-orange-500', badge: 'bg-orange-100 text-orange-600', badgeDark: 'dark:bg-orange-500/20 dark:text-orange-400', label: 'Cao', dot: 'bg-orange-500' },
  medium:   { border: 'border-l-yellow-500', badge: 'bg-yellow-100 text-yellow-700', badgeDark: 'dark:bg-yellow-500/20 dark:text-yellow-400', label: 'Trung bình', dot: 'bg-yellow-500' },
  low:      { border: 'border-l-blue-500', badge: 'bg-blue-100 text-blue-600', badgeDark: 'dark:bg-blue-500/20 dark:text-blue-400', label: 'Thông tin', dot: 'bg-blue-500' },
};

export default function CitizenDashboard() {
  const t = useTranslations('citizen');
  const { user } = useAuth();
  const { districtId, districtName, loading: locationLoading } = useNearestDistrict();
  const [alerts, setAlerts] = React.useState<AlertData[]>([]);
  const [prediction, setPrediction] = React.useState<PredictionData | null>(null);
  const [sensors, setSensors] = React.useState<SensorData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (locationLoading) return;

    const fetchData = async () => {
      try {
        const api = (await import('@/lib/api')).default;

        const sensorParams: any = { per_page: 200 };
        if (districtId) sensorParams.district_id = districtId;

        const [alertsRes, sensorsRes, weatherRes, waterSensorsRes, allSensorsRes, predictionsRes] = await Promise.allSettled([
          api.get('/alerts', { params: { status: 'active', per_page: 5 } }),
          api.get('/sensors', { params: sensorParams }),
          districtId
            ? api.get('/weather/current', { params: { district_id: districtId } })
            : Promise.reject('no district'),
          api.get('/sensors', { params: { type: 'water_level', per_page: 50 } }),
          api.get('/sensors', { params: { per_page: 200 } }),
          api.get('/predictions', { params: { status: 'active', per_page: 1 } }),
        ]);

        if (alertsRes.status === 'fulfilled') {
          setAlerts(alertsRes.value.data?.data ?? []);
        }

        if (predictionsRes.status === 'fulfilled') {
          const pList = predictionsRes.value.data?.data ?? [];
          if (pList.length > 0) setPrediction(pList[0]);
        }

        let merged: Partial<SensorData> = {};

        if (weatherRes.status === 'fulfilled') {
          const weatherList: any[] = weatherRes.value.data?.data ?? [];
          if (weatherList.length > 0) {
            const w = weatherList[0];
            const temp = parseFloat(w.temperature_c);
            const h = parseFloat(w.humidity_pct);
            const r = parseFloat(w.rainfall_mm);
            if (!isNaN(temp)) merged.temperature = temp;
            if (!isNaN(h)) merged.humidity = h;
            if (!isNaN(r)) merged.rainfall = r;
            const ws = parseFloat(w.wind_speed_kmh);
            if (!isNaN(ws)) merged.wind_speed = ws;
          }
        }

        if (waterSensorsRes.status === 'fulfilled') {
          const wList: any[] = waterSensorsRes.value.data?.data ?? [];
          const vals = wList
            .map((x: any) => parseFloat(x.last_value))
            .filter((v) => !isNaN(v) && v > 0);
          if (vals.length) {
            const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
            merged.water_level = avg;
          }
        }

        if (sensorsRes.status === 'fulfilled') {
          const sensorList: any[] = sensorsRes.value.data?.data ?? [];
          const fallback = (type: string) => {
            if (merged[type as keyof SensorData] != null) return;
            const s = sensorList.find((x: any) => x.type === type && x.last_value != null);
            if (!s) return;
            const v = parseFloat(s.last_value);
            if (!isNaN(v)) (merged as any)[type] = v;
          };
          fallback('rainfall'); fallback('temperature'); fallback('humidity');
        }

        if (allSensorsRes.status === 'fulfilled') {
          const allList: any[] = allSensorsRes.value.data?.data ?? [];
          const fallback2 = (type: string) => {
            if (merged[type as keyof SensorData] != null) return;
            const s = allList.find((x: any) => x.type === type && x.last_value != null);
            if (!s) return;
            const v = parseFloat(s.last_value);
            if (!isNaN(v)) (merged as any)[type] = v;
          };
          fallback2('rainfall'); fallback2('temperature'); fallback2('humidity');
        }

        setSensors({
          water_level: merged.water_level ?? null,
          rainfall: merged.rainfall ?? null,
          humidity: merged.humidity ?? null,
          temperature: merged.temperature ?? null,
          wind_speed: merged.wind_speed ?? null,
          updated_at: new Date().toISOString(),
        });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const handler = () => fetchData();
    window.addEventListener('aegis:alert:created', handler);
    return () => window.removeEventListener('aegis:alert:created', handler);
  }, [districtId, locationLoading]);

  const criticalAlert = alerts.find((a) => a.severity === 'critical' || a.severity === 'high');

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
  };

  const riskLevel = (prediction && prediction.probability >= 0.7) ? 'high'
    : alerts.some(a => a.severity === 'critical') ? 'high'
    : (prediction && prediction.probability >= 0.4) ? 'medium'
    : alerts.some(a => a.severity === 'high') ? 'medium'
    : 'low';
  const riskPercent = prediction ? Math.round(prediction.probability * 100) : (riskLevel === 'high' ? 85 : riskLevel === 'medium' ? 55 : 20);
  const riskConfig = {
    high: { label: 'Cao', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/20', bar: 'bg-red-500' },
    medium: { label: 'Trung bình', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-500/20', bar: 'bg-orange-500' },
    low: { label: 'Thấp', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-500/20', bar: 'bg-green-500' },
  };
  const risk = riskConfig[riskLevel];

  return (
    <div className="max-w-lg mx-auto">
      {/* ── Gradient Header ── */}
      <div className="bg-gradient-to-br from-violet-600 via-primary to-purple-500 px-5 pt-6 pb-10 text-white rounded-b-[2rem]">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-[11px] text-white/70">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
            <h1 className="text-[22px] font-bold mt-0.5">
              {t('home.greeting', { name: user?.name?.split(' ')[0] ?? '' })} 👋
            </h1>
          </div>
          <Link href="/citizen/alerts" className="relative">
            <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bell size={19} className="text-white" />
            </div>
            {alerts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-red-500 border-2 border-purple-600 rounded-full text-[9px] font-bold flex items-center justify-center">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </Link>
        </div>

        {/* AI monitoring badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-[11px] font-medium text-white/90">AI đang theo dõi khu vực của bạn</span>
        </div>
      </div>

      {/* ── Weather Card (overlapping header) ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-4 -mt-6 relative z-10"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🌧️</div>
            <div className="flex-1">
              <span className="text-2xl font-bold">
                {sensors?.temperature != null ? `${sensors.temperature}°` : '--°'}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sensors?.rainfall != null && sensors.rainfall > 0 ? 'Mưa rào' : 'Nhiều mây'}
                {sensors?.humidity != null ? `, độ ẩm ${sensors.humidity > 70 ? 'cao' : 'TB'}` : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Droplets size={13} className="text-blue-500" />
              <span>{sensors?.humidity != null ? `${sensors.humidity}%` : '--%'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CloudRain size={13} className="text-blue-500" />
              <span>{sensors?.rainfall != null ? `${sensors.rainfall}mm/h` : '--mm/h'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wind size={13} className="text-blue-500" />
              <span>{sensors?.wind_speed != null ? `${sensors.wind_speed}km/h` : '--km/h'}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── AI Prediction Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-4 mt-4"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Zap size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">Dự báo AI thông minh</p>
                <p className="text-[11px] text-muted-foreground">
                  {prediction ? `Cập nhật ${timeAgo(prediction.issued_at)}` : 'Đang tải...'}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </div>

          {/* Prediction highlight */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10 rounded-xl p-3.5 mb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                  {prediction ? `Nguy cơ ngập trong ${Math.round((prediction.horizon_minutes ?? 120) / 60)} giờ tới` : 'Đang phân tích...'}
                </p>
                <p className="text-[11px] text-orange-600/80 dark:text-orange-400/70 mt-1">
                  {districtName ? `Khu vực ${districtName}` : 'Khu vực lân cận'} — Mực nước dự kiến {prediction?.predicted_value != null ? `${prediction.predicted_value}m` : (sensors?.water_level ? `${(sensors.water_level / 100).toFixed(1)}m` : '--')}
                </p>
              </div>
              <div className="text-right ml-3">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{prediction ? `${Math.round(prediction.confidence * 100)}%` : '--%'}</p>
                <p className="text-[9px] uppercase tracking-wider text-orange-500 font-semibold">Độ tin cậy</p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2.5 bg-muted/50 rounded-xl">
              <p className="text-base font-bold">{sensors?.rainfall != null ? `${sensors.rainfall}mm` : '--'}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Lượng mưa</p>
            </div>
            <div className="text-center p-2.5 bg-muted/50 rounded-xl">
              <p className="text-base font-bold">{sensors?.water_level != null ? `${(sensors.water_level / 100).toFixed(1)}m` : '--'}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Triều cường</p>
            </div>
            <div className="text-center p-2.5 bg-muted/50 rounded-xl">
              <p className="text-base font-bold">{sensors?.humidity != null ? `${sensors.humidity}%` : '--%'}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Độ bão hòa</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Risk Assessment ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mx-4 mt-4"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-muted-foreground" />
              <span className="text-sm font-bold">Đánh giá rủi ro khu vực</span>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${risk.bg} ${risk.color}`}>
              {risk.label}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${risk.bar}`} style={{ width: `${riskPercent}%` }} />
          </div>

          {/* Factors grid */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="flex items-center gap-2.5 p-2.5 bg-muted/40 rounded-xl">
              <CloudRain size={16} className="text-blue-500 shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground">Lượng mưa</p>
                <p className="text-xs font-semibold">{sensors?.rainfall != null ? `${sensors.rainfall}mm/h` : '--'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 bg-muted/40 rounded-xl">
              <Waves size={16} className="text-blue-500 shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground">Mực nước</p>
                <p className="text-xs font-semibold">{sensors?.water_level != null ? `${(sensors.water_level / 100).toFixed(1)}m` : '--'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 bg-muted/40 rounded-xl">
              <TrendingUp size={16} className="text-orange-500 shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground">Triều cường</p>
                <p className="text-xs font-semibold">{sensors?.water_level != null && sensors.water_level > 30 ? 'Cao điểm' : 'Bình thường'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 bg-muted/40 rounded-xl">
              <Droplets size={16} className="text-green-500 shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground">Thoát nước</p>
                <p className="text-xs font-semibold">{sensors?.rainfall != null && sensors.rainfall > 20 ? 'Quá tải' : 'Bình thường'}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Quick Actions (horizontal row) ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-4 mt-5"
      >
        <div className="flex justify-between">
          {[
            { href: '/citizen/request', icon: FileText,      color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/20', label: 'Báo cáo\nngập' },
            { href: '/citizen/sos',     icon: AlertTriangle, color: 'text-red-500',  bg: 'bg-red-100 dark:bg-red-500/20',  label: 'Cứu hộ' },
            { href: '/citizen/shelters', icon: HomeIcon,     color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-500/20', label: 'Trú ẩn' },
            { href: '/citizen/map',     icon: MapPin,        color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-500/20', label: 'Bản đồ' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-2 w-[72px]">
              <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center`}>
                <item.icon size={24} className={item.color} />
              </div>
              <span className="text-[11px] font-medium text-center leading-tight whitespace-pre-line">{item.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Critical Alert Banner ── */}
      {criticalAlert && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="px-4 mt-5"
        >
          <Link href="/citizen/alerts" className="block">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl p-4 flex items-center gap-3.5 text-white shadow-lg">
              <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[14px] leading-tight">Cảnh báo ngập nghiêm trọng</p>
                <p className="text-[12px] text-white/85 truncate mt-0.5">{criticalAlert.title}</p>
              </div>
              <ChevronRight size={20} className="text-white/60 shrink-0" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* ── Active Alerts List ── */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">Cảnh báo đang hoạt động</h2>
          <Link href="/citizen/alerts" className="text-[13px] font-semibold text-primary flex items-center gap-0.5">
            Xem tất cả <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert, i) => {
              const cfg = severityConfig[alert.severity] ?? severityConfig.low;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                >
                  <Link href="/citizen/alerts">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-border/50 flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${cfg.badge} ${cfg.badgeDark} flex items-center justify-center shrink-0 mt-0.5`}>
                        <AlertTriangle size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-[13px] leading-snug">{alert.title}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.badge} ${cfg.badgeDark}`}>
                            {cfg.label.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1.5">
                          <Clock size={11} />
                          {timeAgo(alert.created_at)}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">{t('home.noAlerts')}</p>
          </div>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
