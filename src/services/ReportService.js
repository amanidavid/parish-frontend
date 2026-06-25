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

  async contractCollectionsChart(params = {}) {
    const { signal, ...filters } = params;
    const qs = buildChartQuery(filters);
    return apiFetch(`${BASE}/contracts/chart?${qs}`, { signal });
  },

  async contractSummaryCards(params = {}) {
    const qs = new URLSearchParams();
    const append = (key, val) => {
      if (val !== undefined && val !== null && val !== '') qs.append(key, val);
    };
    append('property_uuid', params.propertyUuid);
    append('range', params.range);
    append('start_date', params.startDate);
    append('end_date', params.endDate);
    return apiFetch(`${BASE}/contracts/summary-cards?${qs}`);
  },

  async contractMonthlyActiveAmountChart(params = {}) {
    const qs = new URLSearchParams();
    const append = (key, val) => {
      if (val !== undefined && val !== null && val !== '') qs.append(key, val);
    };
    append('property_uuid', params.propertyUuid);
    append('window', params.window || 'last_12_months');
    return apiFetch(`${BASE}/contracts/monthly-active-amount-chart?${qs}`);
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

function buildChartQuery(filters) {
  const qs = new URLSearchParams();
  const append = (key, val) => {
    if (val !== undefined && val !== null && val !== '') qs.append(key, val);
  };
  append('property_uuid', filters.propertyUuid);
  append('billing_cycle', filters.billingCycle);
  append('period', filters.period);
  append('range', filters.range);
  append('start_date', filters.startDate);
  append('end_date', filters.endDate);
  append('group_by', filters.groupBy);
  append('metric', filters.metric);
  if (Array.isArray(filters.recognizedStatuses) && filters.recognizedStatuses.length) {
    filters.recognizedStatuses.forEach((s) => qs.append('recognized_statuses[]', s));
  }
  return qs;
}

export default ReportService;
