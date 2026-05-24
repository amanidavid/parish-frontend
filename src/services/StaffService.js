import apiFetch from '@/lib/apiFetch';

const BASE = '/api/v1/app/staff-users';

const StaffService = {
  async list(params = {}) {
    const query = new URLSearchParams({ per_page: params.perPage || 15, sort: 'name' });
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.role) query.set('role', params.role);
    if (params.page && params.page > 1) query.set('page', params.page);
    return apiFetch(`${BASE}?${query}`);
  },

  async show(uuid) {
    return apiFetch(`${BASE}/${uuid}`);
  },

  async store(data) {
    return apiFetch(BASE, { method: 'POST', body: JSON.stringify(data) });
  },

  async update(uuid, data) {
    return apiFetch(`${BASE}/${uuid}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async destroy(uuid) {
    return apiFetch(`${BASE}/${uuid}`, { method: 'DELETE' });
  },
};

export default StaffService;
