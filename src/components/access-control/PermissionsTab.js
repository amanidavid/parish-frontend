'use client';
import { useState, useEffect, useMemo } from 'react';
import AccessControlService from '@/services/AccessControlService';

/* Extract action from permission name: 'customers.create' -> 'Create' */
function formatPermissionAction(name) {
  if (!name) return '';
  const action = name.includes('.') ? name.split('.').slice(1).join('.') : name;
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PermissionsTab() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    AccessControlService.listPermissions({ perPage: 100 })
      .then((res) => {
        if (cancelled) return;
        if (res?.success) {
          setPermissions(res.data || []);
        } else {
          setError(res?.message || 'Failed to load permissions');
        }
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const modules = useMemo(() => {
    const set = new Set(permissions.map((p) => p.module).filter(Boolean));
    return Array.from(set).sort();
  }, [permissions]);

  const filtered = useMemo(() => {
    let list = permissions;
    if (moduleFilter) {
      list = list.filter((p) => p.module === moduleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.display_name?.toLowerCase().includes(q) ||
          p.module?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [permissions, moduleFilter, search]);

  const grouped = useMemo(() => {
    const groups = {};
    for (const p of filtered) {
      const mod = p.module || 'General';
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(p);
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="py-2 px-3 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All modules</option>
          {modules.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} permission{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grouped list */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-8 bg-gray-100 rounded" />
              <div className="h-8 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 text-center py-8">{error}</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No permissions found</p>
      ) : (
        <div className="space-y-3">
          {grouped.map(([module, perms]) => (
            <div key={module} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{module}</h4>
              </div>
              <div className="divide-y divide-gray-50">
                {perms.map((p) => (
                  <div key={p.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{formatPermissionAction(p.name)}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{p.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
