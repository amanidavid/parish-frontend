'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import FloorService from '@/services/FloorService';
import UnitService from '@/services/UnitService';
import ContractService from '@/services/ContractService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import useCan from '@/hooks/useCan';
import ActionMenu from '@/components/ui/ActionMenu';
import { usePropertyAccess } from '@/contexts/PropertyAccessContext';
import { capitalize } from '@/lib/utils';

const PER_PAGE = 50;

/* -- Portal wrapper — renders modal at body root to escape transformed ancestors -- */
function ModalPortal({ children }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

/* ─── Helpers for contract view modal ───────────────────────────── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtAmount = (amount, currency) =>
  amount != null ? `${currency || ''} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

const CONTRACT_STATUS = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-600', color: '#6b7280' },
  active: { label: 'Active', bg: 'bg-green-50', text: 'text-green-700', color: '#22c55e' },
  expired: { label: 'Expired', bg: 'bg-orange-50', text: 'text-orange-700', color: '#f97316' },
};

function ContractStatusBadge({ status }) {
  const s = CONTRACT_STATUS[status] || CONTRACT_STATUS.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function Spinner({ className = 'w-4 h-4' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
    </svg>
  );
}

function FloorAvatar({ number, size = 'md' }) {
  const dim = size === 'lg' ? 'w-14 h-14 text-lg' : size === 'sm' ? 'w-9 h-9 text-xs' : 'w-11 h-11 text-sm';
  return (
    <div className={`${dim} rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0`}>
      {number}
    </div>
  );
}

/* -- Floor modal (create + edit) ----------------------------------- */
function FloorModal({ open, onClose, onSaved, propertyUuid, initial }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({ name: '', floor_number: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm({ name: initial?.name || '', floor_number: initial?.floor_number ?? '' });
      setErrors({});
      setServerError(null);
    }
  }, [open, initial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        floor_number: Number(form.floor_number),
        ...(!isEdit && { property_uuid: propertyUuid }),
      };
      const data = isEdit
        ? await FloorService.update(initial.uuid, payload)
        : await FloorService.store(payload);

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

  if (!open) return null;
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Floor' : 'New Floor'}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {serverError && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2.5">
                <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Floor Name <span className="text-red-500">*</span></label>
              <input type="text" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none" placeholder="e.g. Ground Floor" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
              {errors.name?.[0] && <p className="mt-1 text-xs text-red-600">{errors.name[0]}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Floor Number <span className="text-red-500">*</span></label>
              <input type="number" min="0" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none" placeholder="0 = ground, 1 = first, ..." value={form.floor_number} onChange={(e) => setForm((p) => ({ ...p, floor_number: e.target.value }))} required />
              {errors.floor_number?.[0] && <p className="mt-1 text-xs text-red-600">{errors.floor_number[0]}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 inline-flex items-center gap-2">
                {saving && <Spinner />}
                {isEdit ? 'Save Changes' : 'Create Floor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

/* -- Field row ----------------------------------------------------- */
function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-700">{value || <span className="text-gray-300">—</span>}</p>
    </div>
  );
}

/* -- Unit modal (create + edit) ------------------------------------ */
function UnitModal({ open, onClose, onSaved, floorUuid, initial }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({ unit_number: '', description: '', status: 'vacant' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm({
        unit_number: initial?.unit_number || '',
        description: initial?.description || '',
        status: initial?.status || 'vacant',
      });
      setErrors({});
      setServerError(null);
    }
  }, [open, initial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);
    setSaving(true);
    try {
      const payload = {
        unit_number: form.unit_number.trim(),
        description: form.description || null,
        status: form.status,
        ...(!isEdit && { property_floor_uuid: floorUuid }),
      };
      const data = isEdit
        ? await UnitService.update(initial.uuid, payload)
        : await UnitService.store(payload);
      if (data?.success) {
        onSaved(data.data, isEdit, data?.message);
        onClose();
      } else {
        if (data?.errors) setErrors(data.errors);
        else setServerError(data?.message || 'Request failed.');
      }
    } catch {
      setServerError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Unit' : 'New Unit'}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {serverError && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2.5">
                <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Unit Number <span className="text-red-500">*</span></label>
              <input type="text" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none" placeholder="e.g. G-01" value={form.unit_number} onChange={(e) => setForm((p) => ({ ...p, unit_number: e.target.value }))} required />
              {errors.unit_number?.[0] && <p className="mt-1 text-xs text-red-600">{errors.unit_number[0]}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
              <select className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none resize-none" rows={2} placeholder="Brief description..." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 inline-flex items-center gap-2">
                {saving && <Spinner />}
                {isEdit ? 'Save Changes' : 'Create Unit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

/* -- Contract view modal (read-only for a unit) -------------------- */
function ContractViewModal({ open, onClose, unit }) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !unit?.uuid) return;
    setLoading(true);
    ContractService.list({ unitUuid: unit.uuid, perPage: 1 })
      .then((data) => {
        if (data?.success && data.data?.length) {
          setContract(data.data[0]);
        } else {
          setContract(null);
        }
      })
      .catch(() => setContract(null))
      .finally(() => setLoading(false));
  }, [open, unit?.uuid]);

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

  const c = contract || {};
  const s = CONTRACT_STATUS[c.status] || CONTRACT_STATUS.draft;

  return (
    <Modal open={open} onClose={onClose} title={`Contract — ${unit?.unit_number || 'Unit'}`} maxWidth="max-w-lg">
      <div className="space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading contract...
          </div>
        ) : !contract ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-gray-500">No contract found for this unit.</p>
          </div>
        ) : (
          <>
            {/* Header Card — contract number + amount priority */}
            <div className={`relative overflow-hidden rounded-xl ring-1 shadow-sm p-5 ${s.bg} ring-gray-100`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ContractStatusBadge status={c.status} />
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
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                label="Period"
                value={`${fmtDate(c.start_date)} — ${c.end_date ? fmtDate(c.end_date) : 'Open ended'}`}
              />
              <InfoRow
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                label="Unit"
                value={c.unit ? `${c.unit.unit_number}${c.unit.property_floor ? ` · ${c.unit.property_floor.name}` : ''}` : undefined}
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
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

/* -- Main workspace ------------------------------------------------ */
export default function FloorsWorkspace({ propertyUuid }) {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [selected, setSelected] = useState(null);

  const [units, setUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(false);

  const [floorModal, setFloorModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [unitModal, setUnitModal] = useState(null); // null | 'new' | unit object
  const [contractModal, setContractModal] = useState(null); // unit object
  const [deleteUnitTarget, setDeleteUnitTarget] = useState(null);
  const [deletingUnit, setDeletingUnit] = useState(false);
  const [unitSearchInput, setUnitSearchInput] = useState('');
  const [appliedUnitSearch, setAppliedUnitSearch] = useState('');

  /* -- Permission guards -- */
  const canCreateFloor = useCan('property_floors.create');
  const canEditFloor = useCan('property_floors.update');
  const canDeleteFloor = useCan('property_floors.delete');
  const canCreateUnit = useCan('units.create');
  const canEditUnit = useCan('units.update');
  const canDeleteUnit = useCan('units.delete');
  const canCreateContract = useCan(['customer_contracts.create', 'contract.create', 'contracts.create'], 'any');

  const access = usePropertyAccess();
  const workspaceBlocked = access?.workspace?.allowed === false;
  const propertyBlocked = access?.property_subscription?.allowed === false;
  const opsBlocked = workspaceBlocked || propertyBlocked;
  const opsMessage = workspaceBlocked
    ? access?.workspace?.message
    : (propertyBlocked ? access?.property_subscription?.message : '');

  const abortRef = useRef(null);

  /* -- Load floors -- */
  const loadFloors = useCallback(async () => {
    if (!propertyUuid) { setFloors([]); setMeta(null); setLoading(false); return; }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    setLoading(true);
    setError(null);
    try {
      const data = await FloorService.list(propertyUuid, {
        search: appliedSearch || undefined,
        perPage: PER_PAGE,
        signal,
      });
      if (signal.aborted) return;
      if (data?.success) {
        const items = [...(data.data || [])].sort((a, b) => (a.floor_number ?? 0) - (b.floor_number ?? 0));
        setFloors(items);
        setSelected((prev) => (prev ? items.find((f) => f.uuid === prev.uuid) || prev : prev));
      } else {
        setError(data?.message || 'Failed to load floors.');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') setError('Network error. Please try again.');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [propertyUuid, appliedSearch]);

  useEffect(() => { loadFloors(); }, [loadFloors]);

  /* Debounced live search (floors) */
  useEffect(() => {
    const t = setTimeout(() => setAppliedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* Debounced live search (units) */
  useEffect(() => {
    const t = setTimeout(() => setAppliedUnitSearch(unitSearchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [unitSearchInput]);

  /* -- Load units for selected floor -- */
  const loadUnits = useCallback(async (floorUuid, search = '') => {
    if (!floorUuid) return;
    setUnitsLoading(true);
    try {
      const res = await UnitService.listByFloor(floorUuid, { perPage: PER_PAGE, search });
      if (res?.success) {
        const arr = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setUnits(arr);
      } else {
        setUnits([]);
      }
    } catch {
      setUnits([]);
    } finally {
      setUnitsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected?.uuid) loadUnits(selected.uuid, appliedUnitSearch);
    else setUnits([]);
  }, [selected?.uuid, appliedUnitSearch, loadUnits]);

  const handleSaved = (floor, isEdit, message) => {
    useUiStore.getState().showModal({ type: 'success', message });
    if (isEdit) {
      setFloors((prev) => prev.map((f) => f.uuid === floor.uuid ? { ...f, ...floor } : f));
      if (selected?.uuid === floor.uuid) setSelected((prev) => ({ ...prev, ...floor }));
    } else {
      loadFloors();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const data = await FloorService.destroy(deleteTarget.uuid);
      if (data?.success !== false) {
        if (selected?.uuid === deleteTarget.uuid) setSelected(null);
        setDeleteTarget(null);
        loadFloors();
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleUnitSaved = (unit, isEdit, message) => {
    useUiStore.getState().showModal({ type: 'success', message });
    if (isEdit) {
      setUnits((prev) => prev.map((u) => u.uuid === unit.uuid ? { ...u, ...unit } : u));
    } else {
      loadUnits(selected?.uuid);
      loadFloors();
    }
  };

  const handleDeleteUnit = async () => {
    if (!deleteUnitTarget) return;
    setDeletingUnit(true);
    try {
      const data = await UnitService.destroy(deleteUnitTarget.uuid);
      if (data?.success !== false) {
        setDeleteUnitTarget(null);
        loadUnits(selected?.uuid);
        loadFloors();
      }
    } finally {
      setDeletingUnit(false);
      setDeleteUnitTarget(null);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
  };

  return (
    <div className="space-y-4">
      {/* Master–detail container */}
      <div className="flex h-[calc(100vh-14rem)] min-h-[400px] bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* -- List pane -- */}
        <aside className={`w-full md:w-80 lg:w-96 md:border-r border-gray-200 flex-col min-h-0 ${selected ? 'hidden md:flex' : 'flex'}`}>
          {/* Search + New Floor */}
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="flex items-center gap-2">
              {canCreateFloor && (
                <button
                  onClick={() => setFloorModal('new')}
                  disabled={opsBlocked}
                  title={opsBlocked ? opsMessage : undefined}
                  className="btn-primary text-xs inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  New Floor
                </button>
              )}
            </div>
            <form onSubmit={(e) => e.preventDefault()} className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Search floors..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-gray-50 border border-transparent text-sm focus:bg-white focus:border-primary-500 focus:outline-none transition-colors"
              />
              {searchInput && (
                <button type="button" onClick={handleClearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </form>
          </div>

          {/* List */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-11 h-11 rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                      <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-6 text-center text-sm text-red-600">{error}</div>
            ) : floors.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-500 font-medium">No floors found</p>
                {appliedSearch && <button onClick={handleClearSearch} className="mt-2 text-xs text-primary-600 hover:underline">Clear search</button>}
              </div>
            ) : (
              <ul>
                {floors.map((floor) => {
                  const active = selected?.uuid === floor.uuid;
                  return (
                    <li key={floor.uuid}>
                      <button
                        onClick={() => setSelected(floor)}
                        className={`w-full flex items-center gap-3 px-3 py-3 text-left border-b border-gray-50 transition-colors ${active ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                      >
                        <FloorAvatar number={floor.floor_number} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold truncate ${active ? 'text-primary-700' : 'text-gray-900'}`}>{capitalize(floor.name)}</p>
                          <p className="text-xs text-gray-400 truncate">{floor.units_count ?? 0} units</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* -- Detail pane -- */}
        <section className={`flex-1 min-w-0 min-h-0 flex-col ${selected ? 'flex' : 'hidden md:flex'}`}>
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <p className="text-sm font-medium text-gray-500">Select a floor</p>
              <p className="text-xs text-gray-400 mt-1">Floor details and units will appear here.</p>
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                <button onClick={() => setSelected(null)} className="md:hidden -ml-1 p-1.5 rounded-full text-gray-500 hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <FloorAvatar number={selected.floor_number} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{capitalize(selected.name)}</p>
                  <p className="text-xs text-gray-400">Floor {selected.floor_number} · {selected.units_count ?? 0} units</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {canEditFloor && (
                    <button
                      onClick={() => setFloorModal(selected)}
                      disabled={opsBlocked}
                      title={opsBlocked ? opsMessage : undefined}
                      className="h-8 px-3 inline-flex items-center rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >Edit</button>
                  )}
                  {canDeleteFloor && (
                    <button
                      onClick={() => setDeleteTarget(selected)}
                      disabled={opsBlocked}
                      title={opsBlocked ? opsMessage : undefined}
                      className="h-8 px-3 inline-flex items-center rounded text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >Delete</button>
                  )}
                </div>
              </div>

              {/* Detail body */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                {/* Units table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex flex-col gap-2 px-4 py-3 border-b border-gray-100 bg-white">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Units on this Floor</h3>
                        <p className="text-xs text-gray-400">{units.length} unit{units.length !== 1 ? 's' : ''}</p>
                      </div>
                      {canCreateUnit && (
                        <button
                          onClick={() => setUnitModal('new')}
                          disabled={opsBlocked}
                          title={opsBlocked ? opsMessage : undefined}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors shrink-0 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          New Unit
                        </button>
                      )}
                    </div>
                    <div className="relative max-w-xs w-full">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      <input
                        type="text"
                        placeholder="Search units..."
                        value={unitSearchInput}
                        onChange={(e) => setUnitSearchInput(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 rounded-lg bg-gray-50 border border-transparent text-sm focus:bg-white focus:border-primary-500 focus:outline-none transition-colors"
                      />
                      {unitSearchInput && (
                        <button type="button" onClick={() => setUnitSearchInput('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {unitsLoading ? (
                    <div className="flex items-center justify-center py-10 text-gray-400 text-sm gap-2"><Spinner /> Loading...</div>
                  ) : units.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="text-sm text-gray-500 font-medium">No units on this floor</p>
                      <p className="text-xs text-gray-400 mt-1">Register units to start assigning contracts.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[480px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit #</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {units.map((u) => (
                            <tr key={u.uuid} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900">{u.unit_number || '—'}</p>
                                {u.name && <p className="text-xs text-gray-400">{u.name}</p>}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'occupied' ? 'bg-green-50 text-green-700' : u.status === 'vacant' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {u.status ? capitalize(u.status) : '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {canCreateContract && (
                                    <button
                                      onClick={() => setContractModal(u)}
                                      disabled={opsBlocked}
                                      title={opsBlocked ? opsMessage : undefined}
                                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                      Contract
                                    </button>
                                  )}
                                  <ActionMenu
                                    actions={[
                                      ...(canEditUnit ? [{ label: 'Edit', onClick: () => setUnitModal(u), disabled: opsBlocked }] : []),
                                      ...(canDeleteUnit ? [{ label: 'Delete', onClick: () => setDeleteUnitTarget(u), danger: true, disabled: opsBlocked }] : []),
                                    ]}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* New Floor floating button (mobile only, when list is showing) */}
      {
        !selected && (
          <div className="md:hidden flex justify-end">
            {canCreateFloor && (
              <button
                onClick={() => setFloorModal('new')}
                disabled={opsBlocked}
                title={opsBlocked ? opsMessage : undefined}
                className="btn-primary text-sm inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Floor
              </button>
            )}
          </div>
        )
      }

      {/* Modals */}
      <FloorModal
        open={!!floorModal}
        onClose={() => setFloorModal(null)}
        onSaved={handleSaved}
        propertyUuid={propertyUuid}
        initial={floorModal === 'new' ? null : floorModal}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        danger
        title="Delete Floor"
        message={`Delete "${capitalize(deleteTarget?.name || '')}"? All units on this floor will also be removed. This cannot be undone.`}
        confirmLabel="Delete Floor"
      />

      <ConfirmModal
        open={!!deleteUnitTarget}
        onClose={() => setDeleteUnitTarget(null)}
        onConfirm={handleDeleteUnit}
        loading={deletingUnit}
        danger
        title="Delete Unit"
        message={`Delete unit "${deleteUnitTarget?.unit_number || ''}"? This cannot be undone.`}
        confirmLabel="Delete Unit"
      />

      <UnitModal
        open={!!unitModal}
        onClose={() => setUnitModal(null)}
        onSaved={handleUnitSaved}
        floorUuid={selected?.uuid}
        initial={unitModal === 'new' ? null : unitModal}
      />

      <ContractViewModal
        open={!!contractModal}
        onClose={() => setContractModal(null)}
        unit={contractModal}
      />
    </div >
  );
}
