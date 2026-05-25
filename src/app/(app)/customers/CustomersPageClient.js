'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import CustomerService from '@/services/CustomerService';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/ui/ConfirmModal';

const PER_PAGE = 50;

const CUSTOMER_STATUS = {
  active: { label: 'Active', bg: 'bg-green-50', text: 'text-green-700' },
  inactive: { label: 'Inactive', bg: 'bg-gray-100', text: 'text-gray-600' },
};

function StatusBadge({ status }) {
  const s = CUSTOMER_STATUS[status] || CUSTOMER_STATUS.inactive;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
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
        <Link href="/customers/create" className="btn-primary text-sm">New Customer</Link>
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

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {error && <div className="m-4 text-sm text-red-700">{error}</div>}
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th><th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contracts</th><th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th></tr></thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) : customers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-sm text-gray-500">No customers found.</td></tr>
            ) : customers.map((customer) => (
              <tr key={customer.uuid} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-900">{cap(customer.display_name)}</td>
                <td className="px-5 py-3.5 text-xs text-gray-500">{customer.customer_type}</td>
                <td className="px-5 py-3.5 text-xs text-gray-500">{customer.email || customer.phone || <span className="text-gray-300">—</span>}</td>
                <td className="px-5 py-3.5"><StatusBadge status={customer.status} /></td>
                <td className="px-5 py-3.5 text-center">{customer.contracts_count ?? 0}</td>
                <td className="px-5 py-3.5 text-right"><div className="flex items-center justify-end gap-1"><Link href={`/customers/${customer.uuid}`} className={BTN.blue}>View</Link><Link href={`/customers/${customer.uuid}/edit`} className={BTN.gray}>Edit</Link><button className={BTN.red} onClick={() => setDeleteTarget(customer)}>Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {meta && <Pagination meta={meta} onPageChange={setPage} />}
      </div>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} title="Delete Customer" message={`Delete "${deleteTarget?.display_name}"?`} confirmLabel="Delete Customer" />
    </div>
  );
}
