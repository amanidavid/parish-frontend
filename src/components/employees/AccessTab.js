'use client';
import { useState } from 'react';
import { useEmployeeAccess, useInviteEmployee } from '@/hooks/useEmployees';
import useUiStore from '@/store/uiStore';

export default function AccessTab({ uuid, canManage }) {
  const { data: accessData, isLoading } = useEmployeeAccess(uuid);
  const access = accessData?.data;
  const inviteEmployee = useInviteEmployee();

  const [inviteEmail, setInviteEmail] = useState('');

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteEmployee.mutate(
      { uuid, email: inviteEmail.trim() },
      {
        onSuccess: () => {
          useUiStore.getState().showModal({ type: 'success', message: 'Invitation sent successfully.' });
          setInviteEmail('');
        },
        onError: (err) => {
          useUiStore.getState().showModal({ type: 'error', message: err?.message || 'Failed to send invitation.' });
        },
      }
    );
  };

  return (
    <div className="space-y-5">
      {canManage && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Send Invitation</p>
          <div className="flex items-center gap-2">
            <input
              type="email"
              className="input text-sm flex-1 max-w-sm"
              placeholder="employee@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <button onClick={handleInvite} disabled={inviteEmployee.isPending} className="btn-primary text-sm">
              {inviteEmployee.isPending ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Access Information</p>
        </div>
        {isLoading ? (
          <p className="px-6 py-4 text-sm text-gray-400">Loading…</p>
        ) : access ? (
          <div className="px-6 py-4 space-y-3 text-sm">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">Roles</p>
              <div className="flex flex-wrap gap-1">
                {(access.role_uuids || []).length === 0 ? (
                  <span className="text-gray-400">No roles assigned</span>
                ) : (
                  access.role_uuids.map((r, i) => <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-primary-50 text-primary-700 text-xs font-medium">{r}</span>)
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">Permissions</p>
              <div className="flex flex-wrap gap-1">
                {(access.permission_uuids || []).length === 0 ? (
                  <span className="text-gray-400">No permissions assigned</span>
                ) : (
                  access.permission_uuids.map((p, i) => <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium">{p}</span>)
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="px-6 py-4 text-sm text-gray-400">No access data available.</p>
        )}
      </div>
    </div>
  );
}
