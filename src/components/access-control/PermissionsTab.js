'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import AccessControlService from '@/services/AccessControlService';
import Pagination from '@/components/ui/Pagination';

/* Extract action from permission name: 'customers.create' -> 'Create' */
function formatPermissionAction(name) {
  if (!name) return '';
  const action = name.includes('.') ? name.split('.').slice(1).join('.') : name;
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function SkeletonRow() {
  return (
    <tr>
      <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse w-8" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse w-24" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse w-20" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse w-32" /></td>
    </tr>
  );
}

export default function PermissionsTab() {
  const [permissions, setPermissions] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* All modules for dropdown (fetched once) */
  const [allModules, setAllModules] = useState([]);

  /* Debounced search states */
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [moduleInput, setModuleInput] = useState('');
  const [appliedModule, setAppliedModule] = useState('');
  const [moduleOpen, setModuleOpen] = useState(false);
  const [page, setPage] = useState(1);

  const PER_PAGE = 15;

  const searchTimerRef = useRef(null);
  const moduleTimerRef = useRef(null);
  const moduleWrapRef = useRef(null);

  const DEBOUNCE_MS = 250;

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setAppliedSearch(val.trim());
    }, DEBOUNCE_MS);
  }, []);

  const handleModuleInputChange = useCallback((e) => {
    const val = e.target.value;
    setModuleInput(val);
    setModuleOpen(true);
    if (moduleTimerRef.current) clearTimeout(moduleTimerRef.current);
    moduleTimerRef.current = setTimeout(() => {
      setAppliedModule(val.trim().toLowerCase());
    }, DEBOUNCE_MS);
  }, []);

  const selectModule = useCallback((mod) => {
    setModuleInput(mod);
    setAppliedModule(mod.toLowerCase());
    setModuleOpen(false);
  }, []);

  const handleClear = useCallback(() => {
    setSearchInput('');
    setAppliedSearch('');
    setModuleInput('');
    setAppliedModule('');
    setModuleOpen(false);
    setPage(1);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (moduleWrapRef.current && !moduleWrapRef.current.contains(e.target)) {
        setModuleOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('mousedown', onClick);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (moduleTimerRef.current) clearTimeout(moduleTimerRef.current);
    };
  }, []);

  /* Fetch all unique modules once for the dropdown */
  useEffect(() => {
    let cancelled = false;
    AccessControlService.listPermissions({ perPage: 100 })
      .then((res) => {
        if (cancelled) return;
        if (res?.success) {
          const mods = [...new Set((res.data || []).map((p) => p.module).filter(Boolean))].sort();
          setAllModules(mods);
        }
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, []);

  /* Server-side paginated fetch */
  const fetchPermissions = useCallback(() => {
    setLoading(true);
    setError(null);
    AccessControlService.listPermissions({
      page,
      perPage: PER_PAGE,
      search: appliedSearch || undefined,
      module: appliedModule || undefined,
    })
      .then((res) => {
        if (res?.success) {
          setPermissions(res.data || []);
          setMeta(res.meta || null);
        } else {
          setError(res?.message || 'Failed to load permissions');
          setPermissions([]);
          setMeta(null);
        }
      })
      .catch(() => {
        setError('Network error');
        setPermissions([]);
        setMeta(null);
      })
      .finally(() => setLoading(false));
  }, [page, appliedSearch, appliedModule]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const dropdownModules = useMemo(() => {
    if (!moduleInput.trim()) return allModules;
    const q = moduleInput.toLowerCase();
    return allModules.filter((m) => m.toLowerCase().includes(q));
  }, [allModules, moduleInput]);

  /* Reset to page 1 when filters change */
  useEffect(() => {
    setPage(1);
  }, [appliedSearch, appliedModule]);

  const hasActiveFilters = appliedSearch || appliedModule;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Search permissions..."
            value={searchInput}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary-500 focus:outline-none transition-colors"
          />
        </div>
        <div ref={moduleWrapRef} className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
          <input
            type="text"
            placeholder="Filter by module..."
            value={moduleInput}
            onChange={handleModuleInputChange}
            onFocus={() => setModuleOpen(true)}
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary-500 focus:outline-none transition-colors"
          />
          <button
            type="button"
            onClick={() => setModuleOpen((o) => !o)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className={`w-4 h-4 transition-transform ${moduleOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {moduleOpen && (
            <div className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-52 overflow-y-auto">
              {dropdownModules.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400">No modules found</div>
              ) : (
                dropdownModules.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => selectModule(m)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${appliedModule === m.toLowerCase() ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {m}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            Clear
          </button>
        )}
        <span className="text-xs text-gray-500 ml-auto">{meta?.total ?? 0} permission{(meta?.total ?? 0) !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Module</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Permission Name</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-red-600 text-sm">{error}</td>
                </tr>
              ) : permissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400 text-sm">
                    {hasActiveFilters ? 'No permissions match your filters' : 'No permissions found'}
                  </td>
                </tr>
              ) : (
                permissions.map((p, idx) => (
                  <tr key={p.id || p.name} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs tabular-nums">{(meta?.current_page ? (meta.current_page - 1) * PER_PAGE : 0) + idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px] font-semibold">
                        {p.module || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium text-sm">{formatPermissionAction(p.name)}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-[11px]">{p.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.last_page > 1 && (
          <Pagination meta={meta} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
