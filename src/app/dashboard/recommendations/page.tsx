'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Lightbulb, AlertTriangle, TrendingUp,
  Clock, Filter, RefreshCw, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Sparkles, MapPin, Users, Activity, CheckCircle, Shield, XCircle, AlertTriangle as AlertTriangleIcon } from 'lucide-react';

interface Recommendation {
  id: number;
  type: string;
  title?: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  target_area?: string;
  target_audience?: string[];
  impact?: string;
  confidence?: number;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  created_at: string;
  expires_at?: string;
  type_label?: string;
  details?: any;
  incident?: any;
}
const getMappedPriority = (rec: any): 'low' | 'medium' | 'high' | 'critical' => {
  if (rec.priority) return rec.priority;
  if (rec.type === 'rescue_dispatch' || rec.type === 'emergency') return 'critical';
  if (rec.type === 'evacuation') return 'high';
  return 'medium';
};

const getMappedTitle = (rec: any): string => {
  if (rec.title) return rec.title;
  if (rec.type === 'rescue_dispatch') return 'Điều phối lực lượng cứu hộ';
  if (rec.type === 'evacuation') return 'Yêu cầu sơ tán dân cư';
  if (rec.type === 'alert') return 'Phát thông tin cảnh báo thiên tai';
  return rec.type_label || 'Đề xuất tối ưu từ AI';
};

