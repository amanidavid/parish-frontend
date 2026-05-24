'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import CustomerService from '@/services/CustomerService';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/ui/ConfirmModal';

const PER_PAGE = 15;

const CUSTOMER_STATUS = {
  active: { label: 'Active', bg: 'bg-green-50', text: 'text-green-700' },
  inactive: { label: 'Inactive', bg: 'bg-gray-100', text: 'text-gray-600' },
};

const CUSTOMER_TYPE = {
  individual: { label: 'Individual', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  business: { label: 'Business', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5' },
};

function StatusBadge({ status }) {
  const s = CUSTOMER_STATUS[status] || CUSTOMER_STATUS.inactive;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 - i * 6}%` }} />
        </td>
      ))}
    </tr>
  );
}

const BTN = {
  gray: 'h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors',
  blue: 'h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors',
  red: 'h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-red-500 hover:bg-red-50 transition-colors',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await CustomerService.list({
        search: appliedSearch || undefined,
        customerType: typeFilter || undefined,
        status: statusFilter || undefined,
        page,
        perPage: PER_PAGE,
      });
      if (data?.success) {
        setCustomers(data.data || []);
        setMeta(data.meta || null);
      } else {
        setError(data?.message);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, typeFilter, statusFilter, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput('');
    setAppliedSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const data = await CustomerService.destroy(deleteTarget.uuid);
      if (data?.success !== false) {
        setCustomers((prev) => prev.filter((c) => c.uuid !== deleteTarget.uuid));
        if (meta) setMeta((m) => ({ ...m, total: Math.max(0, (m.total || 1) - 1) }));
        fetchCustomers();
      }
    } catch {
      /* swallow */
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage tenants and business clients</p>
        </div>
        <Link href="/customers/create" className="btn-primary text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Customer
        </Link>
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
                placeholder="Search by name..."
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
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Types</option>
            <option value="individual">Individual</option>
            <option value="business">Business</option>
          </select>

          <select
            className="input w-auto text-sm"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {(appliedSearch || typeFilter || statusFilter) && (
            <button type="button" onClick={handleClear}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
              Clear all
            </button>
          )}
        </div>

        {meta && (
          <p className="text-sm text-gray-400">
            <span className="font-medium text-gray-700">{meta.total ?? 0}</span> total
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

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Contracts</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm text-gray-500 font-medium">
                    {(appliedSearch || typeFilter || statusFilter)
                      ? 'No customers match your search from the server.'
                      : 'No customers found.'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 mb-3">
                    {(appliedSearch || typeFilter || statusFilter)
                      ? 'Try adjusting your search term or filters.'
                      : 'Register your first customer to start assigning contracts.'}
                  </p>
                  {(appliedSearch || typeFilter || statusFilter) && (
                    <button onClick={handleClear} className="text-xs text-blue-600 hover:underline">Clear search</button>
                  )}
                </td>
              </tr>
            ) : (
              customers.map((customer, idx) => {
                const type = CUSTOMER_TYPE[customer.customer_type] || CUSTOMER_TYPE.individual;
                return (
                  <tr key={customer.uuid} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {((page - 1) * PER_PAGE) + idx + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={type.icon} />
                          </svg>
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{cap(customer.display_name)}</p>
                          {customer.business_detail?.business_name && customer.business_detail.business_name !== customer.display_name && (
                            <p className="text-xs text-gray-400">{customer.business_detail.business_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-gray-500">{type.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {customer.email && <p>{customer.email}</p>}
                      {customer.phone && <p className="text-gray-400">{customer.phone}</p>}
                      {!customer.email && !customer.phone && <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={customer.status} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[24px] h-5 rounded bg-gray-100 text-gray-600 text-xs font-medium px-1.5">
                        {customer.contracts_count ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/customers/${customer.uuid}`} className={BTN.blue}>View</Link>
                        <Link href={`/customers/${customer.uuid}/edit`} className={BTN.gray}>Edit</Link>
                        <button className={BTN.red} onClick={() => setDeleteTarget(customer)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {meta && <Pagination meta={meta} onPageChange={setPage} />}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Customer"
        message={`Delete "${deleteTarget?.display_name}"? Any associated contracts must be removed first.`}
        confirmLabel="Delete Customer"
      />
    </div>
  );
}
