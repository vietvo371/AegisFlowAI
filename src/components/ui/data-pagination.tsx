'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Meta } from '@/lib/use-table';

interface Props {
  meta: Meta;
  onPageChange: (page: number) => void;
}

export function DataPagination({ meta, onPageChange }: Props) {
  if (meta.last_page <= 1) return null;

  const { current_page, last_page, total, per_page } = meta;
  const from = (current_page - 1) * per_page + 1;
  const to   = Math.min(current_page * per_page, total);

  return (
    <div className="flex items-center justify-between px-2 py-3 border-t border-border">
      <p className="text-xs text-muted-foreground">
        {from}–{to} / <span className="font-bold">{total}</span> kết quả
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline" size="icon" className="h-8 w-8"
          disabled={current_page === 1}
          onClick={() => onPageChange(current_page - 1)}
        >
          <ChevronLeft size={14} />
        </Button>
        {/* Page numbers — show max 5 */}
        {Array.from({ length: last_page }, (_, i) => i + 1)
          .filter(p => p === 1 || p === last_page || Math.abs(p - current_page) <= 1)
          .reduce<(number | '...')[]>((acc, p, i, arr) => {
            if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
            ) : (
              <Button
                key={p}
                variant={p === current_page ? 'default' : 'outline'}
                size="icon" className="h-8 w-8 text-xs"
                onClick={() => onPageChange(p as number)}
              >
                {p}
              </Button>
            )
          )
        }
        <Button
          variant="outline" size="icon" className="h-8 w-8"
          disabled={current_page === last_page}
          onClick={() => onPageChange(current_page + 1)}
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
