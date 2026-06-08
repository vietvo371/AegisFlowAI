'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CascadeAlertPanel } from './CascadeAlertPanel';

export function DashboardAlertWidget() {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      {/* Toggle button */}
      <Button
        variant="outline"
        size="sm"
        className="gap-2 relative"
        onClick={() => setPanelOpen(true)}
      >
        <Bell size={14} />
        <span>Cảnh báo</span>
        {/* Badge sẽ được cập nhật từ API */}
      </Button>

      {/* Alert panel */}
      <CascadeAlertPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        onAlertClick={(alert) => {
          // Navigate to map with alert focus
          // window.location.href = `/dashboard/flood-zones?lat=${alert.lat}&lng=${alert.lng}`;
        }}
      />
    </>
  );
}
