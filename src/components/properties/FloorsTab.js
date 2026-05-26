'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import FloorService from '@/services/FloorService';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';

const BTN = {
  gray: 'h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors',
  blue: 'h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors',
  red: 'h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-red-500 hover:bg-red-50 transition-colors',
};

function Spinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
    </svg>
  );
}

function TabAlert({ type, message, onClose }) {
  if (!message) return null;
  const ok = type === 'success';
  return (
    <div className={`flex items-center gap-3 rounded-md px-4 py-2.5 mb-4 border text-sm ${ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <svg className={`w-4 h-4 shrink-0 ${ok ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {ok
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        }
      </svg>
      <p className={`flex-1 ${ok ? 'text-green-800' : 'text-red-700'}`}>{message}</p>
      <button onClick={onClose} className={`${ok ? 'text-green-400 hover:text-green-700' : 'text-red-400 hover:text-red-700'} transition-colors`}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function FieldError({ error }) {
  if (!error) return null;
  return <p className="mt-1 text-xs text-red-600">{error}</p>;
}

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
        else setServerError(data?.message);
      }
    } catch {
      setServerError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Floor' : 'New Floor'} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2.5">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        <div>
          <label className="label">Floor Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Ground Floor"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <FieldError error={errors.name?.[0]} />
        </div>

        <div>
          <label className="label">Floor Number <span className="text-red-500">*</span></label>
          <input
            type="number"
            className="input"
            min="0"
            placeholder="0 = ground, 1 = first, ..."
            value={form.floor_number}
            onChange={(e) => setForm((p) => ({ ...p, floor_number: e.target.value }))}
            required
          />
          <FieldError error={errors.floor_number?.[0]} />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving && <Spinner />}
            {isEdit ? 'Save Changes' : 'Create Floor'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function FloorsTab({ propertyUuid, onViewUnits }) {
  const [floors, setFloors] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [floorModal, setFloorModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 4500);
    return () => clearTimeout(t);
  }, [notification]);

  /* Abort any in-flight floors request on unmount */
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const notify = useCallback((type, message) => setNotification({ type, message }), []);

  const loadFloors = useCallback(async () => {
    /* Cancel previous in-flight request — prevents stale-data race conditions */
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    setLoading(true);
    try {
      const data = await FloorService.list(propertyUuid, {
        search: appliedSearch || undefined,
        page,
        signal,
      });
      if (signal.aborted) return;
      if (data?.success) {
        setFloors(data.data || []);
        setMeta(data.meta || null);
      } else {
        notify('error', data?.message);
      }
    } catch (err) {
      if (err?.name !== 'AbortError') notify('error', 'Network error');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [propertyUuid, appliedSearch, page, notify]);

  useEffect(() => { loadFloors(); }, [loadFloors]);

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

  const handleSaved = (floor, isEdit, message) => {
    notify('success', message);
    if (isEdit) {
      /* Optimistic in-place update — no server round-trip for edits */
      setFloors((prev) => prev.map((f) => f.uuid === floor.uuid ? { ...f, ...floor } : f));
    } else {
      /* New floor: navigate to page 1 to show it, or re-fetch if already there */
      if (page !== 1) setPage(1); else loadFloors();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const data = await FloorService.destroy(deleteTarget.uuid);
      if (data?.success !== false) {
        notify('success', data?.message);
        loadFloors(); /* re-fetch needed — pagination row count changes */
      } else {
        notify('error', data?.message);
      }
    } catch {
      notify('error', 'Network error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
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
              placeholder="Search floors..."
              className="input pl-9 pr-8 w-56"
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
        <button className="btn-primary text-sm" onClick={() => setFloorModal('new')}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Floor
        </button>
      </div>

      <TabAlert type={notification?.type} message={notification?.message} onClose={() => setNotification(null)} />

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
            <Spinner /> Loading...
          </div>
        ) : floors.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">
              {appliedSearch ? `No floors match "${appliedSearch}"` : 'No floors registered'}
            </p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              {appliedSearch ? '' : 'Register floors to start assigning units'}
            </p>
            {appliedSearch
              ? <button onClick={handleClear} className="text-xs text-blue-600 hover:underline">Clear search</button>
              : <button className="btn-primary text-sm" onClick={() => setFloorModal('new')}>New Floor</button>
            }
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Floor Name</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Floor No.</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Units</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {floors.map((floor, idx) => (
                  <tr key={floor.uuid} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {((page - 1) * (meta?.per_page || 15)) + idx + 1}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{floor.name}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[32px] h-6 rounded bg-gray-100 text-gray-600 text-xs font-semibold px-2">
                        {floor.floor_number}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[32px] h-6 rounded bg-blue-50 text-blue-700 text-xs font-semibold px-2">
                        {floor.units_count ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className={BTN.blue} onClick={() => onViewUnits(floor)}>View Units</button>
                        <button className={BTN.gray} onClick={() => setFloorModal(floor)}>Edit</button>
                        <button className={BTN.red} onClick={() => setDeleteTarget(floor)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {meta && <Pagination meta={meta} onPageChange={setPage} />}
          </>
        )}
      </div>

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
        title="Delete Floor"
        message={`Delete "${deleteTarget?.name}"? All units on this floor will also be removed. This cannot be undone.`}
        confirmLabel="Delete Floor"
      />
    </div>
  );
}
