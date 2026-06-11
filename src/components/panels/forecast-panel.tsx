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

interface FloodZone {
  id: number;
  name: string;
  risk_level?: string;
  risk_level_label?: string;
  status?: string;
  current_water_level_m?: number | string | null;
  alert_threshold_m?: number | string | null;
  danger_threshold_m?: number | string | null;
  population_affected?: number | null;
  district?: { id: number; name: string } | null;
}

interface PredictionData {
  id: number;
  predicted_value?: number | string | null;
  confidence?: number | string | null;
  probability?: number | string | null;
  severity?: string | null;
  flood_zone?: { id: number; name: string } | null;
  issued_at?: string | null;
}

interface FloodReportFeature {
  id?: number | string;
  properties?: {
    address?: string | null;
    street_name?: string | null;
    ward_name?: string | null;
    district_name?: string | null;
    water_level_cm?: number | string | null;
    reported_at?: string | null;
  };
}

const getListData = <T,>(payload: any): T[] => {
  const data = payload?.data?.data ?? payload?.data ?? [];
  return Array.isArray(data) ? data : [];
};

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeLevel = (level?: string | null) => {
  if (level === 'critical' || level === 'high' || level === 'medium' || level === 'low') {
    return level;
  }
  if (level === 'very_high' || level === 'severe') return 'critical';
  if (level === 'moderate') return 'medium';
  return 'low';
};

const estimateRisk = (waterLevelM = 0, rainfallMm = 0, zoneLevel?: string | null): FloodRisk => {
  const waterScore = Math.min(45, waterLevelM * 12);
  const rainScore = Math.min(30, rainfallMm * 1.2);
  const zoneScore = zoneLevel === 'critical' ? 25 : zoneLevel === 'high' ? 18 : zoneLevel === 'medium' ? 10 : 4;
  const riskScore = Math.min(100, Math.max(8, waterScore + rainScore + zoneScore));
  const riskLevel = riskScore >= 75 ? 'critical' : riskScore >= 55 ? 'high' : riskScore >= 30 ? 'medium' : 'low';

  return {
    risk_score: riskScore,
    risk_level: riskLevel,
    confidence: waterLevelM > 0 || rainfallMm > 0 ? 0.78 : 0.62,
    probability: Math.min(0.95, riskScore / 100),
    contributing_factors: {
      water_level: waterScore,
      rainfall: rainScore,
      flood_zone: zoneScore,
    },
  };
};

const DA_NANG_FALLBACK_WEATHER = {
  windSpeedKmh: 12,
  windDirection: 'Đông Bắc',
  temperatureC: 28,
  humidityPct: 78,
  sourceLabel: 'Ước tính Đà Nẵng',
};

