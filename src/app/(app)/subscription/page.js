'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import SubscriptionService from '@/services/SubscriptionService';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';

const PER_PAGE = 15;

function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
      <div className="h-6 bg-gray-100 rounded animate-pulse w-2/3" />
      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${70 - i * 8}%` }} />
        </td>
      ))}
    </tr>
  );
}

function formatCurrency(cents, currency = 'TZS') {
  if (!cents && cents !== 0) return '—';
  const value = (Number(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${currency} ${value}`;
}

function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d)) return dateString;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d)) return dateString;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function AccessStateBadge({ state }) {
  const styles = {
    trialing: 'bg-blue-50 text-blue-700 ring-blue-200',
    active: 'bg-green-50 text-green-700 ring-green-200',
    past_due: 'bg-orange-50 text-orange-700 ring-orange-200',
    canceled: 'bg-red-50 text-red-600 ring-red-200',
    suspended: 'bg-gray-100 text-gray-600 ring-gray-200',
    provisioning: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
    unconfigured: 'bg-gray-100 text-gray-500 ring-gray-200',
    restricted: 'bg-red-50 text-red-600 ring-red-200',
  };
  const cls = styles[state] || styles.restricted;
  const label = state ? state.charAt(0).toUpperCase() + state.slice(1).replace(/_/g, ' ') : '—';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

export default function SubscriptionPage() {
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  const [properties, setProperties] = useState([]);
  const [meta, setMeta] = useState(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const searchRef = useRef(null);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await SubscriptionService.summary();
      if (data?.success && data?.data) {
        setSummary(data.data);
      } else {
        setSummaryError(data?.message || 'Failed to load subscription summary');
      }
    } catch {
      setSummaryError('Network error');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    setTableLoading(true);
    setTableError(null);
    try {
      const data = await SubscriptionService.properties({
        search: appliedSearch || undefined,
        status: statusFilter || undefined,
        sort,
        page,
        perPage: PER_PAGE,
      });
      if (data?.success && data?.data) {
        setProperties(data.data || []);
        setMeta(data.meta || null);
      } else {
        setTableError(data?.message || 'Failed to load property breakdown');
      }
    } catch {
      setTableError('Network error');
    } finally {
      setTableLoading(false);
    }
  }, [appliedSearch, statusFilter, sort, page]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput('');
    setAppliedSearch('');
    setStatusFilter('');
    setSort('name');
    setPage(1);
  };

  const plan = summary?.subscription?.plan;
  const billingProfile = summary?.subscription?.billing_profile;
  const usage = summary?.usage;
  const currency = billingProfile?.currency || 'TZS';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Subscription</h1>
        <p className="text-sm text-gray-400 mt-0.5">Workspace billing and usage overview</p>
      </div>

      {/* Summary Section */}
      {summaryError && (
        <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{summaryError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : summary ? (
          <>
            {/* Plan Card */}
            <div className="card p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Plan</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900 capitalize">{plan?.name || '—'}</span>
                {plan?.billing_interval && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                    {plan.billing_interval}
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">Price</span>
                  <span className="font-medium">{formatCurrency(plan?.price_cents, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Properties included</span>
                  <span className="font-medium">{plan?.properties_included ?? '—'}</span>
                </div>
                {plan?.features?.units_limit !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Units limit</span>
                    <span className="font-medium">{plan.features.units_limit}</span>
                  </div>
                )}
                {plan?.trial_days !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trial days</span>
                    <span className="font-medium">{plan.trial_days}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Card */}
            <div className="card p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</p>
              <div className="mt-2">
                <AccessStateBadge state={summary.access_state} />
              </div>
              <p className="mt-2 text-sm text-gray-600">{summary.access_message}</p>
              <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                {summary.subscription?.is_trial_active && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trial ends</span>
                    <span className="font-medium">{formatDate(summary.subscription.trial_ends_at)}</span>
                  </div>
                )}
                {summary.subscription?.current_period_starts_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Period</span>
                    <span className="font-medium">
                      {formatDate(summary.subscription.current_period_starts_at)} – {formatDate(summary.subscription.current_period_ends_at)}
                    </span>
                  </div>
                )}
                {summary.subscription?.starts_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Started</span>
                    <span className="font-medium">{formatDate(summary.subscription.starts_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Usage Card */}
            <div className="card p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Usage</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{usage?.registered_properties ?? 0}</span>
                <span className="text-sm text-gray-500">properties</span>
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">Registered units</span>
                  <span className="font-medium">{usage?.registered_units_total ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Estimated price</span>
                  <span className="font-medium text-gray-900">{formatCurrency(usage?.estimated_total_price_cents, currency)}</span>
                </div>
                {plan?.features?.units_limit !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Units used</span>
                    <span className={`font-medium ${usage?.registered_units_total > plan.features.units_limit ? 'text-red-600' : ''}`}>
                      {usage?.registered_units_total ?? 0} / {plan.features.units_limit}
                    </span>
                  </div>
                )}
              </div>
              {usage?.registered_units_total > (plan?.features?.units_limit ?? Infinity) && (
                <p className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">Unit limit exceeded</p>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Property Breakdown Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Property Billing Breakdown</h2>
            <p className="text-sm text-gray-400 mt-0.5">Per-property unit counts and estimated charges</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search property name..."
                  className="input pl-9 pr-8 w-56"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {searchInput && (
                  <button type="button" onClick={handleClear}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button type="submit" className="btn-secondary text-sm">Search</button>
            </form>

            <select
              className="input w-auto text-sm"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              className="input w-auto text-sm"
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
            >
              <option value="name">Name ↑</option>
              <option value="-name">Name ↓</option>
              <option value="registered_units">Units ↑</option>
              <option value="-registered_units">Units ↓</option>
              <option value="created_at">Created ↑</option>
              <option value="-created_at">Created ↓</option>
            </select>

            {(appliedSearch || statusFilter || sort !== 'name') && (
              <button type="button" onClick={handleClear}
                className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                Clear all
              </button>
            )}
          </div>

          {meta && (
            <p className="text-sm text-gray-400">
              <span className="font-medium text-gray-700">{meta.total ?? 0}</span> properties
            </p>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {tableError && (
            <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 m-4 px-4 py-3">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{tableError}</p>
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Units</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Matched Rule</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Est. Price</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-sm text-gray-500 font-medium">
                      {appliedSearch || statusFilter ? 'No properties match your filters.' : 'No properties found.'}
                    </p>
                    {(appliedSearch || statusFilter) && (
                      <button onClick={handleClear} className="text-xs text-blue-600 hover:underline mt-2">Clear filters</button>
                    )}
                  </td>
                </tr>
              ) : (
                properties.map((property) => (
                  <tr key={property.property_uuid} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{property.name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{property.property_uuid}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={property.status} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {property.registered_units}
                    </td>
                    <td className="px-5 py-3.5">
                      {property.matched_rule ? (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{property.matched_rule.range_start}–{property.matched_rule.range_end}</span>
                          <span className="text-gray-400 mx-1">·</span>
                          <span>{formatCurrency(property.matched_rule.price_cents, property.matched_rule.currency)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                      {formatCurrency(property.estimated_price_cents, currency)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {formatDate(property.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </div>
      </div>
    </div>
  );
}
