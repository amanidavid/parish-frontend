import apiFetch from '@/lib/apiFetch';

const JOBS_BASE = '/api/v1/app/maintenance/jobs';
const EXPENSES_BASE = '/api/v1/app/maintenance/expenses';
const REPORTS_BASE = '/api/v1/app/reports/maintenance';

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== '') qs.set(key, String(val));
  });
  const str = qs.toString();
  return str ? `?${str}` : '';
}

const MaintenanceService = {
  // ─── Jobs ──────────────────────────────────────────────────────────────────
  jobsIndex(params = {}) {
    return apiFetch(`${JOBS_BASE}${buildQuery(params)}`);
  },

  jobsShow(uuid) {
    return apiFetch(`${JOBS_BASE}/${uuid}`);
  },

  jobsStore(data) {
    return apiFetch(JOBS_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  jobsUpdate(uuid, data) {
    return apiFetch(`${JOBS_BASE}/${uuid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  jobsDestroy(uuid) {
    return apiFetch(`${JOBS_BASE}/${uuid}`, { method: 'DELETE' });
  },

  // ─── Expenses ─────────────────────────────────────────────────────────────
  expensesIndex(params = {}) {
    return apiFetch(`${EXPENSES_BASE}${buildQuery(params)}`);
  },

  expensesShow(uuid) {
    return apiFetch(`${EXPENSES_BASE}/${uuid}`);
  },

  expensesStore(data) {
    return apiFetch(EXPENSES_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  expensesUpdate(uuid, data) {
    return apiFetch(`${EXPENSES_BASE}/${uuid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  expensesDestroy(uuid) {
    return apiFetch(`${EXPENSES_BASE}/${uuid}`, { method: 'DELETE' });
  },

  // ─── Reports ───────────────────────────────────────────────────────────────
  summaryReport(params = {}) {
    return apiFetch(`${REPORTS_BASE}/summary${buildQuery(params)}`);
  },

  byPropertyReport(params = {}) {
    return apiFetch(`${REPORTS_BASE}/by-property${buildQuery(params)}`);
  },

  recentExpensesReport(params = {}) {
    return apiFetch(`${REPORTS_BASE}/recent-expenses${buildQuery(params)}`);
  },
};

export default MaintenanceService;