export function ForecastPanel() {
  const t = useTranslations('dashboard');
  const tF = useTranslations('dashboard.forecast');
  const tCommon = useTranslations('common');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [waterSensor, setWaterSensor] = useState<SensorData | null>(null);
  const [rainSensor, setRainSensor] = useState<SensorData | null>(null);
  const [windSensor, setWindSensor] = useState<SensorData | null>(null);
  const [temperatureSensor, setTemperatureSensor] = useState<SensorData | null>(null);
  const [humiditySensor, setHumiditySensor] = useState<SensorData | null>(null);
  const [floodRisk, setFloodRisk] = useState<FloodRisk | null>(null);
  const [floodZones, setFloodZones] = useState<FloodZone[]>([]);
  const [floodReports, setFloodReports] = useState<FloodReportFeature[]>([]);
  const [latestPrediction, setLatestPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [weatherResult, sensorsResult, zonesResult, reportsResult, predictionsResult] = await Promise.allSettled([
        api.get('/weather/current'),
        api.get('/sensors', { params: { per_page: 100 } }),
        api.get('/flood-zones', { params: { per_page: 5 } }),
        api.get('/map/flood-reports'),
        api.get('/predictions', { params: { recent_only: 1, per_page: 1 } }),
      ]);

      const weatherList = weatherResult.status === 'fulfilled'
        ? getListData<WeatherData>(weatherResult.value)
        : [];
      const nextWeather = weatherList[0] ?? null;
      setWeather(nextWeather);

      const sensors = sensorsResult.status === 'fulfilled'
        ? getListData<SensorData>(sensorsResult.value)
        : [];

      const pickSensor = (types: string[]) => sensors
        .filter(s => types.includes(String(s.type).toLowerCase()) && s.last_value != null)
        .sort((a, b) => (a.status === 'online' ? -1 : 1) - (b.status === 'online' ? -1 : 1))[0] ?? null;

      const topSensor = sensors
        .filter(s => String(s.type).toLowerCase() === 'water_level')
        .filter(s => s.last_value != null)
        .sort((a, b) => (a.status === 'online' ? -1 : 1) - (b.status === 'online' ? -1 : 1))
        .sort((a, b) => (b.last_value ?? 0) - (a.last_value ?? 0))[0] ?? null;
      setWaterSensor(topSensor);
      setRainSensor(pickSensor(['rainfall', 'rain', 'rain_station']));
      setWindSensor(pickSensor(['wind', 'wind_speed']));
      setTemperatureSensor(pickSensor(['temperature', 'temp']));
      setHumiditySensor(pickSensor(['humidity']));

      const zones = zonesResult.status === 'fulfilled'
        ? getListData<FloodZone>(zonesResult.value)
        : [];
      const sortedZones = zones.sort((a, b) => {
        const aLevel = toNumber(a.current_water_level_m) ?? 0;
        const bLevel = toNumber(b.current_water_level_m) ?? 0;
        return bLevel - aLevel;
      });
      setFloodZones(sortedZones);

      const reports = reportsResult.status === 'fulfilled'
        ? reportsResult.value.data?.features ?? []
        : [];
      setFloodReports(reports);

      const predictions = predictionsResult.status === 'fulfilled'
        ? getListData<PredictionData>(predictionsResult.value)
        : [];
      const prediction = predictions[0] ?? null;
      setLatestPrediction(prediction);

      const topZone = sortedZones[0] ?? null;
      const maxReportWaterLevelM = reports.reduce((max: number, report: FloodReportFeature) => {
        const valueM = (toNumber(report.properties?.water_level_cm) ?? 0) / 100;
        return Math.max(max, valueM);
      }, 0);
      const waterLevel = topSensor?.last_value ?? toNumber(topZone?.current_water_level_m) ?? maxReportWaterLevelM;
      const rainfall = nextWeather?.rainfall_mm ?? rainSensor?.last_value ?? pickSensor(['rainfall', 'rain', 'rain_station'])?.last_value ?? 0;

      if (prediction) {
        const score = toNumber(prediction.predicted_value) ?? Math.round((toNumber(prediction.probability) ?? 0.35) * 100);
        setFloodRisk({
          risk_score: Math.min(100, Math.max(0, score)),
          risk_level: normalizeLevel(prediction.severity),
          confidence: toNumber(prediction.confidence) ?? 0.75,
          probability: toNumber(prediction.probability) ?? Math.min(0.95, score / 100),
          contributing_factors: {
            water_level: Math.min(45, waterLevel * 12),
            rainfall: Math.min(30, rainfall * 1.2),
            ai_prediction: 20,
          },
        });
        return;
      }

      if (waterLevel > 0 || rainfall > 0 || topZone || reports.length > 0) {
        try {
          const riskRes = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:5005'}/api/predict-risk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              water_level_m: waterLevel,
              rainfall_mm: rainfall,
              hours_rain: 6,
              tide_level: 0,
              historical_score: 30,
            }),
          });

          if (!riskRes.ok) throw new Error('AI risk service unavailable');
          setFloodRisk(await riskRes.json());
        } catch {
          setFloodRisk(estimateRisk(waterLevel, rainfall, normalizeLevel(topZone?.risk_level)));
        }
      } else {
        setFloodRisk(null);
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

  const topZone = floodZones[0] ?? null;
  const fallbackWaterLevel = toNumber(topZone?.current_water_level_m);
  const topFloodReport = floodReports
    .slice()
    .sort((a, b) => (toNumber(b.properties?.water_level_cm) ?? 0) - (toNumber(a.properties?.water_level_cm) ?? 0))[0];
  const topReportWaterLevel = topFloodReport ? (toNumber(topFloodReport.properties?.water_level_cm) ?? 0) / 100 : undefined;
  const fallbackWaterName = topZone
    ? `${topZone.name}${topZone.district?.name ? `, ${topZone.district.name}` : ''}`
    : topFloodReport
      ? topFloodReport.properties?.street_name || topFloodReport.properties?.ward_name || topFloodReport.properties?.address || 'Báo cáo ngập thực tế'
      : tF('noSensorData');

  const mainStats = [
    {
      icon: Droplets,
      label: tF('rainfall'),
      value: weather?.rainfall_mm != null
        ? `${weather.rainfall_mm}mm`
        : rainSensor?.last_value != null
          ? `${rainSensor.last_value}${rainSensor.unit || 'mm'}`
          : '0mm',
      sub: weather?.district?.name ?? rainSensor?.name ?? tCommon('cityName'),
      color: 'text-blue-500',
    },
    {
      icon: Waves,
      label: tF('waterLevel'),
      value: waterSensor?.last_value != null ? `${waterSensor.last_value}m` : fallbackWaterLevel != null ? `${fallbackWaterLevel}m` : topReportWaterLevel != null ? `${topReportWaterLevel.toFixed(2)}m` : '—',
      sub: waterSensor?.name ?? fallbackWaterName,
      color: waterSensor?.danger_threshold && (waterSensor.last_value ?? fallbackWaterLevel ?? topReportWaterLevel ?? 0) >= waterSensor.danger_threshold
        ? 'text-red-500' : 'text-orange-500',
    },
    {
      icon: Wind,
      label: tF('windSpeed'),
      value: weather?.wind_speed_kmh != null
        ? `${weather.wind_speed_kmh}km/h`
        : windSensor?.last_value != null
          ? `${windSensor.last_value}${windSensor.unit || 'km/h'}`
          : `${DA_NANG_FALLBACK_WEATHER.windSpeedKmh}km/h`,
      sub: weather?.wind_direction ? (!isNaN(Number(weather.wind_direction)) ? `Hướng: ${weather.wind_direction}°` : weather.wind_direction) : windSensor?.name ?? `${DA_NANG_FALLBACK_WEATHER.windDirection} · ${DA_NANG_FALLBACK_WEATHER.sourceLabel}`,
      color: 'text-slate-500',
    },
    {
      icon: Thermometer,
      label: tF('temperature'),
      value: weather?.temperature_c != null
        ? `${weather.temperature_c}°C`
        : temperatureSensor?.last_value != null
          ? `${temperatureSensor.last_value}${temperatureSensor.unit || '°C'}`
          : `${DA_NANG_FALLBACK_WEATHER.temperatureC}°C`,
      sub: weather?.humidity_pct != null
        ? `${tF('humidity')} ${weather.humidity_pct}%`
        : humiditySensor?.last_value != null
          ? `${tF('humidity')} ${humiditySensor.last_value}${humiditySensor.unit || '%'}`
          : temperatureSensor?.name ?? `${tF('humidity')} ${DA_NANG_FALLBACK_WEATHER.humidityPct}% · ${DA_NANG_FALLBACK_WEATHER.sourceLabel}`,
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
                  {latestPrediction?.flood_zone?.name ? ` · ${latestPrediction.flood_zone.name}` : topZone?.name ? ` · ${topZone.name}` : floodReports.length ? ` · ${floodReports.length} báo cáo ngập` : ''}
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

      {floodZones.length > 0 && (
        <Card className="border-border shadow-sm">
          <CardHeader className="p-5 pb-0">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              Điểm nóng theo dõi
              <Badge variant="secondary" className="text-[10px] font-medium">
                {floodZones.length} vùng
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {floodZones.slice(0, 3).map((zone) => {
              const level = toNumber(zone.current_water_level_m) ?? 0;
              const danger = toNumber(zone.danger_threshold_m) ?? 3;
              const alert = toNumber(zone.alert_threshold_m) ?? 1.5;
              const percent = Math.min(100, Math.round((level / Math.max(danger, alert, 1)) * 100));
              const color = level >= danger ? 'bg-red-500' : level >= alert ? 'bg-orange-500' : 'bg-emerald-500';

              return (
                <div key={zone.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{zone.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {zone.risk_level_label || riskLabel(normalizeLevel(zone.risk_level))}
                      </p>
                    </div>
                    <span className="font-mono font-bold shrink-0">{level.toFixed(2)}m</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {floodZones.length === 0 && floodReports.length > 0 && (
        <Card className="border-border shadow-sm">
          <CardHeader className="p-5 pb-0">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              Báo cáo ngập nổi bật
              <Badge variant="secondary" className="text-[10px] font-medium">
                {floodReports.length} điểm
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {floodReports
              .slice()
              .sort((a, b) => (toNumber(b.properties?.water_level_cm) ?? 0) - (toNumber(a.properties?.water_level_cm) ?? 0))
              .slice(0, 3)
              .map((report, index) => {
                const levelCm = toNumber(report.properties?.water_level_cm) ?? 0;
                const color = levelCm >= 75 ? 'bg-red-500' : levelCm >= 50 ? 'bg-orange-500' : levelCm >= 25 ? 'bg-blue-500' : 'bg-emerald-500';
                const title = report.properties?.street_name || report.properties?.ward_name || report.properties?.address || `Điểm ngập #${report.id ?? index + 1}`;

                return (
                  <div key={report.id ?? index} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {report.properties?.district_name || 'Đà Nẵng'}
                        </p>
                      </div>
                      <span className="font-mono font-bold shrink-0">{Math.round(levelCm)}cm</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, levelCm)}%` }} />
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