export default function RecommendationsPage() {
  const t = useTranslations('dashboard');
  const [recommendations, setRecommendations] = React.useState<Recommendation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<number | null>(null);
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [priorityFilter, setPriorityFilter] = React.useState('all');
  
  // Modal state
  const [selectedRec, setSelectedRec] = React.useState<Recommendation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [isRejecting, setIsRejecting] = React.useState(false);

  React.useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const api = (await import('@/lib/api')).default;
        const params: any = {};
        if (typeFilter !== 'all') params.type = typeFilter;
        if (priorityFilter !== 'all') params.priority = priorityFilter;
        const res = await api.get('/recommendations', { params });
        setRecommendations(res.data?.data ?? []);
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [typeFilter, priorityFilter]);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      const api = (await import('@/lib/api')).default;
      await api.put(`/recommendations/${id}/approve`);
      setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
      if (selectedRec && selectedRec.id === id) {
        setSelectedRec(prev => prev ? { ...prev, status: 'approved' } : null);
      }
      toast.success('Đã duyệt và chuyển lệnh cho đội cứu hộ!');
      setIsDetailOpen(false);
    } catch (e) {
      // toast is handled by interceptor
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối!');
      return;
    }
    setActionLoading(id);
    try {
      const api = (await import('@/lib/api')).default;
      await api.put(`/recommendations/${id}/reject`, { reason: rejectReason });
      setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
      if (selectedRec && selectedRec.id === id) {
        setSelectedRec(prev => prev ? { ...prev, status: 'rejected' } : null);
      }
      toast.success('Đã từ chối đề xuất này.');
      setIsDetailOpen(false);
      setIsRejecting(false);
      setRejectReason('');
    } catch (e) {
      // toast is handled by interceptor
    } finally {
      setActionLoading(null);
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'critical': return { color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', label: 'Khẩn cấp' };
      case 'high': return { color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', label: 'Cao' };
      case 'medium': return { color: 'bg-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Trung bình' };
      case 'low': return { color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', label: 'Thấp' };
      default: return { color: 'bg-gray-500', text: 'text-gray-600', bg: 'bg-gray-50', label: priority };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'evacuation': return { icon: '🚨', label: 'Sơ tán', color: 'text-red-600 bg-red-100' };
      case 'preparation': return { icon: '🛡️', label: 'Chuẩn bị', color: 'text-blue-600 bg-blue-100' };
      case 'prevention': return { icon: '⚠️', label: 'Phòng ngừa', color: 'text-green-600 bg-green-100' };
      case 'emergency': return { icon: '🚑', label: 'Khẩn cấp', color: 'text-orange-600 bg-orange-100' };
      case 'general': return { icon: '📋', label: 'Chung', color: 'text-gray-600 bg-gray-100' };
      default: return { icon: '📌', label: type, color: 'text-gray-600 bg-gray-100' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Chờ duyệt', color: 'text-yellow-600 border-yellow-200' };
      case 'approved': return { label: 'Đã duyệt', color: 'text-blue-600 border-blue-200' };
      case 'executed': return { label: 'Đã thực hiện', color: 'text-green-600 border-green-200' };
      case 'rejected': return { label: 'Từ chối', color: 'text-red-600 border-red-200' };
      default: return { label: status, color: 'text-gray-600' };
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (typeFilter !== 'all' && rec.type !== typeFilter) return false;
    if (priorityFilter !== 'all' && rec.priority !== priorityFilter) return false;
    return true;
  });

  const stats = {
    total: recommendations.length,
    pending: recommendations.filter(r => r.status === 'pending').length,
    executed: recommendations.filter(r => r.status === 'executed' || r.status === 'approved').length,
    critical: recommendations.filter(r => r.priority === 'critical' && r.status === 'pending').length,
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6 custom-scroll">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Khuyến nghị</h1>
          <p className="text-sm text-muted-foreground">AI đề xuất hành động tối ưu</p>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw size={16} />
          Cập nhật
        </Button>
      </div>

      {/* AI Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Lightbulb size={24} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold">AI Recommendation Engine</p>
              <p className="text-xs text-muted-foreground">
                {stats.pending} khuyến nghị chờ duyệt • {stats.critical} ưu tiên cao
              </p>
            </div>
          </div>
          <Badge className="bg-yellow-100 text-yellow-700">Chờ duyệt</Badge>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng khuyến nghị', value: stats.total, icon: CheckCircle2, color: 'text-blue-600 bg-blue-100' },
          { label: 'Chờ duyệt', value: stats.pending, icon: TrendingUp, color: 'text-yellow-600 bg-yellow-100' },
          { label: 'Đã thực hiện', value: stats.executed, icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
          { label: 'Khẩn cấp', value: stats.critical, icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            <SelectItem value="evacuation">Sơ tán</SelectItem>
            <SelectItem value="preparation">Chuẩn bị</SelectItem>
            <SelectItem value="prevention">Phòng ngừa</SelectItem>
            <SelectItem value="emergency">Khẩn cấp</SelectItem>
            <SelectItem value="general">Chung</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => v && setPriorityFilter(v)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Ưu tiên" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả ưu tiên</SelectItem>
            <SelectItem value="critical">Khẩn cấp</SelectItem>
            <SelectItem value="high">Cao</SelectItem>
            <SelectItem value="medium">Trung bình</SelectItem>
            <SelectItem value="low">Thấp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recommendations List */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Chờ duyệt ({filteredRecommendations.filter(r => r.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="executed">Đã xử lý ({filteredRecommendations.filter(r => r.status === 'executed' || r.status === 'approved').length})</TabsTrigger>
          <TabsTrigger value="all">Tất cả ({filteredRecommendations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {renderRecommendations(filteredRecommendations.filter(r => r.status === 'pending'), loading)}
        </TabsContent>

        <TabsContent value="executed" className="space-y-4">
          {renderRecommendations(filteredRecommendations.filter(r => r.status === 'executed' || r.status === 'approved'), loading)}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {renderRecommendations(filteredRecommendations, loading)}
        </TabsContent>
      </Tabs>

      {/* Dialog for details */}
      <Dialog open={isDetailOpen} onOpenChange={(open) => {
        setIsDetailOpen(open);
        if (!open) {
          setIsRejecting(false);
          setRejectReason('');
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedRec && (() => {
            const mappedPriority = getMappedPriority(selectedRec);
            const mappedTitle = getMappedTitle(selectedRec);
            const confidenceVal = selectedRec.confidence ?? selectedRec.details?.confidence_score ?? 0.85;

            const priority = getPriorityConfig(mappedPriority);
            const type = getTypeConfig(selectedRec.type);
            const status = getStatusConfig(selectedRec.status);

            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${type.color} flex items-center justify-center text-lg shrink-0`}>
                      {type.icon}
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold">{mappedTitle}</DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                        Khuyến nghị ID #{selectedRec.id} • {type.label}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Status & Priority Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`${priority.text} bg-opacity-10`} style={{ backgroundColor: 'var(--tw-bg-opacity, 0.1)' }}>
                      Mức độ: {priority.label}
                    </Badge>
                    <Badge variant="outline" className={`${status.color}`}>
                      Trạng thái: {status.label}
                    </Badge>
                  </div>

                  {/* Core Description */}
                  <div className="rounded-xl bg-slate-50 border p-4 text-sm font-medium text-slate-800 leading-relaxed">
                    {selectedRec.description}
                  </div>

                  {/* Incident link if available */}
                  {selectedRec.incident && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-b py-2 my-2">
                      <MapPin size={14} className="text-red-500" />
                      <span className="font-semibold text-slate-700">Sự cố liên quan:</span>
                      <span className="truncate flex-1">{selectedRec.incident.title}</span>
                    </div>
                  )}

                  {/* Model Confidence Bar */}
                  {confidenceVal !== undefined && (
                    <div className="space-y-1 bg-emerald-50/30 border border-emerald-100/50 rounded-xl p-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-500 flex items-center gap-1">
                          <Shield size={13} className="text-emerald-600 animate-pulse" /> Độ tin cậy của AI
                        </span>
                        <span className="font-bold text-emerald-600">{Math.round(confidenceVal * 100)}%</span>
                      </div>
                      <Progress value={confidenceVal * 100} indicatorClassName="bg-emerald-500" className="h-1.5 mt-1" />
                    </div>
                  )}

                  {/* AI Reasoning / Explanations */}
                  {selectedRec.details?.reasoning && selectedRec.details.reasoning.length > 0 && (
                    <div className="rounded-xl border p-3.5 space-y-2.5 bg-indigo-50/20">
                      <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-indigo-500" />
                        Cơ sở đưa ra khuyến nghị
                      </p>
                      <div className="space-y-2">
                        {selectedRec.details.reasoning.map((reason: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                            <CheckCircle size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Target Audience & Expires if available */}
                  {(selectedRec.target_area || (selectedRec.target_audience && selectedRec.target_audience.length > 0)) && (
                    <div className="grid grid-cols-2 gap-3 text-xs border border-dashed rounded-xl p-3 bg-slate-50/50">
                      <div>
                        <span className="text-muted-foreground block mb-0.5">📍 Khu vực áp dụng</span>
                        <span className="font-semibold text-slate-800">{selectedRec.target_area || 'Liên Chiểu, Đà Nẵng'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">👥 Đối tượng nhận tin</span>
                        <span className="font-semibold text-slate-800">
                          {selectedRec.target_audience && selectedRec.target_audience.length > 0
                            ? selectedRec.target_audience.join(', ')
                            : 'Đội cứu hộ, cư dân'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Reject Reason input field */}
                  {isRejecting && (
                    <div className="space-y-2 border-t pt-3">
                      <label className="text-xs font-bold text-red-600 block">Lý do từ chối (bắt buộc):</label>
                      <textarea
                        className="w-full min-h-[70px] p-2 border rounded-md text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
                        placeholder="Nhập lý do chi tiết từ chối để AI có thể tự học hỏi và cải thiện..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        maxLength={500}
                      />
                    </div>
                  )}
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
                  {selectedRec.status === 'pending' ? (
                    isRejecting ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            setIsRejecting(false);
                            setRejectReason('');
                          }}
                        >
                          Hủy bỏ
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full sm:w-auto gap-1 bg-red-600 hover:bg-red-700"
                          onClick={() => handleReject(selectedRec.id)}
                          disabled={actionLoading === selectedRec.id}
                        >
                          <XCircle size={15} />
                          Xác nhận từ chối
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => setIsRejecting(true)}
                        >
                          Từ chối
                        </Button>
                        <Button
                          size="sm"
                          className="w-full sm:w-auto gap-1 bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
                          onClick={() => handleApprove(selectedRec.id)}
                          disabled={actionLoading === selectedRec.id}
                        >
                          <CheckCircle size={15} />
                          Phê duyệt & Ban hành
                        </Button>
                      </>
                    )
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setIsDetailOpen(false)}
                    >
                      Đóng
                    </Button>
                  )}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderRecommendations(items: Recommendation[], isLoading: boolean) {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="h-28 bg-muted rounded-lg animate-pulse" />
          </CardContent>
        </Card>
      ));
    }

    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Không có khuyến nghị nào</p>
          </CardContent>
        </Card>
      );
    }

    return items.map((rec, i) => {
      const mappedPriority = getMappedPriority(rec);
      const mappedTitle = getMappedTitle(rec);
      const confidenceVal = rec.confidence ?? rec.details?.confidence_score ?? 0.85;

      const priority = getPriorityConfig(mappedPriority);
      const type = getTypeConfig(rec.type);
      const status = getStatusConfig(rec.status);

      return (
        <motion.div
          key={rec.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className={`${mappedPriority === 'critical' && rec.status === 'pending' ? 'border-red-200 shadow-red-50/50 shadow-md' : ''} hover:shadow-md transition-shadow`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${type.color} flex items-center justify-center text-xl shrink-0`}>
                  {type.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold">{mappedTitle}</h3>
                    <Badge className={`${priority.text} bg-opacity-10`} style={{ backgroundColor: 'var(--tw-bg-opacity, 0.1)' }}>
                      {priority.label}
                    </Badge>
                    <Badge variant="outline">{type.label}</Badge>
                    <Badge variant="outline" className={`${status.color}`}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    {rec.target_area ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        📍 {rec.target_area}
                      </span>
                    ) : rec.incident ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        📍 {rec.incident.title}
                      </span>
                    ) : null}
                    {rec.impact && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        📊 Tác động: {rec.impact}
                      </span>
                    )}
                    {confidenceVal !== undefined && (
                      <span className={`text-xs font-medium ${confidenceVal >= 0.8 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {Math.round(confidenceVal * 100)}% độ tin cậy
                      </span>
                    )}
                    {rec.target_audience && rec.target_audience.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        👥 {rec.target_audience.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {rec.status === 'pending' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(rec.id)}
                      disabled={actionLoading === rec.id}
                    >
                      {actionLoading === rec.id ? 'Đang duyệt...' : 'Duyệt & Triển khai'}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedRec(rec);
                    setIsDetailOpen(true);
                    setIsRejecting(false);
                    setRejectReason('');
                  }}>
                    Chi tiết
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    });
  }
}
