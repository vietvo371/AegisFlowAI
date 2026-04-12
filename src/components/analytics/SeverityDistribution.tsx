'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface SeverityDistributionProps {
  data: Record<string, number>;
}

const COLORS: Record<string, string> = {
  critical: '#EF4444', // red-500
  high: '#F97316',     // orange-500
  medium: '#FACC15',   // yellow-400
  low: '#10B981',      // emerald-500
};

const LABELS: Record<string, string> = {
  critical: 'Nguy cấp',
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
};

export function SeverityDistribution({ data }: SeverityDistributionProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: LABELS[key] || key,
    value,
    color: COLORS[key] || '#94A3B8'
  }));

  return (
    <Card className="col-span-1 shadow-sm border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold">Phân tích Mức độ</CardTitle>
          <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Tỷ lệ theo tính chất nguy hiểm</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="h-[300px] flex flex-col items-center justify-center pt-4">
        <ResponsiveContainer width="100%" height="80%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              animationBegin={0}
              animationDuration={1500}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-4 mt-2 w-full px-4">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.name} ({item.value})</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
