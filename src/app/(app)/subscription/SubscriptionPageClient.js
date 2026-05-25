'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import SubscriptionService from '@/services/SubscriptionService';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';

const PER_PAGE = 15;

function SkeletonCard() {
  return <div className="card p-5 space-y-3"><div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" /><div className="h-6 bg-gray-100 rounded animate-pulse w-2/3" /><div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" /></div>;
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-5 py-3.5"><div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${70 - i * 8}%` }} /></td>
      ))}
    </tr>
  );
}

function formatCurrency(cents, currency = 'TZS') {
  if (!cents && cents !== 0) return '—';
  const value = (Number(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${currency} ${value}`;
}

export default function SubscriptionPageClient({ initialSummary = null, initialSummaryError = null, initialProperties = [], initialMeta = null, initialTableError = null }) {
  const [summary, setSummary] = useState(initialSummary);
  const [summaryLoading, setSummaryLoading] = useState(!initialSummary && !initialSummaryError);
  const [summaryError, setSummaryError] = useState(initialSummaryError);
  const [properties, setProperties] = useState(initialProperties);
  const [meta, setMeta] = useState(initialMeta);
  const [tableLoading, setTableLoading] = useState(!initialMeta && !initialTableError);
  const [tableError, setTableError] = useState(initialTableError);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(initialMeta?.current_page ?? 1);
  const searchRef = useRef(null);
  const hydratedSummaryRef = useRef(Boolean(initialSummary) && !initialSummaryError);
  const hydratedTableRef = useRef(Boolean(initialMeta) && !initialTableError);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true); setSummaryError(null);
    try {
      const data = await SubscriptionService.summary();
      if (data?.success && data?.data) setSummary(data.data); else setSummaryError(data?.message || 'Failed to load subscription summary');
    } catch { setSummaryError('Network error'); }
    finally { setSummaryLoading(false); }
  }, []);

  const fetchProperties = useCallback(async () => {
    setTableLoading(true); setTableError(null);
    try {
      const data = await SubscriptionService.properties({ search: appliedSearch || undefined, status: statusFilter || undefined, sort, page, perPage: PER_PAGE });
      if (data?.success && data?.data) { setProperties(data.data || []); setMeta(data.meta || null); } else { setTableError(data?.message || 'Failed to load property breakdown'); }
    } catch { setTableError('Network error'); }
    finally { setTableLoading(false); }
  }, [appliedSearch, statusFilter, sort, page]);

  useEffect(() => {
    if (hydratedSummaryRef.current) { hydratedSummaryRef.current = false; return; }
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (hydratedTableRef.current && page === 1 && !appliedSearch && !statusFilter && sort === 'name') {
      hydratedTableRef.current = false;
      return;
    }
    fetchProperties();
  }, [fetchProperties, page, appliedSearch, statusFilter, sort]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); setAppliedSearch(searchInput.trim()); };
  const handleClear = () => { setSearchInput(''); setAppliedSearch(''); setStatusFilter(''); setSort('name'); setPage(1); };

  const plan = summary?.subscription?.plan;
  const usage = summary?.usage;
  const currency = summary?.subscription?.billing_profile?.currency || 'TZS';

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-bold text-gray-900">Subscription</h1><p className="text-sm text-gray-400 mt-0.5">Workspace billing and usage overview</p></div>
      {summaryError && <div className="text-sm text-red-700">{summaryError}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryLoading ? <><SkeletonCard /><SkeletonCard /><SkeletonCard /></> : (
          <>
            <div className="card p-5"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Plan</p><div className="mt-2 text-lg font-bold text-gray-900 capitalize">{plan?.name || '—'}</div><div className="mt-3 text-sm text-gray-600">Properties included: {plan?.properties_included ?? '—'}</div></div>
            <div className="card p-5"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</p><div className="mt-2"><StatusBadge status={summary?.access_state || 'inactive'} /></div><p className="mt-2 text-sm text-gray-600">{summary?.access_message}</p></div>
            <div className="card p-5"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Usage</p><div className="mt-2 text-2xl font-bold text-gray-900">{usage?.registered_properties ?? 0}</div><div className="mt-3 text-sm text-gray-600">Estimated price: {formatCurrency(usage?.estimated_total_price_cents, currency)}</div></div>
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <form onSubmit={handleSearch} className="flex items-center gap-2"><input ref={searchRef} type="text" placeholder="Search property name..." className="input w-56" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} /><button type="submit" className="btn-secondary text-sm">Search</button></form>
            <select className="input w-auto text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}><option value="">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
            <select className="input w-auto text-sm" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}><option value="name">Name ?</option><option value="-name">Name ?</option><option value="registered_units">Units ?</option><option value="-registered_units">Units ?</option><option value="created_at">Created ?</option><option value="-created_at">Created ?</option></select>
            {(appliedSearch || statusFilter || sort !== 'name') && <button type="button" onClick={handleClear} className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">Clear all</button>}
          </div>
          {meta && <p className="text-sm text-gray-400"><span className="font-medium text-gray-700">{meta.total ?? 0}</span> properties</p>}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {tableError && <div className="m-4 text-sm text-red-700">{tableError}</div>}
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Units</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Est. Price</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th></tr></thead>
            <tbody>
              {tableLoading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) : properties.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-sm text-gray-500">No properties found.</td></tr>
              ) : properties.map((property) => (
                <tr key={property.property_uuid} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5"><p className="font-medium text-gray-900">{property.name}</p></td>
                  <td className="px-5 py-3.5"><StatusBadge status={property.status} /></td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{property.registered_units}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{formatCurrency(property.estimated_price_cents, currency)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{property.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </div>
      </div>
    </div>
  );
}
