'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import UnitService from '@/services/UnitService';
import FloorService from '@/services/FloorService';
import Pagination from '@/components/ui/Pagination';
import ActionMenu from '@/components/ui/ActionMenu';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import useConfirmModal from '@/hooks/useConfirmModal';
import useUiStore from '@/store/uiStore';

const BTN = {
  gray: 'h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors',
  blue: 'h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors',
  red: 'h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-red-500 hover:bg-red-50 transition-colors',
};

const UNIT_STATUS = {
  occupied: { label: 'Occupied', dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
  vacant: { label: 'Vacant', dot: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-50' },
  maintenance: { label: 'Maintenance', dot: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50' },
};

function UnitStatusBadge({ status }) {
  const s = UNIT_STATUS[status] || UNIT_STATUS.vacant;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
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

function FieldError({ error }) {
  if (!error) return null;
  return <p className="mt-1 text-xs text-red-600">{error}</p>;
}

function UnitModal({ open, onClose, onSaved, floors, initial, preselectFloorUuid = '' }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({ unit_number: '', description: '', status: 'vacant', property_floor_uuid: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm({
        unit_number: initial?.unit_number || '',
        description: initial?.description || '',
        status: initial?.status || 'vacant',
        property_floor_uuid: initial?.property_floor?.uuid || preselectFloorUuid || '',
      });
      setErrors({});
      setServerError(null);
    }
  }, [open, initial, preselectFloorUuid]);

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
        ...(!isEdit && { property_floor_uuid: form.property_floor_uuid }),
      };
      const data = isEdit
        ? await UnitService.update(initial.uuid, payload)
        : await UnitService.store(payload);

      if (data?.success) {
        onSaved(data.data, isEdit, data?.message);
        onClose();
      } else {
        if (data?.errors) setErrors(data.errors);
        else setServerError(data?.message || 'Request failed. Please check your input and try again.');
      }
    } catch {
      setServerError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Unit' : 'New Unit'} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2.5">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        {!isEdit && (
          <div>
            <label className="label">Floor <span className="text-red-500">*</span></label>
            <select
              className="input"
              value={form.property_floor_uuid}
              onChange={(e) => setForm((p) => ({ ...p, property_floor_uuid: e.target.value }))}
              required
            >
              <option value="">Select a floor</option>
              {floors.map((f) => (
                <option key={f.uuid} value={f.uuid}>
                  {f.name} (Floor {f.floor_number})
                </option>
              ))}
            </select>
            <FieldError error={errors.property_floor_uuid?.[0]} />
          </div>
        )}

        {isEdit && initial?.property_floor && (
          <div>
            <label className="label">Floor</label>
            <input
              type="text"
              className="input bg-gray-50 cursor-not-allowed"
              value={`${initial.property_floor.name} (Floor ${initial.property_floor.floor_number})`}
              readOnly
            />
          </div>
        )}

        <div>
          <label className="label">Unit Number <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="input"
            placeholder="e.g. G-01"
            value={form.unit_number}
            onChange={(e) => setForm((p) => ({ ...p, unit_number: e.target.value }))}
            required
          />
          <FieldError error={errors.unit_number?.[0]} />
        </div>

        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="vacant">Vacant</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <FieldError error={errors.status?.[0]} />
        </div>

        <div>
          <label className="label">Description <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Brief description of this unit..."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <FieldError error={errors.description?.[0]} />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving && <Spinner />}
            {isEdit ? 'Save Changes' : 'Create Unit'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function UnitsTab({ propertyUuid, initialFloor = null, onBackToFloors }) {
  const [units, setUnits] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [floors, setFloors] = useState([]);
  const [selectedFloorUuid, setSelectedFloorUuid] = useState(initialFloor?.uuid || '');
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [floorsLoading, setFloorsLoading] = useState(true);
  const [unitModal, setUnitModal] = useState(null);
  const confirmModal = useConfirmModal();
  const searchRef = useRef(null);
  const unitsAbortRef = useRef(null);
  const floorsAbortRef = useRef(null);

  /* Abort all in-flight requests on unmount */
  useEffect(() => () => {
    unitsAbortRef.current?.abort();
    floorsAbortRef.current?.abort();
  }, []);

  /* Load floors for the filter dropdown — bounded to 100 rows, abortable */
  useEffect(() => {
    floorsAbortRef.current?.abort();
    floorsAbortRef.current = new AbortController();
    const { signal } = floorsAbortRef.current;

    FloorService.list(propertyUuid, { perPage: 100, signal })
      .then((data) => {
        if (signal.aborted) return;
        if (data?.success) setFloors(data.data || []);
      })
      .catch((err) => { if (err?.name === 'AbortError') return; })
      .finally(() => { if (!signal.aborted) setFloorsLoading(false); });
  }, [propertyUuid]);

  useEffect(() => {
    setSelectedFloorUuid(initialFloor?.uuid || '');
  }, [initialFloor]);

  const loadUnits = useCallback(async () => {
    /* Cancel previous in-flight request — prevents stale-data race conditions */
    unitsAbortRef.current?.abort();
    unitsAbortRef.current = new AbortController();
    const { signal } = unitsAbortRef.current;

    setUnitsLoading(true);
    const params = { page, search: appliedSearch || undefined, signal };
    try {
      const data = await (selectedFloorUuid
        ? UnitService.listByFloor(selectedFloorUuid, params)
        : UnitService.listByProperty(propertyUuid, params));
      if (signal.aborted) return;
      if (data?.success) {
        setUnits(data.data || []);
        setMeta(data.meta || null);
      } else {
        useUiStore.getState().showModal({ type: 'error', message: data?.message || 'Failed to load units' });
      }
    } catch (err) {
      if (err?.name !== 'AbortError') useUiStore.getState().showModal({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      if (!signal.aborted) setUnitsLoading(false);
    }
  }, [selectedFloorUuid, propertyUuid, appliedSearch, page]);

  useEffect(() => { loadUnits(); }, [loadUnits]);

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

  const handleSaved = (unit, isEdit, message) => {
    useUiStore.getState().showModal({
      type: 'success',
      message,
      onRefresh: () => { if (page !== 1) setPage(1); else loadUnits(); },
    });
    if (isEdit) {
      /* Optimistic in-place update — no server round-trip for edits */
      setUnits((prev) => prev.map((u) => u.uuid === unit.uuid ? { ...u, ...unit } : u));
    } else {
      /* New unit: go to page 1 to show it, or re-fetch if already there */
      if (page !== 1) setPage(1); else loadUnits();
    }
  };

  const handleDelete = useCallback(async () => {
    const res = await confirmModal.execute(
      (unit) => UnitService.destroy(unit.uuid),
      { successMessage: 'Unit deleted successfully.', errorMessage: 'Failed to delete unit.' }
    );
    if (res?.success) {
      loadUnits(); /* re-fetch needed — pagination row count changes */
    }
  }, [confirmModal, loadUnits]);

  const selectedFloorLabel = floors.find((f) => f.uuid === selectedFloorUuid)?.name;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {initialFloor && onBackToFloors && (
            <button
              type="button"
              onClick={onBackToFloors}
              className="btn-secondary text-sm inline-flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Floors
            </button>
          )}
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
                placeholder="Search unit number..."
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

          {floorsLoading ? (
            <div className="w-36 h-9 bg-gray-100 rounded animate-pulse" />
          ) : (
            <select
              className="input w-auto text-sm"
              value={selectedFloorUuid}
              onChange={(e) => { setSelectedFloorUuid(e.target.value); setPage(1); setAppliedSearch(''); setSearchInput(''); }}
            >
              <option value="">All Floors</option>
              {floors.map((f) => (
                <option key={f.uuid} value={f.uuid}>{f.name} (Floor {f.floor_number})</option>
              ))}
            </select>
          )}
        </div>

        <button
          className="btn-primary text-sm"
          onClick={() => setUnitModal({ mode: 'new', preselectFloorUuid: initialFloor?.uuid || '' })}
          disabled={floorsLoading || floors.length === 0}
          title={floors.length === 0 ? 'Create a floor first before adding units' : undefined}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Unit
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {floors.length === 0 && !floorsLoading ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 font-medium">No floors available</p>
            <p className="text-xs text-gray-400 mt-1">Register floors first before adding units</p>
          </div>
        ) : unitsLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
            <Spinner /> Loading...
          </div>
        ) : units.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">
              {appliedSearch ? `No units match "${appliedSearch}"` : selectedFloorUuid ? `No units on ${selectedFloorLabel}` : 'No units found'}
            </p>
            <p className="text-xs text-gray-400 mt-1 mb-3">
              {!appliedSearch && !selectedFloorUuid ? 'Start by creating units on your floors.' : ''}
            </p>
            {appliedSearch && <button onClick={handleClear} className="text-xs text-blue-600 hover:underline">Clear search</button>}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit Number</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Floor</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit, idx) => (
                  <tr key={unit.uuid} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {((page - 1) * (meta?.per_page || 15)) + idx + 1}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{unit.unit_number}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-sm">
                      {unit.property_floor
                        ? `${unit.property_floor.name} (Floor ${unit.property_floor.floor_number})`
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <UnitStatusBadge status={unit.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ActionMenu
                        actions={[
                          { label: 'Contracts', onClick: () => window.location.href = `/contracts?unit_uuid=${unit.uuid}&property_uuid=${propertyUuid}` },
                          { label: 'Edit', onClick: () => setUnitModal(unit) },
                          { label: 'Delete', onClick: () => confirmModal.prompt(unit), danger: true },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            {meta && <Pagination meta={meta} onPageChange={setPage} />}
          </>
        )}
      </div>

      <UnitModal
        open={!!unitModal}
        onClose={() => setUnitModal(null)}
        onSaved={handleSaved}
        floors={floors}
        initial={unitModal?.mode === 'new' ? null : unitModal}
        preselectFloorUuid={unitModal?.preselectFloorUuid || ''}
      />

      <ConfirmModal
        open={confirmModal.open}
        onClose={confirmModal.close}
        onConfirm={handleDelete}
        onRetry={handleDelete}
        danger
        loading={confirmModal.loading}
        result={confirmModal.result}
        title="Delete Unit"
        message={`Delete unit "${confirmModal.item?.unit_number}"? This cannot be undone.`}
        confirmLabel="Delete Unit"
      />
    </div>
  );
}
