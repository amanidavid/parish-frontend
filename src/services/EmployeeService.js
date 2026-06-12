import apiFetch from '@/lib/apiFetch';

const BASE = '/api/v1/employees';

const EmployeeService = {
  async list(params = {}) {
    const query = new URLSearchParams({ per_page: params.perPage || 15 });
    if (params.search) query.set('search', params.search);
    if (params.branch_uuid) query.set('branch_uuid', params.branch_uuid);
    if (params.employment_status) query.set('employment_status', params.employment_status);
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
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async getProfile(uuid) {
    return apiFetch(`${BASE}/${uuid}/profile`);
  },

  async updateProfile(uuid, data) {
    return apiFetch(`${BASE}/${uuid}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async invite(uuid, email) {
    return apiFetch(`${BASE}/${uuid}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  },

  async getAccess(uuid) {
    return apiFetch(`${BASE}/${uuid}/access`);
  },

  async updateAccess(uuid, data) {
    return apiFetch(`${BASE}/${uuid}/access`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async offboard(uuid, data) {
    return apiFetch(`${BASE}/${uuid}/offboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async listDocuments(uuid, params = {}) {
    const query = new URLSearchParams({ per_page: params.perPage || 15 });
    if (params.page && params.page > 1) query.set('page', params.page);
    return apiFetch(`${BASE}/${uuid}/documents?${query}`);
  },

  async storeDocument(uuid, data) {
    return apiFetch(`${BASE}/${uuid}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateDocument(uuid, docUuid, data) {
    return apiFetch(`${BASE}/${uuid}/documents/${docUuid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async destroyDocument(uuid, docUuid) {
    return apiFetch(`${BASE}/${uuid}/documents/${docUuid}`, { method: 'DELETE' });
  },

  async listContracts(uuid, params = {}) {
    const query = new URLSearchParams({ per_page: params.perPage || 15 });
    if (params.page && params.page > 1) query.set('page', params.page);
    return apiFetch(`${BASE}/${uuid}/contracts?${query}`);
  },

  async storeContract(uuid, data) {
    return apiFetch(`${BASE}/${uuid}/contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateContract(uuid, contractUuid, data) {
    return apiFetch(`${BASE}/${uuid}/contracts/${contractUuid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async destroyContract(uuid, contractUuid) {
    return apiFetch(`${BASE}/${uuid}/contracts/${contractUuid}`, { method: 'DELETE' });
  },
};

export default EmployeeService;
