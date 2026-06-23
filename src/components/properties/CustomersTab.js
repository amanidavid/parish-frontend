'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import CustomerService from '@/services/CustomerService';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ActionMenu from '@/components/ui/ActionMenu';
import Modal from '@/components/ui/Modal';
import CustomerForm from '@/components/customers/CustomerForm';
import useCan from '@/hooks/useCan';
import useUiStore from '@/store/uiStore';

const PER_PAGE = 15;

function StatusBadge({ status }) {
  return status === 'active'
    ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">Active</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Inactive</span>;
}

function TypeBadge({ type }) {
  return type === 'business'
    ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">Business</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Individual</span>;
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${70 - i * 8}%` }} />
        </td>
      ))}
    </tr>
  );
}

const BTN = {
  gray: 'h-7 px-2 inline-flex items-center rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors',
  blue: 'h-7 px-2 inline-flex items-center rounded text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors',
  red: 'h-7 px-2 inline-flex items-center rounded text-xs font-medium text-red-500 hover:bg-red-50 transition-colors',
};

function CustomerModal({ open, onClose, initial, propertyUuid, onSaved }) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!initial?.uuid;

  const handleSubmit = async (payload) => {
    setLoading(true);
    try {
      const data = isEdit
        ? await CustomerService.update(initial.uuid, payload)
        : await CustomerService.store(payload);
      if (data?.success) {
        useUiStore.getState().showModal({
          type: 'success',
          message: data?.message || (isEdit ? 'Customer updated.' : 'Customer created.'),
        });
        onSaved();
        onClose();
        return {};
      }
      useUiStore.getState().showModal({
        type: 'error',
        message: data?.message || (isEdit ? 'Failed to update customer.' : 'Failed to create customer.'),
      });
      return { errors: data?.errors || {} };
    } catch {
      useUiStore.getState().showModal({ type: 'error', message: 'Network error. Please try again.' });
      return {};
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Customer' : 'New Customer'} maxWidth="max-w-2xl">
      <CustomerForm
        key={initial?.uuid || 'new'}
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel={isEdit ? 'Save Changes' : 'Create Customer'}
        initial={isEdit ? initial : null}
        propertyUuid={propertyUuid}
      />
    </Modal>
  );
}

export default function CustomersTab({ propertyUuid }) {
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
  const [customerModal, setCustomerModal] = useState(null);
  const searchRef = useRef(null);

  const canCreate = useCan('customers.create');
  const canView = useCan('customers.view');
  const canEdit = useCan('customers.update');
  const canDelete = useCan('customers.delete');

  const fetchCustomers = useCallback(async () => {
    if (!propertyUuid) { setCustomers([]); setMeta(null); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await CustomerService.list({
        propertyUuid,
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
  }, [propertyUuid, appliedSearch, typeFilter, statusFilter, page]);

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

  /* Customer summary counts */
  const customerSummary = useMemo(() => {
    const counts = { total: customers.length, active: 0, inactive: 0 };
    customers.forEach((c) => { if (counts[c.status] !== undefined) counts[c.status]++; });
    return counts;
  }, [customers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const data = await CustomerService.destroy(deleteTarget.uuid);
      if (data?.success !== false) {
        setDeleteTarget(null);
        fetchCustomers();
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by name..."
              className="w-56 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Search</button>
          </form>
          <select
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Types</option>
            <option value="individual">Individual</option>
            <option value="business">Business</option>
          </select>
          <select
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(appliedSearch || typeFilter || statusFilter) && (
            <button type="button" onClick={handleClear} className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">Clear all</button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {meta && <p className="text-sm text-gray-400"><span className="font-medium text-gray-700">{meta.total ?? 0}</span> total</p>}
          {canCreate && (
            <button
              onClick={() => setCustomerModal('new')}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Customer
            </button>
          )}
        </div>
      </div>

      {/* Customer Summary Cards — premium icon-based design */}
      {!loading && customers.length > 0 && (
        <div className="relative">
          <div
            className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[
              {
                key: 'total',
                label: 'Total Customers',
                numColor: 'text-gray-900',
                iconBg: 'bg-gray-50',
                iconColor: 'text-gray-500',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
              },
              {
                key: 'active',
                label: 'Active',
                numColor: 'text-emerald-600',
                iconBg: 'bg-emerald-50',
                iconColor: 'text-emerald-500',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
              },
              {
                key: 'inactive',
                label: 'Inactive',
                numColor: 'text-slate-600',
                iconBg: 'bg-slate-50',
                iconColor: 'text-slate-500',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                ),
              },
            ].map(({ key, label, numColor, iconBg, iconColor, icon }) => (
              <div
                key={key}
                className="shrink-0 w-[150px] sm:flex-1 snap-start bg-white rounded-xl border border-gray-200 hover:border-primary-200 hover:shadow-sm transition-all px-4 py-3.5 flex items-center gap-3"
              >
                <div className={`shrink-0 w-10 h-10 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}>
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className={`${numColor} text-lg font-bold leading-tight tabular-nums`}>{customerSummary[key]}</p>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5 truncate">{label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-[#f8fafc] to-transparent sm:hidden" />
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {error && <div className="m-4 text-sm text-red-700">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-gray-500">
                    No customers found for this property.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.uuid} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{cap(customer.display_name)}</p>
                      {customer.customer_type === 'business' && customer.business_detail?.business_name && (
                        <p className="text-xs text-gray-400 mt-0.5">{customer.business_detail.business_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={customer.customer_type} /></td>
                    <td className="px-4 py-3">
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
                      {!customer.email && !customer.phone && <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={customer.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canView && <Link href={`/customers/${customer.uuid}`} className={BTN.blue}>View</Link>}
                        <ActionMenu
                          actions={[
                            ...(canEdit ? [{ label: 'Edit', onClick: () => setCustomerModal(customer) }] : []),
                            ...(canDelete ? [{ label: 'Delete', onClick: () => setDeleteTarget(customer), danger: true }] : []),
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {meta && <Pagination meta={meta} onPageChange={setPage} />}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Customer"
        message={`Delete "${deleteTarget?.display_name}"?`}
        confirmLabel="Delete Customer"
      />

      <CustomerModal
        open={!!customerModal}
        onClose={() => setCustomerModal(null)}
        initial={customerModal === 'new' ? null : customerModal}
        propertyUuid={propertyUuid}
        onSaved={fetchCustomers}
      />
    </div>
  );
}
