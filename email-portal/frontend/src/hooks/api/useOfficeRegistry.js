import { useCallback, useEffect, useState } from 'react';
import { registryApi } from '../../lib/api/registryApi';

/**
 * Loads the caller's own office's Active accounts (scoped server-side for
 * office_admin, global for portal_manager) — used by Modification &
 * Deletion forms so the user picks a real existing account instead of
 * free-typing an email that may not exist or belong to another office.
 */
export default function useOfficeRegistry() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await registryApi.search({ status: 'Active' });
      setRecords(res.data || []);
    } catch {
      setError('Could not load the email account registry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { records, loading, error, refetch };
}
