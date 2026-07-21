import { useCallback, useEffect, useState } from 'react';
import { requestsApi } from '../../lib/api/requestsApi';
import { getErrorMessage } from '../../lib/utils';

/**
 * Shared list hook — user gets their own submissions only (server
 * enforces this regardless via req.user.id scoping in listRequests),
 * portal_manager gets every office's requests. Used by both dashboards'
 * "My Requests" / "Review Queue" tabs.
 */
export default function useRequestsList(initialFilters = {}) {
  const [filters, setFilters] = useState({ page: 1, limit: 20, ...initialFilters });
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await requestsApi.list(filters);
      setData(res.data || []);
      setPagination(res.pagination || null);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load requests.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, pagination, loading, error, filters, setFilters, refetch };
}
