import apiFetch from '@/lib/apiFetch';

const ReportService = {
  async dashboardOverview(params = {}) {
    const { signal, ...rest } = params;
    const qs = new URLSearchParams({
      per_page: rest.per_page || 10,
      sort: rest.sort || '-vacant_units',
      property_status: rest.property_status || 'active',
    });
    return apiFetch(`/api/v1/app/reports/dashboard-overview?${qs}`, { signal });
  },
};

export default ReportService;
