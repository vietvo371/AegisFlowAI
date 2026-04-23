'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CloudRain, Wind, Droplets, Thermometer,
  TrendingUp, AlertCircle, Clock, Waves, RefreshCw
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import api from '@/lib/api';

interface WeatherData {
  district_id: number;
  temperature_c?: number;
  humidity_pct?: number;
  wind_speed_kmh?: number;
  wind_direction?: string;
  rainfall_mm?: number;
  recorded_at: string;
  district?: { id: number; name: string };
}

interface SensorData {
  id: number;
  name: string;
  type: string;
  last_value?: number;
  unit: string;
  alert_threshold?: number;
  danger_threshold?: number;
  status: string;
}

interface FloodRisk {
  risk_score: number;
  risk_level: string;
  confidence: number;
  probability: number;
  contributing_factors: Record<string, number>;
}

export function ForecastPanel() {
  const t = useTranslations('dashboard');
  const tF = useTranslations('dashboard.forecast');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [waterSensor, setWaterSensor] = useState<SensorData | null>(null);
  const [floodRisk, setFloodRisk] = useState<FloodRisk | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [weatherRes, sensorsRes] = await Promise.all([
        api.get('/weather/current'),
        api.get('/sensors', { params: { type: 'water_level', per_page: 5 } }),
      ]);

      const weatherList: WeatherData[] = weatherRes.data?.data ?? [];
      if (weatherList.length > 0) setWeather(weatherList[0]);

      const sensors: SensorData[] = sensorsRes.data?.data ?? [];
      const topSensor = sensors
        .filter(s => s.status === 'online' && s.last_value != null)
        .sort((a, b) => (b.last_value ?? 0) - (a.last_value ?? 0))[0] ?? null;
      setWaterSensor(topSensor);

      if (topSensor?.last_value != null) {
        const riskRes = await api.post(
          `${process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:5005'}/api/predict-risk`,
          {
            water_level_m: topSensor.last_value,
            rainfall_mm: weatherList[0]?.rainfall_mm ?? 0,
            hours_rain: 6,
            tide_level: 0,
            historical_score: 30,
          }
        );
        setFloodRisk(riskRes.data);
      }
    } catch (e) {
      console.error('ForecastPanel fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const riskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-emerald-500';
    }
  };

  const riskLabel = (level: string) => {
    switch (level) {
      case 'critical': return tF('riskCritical');
      case 'high': return tF('riskHigh');
      case 'medium': return tF('riskMedium');
      default: return tF('riskLow');
    }
  };

  const mainStats = [
    {
      icon: Droplets,
      label: tF('rainfall'),
      value: weather?.rainfall_mm != null ? `${weather.rainfall_mm}mm` : '—',
      sub: weather?.district?.name ?? 'Đà Nẵng',
      color: 'text-blue-500',
    },
    {
      icon: Waves,
      label: tF('waterLevel'),
      value: waterSensor?.last_value != null ? `${waterSensor.last_value}m` : '—',
      sub: waterSensor?.name ?? tF('noSensorData'),
      color: waterSensor?.danger_threshold && (waterSensor.last_value ?? 0) >= waterSensor.danger_threshold
        ? 'text-red-500' : 'text-orange-500',
    },
    {
      icon: Wind,
      label: tF('windSpeed'),
      value: weather?.wind_speed_kmh != null ? `${weather.wind_speed_kmh}km/h` : '—',
      sub: weather?.wind_direction ?? '—',
      color: 'text-slate-500',
    },
    {
      icon: Thermometer,
      label: tF('temperature'),
      value: weather?.temperature_c != null ? `${weather.temperature_c}°C` : '—',
      sub: weather?.humidity_pct != null ? `${tF('humidity')} ${weather.humidity_pct}%` : '—',
      color: 'text-rose-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* AI Risk Insight */}
      <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <TrendingUp size={80} className="rotate-12" />
        </div>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider">
              {t('aiInsight')}
            </Badge>
            {loading
              ? <RefreshCw className="w-3 h-3 animate-spin text-primary" />
              : <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            }
          </div>
          {floodRisk ? (
            <div className="space-y-2">
              <p className="text-sm font-medium leading-relaxed">
                {tF('riskLabel')}:{' '}
                <span className={`font-bold ${riskColor(floodRisk.risk_level)}`}>
                  {riskLabel(floodRisk.risk_level)} ({floodRisk.risk_score.toFixed(0)}/100)
                </span>
                {' '}— {tF('confidence')}{' '}
                <span className="text-primary font-bold">{Math.round(floodRisk.confidence * 100)}%</span>
              </p>
              {floodRisk.risk_level !== 'low' && (
                <p className="text-xs text-muted-foreground">
                  {tF('floodProbability')}: {Math.round(floodRisk.probability * 100)}% · {tF('waterContrib')} {floodRisk.contributing_factors.water_level?.toFixed(0)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm font-medium text-muted-foreground">
              {loading ? tF('analyzing') : tF('noData')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-4">
        {mainStats.map((stat, i) => (
          <Card key={i} className="border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon size={18} />
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">{stat.label}</div>
              </div>
              <div className="text-2xl font-black">{stat.value}</div>
              <div className="text-[10px] font-medium text-muted-foreground mt-1 truncate">{stat.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Flood Risk Detail */}
      {floodRisk && (
        <Card className="border-border shadow-sm">
          <CardHeader className="p-5 pb-0">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              {t('forecastRadar')}
              <Badge variant="secondary" className="text-[10px] font-medium">
                {waterSensor?.name ?? tF('sensor')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground text-[10px] uppercase">{tF('floodRiskTitle')}</span>
                <span className={riskColor(floodRisk.risk_level)}>{floodRisk.risk_score.toFixed(0)}%</span>
              </div>
              <Progress value={floodRisk.risk_score} className="h-1.5 bg-muted" />
            </div>

            {/* Contributing factors */}
            <div className="space-y-2">
              {Object.entries(floodRisk.contributing_factors).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground capitalize">{key.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(val / 40) * 100}%` }} />
                    </div>
                    <span className="font-mono font-bold w-6 text-right">{val.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>

            {floodRisk.risk_level !== 'low' && (
              <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-3">
                <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={16} />
                <div className="text-[11px] font-medium text-orange-700 leading-relaxed">
                  {floodRisk.risk_level === 'critical' ? tF('alertCritical') : tF('alertHigh')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
