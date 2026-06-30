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
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <SkeletonBlock w="w-10" h="h-10" />
              <div className="space-y-2 flex-1">
                <SkeletonBlock w="w-32" h="h-4" />
                <SkeletonBlock w="w-48" h="h-3" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <SkeletonBlock w="w-8" h="h-8" />
                  <div className="space-y-1.5 flex-1">
                    <SkeletonBlock w="w-16" h="h-3" />
                    <SkeletonBlock w="w-28" h="h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : summary && (
          <>
            {/*
            ============================================================
            BILLING SUMMARY — commented out for future use
            ============================================================
            { Access Status Banner, Plan, Billing Profile, Usage & Cost }
            Uncomment below when workspace-level billing summary is needed.
            -----------------------------------------------------------
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <SectionCard title="Plan"> ... </SectionCard>
              <SectionCard title="Subscription Dates"> ... </SectionCard>
              <SectionCard title="Billing Profile"> ... </SectionCard>
              <SectionCard title="Usage & Cost"> ... </SectionCard>
            </div>
            -----------------------------------------------------------
            */}

            {/* ===== Premium Subscription Dates Card ===== */}
            <div className="relative overflow-hidden rounded-2xl ring-1 shadow-sm bg-white ring-gray-200/70">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500" />
              <div className="px-6 py-5">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center ring-1 ring-blue-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Subscription Dates</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Workspace subscription timeline</p>
                  </div>
                </div>

                {/* Dates grid */}
                <div className="flex flex-wrap gap-x-8 gap-y-4">
                  {/* Started */}
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Started</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatDateTime(sub?.starts_at)}</p>
                    </div>
                  </div>

                  {/* Current Period */}
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Current Period</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {sub?.current_period_starts_at ? `${formatDate(sub?.current_period_starts_at)} – ${formatDate(sub?.current_period_ends_at)}` : '—'}
                      </p>
                      {sub?.is_current_period_active && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Trial Ends */}
                  {sub?.trial_ends_at && (
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center mt-0.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Trial Ends</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatDateTime(sub?.trial_ends_at)}</p>
                        {sub?.is_trial_active && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Trial active</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Trial Expired */}
                  {sub?.is_trial_expired !== undefined && (
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center mt-0.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Trial Expired</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">
                          <BoolBadge value={sub?.is_trial_expired} trueLabel="Yes" falseLabel="No" />
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- TAB 2: Property Cost Breakdown --- mounted always, hidden when inactive */}
      <div className={activeTab !== 'properties' ? 'hidden' : 'space-y-4'}>
        {/* Header row with total cost badge */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400 mt-0.5">Per-property billing and estimated cost per property</p>
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
                    <td colSpan={7} className="text-center py-16 text-sm text-gray-500">
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
