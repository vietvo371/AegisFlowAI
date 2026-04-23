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
import { RefreshCw, Search, ShieldAlert, Phone, Users, Navigation } from 'lucide-react';

interface RescueTeam {
  id: number; name: string; code: string;
  team_type: string; specializations?: string[];
  vehicle_count: number; personnel_count: number;
  phone?: string; status: string;
  district?: { id: number; name: string };
}

const STA_CLS: Record<string, string> = {
  available:   'bg-emerald-500 text-white',
  on_mission:  'bg-orange-500 text-white animate-pulse',
  resting:     'bg-yellow-100 text-yellow-600',
  offline:     'text-gray-400',
};

export default function RescueTeamsPage() {
  const t = useTranslations('dashboard');
  const tEnum = useTranslations('enums');

  const { data: teams, meta, loading, setFilter, setPage, refresh } = useTable<RescueTeam>({
    endpoint: '/rescue-teams', perPage: 20,
  });

  const availableCount = teams.filter(team => team.status === 'available').length;

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      medical: t('rescueTeams.typeMedical'),
      fire: t('rescueTeams.typeFire'),
      military: t('rescueTeams.typeMilitary'),
      volunteer: t('rescueTeams.typeVolunteer'),
      special: t('rescueTeams.typeSpecial'),
    };
    return map[type] ?? type;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('pages.rescueTeams')}</h1>
          <p className="text-muted-foreground mt-1">{t('rescueTeams.subtitle')}</p>
        </div>
        <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('rescueTeams.searchPlaceholder')} className="pl-9 h-9 bg-muted/50"
                onChange={e => setFilter('search', e.target.value)} />
            </div>
            <Select onValueChange={v => setFilter('status', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder={t('rescueTeams.statusPlaceholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('table.all')}</SelectItem>
                <SelectItem value="available">{tEnum('teamStatus.available')}</SelectItem>
                <SelectItem value="on_mission">{tEnum('teamStatus.on_mission')}</SelectItem>
                <SelectItem value="resting">{tEnum('teamStatus.resting')}</SelectItem>
                <SelectItem value="offline">{tEnum('teamStatus.offline')}</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={v => setFilter('team_type', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder={t('rescueTeams.typePlaceholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('table.all')}</SelectItem>
                <SelectItem value="medical">{t('rescueTeams.typeMedical')}</SelectItem>
                <SelectItem value="fire">{t('rescueTeams.typeFire')}</SelectItem>
                <SelectItem value="military">{t('rescueTeams.typeMilitary')}</SelectItem>
                <SelectItem value="volunteer">{t('rescueTeams.typeVolunteer')}</SelectItem>
                <SelectItem value="special">{t('rescueTeams.typeSpecial')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 whitespace-nowrap">
              <ShieldAlert size={14} /> {t('rescueTeams.availableCount', { count: availableCount })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">{t('rescueTeams.colCode')}</TableHead>
                <TableHead>{t('rescueTeams.colName')}</TableHead>
                <TableHead>{t('rescueTeams.colStatus')}</TableHead>
                <TableHead>{t('rescueTeams.colType')}</TableHead>
                <TableHead>{t('rescueTeams.colForce')}</TableHead>
                <TableHead>{t('rescueTeams.colSpecialization')}</TableHead>
                <TableHead>{t('rescueTeams.colContact')}</TableHead>
                <TableHead className="text-right">{t('rescueTeams.colArea')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="h-32 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : teams.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">{t('rescueTeams.noTeams')}</TableCell></TableRow>
              ) : teams.map(team => {
                const staCls = STA_CLS[team.status];
                const staLabel = tEnum(`teamStatus.${team.status}` as any, { defaultValue: team.status });
                return (
                  <TableRow key={team.id} className="hover:bg-muted/30">
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{team.code}</Badge></TableCell>
                    <TableCell className="font-semibold">{team.name}</TableCell>
                    <TableCell><Badge variant="outline" className={staCls}>{staLabel}</Badge></TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{getTypeLabel(team.team_type)}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Users size={13} /> {team.personnel_count}
                        <span className="text-muted-foreground text-xs">({t('rescueTeams.vehicles', { count: team.vehicle_count })})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(team.specializations ?? []).slice(0, 2).map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0">{s}</Badge>
                        ))}
                        {(team.specializations?.length ?? 0) > 2 && <span className="text-xs text-muted-foreground">+{team.specializations!.length - 2}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {team.phone
                        ? <div className="flex items-center gap-1 text-sm"><Phone size={12} className="text-muted-foreground" />{team.phone}</div>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {team.district?.name
                        ? <span className="flex items-center justify-end gap-1"><Navigation size={11} />{team.district.name}</span>
                        : '—'}
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
