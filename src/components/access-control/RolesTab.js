'use client';
import { useState, useEffect, useCallback } from 'react';
import AccessControlService from '@/services/AccessControlService';
import RolePermissionsModal from './RolePermissionsModal';

/* Toast Banner */
function Toast({ message, type, onClose }) {
  if (!message) return null;
  const bg = type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200';
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm flex items-center justify-between ${bg}`}>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

/* Delete Role Modal */
function DeleteRoleModal({ role, onClose, onDeleted, onShowToast }) {
  const [deleting, setDeleting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const handleConfirm = async () => {
    setDeleting(true);
    setModalError(null);
    try {
      const res = await AccessControlService.deleteRole(role.id);
      if (res?.success) {
        onShowToast?.(res?.message || 'Role deleted successfully.', 'success');
        onDeleted?.();
        onClose();
      } else {
        setModalError(res?.message || 'Failed to delete role');
      }
    } catch {
      setModalError('Network error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Delete Role</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {modalError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{modalError}</p>}
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <span className="font-semibold text-gray-900">{role.name}</span>? This cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={onClose} disabled={deleting} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50">Cancel</button>
            <button onClick={handleConfirm} disabled={deleting} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 transition-colors">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Create Role Modal */
function CreateRoleModal({ onClose, onCreated, onShowToast }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);
    try {
      const res = await AccessControlService.createRole(name.trim());
      if (res?.success) {
        onShowToast?.(res?.message || 'Role created successfully.', 'success');
        onCreated?.();
        onClose();
      } else {
        setModalError(res?.message || 'Failed to create role');
      }
    } catch {
      setModalError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">New Role</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {modalError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{modalError}</p>}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Role Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. property_manager"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
            <p className="text-[11px] text-gray-400 mt-1">Lowercase letters, numbers, and underscores only.</p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
              {saving ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RolesTab() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingRole, setDeletingRole] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AccessControlService.listRoles({ perPage: 50 });
      if (res?.success) {
        setRoles(res.data || []);
      } else {
        setError(res?.message || 'Failed to load roles');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const filtered = roles.filter((r) => r.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Search roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Role
        </button>
        <span className="text-xs text-gray-500">{filtered.length} role{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Name</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Permissions</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                  <td className="px-4 py-3 text-center"><div className="h-4 w-8 bg-gray-100 rounded mx-auto" /></td>
                  <td className="px-4 py-3 text-right"><div className="h-4 w-12 bg-gray-100 rounded ml-auto" /></td>
                </tr>
              ))
            ) : error ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-red-600 text-sm">{error}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">No roles found</td></tr>
            ) : (
              filtered.map((role) => (
                <tr key={role.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </span>
                      <span className="font-medium text-gray-900">{role.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {role.permissions_count ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-3">
                      <button
                        onClick={() => setActiveRole(role)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Manage
                      </button>
                      <button
                        onClick={() => setDeletingRole(role)}
                        className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
                        title="Delete role"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {activeRole && (
        <RolePermissionsModal
          role={activeRole}
          onClose={() => setActiveRole(null)}
          onSaved={fetchRoles}
        />
      )}

      {showCreate && (
        <CreateRoleModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchRoles}
          onShowToast={showToast}
        />
      )}

      {deletingRole && (
        <DeleteRoleModal
          role={deletingRole}
          onClose={() => setDeletingRole(null)}
          onDeleted={fetchRoles}
          onShowToast={showToast}
        />
      )}
    </div>
  );
}
