import apiFetch from '@/lib/apiFetch';

const BASE = '/api/v1/app/reports';

const ReportService = {
  async dashboardOverview(params = {}) {
    const { signal, ...rest } = params;
    const qs = new URLSearchParams({
      per_page: rest.per_page || 10,
      sort: rest.sort || '-vacant_units',
      property_status: rest.property_status || 'active',
    });
    return apiFetch(`${BASE}/dashboard-overview?${qs}`, { signal });
  },

  async contractSummary(params = {}) {
    const { signal, ...filters } = params;
    const qs = buildQuery(filters);
    return apiFetch(`${BASE}/contracts/summary?${qs}`, { signal });
  },

  async contractByProperty(params = {}) {
    const { signal, ...filters } = params;
    const qs = buildQuery(filters);
    return apiFetch(`${BASE}/contracts/by-property?${qs}`, { signal });
  },

  async contractExpiring(params = {}) {
    const { signal, ...filters } = params;
    const qs = buildQuery(filters);
    return apiFetch(`${BASE}/contracts/expiring?${qs}`, { signal });
  },
};

function buildQuery(filters) {
  const qs = new URLSearchParams();
  const append = (key, val) => {
    if (val !== undefined && val !== null && val !== '') qs.append(key, val);
  };
  append('property_uuid', filters.propertyUuid);
  append('customer_uuid', filters.customerUuid);
  append('status', filters.status);
  append('billing_cycle', filters.billingCycle);
  append('start_date', filters.startDate);
  append('end_date', filters.endDate);
  append('search', filters.search);
  append('per_page', filters.perPage ?? 15);
  append('sort', filters.sort);
  append('days', filters.days);
  append('page', filters.page);
  return qs;
}

export default ReportService;
