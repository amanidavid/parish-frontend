import apiFetch from '@/lib/apiFetch';

const BASE = '/api/v1/app/access-control/roles';

const RoleService = {
  async list(params = {}) {
    const query = new URLSearchParams({ per_page: params.perPage || 50 });
    if (params.search) query.set('search', params.search);
    if (params.page && params.page > 1) query.set('page', params.page);
    return apiFetch(`${BASE}?${query}`);
  },
};

export default RoleService;
