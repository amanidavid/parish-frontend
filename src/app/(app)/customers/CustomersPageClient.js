'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import CustomerService from '@/services/CustomerService';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/ui/ConfirmModal';
import useCan from '@/hooks/useCan';

const PER_PAGE = 50;

function StatusBadge({ status }) {
  return status === 'active'
    ? <span className="badge badge-green">Active</span>
    : <span className="badge badge-gray">Inactive</span>;
}

function TypeBadge({ type }) {
  return type === 'business'
    ? <span className="badge badge-blue">Business</span>
    : <span className="badge badge-gray">Individual</span>;
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

export default function CustomersPageClient({ initialItems = [], initialMeta = null, initialError = null }) {
  const [customers, setCustomers] = useState(initialItems);
  const [meta, setMeta] = useState(initialMeta);
  const [loading, setLoading] = useState(!initialMeta && !initialError);
  const [error, setError] = useState(initialError);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(initialMeta?.current_page ?? 1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef(null);
  const hydratedInitialRef = useRef(Boolean(initialMeta) && !initialError);

  const canCreate = useCan('customers.create');
  const canEdit = useCan('customers.edit');
  const canDelete = useCan('customers.delete');

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
        setError(data?.message || 'Failed to load customers');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, typeFilter, statusFilter, page]);

  useEffect(() => {
    if (hydratedInitialRef.current && page === 1 && !appliedSearch && !typeFilter && !statusFilter) {
      hydratedInitialRef.current = false;
      return;
    }

    fetchCustomers();
  }, [fetchCustomers, page, appliedSearch, typeFilter, statusFilter]);

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
        setDeleteTarget(null);
        hydratedInitialRef.current = false;
        fetchCustomers();
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage tenants and business clients</p>
        </div>
        {canCreate && <Link href="/customers/create" className="btn-primary text-sm">New Customer</Link>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input ref={searchRef} type="text" placeholder="Search by name..." className="input w-56" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <button type="submit" className="btn-secondary text-sm">Search</button>
          </form>
          <select className="input w-auto text-sm" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option><option value="individual">Individual</option><option value="business">Business</option>
          </select>
          <select className="input w-auto text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
          {(appliedSearch || typeFilter || statusFilter) && <button type="button" onClick={handleClear} className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">Clear all</button>}
        </div>
        {meta && <p className="text-sm text-gray-400"><span className="font-medium text-gray-700">{meta.total ?? 0}</span> total</p>}
      </div>

      <div className="data-table-wrap">
        {error && <div className="m-4 text-sm text-red-700">{error}</div>}
        <div className="overflow-x-auto no-scrollbar">
          <table className="data-table min-w-[640px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Status</th>
                <th className="text-center">Contracts</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) : customers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-sm text-gray-500">No customers found.</td></tr>
              ) : customers.map((customer) => (
                <tr key={customer.uuid}>
                  <td>
                    <p className="font-semibold text-gray-900 text-sm">{cap(customer.display_name)}</p>
                    {customer.customer_type === 'business' && customer.business_detail?.business_name && (
                      <p className="text-xs text-gray-400 mt-0.5">{customer.business_detail.business_name}</p>
                    )}
                  </td>
                  <td><TypeBadge type={customer.customer_type} /></td>
                  <td>
                    {customer.email && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.customer_type === 'business' && customer.business_detail?.contact_person_name && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Contact: {customer.business_detail.contact_person_name}</span>
                      </div>
                    )}
                    {!customer.email && !customer.phone && <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td><StatusBadge status={customer.status} /></td>
                  <td className="text-center">
                    <span className="badge badge-blue" style={{ borderRadius: '0.375rem' }}>
                      {customer.contracts_count ?? 0}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/customers/${customer.uuid}`} className={BTN.blue}>View</Link>
                      {canEdit && <Link href={`/customers/${customer.uuid}/edit`} className={BTN.gray}>Edit</Link>}
                      {canDelete && <button className={BTN.red} onClick={() => setDeleteTarget(customer)}>Delete</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {meta && <Pagination meta={meta} onPageChange={setPage} />}
      </div>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} title="Delete Customer" message={`Delete "${deleteTarget?.display_name}"?`} confirmLabel="Delete Customer" />
    </div>
  );
}
