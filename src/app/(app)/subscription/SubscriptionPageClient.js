'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SubscriptionService from '@/services/SubscriptionService';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';

const TABS = [
  { id: 'summary', label: 'Billing Summary' },
  { id: 'properties', label: 'Property Cost Breakdown' },
];

const PER_PAGE = 15;

const ZERO_DECIMAL_CURRENCIES = new Set(['TZS', 'JPY', 'KRW', 'VND', 'IDR', 'BIF', 'CLP', 'GNF', 'ISK', 'KMF', 'MGA', 'PYG', 'RWF', 'UGX', 'XAF', 'XOF']);

function formatCurrency(cents, currency = 'TZS') {
  if (cents === null || cents === undefined) return '—';
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has((currency || '').toUpperCase());
  const amount = isZeroDecimal ? Number(cents) : Number(cents) / 100;
  const decimals = 2;
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function DetailRow({ label, value, highlight }) {
  return (
    <div className="info-card-row">
      <span className="info-card-label">{label}</span>
      <span className={`info-card-value ${highlight ? 'text-blue-700' : ''}`}>{value ?? '—'}</span>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="info-card">
      <div className="info-card-header">
        <p className="info-card-title">{title}</p>
      </div>
      <div className="info-card-body">{children}</div>
    </div>
  );
}

function AccessStateBadge({ state }) {
  const map = {
    trialing: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', label: 'Trialing' },
    active: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500', label: 'Active' },
    expired: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', label: 'Expired' },
    suspended: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Suspended' },
    inactive: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400', label: 'Inactive' },
    grace: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', label: 'Grace Period' },
  };
  const s = map[state] || map.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function BoolBadge({ value, trueLabel = 'Yes', falseLabel = 'No' }) {
  return value
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-200">{trueLabel}</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-600 border border-red-200">{falseLabel}</span>;
}

function SkeletonBlock({ w = 'w-full', h = 'h-4' }) {
  return <div className={`${w} ${h} bg-gray-100 rounded animate-pulse`} />;
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${70 - i * 7}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function SubscriptionPageClient({ initialSummary = null, initialSummaryError = null }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('summary');
  const [summary, setSummary] = useState(initialSummary);
  const [summaryLoading, setSummaryLoading] = useState(!initialSummary && !initialSummaryError);
  const [summaryError, setSummaryError] = useState(initialSummaryError);
  const [properties, setProperties] = useState([]);
  const [meta, setMeta] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('-registered_units');
  const [page, setPage] = useState(1);
  const searchRef = useRef(null);

  /*
   * Performance pattern:
   *  - Summary tab is SSR-fetched (fast TTFB, active tab ready immediately).
   *  - Properties tab is lazy-loaded client-side on FIRST open only.
   *  - After first load, state is cached — tab switches are instant, no re-fetch.
   *  - Filter/sort/page changes re-fetch only while the tab has been opened.
   *  - AbortController cancels in-flight requests when new ones start.
   */
  const hydratedSummaryRef = useRef(Boolean(initialSummary) && !initialSummaryError);
  const propertiesTabOpenedRef = useRef(false);
  const propertiesAbortRef = useRef(null);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true); setSummaryError(null);
    try {
      const data = await SubscriptionService.summary();
      if (data?.success && data?.data) setSummary(data.data);
      else setSummaryError(data?.message || 'Failed to load subscription summary');
    } catch { setSummaryError('Network error'); }
    finally { setSummaryLoading(false); }
  }, []);

  const fetchProperties = useCallback(async () => {
    /* Cancel any previous in-flight request to prevent stale overwrites */
    if (propertiesAbortRef.current) propertiesAbortRef.current.abort();
    propertiesAbortRef.current = new AbortController();
    const signal = propertiesAbortRef.current.signal;

    setTableLoading(true); setTableError(null);
    try {
      const data = await SubscriptionService.properties({
        search: appliedSearch || undefined,
        status: statusFilter || undefined,
        sort,
        page,
        perPage: PER_PAGE,
        signal,
      });
      if (signal.aborted) return;
      if (data?.success && data?.data) { setProperties(data.data || []); setMeta(data.meta || null); }
      else setTableError(data?.message || 'Failed to load property breakdown');
    } catch (err) {
      if (err?.name !== 'AbortError') setTableError('Network error');
    } finally {
      if (!signal.aborted) setTableLoading(false);
    }
  }, [appliedSearch, statusFilter, sort, page]);

  useEffect(() => {
    if (hydratedSummaryRef.current) { hydratedSummaryRef.current = false; return; }
    fetchSummary();
  }, [fetchSummary]);

  /* Effect 1: Trigger the FIRST fetch when the properties tab is opened */
  useEffect(() => {
    if (activeTab !== 'properties' || propertiesTabOpenedRef.current) return;
    propertiesTabOpenedRef.current = true;
    fetchProperties();
  }, [activeTab, fetchProperties]);

  /* Effect 2: Re-fetch when filters/sort/page change AFTER tab has been opened */
  useEffect(() => {
    if (!propertiesTabOpenedRef.current) return;
    fetchProperties();
  }, [fetchProperties]);

  /* Cleanup: abort any pending properties request on unmount */
  useEffect(() => () => { propertiesAbortRef.current?.abort(); }, []);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); setAppliedSearch(searchInput.trim()); };
  const handleClear = () => { setSearchInput(''); setAppliedSearch(''); setStatusFilter(''); setSort('-registered_units'); setPage(1); };

  const sub = summary?.subscription;
  const plan = sub?.plan;
  const billing = sub?.billing_profile;
  const usage = summary?.usage;
  const currency = billing?.currency || 'TZS';

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-2"
          title="Go back"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">Subscription</h1>
        <p className="text-sm text-gray-400 mt-0.5">Workspace billing, plan details, and property cost breakdown</p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.label}
              {tab.id === 'properties' && meta && (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                  {meta.total ?? 0}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* --- TAB 1: Billing Summary --- mounted always, hidden when inactive */}
      <div className={activeTab !== 'summary' ? 'hidden' : 'space-y-5'}>
        {summaryError && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{summaryError}</div>
        )}

        {summaryLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <SkeletonBlock w="w-24" h="h-3" />
                <SkeletonBlock w="w-40" h="h-5" />
                <SkeletonBlock w="w-32" h="h-3" />
                <SkeletonBlock w="w-36" h="h-3" />
              </div>
            ))}
          </div>
        ) : summary && (
          <>
            {/* Access Status Banner */}
            <div className={`rounded-lg border px-5 py-4 flex flex-wrap items-start gap-4 justify-between ${summary.access_state === 'trialing' ? 'bg-blue-50 border-blue-200' :
              summary.access_state === 'active' ? 'bg-green-50 border-green-200' :
                summary.access_state === 'grace' ? 'bg-orange-50 border-orange-200' :
                  'bg-red-50 border-red-200'
              }`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AccessStateBadge state={summary.access_state} />
                  <span className="text-xs text-gray-500 capitalize">{summary.workspace_status} workspace</span>
                </div>
                <p className="text-sm font-medium text-gray-800">{summary.access_message}</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">Inventory changes:</span>
                <BoolBadge value={summary.inventory_changes_allowed} trueLabel="Allowed" falseLabel="Restricted" />
              </div>
            </div>

            {/* Detail Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Plan */}
              <SectionCard title="Plan">
                <DetailRow label="Name" value={<span className="capitalize font-bold text-blue-700">{plan?.name || '—'}</span>} />
                <DetailRow label="Billing Interval" value={<span className="capitalize">{plan?.billing_interval || '—'}</span>} />
                <DetailRow label="Trial Days" value={plan?.trial_days ?? '—'} />
                <DetailRow label="Properties Included" value={plan?.properties_included ?? '—'} />
                <DetailRow label="Units Limit" value={plan?.features?.units_limit ?? 'Unlimited'} />
                <DetailRow label="Base Price" value={formatCurrency(plan?.price_cents, currency)} />
                <DetailRow label="Price / Property" value={formatCurrency(plan?.price_per_property_cents, currency)} />
              </SectionCard>

              {/* Subscription Dates */}
              <SectionCard title="Subscription Dates">
                <DetailRow label="Status" value={<AccessStateBadge state={sub?.effective_status} />} />
                <DetailRow label="Started" value={formatDateTime(sub?.starts_at)} />
                <DetailRow label="Trial Ends" value={formatDateTime(sub?.trial_ends_at)} highlight={sub?.is_trial_active} />
                <DetailRow label="Trial Active" value={<BoolBadge value={sub?.is_trial_active} trueLabel="Yes" falseLabel="No" />} />
                <DetailRow label="Trial Expired" value={<BoolBadge value={sub?.is_trial_expired} trueLabel="Yes" falseLabel="No" />} />
                <DetailRow label="Period Start" value={formatDateTime(sub?.current_period_starts_at)} />
                <DetailRow label="Period End" value={formatDateTime(sub?.current_period_ends_at)} highlight />
                <DetailRow label="Expires At" value={sub?.expires_at ? formatDateTime(sub.expires_at) : <span className="text-gray-400 text-xs">No expiry</span>} />
                <DetailRow label="Period Active" value={<BoolBadge value={sub?.is_current_period_active} trueLabel="Yes" falseLabel="No" />} />
              </SectionCard>

              {/* Billing Profile */}
              <SectionCard title="Billing Profile">
                <DetailRow label="Profile Name" value={billing?.name || '—'} />
                <DetailRow label="Currency" value={<span className="font-bold text-gray-900">{billing?.currency || '—'}</span>} />
                <DetailRow label="Billing Interval" value={<span className="capitalize">{billing?.billing_interval || '—'}</span>} />
                <DetailRow label="Trial Days" value={billing?.trial_days ?? '—'} />
                <DetailRow label="Grace Days" value={billing?.grace_days ?? '—'} />
                <DetailRow label="Profile Status" value={<StatusBadge status={billing?.status} />} />
              </SectionCard>

              {/* Usage & Cost — simplified: total units + estimated cost only */}
              <SectionCard title="Usage & Cost">
                <div className="py-4 space-y-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Total Units Registered</p>
                    <p className="text-3xl font-bold text-gray-900">{usage?.registered_units_total ?? 0}</p>
                    <p className="text-xs text-gray-400 mt-1">across all properties</p>
                  </div>
                  <div className="border-t border-gray-100 pt-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Estimated Total Cost</p>
                    <p className="text-2xl font-bold text-blue-700">{formatCurrency(usage?.estimated_total_price_cents, currency)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {usage?.property_breakdown_paginated
                        ? 'see Property Cost Breakdown tab for details'
                        : 'aggregate across workspace'}
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          </>
        )}
      </div>

      {/* --- TAB 2: Property Cost Breakdown --- mounted always, hidden when inactive */}
      <div className={activeTab !== 'properties' ? 'hidden' : 'space-y-4'}>
        {/* Header row with total cost badge */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400 mt-0.5">Per-property billing — which pricing rule applies and estimated cost per property</p>
          </div>
          <div className="flex items-center gap-3">
            {meta && (
              <p className="text-sm text-gray-400">
                <span className="font-semibold text-gray-700">{meta.total ?? 0}</span> propert{meta.total === 1 ? 'y' : 'ies'}
              </p>
            )}
            {usage && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <span className="text-xs text-blue-600 font-medium">Total Estimated Cost</span>
                <span className="text-sm font-bold text-blue-700">{formatCurrency(usage.estimated_total_price_cents, currency)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Filters — all server-side */}
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input ref={searchRef} type="text" placeholder="Search property..." className="input pl-9 w-52" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            </div>
            <button type="submit" className="btn-secondary text-sm">Search</button>
          </form>
          <select className="input w-auto text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select className="input w-auto text-sm" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            <option value="name">Name A–Z</option>
            <option value="-name">Name Z–A</option>
            <option value="-registered_units">Most Units</option>
            <option value="registered_units">Fewest Units</option>
            <option value="-created_at">Newest</option>
            <option value="created_at">Oldest</option>
          </select>
          {(appliedSearch || statusFilter || sort !== '-registered_units') && (
            <button type="button" onClick={handleClear} className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">Clear filters</button>
          )}
        </div>

        {tableError && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{tableError}</div>}

        <div className="data-table-wrap">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="data-table min-w-[640px]">
              <thead>
                <tr>
                  <th style={{ width: '2.5rem' }}>#</th>
                  <th>Property</th>
                  <th>Status</th>
                  <th className="text-center">Units</th>
                  <th>Pricing Rule</th>
                  <th>Rule Price</th>
                  <th>Effective From</th>
                  <th>Effective To</th>
                  <th className="text-right">Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {tableLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : properties.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-sm text-gray-500">
                      {appliedSearch || statusFilter ? 'No properties match your filters.' : 'No properties registered yet.'}
                    </td>
                  </tr>
                ) : properties.map((prop, idx) => {
                  const rule = prop.matched_rule;
                  return (
                    <tr key={prop.property_uuid}>
                      <td className="text-xs text-gray-400">{((page - 1) * PER_PAGE) + idx + 1}</td>
                      <td>
                        <p className="font-semibold text-gray-900">{prop.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Registered {formatDate(prop.created_at)}</p>
                      </td>
                      <td><StatusBadge status={prop.status} /></td>
                      <td className="text-center">
                        <span className="badge badge-blue" style={{ borderRadius: '0.375rem' }}>
                          {prop.registered_units}
                        </span>
                      </td>
                      <td>
                        {rule
                          ? <span className="badge badge-purple">{rule.range_start}–{rule.range_end ?? '∞'} units</span>
                          : <span className="text-xs text-gray-400">No rule matched</span>}
                      </td>
                      <td className="font-medium text-gray-700">
                        {rule ? formatCurrency(rule.price_cents, rule.currency) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="text-xs text-gray-600">
                        {rule?.effective_from ? formatDate(rule.effective_from) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="text-xs text-gray-600">
                        {rule?.effective_to ? formatDate(rule.effective_to) : <span className="text-gray-400">No end date</span>}
                      </td>
                      <td className="text-right">
                        <span className="font-bold text-gray-900">
                          {formatCurrency(prop.estimated_price_cents, rule?.currency || currency)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </div>
      </div>
    </div>
  );
}
