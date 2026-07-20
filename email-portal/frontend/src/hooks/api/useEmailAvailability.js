import { useEffect, useRef, useState } from 'react';
import { registryApi } from '../../lib/api/registryApi';
import { GOV_EMAIL_REGEX } from '../../lib/constants';
import useDebouncedValue from '../useDebouncedValue';

/**
 * Powers the "Preferred Email ID" real-time check on the Single and Bulk
 * creation forms, hitting GET /api/registry/check-email — the same
 * endpoint the reference emailCheck.js calls, wired through React state
 * instead of vanilla addEventListener/fetch, with request-race protection
 * (an in-flight check for a stale keystroke can no longer overwrite a
 * newer one's result).
 */
export default function useEmailAvailability(email) {
  const [state, setState] = useState({ status: 'idle', message: '' });
  const debounced = useDebouncedValue((email || '').trim().toLowerCase(), 450);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!debounced) {
      setState({ status: 'idle', message: '' });
      return;
    }
    if (!GOV_EMAIL_REGEX.test(debounced)) {
      setState({ status: 'invalid', message: 'Must end with @assam.gov.in' });
      return;
    }

    const myId = ++requestIdRef.current;
    setState({ status: 'checking', message: 'Checking availability…' });

    registryApi
      .checkEmail(debounced)
      .then((res) => {
        if (myId !== requestIdRef.current) return;
        setState({ status: res.available ? 'available' : 'unavailable', message: res.reason });
      })
      .catch(() => {
        if (myId !== requestIdRef.current) return;
        setState({ status: 'error', message: 'Could not check availability right now.' });
      });
  }, [debounced]);

  return state;
}
