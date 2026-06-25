'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import ContractService from '@/services/ContractService';
import CustomerService from '@/services/CustomerService';
import UnitService from '@/services/UnitService';
import Modal from '@/components/ui/Modal';
import { capitalize } from '@/lib/utils';

const CONTRACT_STATUS = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-600', color: '#6b7280' },
  active: { label: 'Active', bg: 'bg-green-50', text: 'text-green-700', color: '#22c55e' },
  expired: { label: 'Expired', bg: 'bg-orange-50', text: 'text-orange-700', color: '#f97316' },
  terminated: { label: 'Terminated', bg: 'bg-red-50', text: 'text-red-700', color: '#ef4444' },
};

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

function getNextContractNumber(contracts = []) {
  if (!contracts.length) return 'C-001';
  const nums = contracts
    .map((c) => c.contract_number)
    .filter(Boolean)
    .map((n) => {
      const m = n.match(/(\d+)(?!.*\d)/);
      return m ? parseInt(m[1], 10) : 0;
    });
  const max = nums.length ? Math.max(...nums) : 0;
  const next = max + 1;
  const padLen = String(max).length;
  return `C-${String(next).padStart(Math.max(padLen, 3), '0')}`;
}

export default function ContractModal({ open, onClose, onSaved, propertyUuid, initial, contracts = [] }) {
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

  /* Initialize form when modal opens */
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
      const unitLabel = initial.unit
        ? `${initial.unit.unit_number}${initial.unit.property_floor ? ` — ${initial.unit.property_floor.name}` : ''}`
        : '';
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

  /* Unit search: server-side */
  const fetchUnits = useCallback(
    (query) => {
      setUnitsLoading(true);
      UnitService.listByProperty(propertyUuid, { search: query || undefined, perPage: 20 })
        .then((data) => {
          if (data?.success) setUnits(data.data || []);
        })
        .catch(() => { })
        .finally(() => setUnitsLoading(false));
    },
    [propertyUuid]
  );

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

  /*
   * Auto-fetch next contract number when unit or start_date changes.
   * For new contracts: always generate.
   * For edit contracts: only generate if contract_number is empty/missing.
   */
  useEffect(() => {
    if (!form.unit_uuid) return;
    // In edit mode, only auto-generate if contract_number is empty
    if (isEdit && form.contract_number) return;
    setNextNumLoading(true);
    ContractService.nextNumber({ unitUuid: form.unit_uuid, startDate: form.start_date || undefined })
      .then((data) => {
        if (data?.success) {
          setForm((p) => ({ ...p, contract_number: data.data.next_number || '' }));
        } else {
          setForm((p) => ({ ...p, contract_number: getNextContractNumber(contracts) }));
        }
      })
      .catch(() => {
        setForm((p) => ({ ...p, contract_number: getNextContractNumber(contracts) }));
      })
      .finally(() => setNextNumLoading(false));
  }, [form.unit_uuid, form.start_date, isEdit, contracts]);

  /* Contract number auto-population for edit mode when initial.contract_number is missing */
  useEffect(() => {
    if (!isEdit || !initial || initial.contract_number || !form.unit_uuid) return;
    setNextNumLoading(true);
    ContractService.nextNumber({ unitUuid: form.unit_uuid, startDate: form.start_date || undefined })
      .then((data) => {
        if (data?.success) {
          setForm((p) => ({ ...p, contract_number: data.data.next_number || '' }));
        } else {
          setForm((p) => ({ ...p, contract_number: getNextContractNumber(contracts) }));
        }
      })
      .catch(() => {
        setForm((p) => ({ ...p, contract_number: getNextContractNumber(contracts) }));
      })
      .finally(() => setNextNumLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, initial, form.unit_uuid]);

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
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 last:border-0 ${form.customer_uuid === c.uuid
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
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

          {/* Unit — server-side searchable dropdown */}
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
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 last:border-0 ${form.unit_uuid === u.uuid
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
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

          {/* Contract number | Status */}
          <div>
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

          <div>
            <label className="label">Status</label>
            <select name="status" className="input text-sm" value={form.status} onChange={change}>
              {isEdit
                ? Object.entries(CONTRACT_STATUS).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))
                : (
                  <>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </>
                )}
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
            <label className="label">
              Notes <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span>
            </label>
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
          <button type="button" onClick={onClose} className="btn-secondary text-sm" disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary text-sm" disabled={saving}>
            {saving && <Spinner />}
            {isEdit ? 'Save Changes' : 'Create Contract'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
