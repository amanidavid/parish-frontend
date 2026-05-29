'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AccessControlService from '@/services/AccessControlService';

function formatPermissionAction(name) {
  if (!name) return '';
  const action = name.includes('.') ? name.split('.').slice(1).join('.') : name;
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RolePermissionsModal({ role, onClose, onSaved }) {
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  /* Load all permissions + current role permissions */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      AccessControlService.listPermissions({ perPage: 100 }),
      AccessControlService.getRole(role.id),
    ])
      .then(([permRes, roleRes]) => {
        if (cancelled) return;
        if (permRes?.success) {
          setAllPermissions(permRes.data || []);
        }
        if (roleRes?.success) {
          const ids = new Set((roleRes.data?.permissions || []).map((p) => p.id));
          setSelectedIds(ids);
        }
      })
      .catch(() => setError('Failed to load permissions'))
      .finally(() => setLoading(false));
    return () => { cancelled = true; };
  }, [role.id]);

  const groupedPermissions = useMemo(() => {
    const groups = {};
    for (const p of allPermissions) {
      const mod = p.module || 'General';
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(p);
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allPermissions]);

  const togglePermission = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleModule = useCallback((moduleName) => {
    const modulePerms = groupedPermissions.find(([name]) => name === moduleName)?.[1] || [];
    const moduleIds = new Set(modulePerms.map((p) => p.id));
    setSelectedIds((prev) => {
      const allSelected = modulePerms.every((p) => prev.has(p.id));
      const next = new Set(prev);
      if (allSelected) {
        for (const id of moduleIds) next.delete(id);
      } else {
        for (const id of moduleIds) next.add(id);
      }
      return next;
    });
  }, [groupedPermissions]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await AccessControlService.syncRolePermissions(role.id, Array.from(selectedIds));
      if (res?.success) {
        onSaved?.();
        onClose();
      } else {
        setError(res?.message || 'Failed to update permissions');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groupedPermissions;
    const q = search.toLowerCase();
    return groupedPermissions
      .map(([mod, perms]) => [
        mod,
        perms.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.display_name?.toLowerCase().includes(q) ||
            mod.toLowerCase().includes(q)
        ),
      ])
      .filter(([, perms]) => perms.length > 0);
  }, [groupedPermissions, search]);

  const selectedCount = selectedIds.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Manage Permissions</h3>
            <p className="text-sm text-gray-500">Role: <span className="font-semibold text-gray-700">{role.name}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100 shrink-0">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search permissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{selectedCount} permission{selectedCount !== 1 ? 's' : ''} selected</p>
        </div>

        {/* Permission list */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-100 rounded" />
                  <div className="h-8 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 text-center py-4">{error}</p>
          ) : filteredGroups.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No permissions found</p>
          ) : (
            filteredGroups.map(([module, perms]) => (
              <div key={module}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{module}</h4>
                  <button
                    onClick={() => toggleModule(module)}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                  >
                    Toggle all
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {perms.map((p) => {
                    const checked = selectedIds.has(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${checked ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 bg-white hover:bg-gray-50'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(p.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{formatPermissionAction(p.name)}</p>
                          <p className="text-[11px] text-gray-400 truncate">{p.name}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {saving ? 'Saving...' : `Save (${selectedCount})`}
          </button>
        </div>
      </div>
    </div>
  );
}
