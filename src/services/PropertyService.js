/**
 * PropertyService — BFF client for /api/v1/app/properties
 *
 * All methods call the Next.js BFF proxy which adds auth + tenant headers.
 * Uses apiFetch for automatic 401 / token-expiry handling.
 */
import apiFetch from '@/lib/apiFetch';

const BASE = '/api/v1/app/properties';

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== '') {
      qs.set(key, val);
    }
  });
  const str = qs.toString();
  return str ? `?${str}` : '';
}

const PropertyService = {
  async index(filters = {}) {
    const normalized = { ...filters };

    if (normalized.search && !normalized.name) {
      normalized.name = normalized.search;
    }

    delete normalized.search;

    /* Only send page when beyond first page (page 1 is server default) */
    if (normalized.page === 1 || normalized.page === '1') {
      delete normalized.page;
    }

    return apiFetch(`${BASE}${buildQuery(normalized)}`);
  },

  async show(uuid) {
    return apiFetch(`${BASE}/${uuid}`);
  },

  async store(data) {
    return apiFetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async update(uuid, data) {
    return apiFetch(`${BASE}/${uuid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async destroy(uuid) {
    return apiFetch(`${BASE}/${uuid}`, { method: 'DELETE' });
  },
};

export default PropertyService;
