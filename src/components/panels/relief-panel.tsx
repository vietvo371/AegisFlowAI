'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation, 
  MapPin, 
  Users, 
  ChevronRight, 
  Truck, 
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { EvacuationRoute } from '@/lib/openmap';
import { ReportIncidentDialog } from './report-incident-dialog';

interface ReliefPanelProps {
  onSelectRoute: (route: EvacuationRoute) => void;
}

export function ReliefPanel({ onSelectRoute }: ReliefPanelProps) {
  const t = useTranslations('dashboard');

  const reliefResources = [
    { id: 1, name: 'Đội cứu hộ số 04', status: 'active', count: 12, loc: 'Hòa Thọ Tây' },
    { id: 2, name: 'Đội y tế lưu động', status: 'dispatched', count: 5, loc: 'Liên Chiểu' },
    { id: 3, name: 'Điểm tập kết lương thực', status: 'standby', count: 800, loc: 'Thanh Khê' },
  ];

  const suggestedRoutes: EvacuationRoute[] = [
    { 
      polyline: '_p~iF~ps|U_af@_af@', 
      origin: { lat: 16.035, lng: 108.182 }, 
      destination: { lat: 16.067, lng: 108.207 },
      label: 'Tuyến sơ tán: Hòa Thọ Tây → THPT Hòa Vang' 
    },
    { 
      polyline: '_p~iF~ps|Uiab@iab@', 
      origin: { lat: 16.035, lng: 108.182 }, 
      destination: { lat: 16.054, lng: 108.172 },
      label: 'Tuyến sơ tán: Hòa Thọ Tây → BV Liên Chiểu' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* SOS Reporting */}
      <div className="px-1">
        <ReportIncidentDialog />
      </div>

      {/* Search and Navigation */}
      <Card className="border-border shadow-sm">
        <CardHeader className="p-5 pb-0">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            {t('reliefDispatch')}
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <Search size={16} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 text-center space-y-1">
              <div className="text-lg font-black text-primary">24</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase">{t('people')} active</div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center space-y-1">
              <div className="text-lg font-black text-emerald-600">03</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase">{t('teams')} dispatched</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-bold text-muted-foreground uppercase px-1">Tuyến sơ tán đề xuất (AI)</div>
            {suggestedRoutes.map((route, i) => (
              <button
                key={i}
                onClick={() => onSelectRoute(route)}
                className="w-full text-left p-3 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all group flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary shrink-0 transition-colors">
                  <Navigation size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">{route.label}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock size={10} /> 12 phút di chuyển · An toàn
                  </div>
                </div>
                <ChevronRight size={14} className="mt-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Tracking */}
      <Card className="border-border shadow-sm">
        <CardHeader className="p-5 pb-0">
          <CardTitle className="text-sm font-bold">{t('live')} Resources</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-4">
          <ScrollArea className="h-[280px] -mx-1 px-1">
            <div className="space-y-3 pb-4">
              {reliefResources.map((res) => (
                <div key={res.id} className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      res.status === 'dispatched' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'
                    }`}>
                      {res.id === 3 ? <Truck size={20} /> : <ShieldAlert size={20} />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{res.name}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin size={10} /> {res.loc}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black">{res.count}</div>
                    <div className="text-[9px] font-bold uppercase text-muted-foreground">
                      {res.status === 'dispatched' ? t('dispatched') : 'Sẵn sàng'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

