import { useCallback, useEffect, useState } from 'react';
import { dashboardApi } from '../../lib/api/dashboardApi';

export default function useDashboardMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [scope, setScope] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardApi.getMetrics();
      setMetrics(res.data);
      setScope(res.scope);
    } catch {
      setError('Could not load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { metrics, scope, loading, error, refetch };
}
