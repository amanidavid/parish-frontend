'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ContractService from '@/services/ContractService';
import CustomerService from '@/services/CustomerService';
import UnitService from '@/services/UnitService';
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

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

/* ─── Module-level helpers (shared by all components) ──────────── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtAmount = (amount, currency) =>
  amount != null ? `${currency || ''} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

function getNextContractNumber(contracts = []) {
  if (!contracts.length) return 'C-001';
  const nums = contracts
    .map((c) => c.contract_number)
    .filter(Boolean)
    .map((n) => {
      const m = n.match(/(\d+)(?!.*\d)/); // last number sequence
      return m ? parseInt(m[1], 10) : 0;
    });
  const max = nums.length ? Math.max(...nums) : 0;
  const next = max + 1;
  // Preserve padding of the longest number
  const padLen = String(max).length;
  return `C-${String(next).padStart(Math.max(padLen, 3), '0')}`;
}

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

function ContractModal({ open, onClose, onSaved, propertyUuid, initial, contracts = [] }) {
  const isEdit = !!initial?.uuid;
  const emptyForm = {
    customer_uuid: '',
    unit_uuid: '',
    contract_number: '',
    start_date: '',
    end_date: '',
    amount: '',
    currency: 'TZS',
    status: 'draft',
    notes: '',
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [nextNumLoading, setNextNumLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const customerSearchTimer = useRef(null);
  const customerInputRef = useRef(null);
  const customerDropdownRef = useRef(null);

  /* --- Unit search state --- */
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
    setForm((p) => ({ ...p, unit_uuid: '', contract_number: '' }));
    setSelectedUnitName('');
    setUnitSearch('');
    setUnits([]);
    setUnitDropdownOpen(false);
  };

  /* Auto-fetch next contract number when unit or start_date changes (new mode only) */
  useEffect(() => {
    if (isEdit) return;
    if (!form.unit_uuid) return;
    setNextNumLoading(true);
    ContractService.nextNumber({ unitUuid: form.unit_uuid, startDate: form.start_date || undefined })
      .then((data) => {
        if (data?.success) {
          setForm((p) => ({ ...p, contract_number: data.data.next_number || '' }));
        } else {
          // Backend endpoint not ready — fallback to frontend generator
          setForm((p) => ({ ...p, contract_number: getNextContractNumber(contracts) }));
        }
      })
      .catch(() => {
        // API unreachable / 404 — fallback to frontend generator
        setForm((p) => ({ ...p, contract_number: getNextContractNumber(contracts) }));
      })
      .finally(() => setNextNumLoading(false));
  }, [form.unit_uuid, form.start_date, isEdit, contracts]);

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
      end_date: form.end_date,
      amount: parseFloat(form.amount),
      currency: form.currency,
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

          {/* Contract number - full width, auto-filled from API when unit selected */}
          <div className="sm:col-span-2">
            <label className="label">Contract Number</label>
            <div className="relative">
              <input
                name="contract_number"
                type="text"
                className="input text-sm w-full pr-9"
                value={form.contract_number}
                onChange={change}
                placeholder={!isEdit ? 'Select a unit to auto-generate' : ''}
              />
              {nextNumLoading && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300">
                  <Spinner />
                </span>
              )}
            </div>
            <FieldError message={errors?.contract_number?.[0]} />
          </div>

          {isEdit && (
            <div>
              <label className="label">Status</label>
              <select name="status" className="input text-sm" value={form.status} onChange={change}>
                {Object.entries(CONTRACT_STATUS).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <FieldError message={errors?.status?.[0]} />
            </div>
          )}

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
            <label className="label">End Date <span className="text-red-500">*</span></label>
            <input
              name="end_date"
              type="date"
              className="input text-sm appearance-none min-h-[2.5rem]"
              value={form.end_date}
              onChange={change}
              required
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
