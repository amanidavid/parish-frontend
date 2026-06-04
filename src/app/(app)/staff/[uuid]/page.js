'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StaffService from '@/services/StaffService';
import ConfirmModal from '@/components/ui/ConfirmModal';
import useCan from '@/hooks/useCan';
import useUiStore from '@/store/uiStore';

const STAFF_STATUS = {
  active: { label: 'Active', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  suspended: { label: 'Suspended', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
};

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

export default function StaffDetailPage() {
  const { uuid } = useParams();
  const router = useRouter();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const canManage = useCan('staff.manage');

  useEffect(() => {
    StaffService.show(uuid)
      .then((data) => {
        console.log('Staff show response:', data);
        if (data?.success && data?.data) {
          setMember(data.data);
        } else {
          useUiStore.getState().showModal({ type: 'error', message: data?.message || 'Failed to load staff details' });
        }
      })
      .catch(() => useUiStore.getState().showModal({ type: 'error', message: 'Network error. Please try again.' }))
      .finally(() => setLoading(false));
  }, [uuid]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const data = await StaffService.destroy(uuid);
      if (data?.success !== false) {
        useUiStore.getState().showModal({
          type: 'success',
          message: data?.message || 'Staff deleted successfully.',
          onRefresh: () => router.push('/staff'),
        });
      } else {
        useUiStore.getState().showModal({ type: 'error', message: data?.message || 'Failed to delete staff.' });
      }
    } catch {
      useUiStore.getState().showModal({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-5 bg-gray-100 rounded animate-pulse w-32" />
        <div className="h-32 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="space-y-5">
        <Link href="/staff" className="btn-secondary">Back to Staff</Link>
      </div>
    );
  }

  const status = STAFF_STATUS[member?.status] || STAFF_STATUS.suspended;
  const roles = member?.roles || [];

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/staff" className="hover:text-gray-800 transition-colors">Staff</Link>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium truncate max-w-xs">{member?.name}</span>
        </nav>
        <Link href="/staff" className="btn-secondary text-sm flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Staff
        </Link>
      </div>

      {/* Summary card */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center shrink-0 text-base font-semibold text-primary-600 uppercase">
              {member?.name?.charAt(0) || '?'}
            </span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-gray-900">{cap(member?.name)}</h1>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-mono">@{member?.base_user?.username || '—'}</p>
            </div>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <Link href={`/staff/${uuid}/edit`} className="btn-secondary text-sm">Edit</Link>
              <button onClick={() => setDeleteOpen(true)} className="btn-danger text-sm">Delete</button>
            </div>
          )}
        </div>
        <div className="border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
          {[
            { label: 'Email', value: member?.email },
            { label: 'Phone', value: member?.phone },
            { label: 'Roles', value: roles.length },
            { label: 'Created', value: member?.created_at ? new Date(member.created_at).toLocaleDateString('en-GB') : '—' },
          ].map(({ label, value, large }) => (
            <div key={label} className="px-6 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
              <p className={`font-medium text-gray-800 ${large ? 'text-lg' : 'text-sm'} truncate`}>
                {value !== undefined && value !== null ? value : <span className="text-gray-300">—</span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Overview */}
      {/* <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Staff Details</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          {[
            { label: 'Full Name', value: member?.name },
            { label: 'Username', value: member?.base_user?.username },
            { label: 'Status', value: cap(member?.status) },
            { label: 'Email', value: member?.email },
            { label: 'Phone', value: member?.phone },
            { label: 'Base User ID', value: member?.base_user?.uuid },
          ].map(({ label, value }) => (
            <div key={label} className="px-6 py-4">
              <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
              <p className="text-sm font-medium text-gray-800">{value || <span className="text-gray-300">—</span>}</p>
            </div>
          ))}
        </div>
      </div> */}
      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Staff"
        message={`Delete "${member?.name}"? This will remove them from the workspace. Owner accounts cannot be deleted.`}
        confirmLabel="Delete Staff"
      />
    </div>
  );
}
