/**
 * PropertyService — BFF client for /api/v1/app/properties
 *
 * All methods call the Next.js BFF proxy which adds auth + tenant headers.
 * Uses apiFetch for automatic 401 / token-expiry handling.
 */
import apiFetch from '@/lib/apiFetch';

const BASE = '/api/v1/app/properties';

/** Build a query string from a plain object, omitting null/undefined/empty values. */
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
  /**
   * Fetch paginated properties list.
   *
   * @param {{ name?: string, status?: string, type_uuid?: string, per_page?: number, page?: number, sort?: string }} filters
   */
  async index(filters = {}) {
    return apiFetch(`${BASE}${buildQuery(filters)}`);
  },

  /**
   * Fetch a single property by UUID.
   *
   * @param {string} uuid
   */
  async show(uuid) {
    return apiFetch(`${BASE}/${uuid}`);
  },

  /**
   * Create a new property.
   *
   * @param {{ name: string, type_uuid?: string, ward_uuid?: string, address_line?: string, postal_code?: string, status?: string }} data
   */
  async store(data) {
    return apiFetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing property.
   *
   * @param {string} uuid
   * @param {object} data
   */
  async update(uuid, data) {
    return apiFetch(`${BASE}/${uuid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a property by UUID.
   *
   * @param {string} uuid
   */
  async destroy(uuid) {
    return apiFetch(`${BASE}/${uuid}`, { method: 'DELETE' });
  },
};

export default PropertyService;
