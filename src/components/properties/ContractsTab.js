'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ContractService from '@/services/ContractService';
import ContractModal from '@/components/contracts/ContractModal';
import Pagination from '@/components/ui/Pagination';
import ActionMenu from '@/components/ui/ActionMenu';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import useConfirmModal from '@/hooks/useConfirmModal';
import useUiStore from '@/store/uiStore';
import useCan from '@/hooks/useCan';
import { usePropertyAccess } from '@/contexts/PropertyAccessContext';
import { capitalize } from '@/lib/utils';

const BTN = {
  gray: 'h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors',
  red: 'h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-red-500 hover:bg-red-50 transition-colors',
};

const CONTRACT_STATUS = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-600', color: '#6b7280' },
  active: { label: 'Active', bg: 'bg-green-50', text: 'text-green-700', color: '#22c55e' },
  expired: { label: 'Expired', bg: 'bg-orange-50', text: 'text-orange-700', color: '#f97316' },
  terminated: { label: 'Terminated', bg: 'bg-red-50', text: 'text-red-700', color: '#ef4444' },
};


function ContractStatusBadge({ status }) {
  const s = CONTRACT_STATUS[status] || CONTRACT_STATUS.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
    </svg>
  );
}

/* ─── Module-level helpers (shared by all components) ──────────── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtAmount = (amount, currency) =>
  amount != null ? `${currency || ''} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

/* ─── Premium Read-Only Contract View Modal ─────────────────────── */
function ContractViewModal({ open, onClose, contract }) {
  const c = contract || {};
  const s = CONTRACT_STATUS[c.status] || CONTRACT_STATUS.draft;

  const InfoRow = ({ icon, label, value, sub }) => (
    <div className="flex items-start gap-3 py-3">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{value || '—'}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );

  if (!open || !contract) return null;
  return (
    <Modal open={open} onClose={onClose} title="Contract Details" maxWidth="max-w-lg">
      <div className="space-y-5">
        {/* Header Card */}
        <div className={`relative overflow-hidden rounded-xl ring-1 shadow-sm p-5 ${s.bg} ring-gray-100`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ContractStatusBadge status={c.status} />
                {c.duration_label && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/60 text-gray-700 text-[10px] font-semibold">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {c.duration_label}
                  </span>
                )}
              </div>
              <p className="text-lg font-bold text-gray-900 mt-2">{c.contract_number || '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{fmtAmount(c.amount, c.currency)}</p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          <InfoRow
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            label="Customer"
            value={c.customer?.display_name}
            sub={c.customer?.customer_type ? capitalize(c.customer.customer_type) : undefined}
          />
          <InfoRow
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            label="Unit"
            value={c.unit ? `${c.unit.unit_number}${c.unit.property_floor ? ` · ${c.unit.property_floor.name}` : ''}` : undefined}
          />
          <InfoRow
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            label="Period"
            value={`${fmtDate(c.start_date)} — ${c.end_date ? fmtDate(c.end_date) : 'Open ended'}`}
          />
        </div>

        {/* Notes */}
        {c.notes && (
          <div className="bg-amber-50/40 rounded-xl border border-amber-100/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Notes</p>
            </div>
            <p className="text-sm text-amber-900/80 leading-relaxed whitespace-pre-line">{c.notes}</p>
          </div>
        )}

        {/* Close */}
        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="btn-secondary text-sm">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function ContractsTab({ propertyUuid }) {
  const [contracts, setContracts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [contractModal, setContractModal] = useState(null);
  const [viewContract, setViewContract] = useState(null);
  const confirmModal = useConfirmModal();
  const searchRef = useRef(null);

  const canCreate = useCan('customer_contracts.create');
  const canView = useCan('customer_contracts.view');
  const canEdit = useCan('customer_contracts.update');
  const canDelete = useCan('customer_contracts.delete');

  const access = usePropertyAccess();
  const workspaceBlocked = access?.workspace?.allowed === false;
  const propertyBlocked = access?.property_subscription?.allowed === false;
  const opsBlocked = workspaceBlocked || propertyBlocked;
  const opsMessage = workspaceBlocked
    ? access?.workspace?.message
    : (propertyBlocked ? access?.property_subscription?.message : '');

  const loadContracts = useCallback(() => {
    if (!propertyUuid) { setContracts([]); setMeta(null); setLoading(false); return; }
    setLoading(true);
    ContractService.list({
      propertyUuid,
      search: appliedSearch || undefined,
      status: statusFilter || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
      page,
    })
      .then((data) => {
        if (data?.success) {
          setContracts(data.data || []);
          setMeta(data.meta || null);
        } else {
          useUiStore.getState().showModal({ type: 'error', message: data?.message || 'Failed to load contracts' });
        }
      })
      .catch(() => useUiStore.getState().showModal({ type: 'error', message: 'Network error. Please try again.' }))
      .finally(() => setLoading(false));
  }, [propertyUuid, appliedSearch, statusFilter, startDateFilter, endDateFilter, page]);

  useEffect(() => { loadContracts(); }, [loadContracts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput('');
    setAppliedSearch('');
    setStatusFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setPage(1);
  };

  const handleSaved = (contract, isEdit, message) => {
    useUiStore.getState().showModal({
      type: 'success',
      message,
      onRefresh: loadContracts,
    });
    loadContracts();
    window.dispatchEvent(new CustomEvent('contract-saved', { detail: { propertyUuid } }));
  };

  const handleDelete = useCallback(async () => {
    const res = await confirmModal.execute(
      (contract) => ContractService.destroy(contract.uuid),
      { successMessage: 'Contract deleted successfully.', errorMessage: 'Failed to delete contract.' }
    );
    if (res?.success) {
      loadContracts();
    }
  }, [confirmModal, loadContracts]);

  /* Contract summary counts */
  const contractSummary = useMemo(() => {
    const counts = { draft: 0, active: 0, expired: 0, terminated: 0, total: contracts.length };
    contracts.forEach((c) => { if (counts[c.status] !== undefined) counts[c.status]++; });
    return counts;
  }, [contracts]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
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
            {Object.entries(CONTRACT_STATUS).map(([val, { label }]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
            <input type="date" value={startDateFilter} onChange={(e) => { setStartDateFilter(e.target.value); setPage(1); }}
              className="input w-auto text-sm py-1.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
            <input type="date" value={endDateFilter} onChange={(e) => { setEndDateFilter(e.target.value); setPage(1); }}
              className="input w-auto text-sm py-1.5" />
          </div>
        </div>
        {canCreate && (
          <button
            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setContractModal('new')}
            disabled={opsBlocked}
            title={opsBlocked ? opsMessage : undefined}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Contract
          </button>
        )}
      </div>

      {/* Contract Summary Cards — premium icon-based design */}
      {!loading && contracts.length > 0 && (
        <div className="relative">
          <div
            className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[
              {
                key: 'total',
                label: 'Total Contracts',
                numColor: 'text-gray-900',
                iconBg: 'bg-gray-50',
                iconColor: 'text-gray-500',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                key: 'draft',
                label: 'Draft',
                numColor: 'text-slate-600',
                iconBg: 'bg-slate-50',
                iconColor: 'text-slate-500',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ),
              },
              {
                key: 'expired',
                label: 'Expired',
                numColor: 'text-orange-600',
                iconBg: 'bg-orange-50',
                iconColor: 'text-orange-500',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                key: 'terminated',
                label: 'Terminated',
                numColor: 'text-red-600',
                iconBg: 'bg-red-50',
                iconColor: 'text-red-500',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                  <p className={`${numColor} text-lg font-bold leading-tight tabular-nums`}>{contractSummary[key]}</p>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5 truncate">{label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-[#f8fafc] to-transparent sm:hidden" />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
            <Spinner /> Loading...
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">
              {appliedSearch ? `No contracts match "${appliedSearch}"` : 'No contracts found'}
            </p>
            <p className="text-xs text-gray-400 mt-1 mb-3">
              {!appliedSearch && !statusFilter ? 'Create contracts by assigning units to customers.' : ''}
            </p>
            {appliedSearch && <button onClick={handleClear} className="text-xs text-blue-600 hover:underline">Clear search</button>}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contract No.</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c, idx) => (
                  <tr key={c.uuid} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {((page - 1) * (meta?.per_page || 15)) + idx + 1}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{c.contract_number}</td>
                    <td className="px-5 py-3.5 text-gray-700">{c.customer?.display_name || <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {c.unit ? (
                        <span>{c.unit.unit_number}{c.unit.property_floor ? ` · ${c.unit.property_floor.name}` : ''}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 tabular-nums">{fmtAmount(c.amount, c.currency)}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      <div>{fmtDate(c.start_date)}{c.end_date ? ` → ${fmtDate(c.end_date)}` : ' → Open'}</div>
                      {c.duration_label && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-semibold">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {c.duration_label}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <ContractStatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canView && (
                          <button
                            onClick={() => setViewContract(c)}
                            className="text-xs font-medium px-2.5 py-1 rounded-md bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                          >
                            View
                          </button>
                        )}
                        <ActionMenu
                          actions={[
                            ...(canEdit ? [{ label: 'Edit', onClick: () => setContractModal(c), disabled: opsBlocked }] : []),
                            ...(canDelete ? [{ label: 'Delete', onClick: () => confirmModal.prompt(c), danger: true, disabled: opsBlocked }] : []),
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            {meta && <Pagination meta={meta} onPageChange={setPage} />}
          </>
        )}
      </div>

      <ContractViewModal
        open={!!viewContract}
        onClose={() => setViewContract(null)}
        contract={viewContract}
      />

      <ContractModal
        open={!!contractModal}
        onClose={() => setContractModal(null)}
        onSaved={handleSaved}
        propertyUuid={propertyUuid}
        initial={contractModal === 'new' ? null : contractModal}
        contracts={contracts}
      />

      <ConfirmModal
        open={confirmModal.open}
        onClose={confirmModal.close}
        onConfirm={handleDelete}
        onRetry={handleDelete}
        danger
        loading={confirmModal.loading}
        result={confirmModal.result}
        title="Delete Contract"
        message={`Delete contract "${confirmModal.item?.contract_number}"? This action cannot be undone.`}
        confirmLabel="Delete Contract"
      />
    </div>
  );
}
