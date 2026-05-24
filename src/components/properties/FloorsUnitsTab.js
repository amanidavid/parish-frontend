'use client';
import { useState, useEffect, useCallback } from 'react';
import FloorService from '@/services/FloorService';
import UnitService from '@/services/UnitService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';

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

function Spinner({ small }) {
  return (
    <svg className={`animate-spin ${small ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function FieldError({ error }) {
  if (!error) return null;
  return <p className="mt-1 text-xs text-red-600">{error}</p>;
}

function FloorModal({ open, onClose, onSave, propertyUuid, initial }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({ name: '', floor_number: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
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
        onSave(data.data, isEdit, data?.message);
        onClose();
      } else {
        if (data?.errors) setErrors(data.errors);
        else setServerError(data?.message);
      }
    } catch {
      setServerError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Floor' : 'Add Floor'} maxWidth="max-w-md">
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
            placeholder="0 = ground, 1 = first, ..."
            min="0"
            value={form.floor_number}
            onChange={(e) => setForm((p) => ({ ...p, floor_number: e.target.value }))}
            required
          />
          <FieldError error={errors.floor_number?.[0]} />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Spinner small />}
            {isEdit ? 'Save Changes' : 'Add Floor'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function UnitModal({ open, onClose, onSave, floorUuid, initial }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({ unit_number: '', status: 'vacant' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm({ unit_number: initial?.unit_number || '', status: initial?.status || 'vacant' });
      setErrors({});
      setServerError(null);
    }
  }, [open, initial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);
    setLoading(true);
    try {
      const payload = {
        unit_number: form.unit_number.trim(),
        status: form.status,
        ...(!isEdit && { property_floor_uuid: floorUuid }),
      };
      const data = isEdit
        ? await UnitService.update(initial.uuid, payload)
        : await UnitService.store(payload);

      if (data?.success) {
        onSave(data.data, isEdit, data?.message);
        onClose();
      } else {
        if (data?.errors) setErrors(data.errors);
        else setServerError(data?.message);
      }
    } catch {
      setServerError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Unit' : 'Add Unit'} maxWidth="max-w-md">
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

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Spinner small />}
            {isEdit ? 'Save Changes' : 'Add Unit'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function FloorRow({ floor, propertyUuid, onFloorUpdated, onFloorDeleted, onNotify }) {
  const [expanded, setExpanded] = useState(false);
  const [units, setUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitsLoaded, setUnitsLoaded] = useState(false);

  const [editFloor, setEditFloor] = useState(false);
  const [addUnit, setAddUnit] = useState(false);
  const [editUnit, setEditUnit] = useState(null);
  const [deleteFloorOpen, setDeleteFloorOpen] = useState(false);
  const [deleteUnit, setDeleteUnit] = useState(null);
  const [deletingFloor, setDeletingFloor] = useState(false);
  const [deletingUnit, setDeletingUnit] = useState(false);

  const loadUnits = useCallback(async () => {
    if (unitsLoaded) return;
    setUnitsLoading(true);
    try {
      const data = await UnitService.listByFloor(floor.uuid);
      if (data?.success) setUnits(data.data || []);
    } catch { /* silent */ }
    finally {
      setUnitsLoading(false);
      setUnitsLoaded(true);
    }
  }, [floor.uuid, unitsLoaded]);

  const toggle = () => {
    setExpanded((prev) => {
      if (!prev) loadUnits();
      return !prev;
    });
  };

  const handleUnitSaved = (unit, isEdit, message) => {
    if (isEdit) {
      setUnits((prev) => prev.map((u) => (u.uuid === unit.uuid ? unit : u)));
    } else {
      setUnits((prev) => [...prev, unit]);
    }
    onNotify('success', message);
  };

  const handleDeleteFloor = async () => {
    setDeletingFloor(true);
    try {
      const data = await FloorService.destroy(floor.uuid);
      if (data?.success !== false) {
        setDeleteFloorOpen(false);
        onFloorDeleted(floor.uuid);
        onNotify('success', data?.message);
      } else {
        onNotify('error', data?.message);
        setDeleteFloorOpen(false);
      }
    } catch {
      onNotify('error', 'Network error.');
      setDeleteFloorOpen(false);
    } finally {
      setDeletingFloor(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!deleteUnit) return;
    setDeletingUnit(true);
    try {
      const data = await UnitService.destroy(deleteUnit.uuid);
      if (data?.success !== false) {
        setUnits((prev) => prev.filter((u) => u.uuid !== deleteUnit.uuid));
        setDeleteUnit(null);
        onNotify('success', data?.message);
      } else {
        onNotify('error', data?.message);
        setDeleteUnit(null);
      }
    } catch {
      onNotify('error', 'Network error.');
      setDeleteUnit(null);
    } finally {
      setDeletingUnit(false);
    }
  };

  return (
    <>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer select-none"
          onClick={toggle}>
          <div className="flex items-center gap-3">
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div>
              <span className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{floor.name}</span>
              <span className="ml-2 text-xs text-gray-400">Floor {floor.floor_number}</span>
            </div>
            <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded px-2 py-0.5">
              {floor.units_count ?? 0} unit{floor.units_count !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn-secondary text-xs py-1 px-2.5"
              onClick={() => setAddUnit(true)}
              title="Add unit to this floor"
            >
              + Unit
            </button>
            <button className="btn-secondary text-xs py-1 px-2.5" onClick={() => setEditFloor(true)}>Edit</button>
            <button
              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
              onClick={() => setDeleteFloorOpen(true)}
              title="Delete floor"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3" />
              </svg>
            </button>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-gray-200">
            {unitsLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400 gap-2 text-sm">
                <Spinner small /> Loading units...
              </div>
            ) : units.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No units yet.{' '}
                <button className="text-blue-600 hover:underline font-medium" onClick={() => setAddUnit(true)}>
                  Add the first unit
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-white">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {units.map((unit) => (
                    <tr key={unit.uuid} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{unit.unit_number}</td>
                      <td className="px-4 py-3"><UnitStatusBadge status={unit.status} /></td>
                      <td className="px-4 py-3 text-gray-400">—</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="btn-secondary text-xs py-1 px-2.5"
                            onClick={() => setEditUnit(unit)}
                          >
                            Edit
                          </button>
                          <button
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            onClick={() => setDeleteUnit(unit)}
                            title="Delete unit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <FloorModal
        open={editFloor}
        onClose={() => setEditFloor(false)}
        onSave={(floor, isEdit, message) => { onFloorUpdated(floor); onNotify('success', message); }}
        propertyUuid={propertyUuid}
        initial={floor}
      />

      <UnitModal
        open={addUnit}
        onClose={() => setAddUnit(false)}
        onSave={handleUnitSaved}
        floorUuid={floor.uuid}
        initial={null}
      />

      <UnitModal
        open={!!editUnit}
        onClose={() => setEditUnit(null)}
        onSave={handleUnitSaved}
        floorUuid={floor.uuid}
        initial={editUnit}
      />

      <ConfirmModal
        open={deleteFloorOpen}
        onClose={() => setDeleteFloorOpen(false)}
        onConfirm={handleDeleteFloor}
        loading={deletingFloor}
        title="Delete Floor"
        message={`Delete "${floor.name}"? All units on this floor will also be removed. This cannot be undone.`}
        confirmLabel="Delete Floor"
      />

      <ConfirmModal
        open={!!deleteUnit}
        onClose={() => setDeleteUnit(null)}
        onConfirm={handleDeleteUnit}
        loading={deletingUnit}
        title="Delete Unit"
        message={`Delete unit "${deleteUnit?.unit_number}"? This cannot be undone.`}
        confirmLabel="Delete Unit"
      />
    </>
  );
}

export default function FloorsUnitsTab({ propertyUuid, onNotify }) {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addFloor, setAddFloor] = useState(false);

  useEffect(() => {
    FloorService.list(propertyUuid)
      .then((data) => { if (data?.success) setFloors(data.data || []); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [propertyUuid]);

  const handleFloorSaved = (floor, isEdit, message) => {
    if (isEdit) {
      setFloors((prev) => prev.map((f) => (f.uuid === floor.uuid ? floor : f)));
    } else {
      setFloors((prev) => [...prev, floor].sort((a, b) => a.floor_number - b.floor_number));
    }
    onNotify('success', message);
  };

  const handleFloorDeleted = (uuid) => {
    setFloors((prev) => prev.filter((f) => f.uuid !== uuid));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 gap-2 text-sm">
        <Spinner /> Loading floors...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {floors.length} floor{floors.length !== 1 ? 's' : ''}
        </p>
        <button className="btn-primary text-sm" onClick={() => setAddFloor(true)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Floor
        </button>
      </div>

      {floors.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-sm text-gray-500 font-medium">No floors added yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Add floors to start managing units</p>
          <button className="btn-primary text-sm" onClick={() => setAddFloor(true)}>Add First Floor</button>
        </div>
      ) : (
        <div className="space-y-3">
          {floors.map((floor) => (
            <FloorRow
              key={floor.uuid}
              floor={floor}
              propertyUuid={propertyUuid}
              onFloorUpdated={(updated) => setFloors((prev) => prev.map((f) => (f.uuid === updated.uuid ? updated : f)))}
              onFloorDeleted={handleFloorDeleted}
              onNotify={onNotify}
            />
          ))}
        </div>
      )}

      <FloorModal
        open={addFloor}
        onClose={() => setAddFloor(false)}
        onSave={handleFloorSaved}
        propertyUuid={propertyUuid}
        initial={null}
      />
    </div>
  );
}
