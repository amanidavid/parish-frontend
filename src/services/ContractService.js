import apiFetch from '@/lib/apiFetch';

const BASE = '/api/v1/app/customer-contracts';

const ContractService = {
  async list(params = {}) {
    const query = new URLSearchParams({ per_page: params.perPage || 15, sort: '-start_date' });
    if (params.propertyUuid) query.set('property_uuid', params.propertyUuid);
    if (params.customerUuid) query.set('customer_uuid', params.customerUuid);
    if (params.unitUuid) query.set('unit_uuid', params.unitUuid);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.startDate) query.set('start_date', params.startDate);
    if (params.endDate) query.set('end_date', params.endDate);
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

  async nextNumber({ unitUuid, startDate }) {
    const query = new URLSearchParams();
    if (unitUuid) query.set('unit_uuid', unitUuid);
    if (startDate) query.set('start_date', startDate);
    return apiFetch(`${BASE}/next-number?${query}`);
  },
};

export default ContractService;
