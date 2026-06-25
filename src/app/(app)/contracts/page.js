'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ContractService from '@/services/ContractService';
import Pagination from '@/components/ui/Pagination';

const PER_PAGE = 15;

const CONTRACT_STATUS = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-600' },
  active: { label: 'Active', bg: 'bg-green-50', text: 'text-green-700' },
  expired: { label: 'Expired', bg: 'bg-orange-50', text: 'text-orange-700' },
  terminated: { label: 'Terminated', bg: 'bg-red-50', text: 'text-red-700' },
};

function ContractStatusBadge({ status }) {
  const s = CONTRACT_STATUS[status] || CONTRACT_STATUS.draft;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${70 - i * 6}%` }} />
        </td>
      ))}
    </tr>
  );
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

function fmtAmount(amount, currency) {
  return amount != null ? `${currency || ''} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
}

function ContractsContent() {
  const searchParams = useSearchParams();
  const initialUnitUuid = searchParams.get('unit_uuid') || '';
  const urlPropertyUuid = searchParams.get('property_uuid') || null;

  const [contracts, setContracts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const propertyUuid = urlPropertyUuid;

  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  /* const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState(''); */
  const [unitUuidFilter, setUnitUuidFilter] = useState(initialUnitUuid);
  const [page, setPage] = useState(1);
  const searchRef = useRef(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ContractService.list({
        search: appliedSearch || undefined,
        status: statusFilter || undefined,
        unitUuid: unitUuidFilter || undefined,
        /* startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined, */
        page,
        perPage: PER_PAGE,
      });
      if (data?.success && data?.data) {
        setContracts(data.data || []);
        setMeta(data.meta || null);
      } else {
        setError(data?.message || 'Failed to load contracts');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, statusFilter, unitUuidFilter, /* startDateFilter, endDateFilter, */ page]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput('');
    setAppliedSearch('');
    setStatusFilter('');
    /* setStartDateFilter('');
    setEndDateFilter(''); */
    setUnitUuidFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Contracts</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {unitUuidFilter ? 'Contracts for selected unit' : 'Manage all customer contracts'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unitUuidFilter && (
            <>
              {propertyUuid && (
                <>
                  <Link
                    href={`/properties/${propertyUuid}?tab=units`}
                    className="btn-secondary text-sm flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Units
                  </Link>
                  <Link
                    href={`/properties/${propertyUuid}?tab=contracts`}
                    className="btn-primary text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Contract
                  </Link>
                </>
              )}
            </>
          )}
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
                placeholder="Search contract no..."
                className="input pl-9 pr-8 w-52"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); setAppliedSearch(''); setPage(1); }}
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
            {Object.entries(CONTRACT_STATUS).map(([val, { label }]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          {/* <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
            <input type="date" value={startDateFilter} onChange={(e) => { setStartDateFilter(e.target.value); setPage(1); }}
              className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
            <input type="date" value={endDateFilter} onChange={(e) => { setEndDateFilter(e.target.value); setPage(1); }}
              className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </div> */}

          {(appliedSearch || statusFilter || unitUuidFilter /* || startDateFilter || endDateFilter */) && (
            <button type="button" onClick={handleClear}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
              Clear all
            </button>
          )}
        </div>

        {meta && (
          <p className="text-sm text-gray-400">
            <span className="font-medium text-gray-700">{meta.total ?? 0}</span> contracts
          </p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {error && (
          <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 m-4 px-4 py-3">
            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contract No.</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : contracts.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-500 font-medium">
                    {appliedSearch || statusFilter || unitUuidFilter /* || startDateFilter || endDateFilter */ ? 'No contracts match your filters.' : 'No contracts found.'}
                  </p>
                  {(appliedSearch || statusFilter || unitUuidFilter /* || startDateFilter || endDateFilter */) && (
                    <button onClick={handleClear} className="text-xs text-blue-600 hover:underline mt-2">Clear filters</button>
                  )}
                </td>
              </tr>
            ) : (
              contracts.map((c, idx) => (
                <tr key={c.uuid} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {((page - 1) * (meta?.per_page || 15)) + idx + 1}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">{c.contract_number}</td>
                  <td className="px-5 py-3.5 text-gray-700 text-sm">
                    {c.customer?.display_name || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 text-sm">
                    {c.unit?.property?.name || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {c.unit?.unit_number || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 tabular-nums text-sm">{fmtAmount(c.amount, c.currency)}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                    <div>{fmtDate(c.start_date)}{c.end_date ? ` → ${fmtDate(c.end_date)}` : ' → Open'}</div>
                    {c.duration_label && (
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-semibold">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {c.duration_label}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5"><ContractStatusBadge status={c.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table></div>

        {meta && <Pagination meta={meta} onPageChange={setPage} />}
      </div>
    </div>
  );
}

export default function ContractsPage() {
  return (
    <Suspense fallback={null}>
      <ContractsContent />
    </Suspense>
  );
}
