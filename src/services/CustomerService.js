import apiFetch from '@/lib/apiFetch';

const BASE = '/api/v1/app/customers';

const CustomerService = {
  async list(params = {}) {
    const query = new URLSearchParams({ per_page: params.perPage || 50, sort: 'display_name' });
    if (params.search) query.set('search', params.search);
    if (params.customerType) query.set('customer_type', params.customerType);
    if (params.status) query.set('status', params.status);
    if (params.propertyUuid) query.set('property_uuid', params.propertyUuid);
    if (params.page && params.page > 1) query.set('page', params.page);
    return apiFetch(`${BASE}?${query}`);
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

export default CustomerService;
