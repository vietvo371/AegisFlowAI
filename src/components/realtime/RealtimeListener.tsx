'use client';

import { useEffect } from 'react';
import echo from '@/lib/echo';
import { toast } from 'sonner';
import { AlertTriangle, Bell, Info, HeartPulse } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const RealtimeListener = () => {
  const router = useRouter();

  useEffect(() => {
    if (!echo) return;

    const channel = echo.channel('flood');

    // 1. Lắng nghe Sự cố mới
    channel.listen('.incident.created', (data: any) => {
      console.log('Realtime: New Incident', data);
      
      toast.error(`SỰ CỐ MỚI: ${data.title}`, {
        description: `${data.address || 'Không xác định'} - Mức độ: ${data.severity}`,
        duration: 10000,
        icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
        action: {
          label: 'Xem chi tiết',
          onClick: () => router.push(`/dashboard/incidents?highlight=${data.id}`)
        }
      });

      // Phát sự kiện custom để các trang tự refresh nếu cần
      window.dispatchEvent(new CustomEvent('aegis:incident:created', { detail: data }));
    });

    // 2. Lắng nghe Cảnh báo mới
    channel.listen('.alert.created', (data: any) => {
      console.log('Realtime: New Alert', data);
      
      toast.warning(`CẢNH BÁO: ${data.title}`, {
        description: data.description,
        duration: 8000,
        icon: <Bell className="w-5 h-5 text-orange-500" />,
        action: {
          label: 'Xem ngay',
          onClick: () => router.push('/dashboard/alerts')
        }
      });

      window.dispatchEvent(new CustomEvent('aegis:alert:created', { detail: data }));
    });

    // 3. Lắng nghe Yêu cầu cứu hộ mới
    channel.listen('.rescue_request.created', (data: any) => {
      toast.info(`Yêu cầu cứu hộ mới`, {
        description: `Tại: ${data.address} - Cần ứng cứu: ${data.people_count} người`,
        icon: <HeartPulse className="w-5 h-5 text-blue-500" />,
        action: {
          label: 'Điều phối',
          onClick: () => router.push('/dashboard/rescue-requests')
        }
      });
      
      window.dispatchEvent(new CustomEvent('aegis:rescue_request:created', { detail: data }));
    });

    // 4. Lắng nghe Cập nhật Yêu cầu cứu hộ
    channel.listen('.rescue_request.updated', (data: any) => {
      window.dispatchEvent(new CustomEvent('aegis:rescue_request:updated', { detail: data }));
    });

    // 5. Lắng nghe Dự báo AI
    channel.listen('.prediction.received', (data: any) => {
       toast('AI vừa cập nhật dự báo mới', {
         description: `Độ tin cậy: ${Math.round(data.confidence * 100)}%`,
         icon: <Info className="w-5 h-5 text-purple-500" />
       });
       window.dispatchEvent(new CustomEvent('aegis:prediction:received', { detail: data }));
    });

    return () => {
      echo.leaveChannel('flood');
    };
  }, [router]);

  return null; // Component này không hiển thị gì cả
};
