'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import StaffService from '@/services/StaffService';
import AccessControlService from '@/services/AccessControlService';

function formatPermissionAction(name) {
  if (!name) return '';
  const action = name.includes('.') ? name.split('.').slice(1).join('.') : name;
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function DirectPermissionsModal({ user, onClose, onSaved }) {
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      AccessControlService.listPermissions({ perPage: 100 }),
      StaffService.show(user.uuid),
    ])
      .then(([permRes, userRes]) => {
        if (cancelled) return;
        if (permRes?.success) setAllPermissions(permRes.data || []);
        if (userRes?.success) {
          const ids = new Set((userRes.data?.direct_permissions || []).map((p) => p.id));
          setSelectedIds(ids);
        }
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
    return () => { cancelled = true; };
  }, [user.uuid]);

  const grouped = useMemo(() => {
    const groups = {};
    for (const p of allPermissions) {
      const mod = p.module || 'General';
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(p);
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allPermissions]);

  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    return grouped
      .map(([mod, perms]) => [mod, perms.filter((p) => p.name?.toLowerCase().includes(q) || p.display_name?.toLowerCase().includes(q))])
      .filter(([, perms]) => perms.length > 0);
  }, [grouped, search]);

  const toggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleModule = useCallback((moduleName) => {
    const modulePerms = grouped.find(([name]) => name === moduleName)?.[1] || [];
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
  }, [grouped]);

  const selectedCount = selectedIds.size;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await AccessControlService.syncUserDirectPermissions(user.uuid, Array.from(selectedIds));
      if (res?.success) {
        onSaved?.();
        onClose();
      } else {
        setError(res?.message || 'Failed to update');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Direct Permissions</h3>
            <p className="text-sm text-gray-500">User: <span className="font-semibold text-gray-700">{user.name}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-3 border-b border-gray-100 shrink-0">
          <input
            type="text" placeholder="Search permissions..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">{selectedCount} permission{selectedCount !== 1 ? 's' : ''} selected</p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 rounded" />)}
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 text-center py-4">{error}</p>
          ) : (
            filtered.map(([mod, perms]) => (
              <div key={mod}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{mod}</h4>
                  <button onClick={() => toggleModule(mod)} className="text-[11px] font-medium text-blue-600 hover:text-blue-700">Toggle all</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {perms.map((p) => (
                    <label key={p.id} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer ${selectedIds.has(p.id) ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggle(p.id)} className="w-4 h-4 rounded border-gray-300 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{formatPermissionAction(p.name)}</p>
                        <p className="text-[11px] text-gray-400 truncate">{p.name}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">{saving ? 'Saving...' : `Save (${selectedCount})`}</button>
        </div>
      </div>
    </div>
  );
}

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeUser, setActiveUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await StaffService.list({ perPage: 50 });
      if (res?.success) {
        setUsers(res.data || []);
      } else {
        setError(res?.message || 'Failed to load users');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => u.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Roles</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 w-28 bg-gray-100 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-12 bg-gray-100 rounded" /></td>
                  <td className="px-4 py-3 text-right"><div className="h-4 w-12 bg-gray-100 rounded ml-auto" /></td>
                </tr>
              ))
            ) : error ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-red-600 text-sm">{error}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No users found</td></tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.uuid} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-[11px] text-gray-400">{u.email || u.phone || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(u.roles || []).slice(0, 2).map((r, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700">{typeof r === 'string' ? r : r.name}</span>
                      ))}
                      {(u.roles || []).length > 2 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">+{(u.roles || []).length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setActiveUser(u)} className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">Permissions</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {activeUser && (
        <DirectPermissionsModal user={activeUser} onClose={() => setActiveUser(null)} onSaved={fetchUsers} />
      )}
    </div>
  );
}
