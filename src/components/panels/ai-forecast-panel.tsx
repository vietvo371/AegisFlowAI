'use client'

import * as React from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { TrendingUp, AlertTriangle, RefreshCw, Brain } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTranslations } from 'next-intl'

interface AiForecastPanelProps {
  currentRisk?: { risk_score: number; risk_level: string; confidence: number }
  sensorReadings?: Array<Record<string, unknown>>
  autoRefreshSeconds?: number
}

interface ForecastPoint {
  horizon: string
  risk_score: number
  risk_level: string
}

interface ForecastResponse {
  forecasts: Array<{ horizon: string; risk_score: number; risk_level: string }>
  method?: string
  sequence_length?: number
  warning?: string | null
}

function riskColor(level: string): string {
  return (
    ({ critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' } as Record<string, string>)[level]
    ?? '#6b7280'
  )
}

function riskBadgeClass(level: string): string {
  return (
    {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200',
    } as Record<string, string>
  )[level] ?? 'bg-gray-100 text-gray-700 border-gray-200'
}

interface ChartDatum {
  time: string
  score: number
  level: string
}

interface CustomDotProps {
  cx?: number
  cy?: number
  payload?: ChartDatum
}

function RiskDot({ cx = 0, cy = 0, payload }: CustomDotProps) {
  if (!payload) return null
  return <circle cx={cx} cy={cy} r={5} fill={riskColor(payload.level)} stroke="#fff" strokeWidth={2} />
}

export default function AiForecastPanel({
  currentRisk,
  sensorReadings,
  autoRefreshSeconds = 60,
}: AiForecastPanelProps) {
  const t = useTranslations('dashboard.forecast')
  const [forecast, setForecast] = React.useState<ForecastResponse | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [weather, setWeather] = React.useState<{
    rainfall_mm: number; wind_speed_kmh: number; pressure_hpa: number; source?: string
  } | null>(null)

  const fetchForecast = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const base = process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? 'http://localhost:5005'
      const body = {
        readings: sensorReadings?.length
          ? sensorReadings
          : [{ water_level_m: 0.5, rainfall_mm: 20 }],
      }
      const [forecastRes, weatherRes] = await Promise.allSettled([
        fetch(`${base}/api/predict/forecast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
        fetch(`${base}/api/weather/danang`),
      ])

      if (forecastRes.status === 'fulfilled' && forecastRes.value.ok) {
        const data: ForecastResponse = await forecastRes.value.json()
        setForecast(data)
      } else {
        throw new Error('Forecast service không phản hồi')
      }

      if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
        const wData = await weatherRes.value.json()
        setWeather({ ...wData.current, source: wData.source })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dự báo')
    } finally {
      setLoading(false)
    }
  }, [sensorReadings])

  React.useEffect(() => {
    fetchForecast()
    const id = setInterval(fetchForecast, autoRefreshSeconds * 1000)
    return () => clearInterval(id)
  }, [fetchForecast, autoRefreshSeconds])

  const chartData: ChartDatum[] = React.useMemo(() => {
    const now: ChartDatum = {
      time: t('now'),
      score: currentRisk?.risk_score ?? 0,
      level: currentRisk?.risk_level ?? 'low',
    }
    const future: ChartDatum[] = (forecast?.forecasts ?? []).map((f: ForecastPoint) => ({
      time: `+${f.horizon}`,
      score: f.risk_score,
      level: f.risk_level,
    }))
    return [now, ...future]
  }, [currentRisk, forecast])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain size={18} className="text-blue-600" />
            {t('aiForecastTitle')}
          </CardTitle>
          <button
            onClick={fetchForecast}
            disabled={loading}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            aria-label="Làm mới dự báo"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-label={t('refresh')} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {forecast?.warning && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle size={16} className="text-orange-600" />
            <AlertDescription className="text-orange-800 text-sm">{forecast.warning}</AlertDescription>
          </Alert>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
        )}

        {loading && !forecast && (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" />
            {t('loading')}
          </div>
        )}

        {chartData.length > 1 && (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [`${value}`, 'Risk Score']}
                contentStyle={{ fontSize: 12 }}
              />
              <ReferenceLine y={25} stroke="#22c55e" strokeDasharray="3 3" label={{ value: '25', fontSize: 10, fill: '#22c55e' }} />
              <ReferenceLine y={50} stroke="#eab308" strokeDasharray="3 3" label={{ value: '50', fontSize: 10, fill: '#eab308' }} />
              <ReferenceLine y={75} stroke="#f97316" strokeDasharray="3 3" label={{ value: '75', fontSize: 10, fill: '#f97316' }} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                fill="url(#riskGrad)"
                strokeWidth={2}
                dot={<RiskDot />}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {chartData.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chartData.map((d) => (
              <div key={d.time} className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{d.time}</span>
                <Badge variant="outline" className={`text-xs ${riskBadgeClass(d.level)}`}>
                  {d.level}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {weather && (
          <div className="flex flex-wrap gap-4 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
            <span className="flex items-center gap-1">
              <span>🌧</span>
              <span>{t('rainfallNow')}: <strong>{weather.rainfall_mm.toFixed(1)} mm/h</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <span>💨</span>
              <span>{t('wind')}: <strong>{weather.wind_speed_kmh.toFixed(1)} km/h</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <span>🌡</span>
              <span>{t('pressure')}: <strong>{weather.pressure_hpa.toFixed(0)} hPa</strong></span>
            </span>
            {weather.source && (
              <span className="ml-auto opacity-60">
                {weather.source === 'open_meteo' ? '🛰 Open-Meteo' : weather.source}
              </span>
            )}
          </div>
        )}

        {forecast && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-t pt-2">
            <span className="flex items-center gap-1">
              <TrendingUp size={12} />
              {forecast.method ?? '—'}
            </span>
            {forecast.sequence_length != null && (
              <span>seq_len: {forecast.sequence_length}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
