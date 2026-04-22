'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Search, BrainCircuit, Play, BarChart3, Clock, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Prediction {
  id: number;
  prediction_type: 'water_level' | 'flood_risk' | 'evacuation_time' | 'resource_need';
  model_version: string;
  prediction_for: string;
  horizon_minutes: number;
  predicted_value: number;
  confidence: number;
  probability: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'verified' | 'rejected' | 'superseded';
  issued_at: string;
  district?: { id: number; name: string };
  flood_zone?: { id: number; name: string };
  verified_by?: { id: number; name: string };
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/predictions');
      if (res.data?.success) {
        setPredictions(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch predictions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await api.post('/predictions/trigger', { horizon_minutes: 60 });
      toast.success('Đã kích hoạt AI Model — kết quả sẽ xuất hiện trong vài giây');
      setTimeout(fetchPredictions, 3000);
    } catch (error) {
      console.error('Failed to trigger prediction', error);
    } finally {
      setTriggering(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive" className="animate-pulse">Cực kỳ nguy hiểm</Badge>;
      case 'high': return <Badge className="bg-orange-500 hover:bg-orange-600">Rủi ro cao</Badge>;
      case 'medium': return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Trung bình</Badge>;
      case 'low': return <Badge className="bg-blue-500 hover:bg-blue-600">An toàn</Badge>;
      default: return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="text-orange-500 border-orange-200">Chờ duyệt</Badge>;
      case 'verified': return <Badge className="bg-emerald-500">Đã Xác thực</Badge>;
      case 'rejected': return <Badge variant="destructive">Bác bỏ (Sai số)</Badge>;
      case 'superseded': return <Badge variant="outline" className="text-gray-400 border-dashed">Thay thế bởi model mới</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'water_level': return 'Dự báo Mực nước';
      case 'flood_risk': return 'Dự báo Xác suất Ngập';
      case 'evacuation_time': return 'Ước tính T.gian Sơ tán';
      case 'resource_need': return 'Nhu cầu Vật tư';
      default: return type.replace('_', ' ').toUpperCase();
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI & Dự Báo (Predictions)</h1>
          <p className="text-muted-foreground mt-1">Lịch sử tính toán của AI Backend sử dụng cho Cảnh báo tự động</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="icon" onClick={fetchPredictions} disabled={loading}>
             <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
           </Button>
           <Button className="gap-2 focus:ring-2" onClick={handleTrigger} disabled={triggering}>
             {triggering
               ? <RefreshCw className="w-4 h-4 animate-spin" />
               : <Play className="w-4 h-4" />
             }
             {triggering ? 'Đang xử lý...' : 'Kích hoạt Model'}
           </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Mô hình AI hoặc tên..." className="pl-9 h-9 w-full bg-muted/50" />
             </div>
             <div className="flex items-center gap-2">
               <BrainCircuit className="w-4 h-4 text-primary" />
               <span className="text-sm font-medium">{predictions.filter(p => ['water_level','flood_risk'].includes(p.prediction_type)).length} kết quả gần đây</span>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[200px]">Loại tính toán</TableHead>
                  <TableHead>Chỉ số dự báo</TableHead>
                  <TableHead>Độ tin cậy</TableHead>
                  <TableHead>Xác suất</TableHead>
                  <TableHead>Mức cảnh báo đề xuất</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thời gian ghi nhận</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-primary" />
                        Đang đọc Logs từ Database...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : predictions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      Model chưa đưa ra kết quả phân tích nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  predictions.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/30 cursor-pointer">
                      <TableCell>
                         <Badge variant="outline" className="font-mono bg-transparent border-dashed">P-{(p.id).toString().padStart(4, '0')}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                           <div className="font-semibold text-foreground">{getTypeLabel(p.prediction_type)}</div>
                           <div className="text-xs text-muted-foreground font-mono mt-0.5">{p.model_version}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="font-mono font-bold text-lg text-primary">
                           {p.predicted_value} 
                         </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col gap-1 w-24">
                           <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                              <span>Conf</span>
                              <span>{Math.round(p.confidence * 100)}%</span>
                           </div>
                           <Progress value={p.confidence * 100} className="h-1.5" />
                         </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">{Math.round(p.probability * 100)}%</Badge>
                      </TableCell>
                      <TableCell>{getSeverityBadge(p.severity)}</TableCell>
                      <TableCell>
                         <div className="flex flex-col gap-1">
                           {getStatusBadge(p.status)}
                           {p.verified_by && (
                             <span className="text-[10px] text-muted-foreground flex items-center"><CheckCircle2 className="w-3 h-3 text-emerald-500 mr-1" /> Duyệt: {p.verified_by.name}</span>
                           )}
                         </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        <div className="flex items-center justify-end">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(p.issued_at).toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
