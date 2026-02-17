import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to load async data and provide a refresh function.
 * Re-fetches when deps change or refresh() is called.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetcher();
      setData(result);
    } catch (e) {
      console.error('useAsyncData error:', e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, refresh: load };
}
