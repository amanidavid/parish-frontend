/**
 * apiFetch — shared BFF fetch client.
 *
 * Automatically clears Zustand auth state and redirects to /login
 * when the BFF returns a 401 (token expired or invalid).
 *
 * Usage (replaces raw fetch in Service files):
 *   import apiFetch from '@/lib/apiFetch';
 *   const data = await apiFetch('/api/v1/app/properties');
 */
import useAuthStore from '@/store/authStore';

export default async function apiFetch(url, options = {}) {
  const res = await fetch(url, { cache: 'no-store', ...options });

  if (res.status === 401) {
    useAuthStore.getState().clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return { success: false, message: 'Session expired' };
  }

  return res.json().catch(() => ({ success: false }));
}
