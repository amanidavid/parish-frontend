import apiFetch from '@/lib/apiFetch';

const BASE = '/api/v1/app/staff-property-assignments';

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== '') qs.set(key, val);
  });
  const str = qs.toString();
  return str ? `?${str}` : '';
}

const StaffPropertyAssignmentService = {
  async index(params = {}) {
    return apiFetch(`${BASE}${buildQuery(params)}`);
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

export default StaffPropertyAssignmentService;
