'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import ContractService from '@/services/ContractService';
import CustomerService from '@/services/CustomerService';
import UnitService from '@/services/UnitService';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import useConfirmModal from '@/hooks/useConfirmModal';
import useUiStore from '@/store/uiStore';

const BTN = {
  gray: 'h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors',
  red: 'h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-red-500 hover:bg-red-50 transition-colors',
};

const CONTRACT_STATUS = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-600', color: '#6b7280' },
  active: { label: 'Active', bg: 'bg-green-50', text: 'text-green-700', color: '#22c55e' },
  expired: { label: 'Expired', bg: 'bg-orange-50', text: 'text-orange-700', color: '#f97316' },
  terminated: { label: 'Terminated', bg: 'bg-red-50', text: 'text-red-700', color: '#ef4444' },
  renewed: { label: 'Renewed', bg: 'bg-blue-50', text: 'text-blue-700', color: '#3b82f6' },
};

const BILLING_CYCLES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annually', label: 'Semi-annually' },
  { value: 'annually', label: 'Annually' },
  { value: 'one_time', label: 'One-time' },
];

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

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function ContractModal({ open, onClose, onSaved, propertyUuid, initial }) {
  const isEdit = !!initial?.uuid;
  const emptyForm = {
    customer_uuid: '',
    unit_uuid: '',
    contract_number: '',
    start_date: '',
    end_date: '',
    amount: '',
    currency: 'TZS',
    billing_cycle: 'monthly',
    status: 'draft',
    notes: '',
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const customerSearchTimer = useRef(null);
  const customerInputRef = useRef(null);
  const customerDropdownRef = useRef(null);

  /* ─── Unit search state ─── */
  const [units, setUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [selectedUnitName, setSelectedUnitName] = useState('');
  const unitSearchTimer = useRef(null);
  const unitInputRef = useRef(null);
  const unitDropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (isEdit && initial) {
      setForm({
        customer_uuid: initial.customer?.uuid || '',
        unit_uuid: initial.unit?.uuid || '',
        contract_number: initial.contract_number || '',
        start_date: initial.start_date || '',
        end_date: initial.end_date || '',
        amount: initial.amount || '',
        currency: initial.currency || 'TZS',
        billing_cycle: initial.billing_cycle || 'monthly',
        status: initial.status || 'draft',
        notes: initial.notes || '',
      });
      setSelectedCustomerName(initial.customer?.display_name || '');
      setCustomerSearch(initial.customer?.display_name || '');
      const unitLabel = initial.unit ? `${initial.unit.unit_number}${initial.unit.property_floor ? ` — ${initial.unit.property_floor.name}` : ''}` : '';
      setSelectedUnitName(unitLabel);
      setUnitSearch(unitLabel);
    } else {
      setForm(emptyForm);
      setSelectedCustomerName('');
      setCustomerSearch('');
      setSelectedUnitName('');
      setUnitSearch('');
    }
    setCustomers([]);
    setCustomerDropdownOpen(false);
    setUnits([]);
    setUnitDropdownOpen(false);
    setErrors({});
    setServerError(null);
  }, [open, isEdit, initial]);

  /*
   * Unit search: server-side via GET /api/v1/app/units?property_uuid={uuid}&search={q}&per_page=20&sort=unit_number
   * Debounced (300ms) to avoid flooding the backend.
   */
  const fetchUnits = useCallback((query) => {
    setUnitsLoading(true);
    UnitService.listByProperty(propertyUuid, { search: query || undefined, perPage: 20 })
      .then((data) => { if (data?.success) setUnits(data.data || []); })
      .catch(() => { })
      .finally(() => setUnitsLoading(false));
  }, [propertyUuid]);

  const fetchCustomers = useCallback((query) => {
    setCustomersLoading(true);
    CustomerService.list({ search: query || undefined, perPage: 20 })
      .then((data) => {
        if (data?.success) setCustomers(data.data || []);
      })
      .catch(() => { })
      .finally(() => setCustomersLoading(false));
  }, []);

  const handleCustomerInputChange = (e) => {
    const val = e.target.value;
    setCustomerSearch(val);
    setCustomerDropdownOpen(true);
    if (customerSearchTimer.current) clearTimeout(customerSearchTimer.current);
    customerSearchTimer.current = setTimeout(() => {
      fetchCustomers(val.trim());
    }, 300);
  };

  const handleCustomerFocus = () => {
    setCustomerDropdownOpen(true);
    if (customers.length === 0 && !customersLoading) {
      fetchCustomers(customerSearch.trim());
    }
  };

  const selectCustomer = (customer) => {
    setForm((p) => ({ ...p, customer_uuid: customer.uuid }));
    setSelectedCustomerName(customer.display_name);
    setCustomerSearch(customer.display_name);
    setCustomerDropdownOpen(false);
    setErrors((p) => ({ ...p, customer_uuid: null }));
  };

  const clearCustomer = () => {
    setForm((p) => ({ ...p, customer_uuid: '' }));
    setSelectedCustomerName('');
    setCustomerSearch('');
    setCustomers([]);
    setCustomerDropdownOpen(false);
  };

  const handleUnitInputChange = (e) => {
    const val = e.target.value;
    setUnitSearch(val);
    setUnitDropdownOpen(true);
    if (unitSearchTimer.current) clearTimeout(unitSearchTimer.current);
    unitSearchTimer.current = setTimeout(() => {
      fetchUnits(val.trim());
    }, 300);
  };

  const handleUnitFocus = () => {
    setUnitDropdownOpen(true);
    if (units.length === 0 && !unitsLoading) {
      fetchUnits(unitSearch.trim());
    }
  };

  const selectUnit = (unit) => {
    const label = `${unit.unit_number}${unit.property_floor ? ` — ${unit.property_floor.name}` : ''}`;
    setForm((p) => ({ ...p, unit_uuid: unit.uuid }));
    setSelectedUnitName(label);
    setUnitSearch(label);
    setUnitDropdownOpen(false);
    setErrors((p) => ({ ...p, unit_uuid: null }));
  };

  const clearUnit = () => {
    setForm((p) => ({ ...p, unit_uuid: '' }));
    setSelectedUnitName('');
    setUnitSearch('');
    setUnits([]);
    setUnitDropdownOpen(false);
  };

  useEffect(() => {
    if (!customerDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) {
        setCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [customerDropdownOpen]);

  useEffect(() => {
    if (!unitDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(e.target)) {
        setUnitDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [unitDropdownOpen]);

  useEffect(() => {
    return () => {
      if (customerSearchTimer.current) clearTimeout(customerSearchTimer.current);
      if (unitSearchTimer.current) clearTimeout(unitSearchTimer.current);
    };
  }, []);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);
    setSaving(true);
    const payload = {
      customer_uuid: form.customer_uuid,
      unit_uuid: form.unit_uuid,
      contract_number: form.contract_number,
      start_date: form.start_date,
      end_date: form.end_date || null,
      amount: parseFloat(form.amount),
      currency: form.currency,
      billing_cycle: form.billing_cycle,
      status: form.status,
      notes: form.notes || null,
    };
    try {
      const data = isEdit
        ? await ContractService.update(initial.uuid, payload)
        : await ContractService.store(payload);
      if (data?.success) {
        onSaved(data.data, isEdit, data?.message);
        onClose();
      } else {
        if (data?.errors) setErrors(data.errors);
        setServerError(data?.message || 'Request failed. Please check your input and try again.');
      }
    } catch {
      setServerError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Contract' : 'New Contract'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2.5">
            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Customer — searchable dropdown */}
          <div className="sm:col-span-2 relative" ref={customerDropdownRef}>
            <label className="label">Customer <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                ref={customerInputRef}
                type="text"
                className="input pl-9 pr-8 text-sm w-full"
                placeholder="Search and select a customer..."
                value={customerSearch}
                onChange={handleCustomerInputChange}
                onFocus={handleCustomerFocus}
                autoComplete="off"
              />
              {form.customer_uuid && (
                <button
                  type="button"
                  onClick={clearCustomer}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {customerDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {customersLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                      <Spinner /> Searching customers...
                    </div>
                  ) : customers.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400">
                      {customerSearch.trim() ? 'No customers found.' : 'Type to search customers...'}
                    </div>
                  ) : (
                    customers.map((c) => (
                      <button
                        key={c.uuid}
                        type="button"
                        onClick={() => selectCustomer(c)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 last:border-0 ${form.customer_uuid === c.uuid ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <span className="font-medium">{c.display_name}</span>
                        {c.customer_type && (
                          <span className="ml-2 text-xs text-gray-400 capitalize">{c.customer_type}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <FieldError message={errors?.customer_uuid?.[0]} />
          </div>

          {/* Unit — server-side searchable dropdown via UnitService.listByProperty */}
          <div className="sm:col-span-2 relative" ref={unitDropdownRef}>
            <label className="label">Unit <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                ref={unitInputRef}
                type="text"
                className="input pl-9 pr-8 text-sm w-full"
                placeholder="Search and select a unit..."
                value={unitSearch}
                onChange={handleUnitInputChange}
                onFocus={handleUnitFocus}
                autoComplete="off"
              />
              {form.unit_uuid && (
                <button
                  type="button"
                  onClick={clearUnit}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {unitDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {unitsLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                      <Spinner /> Searching units...
                    </div>
                  ) : units.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400">
                      {unitSearch.trim() ? 'No units found.' : 'Type to search units...'}
                    </div>
                  ) : (
                    units.map((u) => (
                      <button
                        key={u.uuid}
                        type="button"
                        onClick={() => selectUnit(u)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 last:border-0 ${form.unit_uuid === u.uuid ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <span className="font-medium">{u.unit_number}</span>
                        {u.property_floor && (
                          <span className="ml-2 text-xs text-gray-400">{u.property_floor.name}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <FieldError message={errors?.unit_uuid?.[0]} />
          </div>

          {/* Contract number */}
          <div>
            <label className="label">Contract Number <span className="text-red-500">*</span></label>
            <input
              name="contract_number"
              type="text"
              className="input text-sm"
              placeholder="e.g. CTR-2024-001"
              value={form.contract_number}
              onChange={change}
              required
            />
            <FieldError message={errors?.contract_number?.[0]} />
          </div>

          {/* Status */}
          <div>
            <label className="label">Status</label>
            <select name="status" className="input text-sm" value={form.status} onChange={change}>
              {Object.entries(CONTRACT_STATUS).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <FieldError message={errors?.status?.[0]} />
          </div>

          {/* Start date */}
          <div>
            <label className="label">Start Date <span className="text-red-500">*</span></label>
            <input
              name="start_date"
              type="date"
              className="input text-sm appearance-none min-h-[2.5rem]"
              value={form.start_date}
              onChange={change}
              required
            />
            <FieldError message={errors?.start_date?.[0]} />
          </div>

          {/* End date */}
          <div>
            <label className="label">End Date <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span></label>
            <input
              name="end_date"
              type="date"
              className="input text-sm appearance-none min-h-[2.5rem]"
              value={form.end_date}
              onChange={change}
            />
            <FieldError message={errors?.end_date?.[0]} />
          </div>

          {/* Amount */}
          <div>
            <label className="label">Amount <span className="text-red-500">*</span></label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              className="input text-sm"
              placeholder="0.00"
              value={form.amount}
              onChange={change}
              required
            />
            <FieldError message={errors?.amount?.[0]} />
          </div>

          {/* Currency */}
          <div>
            <label className="label">Currency</label>
            <input
              name="currency"
              type="text"
              maxLength={3}
              className="input text-sm uppercase"
              placeholder="TZS"
              value={form.currency}
              onChange={change}
            />
            <FieldError message={errors?.currency?.[0]} />
          </div>

          {/* Billing cycle */}
          <div>
            <label className="label">Billing Cycle</label>
            <select name="billing_cycle" className="input text-sm" value={form.billing_cycle} onChange={change}>
              {BILLING_CYCLES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <FieldError message={errors?.billing_cycle?.[0]} />
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="label">Notes <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span></label>
            <textarea
              name="notes"
              className="input text-sm resize-none"
              rows={2}
              placeholder="Any additional notes..."
              value={form.notes}
              onChange={change}
            />
            <FieldError message={errors?.notes?.[0]} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary text-sm" disabled={saving}>Cancel</button>
          <button type="submit" className="btn-primary text-sm" disabled={saving}>
            {saving && <Spinner />}
            {isEdit ? 'Save Changes' : 'Create Contract'}
          </button>
        </div>
      </form>
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
  const [loading, setLoading] = useState(true);
  const [contractModal, setContractModal] = useState(null);
  const confirmModal = useConfirmModal();
  const searchRef = useRef(null);

  const loadContracts = useCallback(() => {
    setLoading(true);
    ContractService.list({
      propertyUuid,
      search: appliedSearch || undefined,
      status: statusFilter || undefined,
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
  }, [propertyUuid, appliedSearch, statusFilter, page]);

  useEffect(() => { loadContracts(); }, [loadContracts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput('');
    setAppliedSearch('');
    setPage(1);
  };

  const handleSaved = (contract, isEdit, message) => {
    useUiStore.getState().showModal({
      type: 'success',
      message,
      onRefresh: loadContracts,
    });
    loadContracts();
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

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtAmount = (amount, currency) =>
    amount != null ? `${currency || ''} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

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
        </div>
        <button className="btn-primary text-sm" onClick={() => setContractModal('new')}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Contract
        </button>
      </div>

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
                      {fmtDate(c.start_date)}{c.end_date ? ` → ${fmtDate(c.end_date)}` : ' → Open'}
                    </td>
                    <td className="px-5 py-3.5">
                      <ContractStatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className={BTN.gray} onClick={() => setContractModal(c)}>Edit</button>
                        <button className={BTN.red} onClick={() => confirmModal.prompt(c)}>Delete</button>
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

      <ContractModal
        open={!!contractModal}
        onClose={() => setContractModal(null)}
        onSaved={handleSaved}
        propertyUuid={propertyUuid}
        initial={contractModal === 'new' ? null : contractModal}
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
