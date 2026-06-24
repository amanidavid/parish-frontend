'use client';
import { useState, useEffect } from 'react';
import UnitService from '@/services/UnitService';
import Modal from '@/components/ui/Modal';

const UNIT_STATUS = {
  occupied: { label: 'Occupied', dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
  vacant: { label: 'Vacant', dot: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-50' },
  maintenance: { label: 'Maintenance', dot: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50' },
};

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

/**
 * Reusable Unit create/edit modal.
 *
 * Props:
 *   open            boolean
 *   onClose         () => void
 *   onSaved         (data, isEdit, message?) => void
 *   initial         unit object | null   (edit mode when provided)
 *   floors          Floor[] | undefined  (when provided, shows floor dropdown in create mode)
 *   preselectFloorUuid string | undefined (pre-selected floor for create mode dropdown)
 *   floorUuid       string | undefined   (alternative to preselectFloorUuid; direct floor assignment for create)
 */
export default function UnitModal({ open, onClose, onSaved, onSave, initial = null, floors = [], preselectFloorUuid = '', floorUuid = '' }) {
  const isEdit = !!initial;
  const resolvedFloorUuid = preselectFloorUuid || floorUuid;

  const [form, setForm] = useState({
    unit_number: '',
    description: '',
    status: 'vacant',
    property_floor_uuid: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      unit_number: initial?.unit_number || '',
      description: initial?.description || '',
      status: initial?.status || 'vacant',
      property_floor_uuid: initial?.property_floor?.uuid || resolvedFloorUuid || '',
    });
    setErrors({});
    setServerError(null);
  }, [open, initial, resolvedFloorUuid]);

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
        const cb = onSaved || onSave;
        if (cb) cb(data.data, isEdit, data?.message);
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

  /* When editing an occupied unit, status is derived from contracts — make it read-only */
  const isOccupied = isEdit && initial?.status === 'occupied';
  const occupiedBadge = isOccupied ? UNIT_STATUS.occupied : null;

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

        {/* Floor selector (only when floors array is provided and creating) */}
        {!isEdit && floors.length > 0 && (
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

        {/* Floor display (edit mode) */}
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
          {isOccupied ? (
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 bg-gray-50">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${occupiedBadge.bg} ${occupiedBadge.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${occupiedBadge.dot}`} />
                {occupiedBadge.label}
              </span>
              <span className="text-xs text-gray-400">— managed by active contract</span>
            </div>
          ) : (
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="vacant">Vacant</option>
              <option value="maintenance">Maintenance</option>
            </select>
          )}
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
