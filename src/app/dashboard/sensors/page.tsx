'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useTable } from '@/lib/use-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataPagination } from '@/components/ui/data-pagination';
import { RefreshCw, Search, Waves, CloudRain } from 'lucide-react';

interface Sensor {
  id: number; name: string; external_id: string;
  type: string; status: string; unit: string;
  last_value?: number; alert_threshold?: number; danger_threshold?: number;
  last_reading_at?: string;
  flood_zone?: { id: number; name: string };
  district?: { id: number; name: string };
}

const STA_CLS: Record<string, string> = {
  online:      'bg-emerald-500 text-white',
  offline:     'text-gray-400 line-through',
  error:       'bg-red-500 text-white',
  maintenance: 'bg-yellow-500 text-white',
};

export default function SensorsPage() {
  const t = useTranslations('dashboard');
  const tEnum = useTranslations('enums');

  const { data: sensors, meta, loading, setFilter, setPage, refresh } = useTable<Sensor>({
    endpoint: '/sensors', perPage: 20,
  });

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      water_level: t('sensors.typeWaterLevel'),
      rainfall: t('sensors.typeRainfall'),
      camera: t('sensors.typeCamera'),
      wind: t('sensors.typeWind'),
      temperature: t('sensors.typeTemperature'),
      humidity: t('sensors.typeHumidity'),
      combined: t('sensors.typeCombined'),
    };
    return map[type] ?? type;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('pages.sensors')}</h1>
          <p className="text-muted-foreground mt-1">{t('sensors.subtitle')}</p>
        </div>
        <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('sensors.searchPlaceholder')} className="pl-9 h-9 bg-muted/50"
                onChange={e => setFilter('search', e.target.value)} />
            </div>
            <Select onValueChange={v => setFilter('type', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder={t('sensors.typePlaceholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('table.all')}</SelectItem>
                <SelectItem value="water_level">{t('sensors.typeWaterLevel')}</SelectItem>
                <SelectItem value="rainfall">{t('sensors.typeRainfall')}</SelectItem>
                <SelectItem value="camera">{t('sensors.typeCamera')}</SelectItem>
                <SelectItem value="wind">{t('sensors.typeWind')}</SelectItem>
                <SelectItem value="temperature">{t('sensors.typeTemperature')}</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={v => setFilter('status', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder={t('sensors.statusPlaceholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('table.all')}</SelectItem>
                <SelectItem value="online">{tEnum('sensorStatus.online')}</SelectItem>
                <SelectItem value="offline">{tEnum('sensorStatus.offline')}</SelectItem>
                <SelectItem value="error">{tEnum('sensorStatus.error')}</SelectItem>
                <SelectItem value="maintenance">{tEnum('sensorStatus.maintenance')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[120px]">{t('sensors.colDeviceId')}</TableHead>
                <TableHead>{t('sensors.colName')}</TableHead>
                <TableHead>{t('sensors.colType')}</TableHead>
                <TableHead>{t('sensors.colStatus')}</TableHead>
                <TableHead>{t('sensors.colValue')}</TableHead>
                <TableHead>{t('sensors.colZone')}</TableHead>
                <TableHead className="text-right">{t('sensors.colLastRead')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : sensors.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">{t('sensors.noSensors')}</TableCell></TableRow>
              ) : sensors.map(s => {
                const staCls = STA_CLS[s.status];
                const staLabel = tEnum(`sensorStatus.${s.status}` as any, { defaultValue: s.status });
                const isAlert  = s.alert_threshold  != null && (s.last_value ?? 0) >= s.alert_threshold;
                const isDanger = s.danger_threshold != null && (s.last_value ?? 0) >= s.danger_threshold;
                return (
                  <TableRow key={s.id} className="hover:bg-muted/30">
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{s.external_id}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {s.type === 'water_level' ? <Waves size={15} className="text-blue-500" /> : <CloudRain size={15} className="text-cyan-500" />}
                        <div>
                          <p className="font-semibold text-sm">{s.name}</p>
                          {s.district && <p className="text-xs text-muted-foreground">{s.district.name}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{getTypeLabel(s.type)}</span></TableCell>
                    <TableCell><Badge variant="outline" className={staCls}>{staLabel}</Badge></TableCell>
                    <TableCell>
                      {s.last_value != null
                        ? <span className={`font-mono font-bold ${isDanger ? 'text-red-500' : isAlert ? 'text-orange-500' : 'text-foreground'}`}>
                            {s.last_value} <span className="text-xs font-normal text-muted-foreground">{s.unit}</span>
                          </span>
                        : <span className="text-muted-foreground text-xs italic">{t('sensors.noValue')}</span>
                      }
                      {s.alert_threshold != null && (
                        <div className="text-[10px] text-muted-foreground">{t('sensors.threshold')}: {s.alert_threshold} {s.unit}</div>
                      )}
                    </TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{s.flood_zone?.name ?? '—'}</span></TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {s.last_reading_at ? new Date(s.last_reading_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <DataPagination meta={meta} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
