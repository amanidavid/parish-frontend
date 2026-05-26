import apiFetch from '@/lib/apiFetch';

const BASE = '/api/v1/app/property-floors';

const FloorService = {
  async list(propertyUuid, params = {}) {
    const query = new URLSearchParams({
      property_uuid: propertyUuid,
      per_page: params.perPage || 15,
      sort: 'floor_number',
    });
    if (params.search) query.set('search', params.search);
    if (params.page && params.page > 1) query.set('page', params.page);
    return apiFetch(`${BASE}?${query}`, {
      ...(params.signal ? { signal: params.signal } : {}),
    });
  },

  async listAll(propertyUuid, params = {}) {
    return apiFetch(
      `${BASE}?property_uuid=${propertyUuid}&per_page=100&sort=floor_number`,
      { ...(params.signal ? { signal: params.signal } : {}) },
    );
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

export default FloorService;
