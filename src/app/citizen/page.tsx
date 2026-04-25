'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import {
  AlertTriangle, MapPin, CloudRain, Wind,
  Phone, Shield, ChevronRight, Droplets, Thermometer, Gauge, User, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AlertData {
  id: number;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

interface SensorData {
  water_level: number;
  rainfall: number;
  humidity: number;
  temperature: number;
  updated_at: string;
}

export default function CitizenDashboard() {
  const t = useTranslations('citizen');
  const tDashboard = useTranslations('dashboard');
  const { user } = useAuth();
  const [alerts, setAlerts] = React.useState<AlertData[]>([]);
  const [sensors, setSensors] = React.useState<SensorData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const api = (await import('@/lib/api')).default;
        const [alertsRes] = await Promise.allSettled([
          api.get('/alerts', { params: { status: 'active', per_page: 5 } }),
        ]);

        if (alertsRes.status === 'fulfilled') {
          setAlerts(alertsRes.value.data?.data ?? []);
        }
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const handler = () => fetchData();
    window.addEventListener('aegis:alert:created', handler);
    return () => window.removeEventListener('aegis:alert:created', handler);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('home.greeting', { name: user?.name?.split(' ')[0] ?? t('citizen') })}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <Link href="/citizen/profile">
          <Button variant="outline" size="sm" className="gap-2">
            <User size={16} />
            {t('profile.title')}
          </Button>
        </Link>
      </div>

      {/* SOS Button */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <Link href="/citizen/sos" className="block">
          <Card className="bg-gradient-to-r from-red-500 to-rose-600 border-0 shadow-xl overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertTriangle size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{t('home.requestRescue')}</h2>
                  <p className="text-white/80 text-sm">{t('home.requestRescueDesc')}</p>
                </div>
              </div>
              <ChevronRight size={24} className="text-white/60" />
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Droplets className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{sensors?.water_level ?? '--'}</p>
            <p className="text-xs text-muted-foreground">{tDashboard('forecast.waterLevel')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <CloudRain className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{sensors?.rainfall ?? '--'}</p>
            <p className="text-xs text-muted-foreground">{tDashboard('forecast.rainfall')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Thermometer className="w-6 h-6 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{sensors?.temperature ?? '--'}°</p>
            <p className="text-xs text-muted-foreground">{tDashboard('forecast.temperature')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Gauge className="w-6 h-6 text-green-500 mb-2" />
            <p className="text-2xl font-bold">{sensors?.humidity ?? '--'}%</p>
            <p className="text-xs text-muted-foreground">{tDashboard('forecast.humidity')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {t('home.activeAlerts')}
          </CardTitle>
          <Link href="/citizen/alerts">
            <Button variant="ghost" size="sm" className="text-xs">
              {t('home.viewAll')}
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Link key={alert.id} href={`/citizen/alerts/${alert.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                    <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {t(`alerts.severity.${alert.severity}`)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t('home.noAlerts')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/citizen/shelters">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t('shelters.title')}</p>
                <p className="text-xs text-muted-foreground">{t('home.floodMapDesc')}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/citizen/weather">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Wind className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t('weather.title')}</p>
                <p className="text-xs text-muted-foreground">48 giờ tới</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            {t('home.emergency')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto py-3 flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t('home.emergency')}</span>
              <span className="font-bold">113</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t('home.fireService')}</span>
              <span className="font-bold">114</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t('home.ambulance')}</span>
              <span className="font-bold">115</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t('home.police')}</span>
              <span className="font-bold">1022</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
