import Link from 'next/link';
import { Bell, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TeamUpdatesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cập nhật nhiệm vụ</h1>
          <p className="text-sm text-muted-foreground">Mốc trạng thái dùng để trình bày luồng phản ứng cứu hộ.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/team">Trang chủ</Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        {[
          ['Đã nhận cảnh báo mới từ trung tâm điều phối', 'Vừa xong', Bell],
          ['Đội đã xác nhận sẵn sàng di chuyển', '2 phút trước', CheckCircle],
          ['Đang cập nhật ETA đến khu vực Hòa Khánh', '5 phút trước', Clock],
        ].map(([title, time, Icon]) => (
          <div key={title as string} className="flex gap-4 border-b p-4 last:border-b-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Icon size={18} />
            </div>
            <div>
              <div className="font-medium">{title as string}</div>
              <div className="mt-1 text-xs text-muted-foreground">{time as string}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
