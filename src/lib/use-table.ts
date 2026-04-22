import { useState, useCallback, useEffect, useRef } from 'react';
import api from '@/lib/api';

export interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface UseTableOptions {
  endpoint: string;
  defaultParams?: Record<string, any>;
  perPage?: number;
}

export function useTable<T>({ endpoint, defaultParams = {}, perPage = 20 }: UseTableOptions) {
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<Meta>({ current_page: 1, last_page: 1, per_page: perPage, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [params, setParams] = useState<Record<string, any>>(defaultParams);
  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(async (p: number, q: Record<string, any>) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const res = await api.get(endpoint, {
        params: { ...q, page: p, per_page: perPage },
        signal: abortRef.current.signal,
      });
      setData(res.data?.data ?? []);
      if (res.data?.meta) setMeta(res.data.meta);
    } catch (e: any) {
      if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError' || e?.name === 'AbortError') return;
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [endpoint, perPage]);

  useEffect(() => { fetch(page, params); }, [page, params, fetch]);

  const setFilter = useCallback((key: string, value: any) => {
    setPage(1);
    setParams(prev => {
      const next = { ...prev };
      if (value === '' || value === null || value === undefined) delete next[key];
      else next[key] = value;
      return next;
    });
  }, []);

  const refresh = useCallback(() => fetch(page, params), [fetch, page, params]);

  return { data, meta, loading, page, setPage, setFilter, params, refresh };
}
