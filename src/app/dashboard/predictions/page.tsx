'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useTable } from '@/lib/use-table';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { DataPagination } from '@/components/ui/data-pagination';
import { RefreshCw, Search, BrainCircuit, Play, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Prediction {
  id: number; prediction_type: string;
  model?: { id: number; name: string; version: string };
  model_version?: string;
  prediction_for?: string; horizon_minutes?: number;
  issued_at: string; predicted_value?: number;
  confidence?: number; probability?: number;
  severity?: string; severity_label?: string;
  status: string; status_label?: string;
  flood_zone?: { id: number; name: string };
  verified_by?: { id: number; name: string };
  processing_time_ms?: number;
}

const SEV_COLOR: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-blue-500',
};
const STA_CLS: Record<string, string> = {
  pending:  'text-orange-500 border-orange-200',
  verified: 'bg-emerald-500 text-white',
  alerted:  'bg-red-500 text-white',
  expired:  'text-gray-400',
};

export default function PredictionsPage() {
  const t = useTranslations('dashboard');
  const tEnum = useTranslations('enums');

  const { data: predictions, meta, loading, setFilter, setPage, refresh } = useTable<Prediction>({
    endpoint: '/predictions', perPage: 20,
  });
  const [triggering, setTriggering] = React.useState(false);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await api.post('/predictions/trigger', { horizon_minutes: 60 });
      toast.success(t('predictions.triggerSuccess'));
      setTimeout(refresh, 3000);
    } catch (e) { console.error(e); }
    finally { setTriggering(false); }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      water_level: t('predictions.typeWaterLevel'),
      flood_risk: t('predictions.typeFloodRisk'),
      evacuation_time: t('predictions.typeEvacuationTime'),
      resource_need: t('predictions.typeResourceNeed'),
    };
    return map[type] ?? type;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BrainCircuit size={26} className="text-primary" /> {t('pages.predictions')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('predictions.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={handleTrigger} disabled={triggering}>
            {triggering ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            {triggering ? t('predictions.triggering') : t('predictions.triggerBtn')}
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('predictions.searchPlaceholder')} className="pl-9 h-9 bg-muted/50"
                onChange={e => setFilter('search', e.target.value)} />
            </div>
            <Select onValueChange={v => setFilter('status', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder={t('predictions.statusPlaceholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('table.all')}</SelectItem>
                <SelectItem value="pending">{tEnum('predictionStatus.pending')}</SelectItem>
                <SelectItem value="verified">{tEnum('predictionStatus.verified')}</SelectItem>
                <SelectItem value="alerted">{tEnum('predictionStatus.alerted')}</SelectItem>
                <SelectItem value="expired">{tEnum('predictionStatus.expired')}</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={v => setFilter('prediction_type', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-44"><SelectValue placeholder={t('predictions.typePlaceholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('table.all')}</SelectItem>
                <SelectItem value="water_level">{t('predictions.typeWaterLevel')}</SelectItem>
                <SelectItem value="flood_risk">{t('predictions.typeFloodRisk')}</SelectItem>
                <SelectItem value="evacuation_time">{t('predictions.typeEvacuationTime')}</SelectItem>
                <SelectItem value="resource_need">{t('predictions.typeResourceNeed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[80px]">{t('predictions.colId')}</TableHead>
                <TableHead>{t('predictions.colType')}</TableHead>
                <TableHead>{t('predictions.colValue')}</TableHead>
                <TableHead>{t('predictions.colConfidence')}</TableHead>
                <TableHead>{t('predictions.colProbability')}</TableHead>
                <TableHead>{t('predictions.colSeverity')}</TableHead>
                <TableHead>{t('predictions.colStatus')}</TableHead>
                <TableHead className="text-right">{t('predictions.colTime')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="h-32 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : predictions.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">{t('predictions.noResults')}</TableCell></TableRow>
              ) : predictions.map(p => {
                const staCls = STA_CLS[p.status];
                const staLabel = p.status_label ?? tEnum(`predictionStatus.${p.status}` as any, { defaultValue: p.status });
                return (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell><Badge variant="outline" className="font-mono text-xs">P-{String(p.id).padStart(4, '0')}</Badge></TableCell>
                    <TableCell>
                      <p className="font-semibold text-sm">{getTypeLabel(p.prediction_type)}</p>
                      {p.model_version && <p className="text-[10px] font-mono text-muted-foreground">{p.model_version}</p>}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-bold text-primary">{p.predicted_value ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      {p.confidence != null ? (
                        <div className="w-20 space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                            <span>{t('predictions.confLabel')}</span><span>{Math.round(p.confidence * 100)}%</span>
                          </div>
                          <Progress value={p.confidence * 100} className="h-1.5" />
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {p.probability != null
                        ? <Badge variant="secondary" className="font-mono bg-blue-500/10 text-blue-500">{Math.round(p.probability * 100)}%</Badge>
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {p.severity
                        ? <Badge className={`${SEV_COLOR[p.severity]} text-white`}>
                            {p.severity_label ?? tEnum(`severity.${p.severity}` as any, { defaultValue: p.severity })}
                          </Badge>
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={staCls}>{staLabel}</Badge>
                      {p.verified_by && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <CheckCircle2 size={10} className="text-emerald-500" /> {p.verified_by.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      <Clock size={11} className="inline mr-1" />
                      {new Date(p.issued_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
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
