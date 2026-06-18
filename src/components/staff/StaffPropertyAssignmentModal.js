'use client';
import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import PropertyService from '@/services/PropertyService';
import StaffPropertyAssignmentService from '@/services/StaffPropertyAssignmentService';

/* Simple select from available properties */
export default function StaffPropertyAssignmentModal({ open, onClose, staffUuid, onSaved, existingAssignments = [] }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState(null);

  /* Load available properties */
  useEffect(() => {
    if (!open) return;
    setFetching(true);
    PropertyService.index({ per_page: 100 })
      .then((res) => {
        const arr = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
        setProperties(arr);
      })
      .catch(() => setError('Failed to load properties'))
      .finally(() => setFetching(false));
  }, [open]);

  /* Pre-select already assigned */
  useEffect(() => {
    const assigned = (existingAssignments || []).map((a) => a.property?.uuid).filter(Boolean);
    setSelected(assigned);
  }, [existingAssignments, open]);

  const toggle = (uuid) => {
    setSelected((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentAssigned = (existingAssignments || []).map((a) => a.property?.uuid).filter(Boolean);
      const toAdd = selected.filter((id) => !currentAssigned.includes(id));
      const toRemove = currentAssigned.filter((id) => !selected.includes(id));

      const promises = [
        ...toAdd.map((propertyUuid) =>
          StaffPropertyAssignmentService.store({ user_uuid: staffUuid, property_uuid: propertyUuid })
        ),
        ...toRemove.map((propertyUuid) => {
          const assignment = existingAssignments.find((a) => a.property?.uuid === propertyUuid);
          return assignment ? StaffPropertyAssignmentService.destroy(assignment.uuid) : Promise.resolve();
        }),
      ];

      await Promise.all(promises);
      onSaved?.();
      onClose();
    } catch {
      setError('Failed to update assignments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Assign Properties" maxWidth="max-w-md">
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}

        {fetching ? (
          <div className="text-sm text-gray-400 text-center py-6">Loading properties...</div>
        ) : properties.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-6">No properties available.</div>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
            {properties.map((prop) => {
              const checked = selected.includes(prop.uuid);
              return (
                <label
                  key={prop.uuid}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${checked ? 'bg-blue-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(prop.uuid)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{prop.name}</p>
                    <p className="text-xs text-gray-400 truncate">{prop.location?.ward?.name || prop.address_line || '—'}</p>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || fetching}
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {loading ? 'Saving...' : 'Save Assignments'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
