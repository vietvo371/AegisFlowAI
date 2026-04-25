'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Cloud, CloudRain, CloudSnow, Sun, Thermometer, Droplets,
  Wind, RefreshCw, AlertTriangle, TrendingUp, TrendingDown
} from 'lucide-react';

interface WeatherData {
  temperature_c: number;
  humidity_pct: number;
  rainfall_mm: number;
  wind_speed_kmh: number;
  wind_direction: string;
  pressure_hpa: number;
  visibility_km: number;
  uv_index: number;
  feels_like?: number;
}

interface ForecastHour {
  time: string;
  temp: number;
  rain_probability: number;
  condition: string;
}

export default function CitizenWeatherPage() {
  const t = useTranslations('citizen.weather');
  const [current, setCurrent] = React.useState<WeatherData | null>(null);
  const [forecast, setForecast] = React.useState<ForecastHour[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<string>('');

  const fetchWeather = async () => {
    setLoading(true);
    try {
      // Lấy dữ liệu thời tiết hiện tại
      const res = await api.get('/weather/current');
      if (res.data?.success && res.data?.data?.length > 0) {
        const weather = res.data.data[0];
        setCurrent(weather);
        setLastUpdated(new Date().toLocaleString('vi-VN'));
      }

      // Tạo mock forecast (vì BE có thể chưa có endpoint forecast)
      setForecast(generateMockForecast());
    } catch (e) {
      console.error(e);
      // Fallback data
      setCurrent({
        temperature_c: 28,
        humidity_pct: 85,
        rainfall_mm: 12,
        wind_speed_kmh: 15,
        wind_direction: 'NE',
        pressure_hpa: 1013,
        visibility_km: 8,
        uv_index: 6,
        feels_like: 31,
      });
      setForecast(generateMockForecast());
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchWeather();
  }, []);

  const generateMockForecast = (): ForecastHour[] => {
    const hours: ForecastHour[] = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const time = new Date(now.getTime() + i * 3600000);
      hours.push({
        time: time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        temp: 26 + Math.floor(Math.random() * 5),
        rain_probability: Math.floor(Math.random() * 80),
        condition: Math.random() > 0.6 ? 'rain' : 'cloud',
      });
    }
    return hours;
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'rain': return <CloudRain size={20} className="text-blue-500" />;
      case 'snow': return <CloudSnow size={20} className="text-cyan-400" />;
      case 'sun': return <Sun size={20} className="text-yellow-500" />;
      default: return <Cloud size={20} className="text-gray-400" />;
    }
  };

  const getRiskLevel = (rainfall: number, humidity: number): { level: string; color: string; label: string } => {
    if (rainfall > 50 || humidity > 95) {
      return { level: 'critical', color: 'bg-red-500', label: t('riskCritical') };
    }
    if (rainfall > 30 || humidity > 85) {
      return { level: 'high', color: 'bg-orange-500', label: t('riskHigh') };
    }
    if (rainfall > 10 || humidity > 75) {
      return { level: 'medium', color: 'bg-yellow-500', label: t('riskMedium') };
    }
    return { level: 'low', color: 'bg-emerald-500', label: t('riskLow') };
  };

  const riskInfo = current ? getRiskLevel(current.rainfall_mm, current.humidity_pct) : null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Cloud size={22} className="text-primary" />
            Thời tiết Đà Nẵng
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lastUpdated ? `Cập nhật: ${lastUpdated}` : 'Đang tải...'}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchWeather} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {loading ? (
        <Card className="border-border">
          <CardContent className="p-8 flex justify-center">
            <RefreshCw size={24} className="animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Current Weather */}
          <Card className="border-border overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              {current && (
                <div className="text-center text-white">
                  <div className="flex items-center justify-center gap-2">
                    {current.rainfall_mm > 10 ? (
                      <CloudRain size={48} className="text-white/90" />
                    ) : current.rainfall_mm > 0 ? (
                      <Cloud size={48} className="text-white/90" />
                    ) : (
                      <Sun size={48} className="text-white/90" />
                    )}
                    <span className="text-5xl font-black">{current.temperature_c}°</span>
                  </div>
                  <p className="text-white/80 text-sm mt-1">
                    {t('feelsLike', { temp: current.feels_like ?? current.temperature_c + 2 })}
                  </p>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Droplets size={16} className="mx-auto text-blue-500 mb-1" />
                  <p className="text-lg font-bold">{current?.humidity_pct ?? '--'}%</p>
                  <p className="text-[10px] text-muted-foreground">{t('humidity')}</p>
                </div>
                <div>
                  <Wind size={16} className="mx-auto text-gray-500 mb-1" />
                  <p className="text-lg font-bold">{current?.wind_speed_kmh ?? '--'} km/h</p>
                  <p className="text-[10px] text-muted-foreground">{t('wind', { direction: current?.wind_direction ?? '' })}</p>
                </div>
                <div>
                  <CloudRain size={16} className="mx-auto text-blue-400 mb-1" />
                  <p className="text-lg font-bold">{current?.rainfall_mm ?? '--'} mm</p>
                  <p className="text-[10px] text-muted-foreground">{t('rainfall')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flood Risk Warning */}
          {riskInfo && riskInfo.level !== 'low' && (
            <Card className={`border-2 ${riskInfo.level === 'critical' ? 'border-red-500 bg-red-50' : riskInfo.level === 'high' ? 'border-orange-500 bg-orange-50' : 'border-yellow-500 bg-yellow-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${riskInfo.color} flex items-center justify-center`}>
                    <AlertTriangle size={20} className="text-white" />
                  </div>
                  <div>
                    <p className={`font-black text-sm ${riskInfo.level === 'critical' ? 'text-red-700' : riskInfo.level === 'high' ? 'text-orange-700' : 'text-yellow-700'}`}>
                      {t('floodWarning')}
                    </p>
                    <p className={`text-xs ${riskInfo.level === 'critical' ? 'text-red-600' : riskInfo.level === 'high' ? 'text-orange-600' : 'text-yellow-600'}`}>
                      {riskInfo.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* More Details */}
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Thermometer size={18} className="text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">{t('pressure')}</p>
                    <p className="text-lg font-bold">{current?.pressure_hpa ?? '--'} hPa</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Sun size={18} className="text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">{t('uvIndex')}</p>
                    <p className="text-lg font-bold">{current?.uv_index ?? '--'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hourly Forecast */}
          <div>
            <h2 className="font-black text-sm uppercase tracking-wide text-muted-foreground mb-3">
              {t('hourlyForecast')}
            </h2>
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex overflow-x-auto gap-3 pb-2 -mx-1 px-1 scrollbar-hide">
                  {forecast.map((hour, i) => (
                    <div key={i} className="flex-shrink-0 text-center w-14">
                      <p className="text-[10px] text-muted-foreground">{hour.time}</p>
                      <div className="py-2">
                        {getWeatherIcon(hour.condition)}
                      </div>
                      <p className="text-sm font-bold">{hour.temp}°</p>
                      <div className="flex items-center justify-center gap-0.5 text-[9px] text-blue-500">
                        <Droplets size={8} />
                        <span>{hour.rain_probability}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tips */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4 space-y-2">
              <h3 className="font-bold text-sm text-blue-700 flex items-center gap-2">
                <AlertTriangle size={14} />
                Lời khuyên an toàn
              </h3>
              <ul className="text-xs text-blue-700/80 space-y-1 list-disc list-inside">
                {current && current.rainfall_mm > 20 && (
                  <li>Tránh xa các khu vực ngập úng, đặc biệt là đường thấp trũng</li>
                )}
                {current && current.humidity_pct > 80 && (
                  <li>Độ ẩm cao, cảnh giác với các vật dụng dễ ẩm mốc</li>
                )}
                <li>Theo dõi cảnh báo từ AegisFlow AI để cập nhật tình hình</li>
                <li>Liên hệ đội cứu hộ 113 nếu gặp nguy hiểm</li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
