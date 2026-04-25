'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useAlertEvents } from '@/lib/useAlertEvents';
import { toast } from 'sonner';

/**
 * Xử lý alert events dựa trên role của user
 * - Admin/Operator: Hiển thị tất cả alerts
 * - Citizen: Hiển thị chỉ alerts trong district của họ
 * - Team/Rescue: Hiển thị alerts + rescue requests liên quan
 */
export function RoleBasedAlertHandler() {
  const { user } = useAuth();

  useAlertEvents({
    onAlertCreated: (data) => {
      // Admin/Operator: thấy tất cả
      if (user?.role === 'admin' || user?.role === 'rescue_operator') {
        handleAdminAlertCreated(data);
      }

      // Citizen: chỉ thấy alerts trong district của họ
      if (user?.role === 'citizen') {
        handleCitizenAlertCreated(data);
      }

      // Team: thấy alerts + chuẩn bị rescue requests
      if (user?.role === 'rescue_team') {
        handleTeamAlertCreated(data);
      }
    },

    onAlertUpdated: (data) => {
      if (user?.role === 'admin' || user?.role === 'rescue_operator') {
        handleAdminAlertUpdated(data);
      }
      if (user?.role === 'citizen') {
        handleCitizenAlertUpdated(data);
      }
      if (user?.role === 'rescue_team') {
        handleTeamAlertUpdated(data);
      }
    },

    onAlertResolved: (data) => {
      if (user?.role === 'admin' || user?.role === 'rescue_operator') {
        handleAdminAlertResolved(data);
      }
      if (user?.role === 'citizen') {
        handleCitizenAlertResolved(data);
      }
      if (user?.role === 'rescue_team') {
        handleTeamAlertResolved(data);
      }
    },
  });

  return null;
}

/**
 * ADMIN/OPERATOR handlers
 * - Thấy tất cả alerts
 * - Có thể khắc phục tình huống
 * - Cần monitoring toàn diện
 */
function handleAdminAlertCreated(data: any) {
  // Toast với thông tin chi tiết cho admin
  if (data.severity === 'critical') {
    const districtCount = Array.isArray(data.affected_districts)
      ? data.affected_districts.length
      : 0;
    toast.error(`🚨 CẢNH BÁO NGHIÊM TRỌNG: ${data.title}`, {
      description: `${districtCount} khu vực bị ảnh hưởng. ${data.description}`,
      duration: 10000,
    });
  }
}

function handleAdminAlertUpdated(data: any) {
  // Already handled by RealtimeListener - no need for dispatch
}

function handleAdminAlertResolved(data: any) {
  toast.success(`✅ Giải quyết: ${data.alert_number}`, {
    description: 'Cảnh báo đã được đưa vào trạng thái đã giải quyết',
    duration: 5000,
  });
}

/**
 * CITIZEN handlers
 * - Chỉ thấy alerts trong district của họ
 * - Cần hướng dẫn sơ tán
 * - Thông tin đơn giản, dễ hiểu
 */
function handleCitizenAlertCreated(data: any) {
  // Toast cảnh báo trực tiếp cho dân
  const guidance = getEvacuationGuidance(data.alert_type);
  toast.warning(`⚠️ ${data.title}`, {
    description: guidance.shortMessage,
    duration: 15000,
  });
}

function handleCitizenAlertUpdated(data: any) {
  // Citizen quan tâm đến status changes
  if (data.status === 'active') {
    toast.warning(`🚨 Cảnh báo được kích hoạt: ${data.title}`, {
      duration: 5000,
    });
  }
}

function handleCitizenAlertResolved(data: any) {
  toast.success('✅ Cảnh báo đã kết thúc - An toàn để quay trở lại', {
    duration: 5000,
  });
}

/**
 * RESCUE TEAM handlers
 * - Thấy alerts để chuẩn bị
 * - Nhận rescue requests liên quan
 * - Cần thông tin vị trí chi tiết
 */
function handleTeamAlertCreated(data: any) {
  const districtList = Array.isArray(data.affected_districts)
    ? data.affected_districts.join(', ')
    : 'Không xác định';

  toast.info(`📍 Cảnh báo mới: ${data.title}`, {
    description: `Chuẩn bị cho khu vực: ${districtList}`,
    duration: 5000,
  });
}

function handleTeamAlertUpdated(data: any) {
  if (data.status === 'active') {
    toast.warning(`🔴 Cảnh báo được kích hoạt - Sẵn sàng cứu hộ`, {
      duration: 5000,
    });
  }
}

function handleTeamAlertResolved(data: any) {
  toast.success('✅ Hoàn thành cứu hộ - Trở về vị trí base', {
    duration: 5000,
  });
}

// ============================================================
// Helper Functions
// ============================================================

function getEvacuationGuidance(alertType: string) {
  const guidance: Record<string, any> = {
    flood_warning: {
      shortMessage: '🌊 Sơ tán đến địa điểm an toàn. Tránh vùng nước cao.',
      fullMessage: 'Hãy sơ tán ngay đến địa điểm an toàn. Tránh các khu vực thấp và gần sông.',
      priority: 'high',
    },
    evacuation: {
      shortMessage: '🏃 SƠ TÁN NGAY - Theo hướng dẫn cảnh sát giao thông',
      fullMessage: 'ĐÃ CÓ LỆNH SƠ TÁN - Hãy rời khỏi khu vực ngay lập tức theo hướng được chỉ định',
      priority: 'critical',
    },
    heavy_rain: {
      shortMessage: '🌧️ Mưa lớn - Ở nhà nếu có thể, tránh đi lại',
      fullMessage: 'Có mưa lớn cảnh báo. Hạn chế đi lại ngoài nhà.',
      priority: 'medium',
    },
    all_clear: {
      shortMessage: '✅ An toàn - Có thể quay lại bình thường',
      fullMessage: 'Tình hình đã được kiểm soát. An toàn để tiếp tục hoạt động bình thường.',
      priority: 'low',
    },
  };

  return guidance[alertType] || {
    shortMessage: 'Cảnh báo mới - Kiểm tra thông tin chi tiết',
    fullMessage: 'Có cảnh báo mới. Vui lòng kiểm tra ứng dụng để biết chi tiết.',
    priority: 'medium',
  };
}

function estimateRescueNeeded(severity: string, areaCount: number): number {
  const baseCount = {
    critical: 50,
    high: 30,
    medium: 15,
    low: 5,
  };

  const base = (baseCount as Record<string, number>)[severity] || 10;
  return Math.ceil(base * Math.max(1, areaCount / 2));
}
