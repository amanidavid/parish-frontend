'use client';
import React, { useCallback, useEffect, useState } from 'react';
import ReportService from '@/services/ReportService';
import SummaryTab from './SummaryTab';
import ByPropertyTab from './ByPropertyTab';
import ExpiringTab from './ExpiringTab';

const TABS = [
  { key: 'summary', label: 'Summary' },
  { key: 'by-property', label: 'By Property' },
  { key: 'expiring', label: 'Expiring' },
];

const INITIAL_FILTERS = {
  propertyUuid: '',
  customerUuid: '',
  status: '',
  billingCycle: '',
  startDate: '',
  endDate: '',
  search: '',
  days: 30,
  perPage: 15,
  sort: '',
  page: 1,
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'renewed', label: 'Renewed' },
];

const BILLING_CYCLE_OPTIONS = [
  { value: '', label: 'All Cycles' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annually', label: 'Semi-Annually' },
  { value: 'annually', label: 'Annually' },
  { value: 'one_time', label: 'One-Time' },
];

const FilterPanel = React.memo(function FilterPanel({ activeTab, status, billingCycle, startDate, endDate, days, onChange, onReset }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Filters</p>
        <button type="button" onClick={onReset} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
          Reset
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select className="input text-sm w-full" value={status} onChange={(e) => onChange('status', e.target.value)}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Billing Cycle</label>
          <select className="input text-sm w-full" value={billingCycle} onChange={(e) => onChange('billingCycle', e.target.value)}>
            {BILLING_CYCLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
          <input type="date" className="input text-sm w-full" value={startDate} onChange={(e) => onChange('startDate', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
          <input type="date" className="input text-sm w-full" value={endDate} onChange={(e) => onChange('endDate', e.target.value)} />
        </div>
        {activeTab === 'expiring' && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Days to Expiry</label>
            <input type="number" min={1} max={365} className="input text-sm w-full" value={days} onChange={(e) => onChange('days', e.target.value)} />
          </div>
        )}
      </div>
    </div>
  );
});

function ContractReports() {
  const [activeTab, setActiveTab] = useState('summary');
  const [filters, setFilters] = useState(() => ({ ...INITIAL_FILTERS }));

  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const [byPropertyData, setByPropertyData] = useState(null);
  const [byPropertyLoading, setByPropertyLoading] = useState(false);
  const [byPropertyError, setByPropertyError] = useState(null);

  const [expiringData, setExpiringData] = useState(null);
  const [expiringLoading, setExpiringLoading] = useState(false);
  const [expiringError, setExpiringError] = useState(null);

  /* ── Summary: only fires when on summary tab AND summary-relevant filters change ── */
  useEffect(() => {
    if (activeTab !== 'summary') return;
    const ctrl = new AbortController();
    setSummaryLoading(true);
    setSummaryError(null);
    ReportService.contractSummary({
      signal: ctrl.signal,
      propertyUuid: filters.propertyUuid,
      customerUuid: filters.customerUuid,
      status: filters.status,
      billingCycle: filters.billingCycle,
      startDate: filters.startDate,
      endDate: filters.endDate,
    })
      .then((res) => { if (res?.success) setSummaryData(res.data); })
      .catch((e) => { if (e.name !== 'AbortError') setSummaryError('Failed to load summary.'); })
      .finally(() => setSummaryLoading(false));
    return () => ctrl.abort();
  }, [activeTab, filters.propertyUuid, filters.customerUuid, filters.status, filters.billingCycle, filters.startDate, filters.endDate]);

  /* ── By Property: only fires when on by-property tab AND its filters change ── */
  useEffect(() => {
    if (activeTab !== 'by-property') return;
    const ctrl = new AbortController();
    setByPropertyLoading(true);
    setByPropertyError(null);
    ReportService.contractByProperty({
      signal: ctrl.signal,
      propertyUuid: filters.propertyUuid,
      customerUuid: filters.customerUuid,
      status: filters.status,
      billingCycle: filters.billingCycle,
      startDate: filters.startDate,
      endDate: filters.endDate,
      search: filters.search,
      perPage: filters.perPage,
      sort: filters.sort,
      page: filters.page,
    })
      .then((res) => { if (res?.success) setByPropertyData(res.data); })
      .catch((e) => { if (e.name !== 'AbortError') setByPropertyError('Failed to load by-property report.'); })
      .finally(() => setByPropertyLoading(false));
    return () => ctrl.abort();
  }, [activeTab, filters.propertyUuid, filters.customerUuid, filters.status, filters.billingCycle, filters.startDate, filters.endDate, filters.search, filters.perPage, filters.sort, filters.page]);

  /* ── Expiring: only fires when on expiring tab AND its filters change ── */
  useEffect(() => {
    if (activeTab !== 'expiring') return;
    const ctrl = new AbortController();
    setExpiringLoading(true);
    setExpiringError(null);
    ReportService.contractExpiring({
      signal: ctrl.signal,
      propertyUuid: filters.propertyUuid,
      customerUuid: filters.customerUuid,
      status: filters.status,
      billingCycle: filters.billingCycle,
      startDate: filters.startDate,
      endDate: filters.endDate,
      search: filters.search,
      perPage: filters.perPage,
      sort: filters.sort,
      page: filters.page,
      days: filters.days,
    })
      .then((res) => { if (res?.success) setExpiringData(res.data); })
      .catch((e) => { if (e.name !== 'AbortError') setExpiringError('Failed to load expiring contracts.'); })
      .finally(() => setExpiringLoading(false));
    return () => ctrl.abort();
  }, [activeTab, filters.propertyUuid, filters.customerUuid, filters.status, filters.billingCycle, filters.startDate, filters.endDate, filters.search, filters.perPage, filters.sort, filters.page, filters.days]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters({ ...INITIAL_FILTERS });
  }, []);

  const handlePageChange = useCallback((page) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleSort = useCallback((sort) => {
    setFilters((prev) => ({ ...prev, sort, page: 1 }));
  }, []);

  const handleSearchChange = useCallback((value) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  }, []);

  const loading = activeTab === 'summary' ? summaryLoading
    : activeTab === 'by-property' ? byPropertyLoading
      : expiringLoading;

  const error = activeTab === 'summary' ? summaryError
    : activeTab === 'by-property' ? byPropertyError
      : expiringError;

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={[
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          )}
          {!loading && error && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-sm text-red-600 font-medium">{error}</p>
                <button type="button" onClick={() => setFilters((p) => ({ ...p }))} className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium">Retry</button>
              </div>
            </div>
          )}
          {!loading && !error && activeTab === 'summary' && <SummaryTab data={summaryData} />}
          {!loading && !error && activeTab === 'by-property' && (
            <ByPropertyTab data={byPropertyData} sort={filters.sort} onSort={handleSort} page={filters.page} onPageChange={handlePageChange} search={filters.search} onSearch={handleSearchChange} />
          )}
          {!loading && !error && activeTab === 'expiring' && (
            <ExpiringTab data={expiringData} sort={filters.sort} onSort={handleSort} page={filters.page} onPageChange={handlePageChange} search={filters.search} onSearch={handleSearchChange} />
          )}
        </div>
        <div className="lg:col-span-1">
          <FilterPanel
            activeTab={activeTab}
            status={filters.status}
            billingCycle={filters.billingCycle}
            startDate={filters.startDate}
            endDate={filters.endDate}
            days={filters.days}
            onChange={handleFilterChange}
            onReset={handleReset}
          />
        </div>
      </div>
    </div>
  );
}

export default React.memo(ContractReports);
