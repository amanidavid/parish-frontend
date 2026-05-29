'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import StaffPropertyAssignmentService from '@/services/StaffPropertyAssignmentService';
import PropertyService from '@/services/PropertyService';
import StaffService from '@/services/StaffService';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/ui/ConfirmModal';
import useCan from '@/hooks/useCan';

const PER_PAGE = 15;

/* Async search-select combobox with debounced server-side search */
function AsyncSearchSelect({ label, value, onChange, fetchOptions, placeholder, displayKey = 'name', subKey }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const selected = options.find((o) => o.uuid === value);
  const debounceRef = useRef(null);

  /* Initial fetch on open */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetchOptions('').then((data) => {
      if (!cancelled) setOptions(data);
    }).catch(() => { }).finally(() => setLoading(false));
    return () => { cancelled = true; };
  }, [open, fetchOptions]);

  /* Debounced search */
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      fetchOptions(search).then((data) => {
        setOptions(data);
      }).catch(() => { }).finally(() => setLoading(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, open, fetchOptions]);

  useEffect(() => {
    function onDocClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-left hover:border-gray-300 transition-colors"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? (subKey ? `${selected[displayKey]} — ${selected[subKey]}` : selected[displayKey]) : placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl max-h-60 overflow-y-auto">
          <div className="sticky top-0 bg-white px-3 py-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:border-blue-500 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {loading ? (
            <div className="p-3 text-sm text-gray-400 text-center">Loading...</div>
          ) : options.length === 0 ? (
            <div className="p-3 text-sm text-gray-400 text-center">No results</div>
          ) : (
            options.map((o) => (
              <button
                key={o.uuid}
                type="button"
                onClick={() => { onChange(o.uuid); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${o.uuid === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
              >
                {subKey ? `${o[displayKey]} — ${o[subKey]}` : o[displayKey]}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* Assignment form modal (create + edit) */
function AssignmentModal({ assignment, onClose, onSaved }) {
  const isEdit = !!assignment;
  const [userUuid, setUserUuid] = useState(assignment?.user?.uuid || '');
  const [propertyUuid, setPropertyUuid] = useState(assignment?.property?.uuid || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchStaff = useCallback(async (query) => {
    const res = await StaffService.list({ search: query || undefined, perPage: 15 });
    const arr = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
    return arr.map((u) => ({ uuid: u.uuid, name: u.name, email: u.email }));
  }, []);

  const fetchProperties = useCallback(async (query) => {
    const res = await PropertyService.index({ search: query || undefined, per_page: 15 });
    /* Backend may return paginated {data:[],...} or array directly */
    const arr = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
    return arr.map((p) => ({ uuid: p.uuid, name: p.name }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userUuid || !propertyUuid) { setError('Please select both staff and property'); return; }
    setSaving(true);
    setError(null);
    try {
      const res = isEdit
        ? await StaffPropertyAssignmentService.update(assignment.uuid, { user_uuid: userUuid, property_uuid: propertyUuid })
        : await StaffPropertyAssignmentService.store({ user_uuid: userUuid, property_uuid: propertyUuid });
      if (res?.success) { onSaved?.(); onClose(); }
      else { setError(res?.message || 'Failed to save'); }
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Assignment' : 'Assign Staff to Property'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AsyncSearchSelect label="Staff" value={userUuid} onChange={setUserUuid} fetchOptions={fetchStaff} placeholder="Select staff..." displayKey="name" subKey="email" />
          <AsyncSearchSelect label="Property" value={propertyUuid} onChange={setPropertyUuid} fetchOptions={fetchProperties} placeholder="Select property..." displayKey="name" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">{saving ? 'Saving...' : (isEdit ? 'Update' : 'Assign')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Skeleton row */
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-5 py-3.5"><div className="h-4 bg-gray-100 rounded" style={{ width: `${80 - i * 10}%` }} /></td>
      ))}
    </tr>
  );
}

export default function StaffAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);
  const searchRef = useRef(null);

  const canCreate = useCan('staff_property_assignments.create');
  const canEdit = useCan('staff_property_assignments.update');
  const canDelete = useCan('staff_property_assignments.delete');

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await StaffPropertyAssignmentService.index({
        search: appliedSearch || undefined,
        page,
        per_page: PER_PAGE,
        sort: '-created_at',
      });
      if (res?.success) {
        setAssignments(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        setMeta(res.meta || null);
      } else {
        setError(res?.message || 'Failed to load assignments');
      }
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [appliedSearch, page]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); setAppliedSearch(search.trim()); };
  const handleClear = () => { setSearch(''); setAppliedSearch(''); setPage(1); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await StaffPropertyAssignmentService.destroy(deleteTarget.uuid);
      if (res?.success) { setDeleteTarget(null); fetchAssignments(); }
      else { setError(res?.message); setDeleteTarget(null); }
    } catch { setError('Network error'); setDeleteTarget(null); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Staff Assignments</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage staff-to-property assignments</p>
        </div>
        {canCreate && (
          <button onClick={() => { setEditAssignment(null); setModalOpen(true); }} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm hover:shadow transition-all" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            New Assignment
          </button>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input ref={searchRef} type="text" placeholder="Search staff or property..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:outline-none" />
          {search && <button type="button" onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
        </div>
        <button type="submit" className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Search</button>
      </form>

      {error && (
        <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-300 hover:text-red-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <p className="text-sm text-gray-500 font-medium">No assignments found</p>
                    <p className="text-xs text-gray-400 mt-1">{appliedSearch ? 'No results match your search.' : 'Assign staff to a property to get started.'}</p>
                    {appliedSearch && <button onClick={handleClear} className="mt-3 text-xs text-blue-600 hover:underline">Clear search</button>}
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <tr key={a.uuid} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">{a.user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                        <div>
                          <p className="font-medium text-gray-900">{a.user?.name || '—'}</p>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${a.user?.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{a.user?.status || '—'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {a.user?.email && <p>{a.user.email}</p>}
                      {a.user?.phone && <p className="mt-0.5">{a.user.phone}</p>}
                      {!a.user?.email && !a.user?.phone && <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/properties/${a.property?.uuid}`} className="font-medium text-gray-900 hover:text-blue-600 transition-colors">{a.property?.name || '—'}</Link>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && <button onClick={() => { setEditAssignment(a); setModalOpen(true); }} className="h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">Edit</button>}
                        {canDelete && <button onClick={() => setDeleteTarget(a)} className="h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.total > PER_PAGE && (
          <div className="border-t border-gray-100"><Pagination meta={meta} onPageChange={setPage} /></div>
        )}
      </div>

      {/* Modals */}
      {modalOpen && (
        <AssignmentModal assignment={editAssignment} onClose={() => setModalOpen(false)} onSaved={fetchAssignments} />
      )}
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} title="Delete Assignment" message={`Remove assignment for "${deleteTarget?.user?.name}" from "${deleteTarget?.property?.name}"?`} confirmLabel="Delete Assignment" />
    </div>
  );
}
