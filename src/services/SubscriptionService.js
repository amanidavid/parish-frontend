import apiFetch from '@/lib/apiFetch';

const BASE = '/api/v1/app/workspace/subscription';

const SubscriptionService = {
  async summary() {
    return apiFetch(BASE);
  },

  async properties(params = {}) {
    const query = new URLSearchParams({ per_page: params.perPage || 15 });
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.sort) query.set('sort', params.sort);
    if (params.page && params.page > 1) query.set('page', params.page);
    return apiFetch(`${BASE}/properties?${query}`, {
      ...(params.signal ? { signal: params.signal } : {}),
    });
  },
};

export default SubscriptionService;
