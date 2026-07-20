export function toInputDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

/**
 * Normalizes an axios error from any of our controllers into one
 * user-facing string. Backend error shapes are consistently either
 * { message } or { message, errors: [...] } (see requestController.js).
 */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (Array.isArray(data.errors) && data.errors.length) return data.errors.join(' ');
  return data.message || fallback;
}

export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

/**
 * Maps a flat "modification.newCustodianName"-style RHF error path to the
 * message string, or undefined. Small helper so form JSX doesn't repeat
 * the same optional-chaining dance for every field.
 */
export function fieldError(errors, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], errors)?.message;
}
