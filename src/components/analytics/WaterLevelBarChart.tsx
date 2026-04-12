'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface WaterLevelBarChartProps {
  data: any[];
}

export function WaterLevelBarChart({ data }: WaterLevelBarChartProps) {
  return (
    <Card className="col-span-1 md:col-span-2 shadow-sm border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold">Mực nước Trọng điểm</CardTitle>
          <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">So sánh mực nước (m) tại các vùng ngập</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="h-[300px] pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={100}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--foreground))' }}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
            />
            <Bar 
              dataKey="water_level_m" 
              name="Mực nước (m)" 
              radius={[0, 10, 10, 0]}
              barSize={20}
              animationBegin={500}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell 
                   key={`cell-${index}`} 
                   fill={entry.risk_level === 'critical' ? '#EF4444' : '#F59E0B'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
