'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerService from '@/services/CustomerService';
import ContractService from '@/services/ContractService';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/ui/ConfirmModal';

const CUSTOMER_STATUS = {
  active: { label: 'Active', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  inactive: { label: 'Inactive', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

const CONTRACT_STATUS = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-600' },
  active: { label: 'Active', bg: 'bg-green-50', text: 'text-green-700' },
  expired: { label: 'Expired', bg: 'bg-orange-50', text: 'text-orange-700' },
  terminated: { label: 'Terminated', bg: 'bg-red-50', text: 'text-red-700' },
  renewed: { label: 'Renewed', bg: 'bg-blue-50', text: 'text-blue-700' },
};

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'contracts', label: 'Contracts' },
];

const BTN = {
  gray: 'h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors',
  red: 'h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-red-500 hover:bg-red-50 transition-colors',
};

function ContractStatusBadge({ status }) {
  const s = CONTRACT_STATUS[status] || CONTRACT_STATUS.draft;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
}

function TabAlert({ type, message, onClose }) {
  if (!message) return null;
  const ok = type === 'success';
  return (
    <div className={`flex items-start gap-3 rounded-md px-4 py-3 border ${ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <svg className={`w-4 h-4 mt-0.5 shrink-0 ${ok ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {ok
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
      </svg>
      <p className={`text-sm flex-1 ${ok ? 'text-green-800' : 'text-red-700'}`}>{message}</p>
      <button onClick={onClose} className={`${ok ? 'text-green-400 hover:text-green-600' : 'text-red-400 hover:text-red-600'} transition-colors`}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

export default function CustomerDetailPage() {
  const { uuid } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Contracts tab state
  const [contracts, setContracts] = useState([]);
  const [contractsMeta, setContractsMeta] = useState(null);
  const [contractsPage, setContractsPage] = useState(1);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractSearchInput, setContractSearchInput] = useState('');
  const [appliedContractSearch, setAppliedContractSearch] = useState('');
  const [contractStatusFilter, setContractStatusFilter] = useState('');

  useEffect(() => {
    CustomerService.show(uuid)
      .then((data) => {
        if (data?.success && data?.data) {
          setCustomer(data.data);
        } else {
          setError(data?.message || 'Failed to load customer details');
        }
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [uuid]);

  const loadContracts = useCallback(() => {
    if (tab !== 'contracts') return;
    setContractsLoading(true);
    ContractService.list({
      customerUuid: uuid,
      search: appliedContractSearch || undefined,
      status: contractStatusFilter || undefined,
      page: contractsPage,
      perPage: 15,
    })
      .then((data) => {
        if (data?.success) {
          setContracts(data.data || []);
          setContractsMeta(data.meta || null);
        }
      })
      .catch(() => { })
      .finally(() => setContractsLoading(false));
  }, [tab, uuid, appliedContractSearch, contractStatusFilter, contractsPage]);

  useEffect(() => { loadContracts(); }, [loadContracts]);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 4500);
    return () => clearTimeout(t);
  }, [notification]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const data = await CustomerService.destroy(uuid);
      if (data?.success !== false) {
        router.push('/customers');
      } else {
        setNotification({ type: 'error', message: data?.message });
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error' });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-5 bg-gray-100 rounded animate-pulse w-32" />
        <div className="h-32 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <Link href="/customers" className="btn-secondary">Back to Customers</Link>
        <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const status = CUSTOMER_STATUS[customer?.status] || CUSTOMER_STATUS.inactive;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtAmount = (amount, currency) =>
    amount != null ? `${currency || ''} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/customers" className="hover:text-gray-800 transition-colors">Customers</Link>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium truncate max-w-xs">{customer?.display_name}</span>
        </nav>
        <Link href="/customers" className="btn-secondary text-sm flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Customers
        </Link>
      </div>

      <TabAlert type={notification?.type} message={notification?.message} onClose={() => setNotification(null)} />

      {/* Summary card */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h1 className="text-lg font-bold text-gray-900">{cap(customer?.display_name)}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
            <p className="text-sm text-gray-500">{cap(customer?.customer_type)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/customers/${uuid}/edit`} className="btn-secondary text-sm">Edit</Link>
            <button onClick={() => setDeleteOpen(true)} className="btn-danger text-sm">Delete</button>
          </div>
        </div>
        <div className="border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
          {[
            { label: 'Email', value: customer?.email },
            { label: 'Phone', value: customer?.phone },
            { label: 'Contracts', value: customer?.contracts_count ?? 0, large: true },
            { label: 'Notes', value: customer?.notes },
          ].map(({ label, value, large }) => (
            <div key={label} className="px-6 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
              <p className={`font-medium text-gray-800 ${large ? 'text-lg' : 'text-sm'} truncate`}>
                {value || <span className="text-gray-300">—</span>}
              </p>
            </div>
          ))}
        </div>
        {customer?.business_detail && (
          <div className="border-t border-gray-100 px-6 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Business Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-400">Name:</span> <span className="text-gray-700 font-medium">{customer.business_detail.business_name || '—'}</span></div>
              <div><span className="text-gray-400">Reg No:</span> <span className="text-gray-700">{customer.business_detail.registration_number || '—'}</span></div>
              <div><span className="text-gray-400">Tax ID:</span> <span className="text-gray-700">{customer.business_detail.tax_identifier || '—'}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div>
        <nav className="flex border-b border-gray-200 gap-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === t.id
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Customer Details</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {[
              { label: 'Display Name', value: customer?.display_name },
              { label: 'Customer Type', value: cap(customer?.customer_type) },
              { label: 'Status', value: cap(customer?.status) },
              { label: 'Email', value: customer?.email },
              { label: 'Phone', value: customer?.phone },
              { label: 'Notes', value: customer?.notes },
            ].map(({ label, value }) => (
              <div key={label} className="px-6 py-4">
                <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value || <span className="text-gray-300">—</span>}</p>
              </div>
            ))}
            {customer?.business_detail && (
              <>
                <div className="px-6 py-4">
                  <p className="text-xs font-medium text-gray-400 mb-1">Business Name</p>
                  <p className="text-sm font-medium text-gray-800">{customer.business_detail.business_name || '—'}</p>
                </div>
                <div className="px-6 py-4">
                  <p className="text-xs font-medium text-gray-400 mb-1">Contact Person</p>
                  <p className="text-sm font-medium text-gray-800">{customer.business_detail.contact_person_name || '—'}</p>
                </div>
                <div className="px-6 py-4">
                  <p className="text-xs font-medium text-gray-400 mb-1">Business Address</p>
                  <p className="text-sm font-medium text-gray-800">{customer.business_detail.address_line || '—'}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Contracts */}
      {tab === 'contracts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <form onSubmit={(e) => { e.preventDefault(); setContractsPage(1); setAppliedContractSearch(contractSearchInput.trim()); }} className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search contract no..."
                    className="input pl-9 pr-8 w-52"
                    value={contractSearchInput}
                    onChange={(e) => setContractSearchInput(e.target.value)}
                  />
                  {contractSearchInput && (
                    <button type="button" onClick={() => { setContractSearchInput(''); setAppliedContractSearch(''); setContractsPage(1); }}
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
                value={contractStatusFilter}
                onChange={(e) => { setContractStatusFilter(e.target.value); setContractsPage(1); }}
              >
                <option value="">All Statuses</option>
                {Object.entries(CONTRACT_STATUS).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>

              {(appliedContractSearch || contractStatusFilter) && (
                <button type="button"
                  onClick={() => { setContractSearchInput(''); setAppliedContractSearch(''); setContractStatusFilter(''); setContractsPage(1); }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {contractsLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
                </svg>
                Loading contracts...
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-500 font-medium">
                  {(appliedContractSearch || contractStatusFilter)
                    ? 'No contracts match your search from the server.'
                    : 'No contracts found.'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {(appliedContractSearch || contractStatusFilter)
                    ? 'Try adjusting your search term or filters.'
                    : 'Contracts assigned to this customer will appear here.'}
                </p>
                {(appliedContractSearch || contractStatusFilter) && (
                  <button onClick={() => { setContractSearchInput(''); setAppliedContractSearch(''); setContractStatusFilter(''); setContractsPage(1); }}
                    className="text-xs text-blue-600 hover:underline mt-2">Clear search</button>
                )}
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contract No.</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Floor</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c, idx) => (
                      <tr key={c.uuid} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 text-xs text-gray-400">
                          {((contractsPage - 1) * (contractsMeta?.per_page || 15)) + idx + 1}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-gray-900">{c.contract_number}</td>
                        <td className="px-5 py-3.5 text-gray-700 text-sm">
                          {c.unit?.property?.name || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">
                          {c.unit?.property_floor?.name || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">
                          {c.unit?.unit_number || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-gray-700 tabular-nums text-sm">{fmtAmount(c.amount, c.currency)}</td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                          {fmtDate(c.start_date)}{c.end_date ? ` → ${fmtDate(c.end_date)}` : ' → Open'}
                        </td>
                        <td className="px-5 py-3.5"><ContractStatusBadge status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {contractsMeta && <Pagination meta={contractsMeta} onPageChange={setContractsPage} />}
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Customer"
        message={`Delete "${customer?.display_name}"? All associated contracts must be removed first. This cannot be undone.`}
        confirmLabel="Delete Customer"
      />
    </div>
  );
}
