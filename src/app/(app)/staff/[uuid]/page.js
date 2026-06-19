'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StaffService from '@/services/StaffService';
import useCan from '@/hooks/useCan';
import useUiStore from '@/store/uiStore';
import StaffPropertyAssignmentModal from '@/components/staff/StaffPropertyAssignmentModal';
import StaffPropertyAssignmentService from '@/services/StaffPropertyAssignmentService';

export default function StaffDetailPage() {
  const { uuid } = useParams();
  const router = useRouter();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
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

  /* Load staff property assignments */
  useEffect(() => {
    if (!uuid) return;
    setAssignmentsLoading(true);
    StaffPropertyAssignmentService.index({ user_uuid: uuid, per_page: 100 })
      .then((res) => {
        if (res?.success) {
          setAssignments(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        }
      })
      .catch(() => { })
      .finally(() => setAssignmentsLoading(false));
  }, [uuid]);

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
        <button onClick={() => router.back()} className="btn-secondary">Back</button>
      </div>
    );
  }

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
        <button onClick={() => router.back()} className="btn-secondary text-sm flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Assigned Properties */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Assigned Properties</p>
          {canManage && (
            <button
              onClick={() => setAssignModalOpen(true)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            >
              + Manage Properties
            </button>
          )}
        </div>
        {assignmentsLoading ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">Loading...</div>
        ) : assignments.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-400">No properties assigned.</p>
            {canManage && (
              <button
                onClick={() => setAssignModalOpen(true)}
                className="mt-2 text-xs font-medium text-blue-600 hover:underline"
              >
                Assign properties now
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {assignments.map((a) => (
              <div key={a.uuid} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <Link href={`/properties/${a.property?.uuid}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                      {a.property?.name || '—'}
                    </Link>
                    <p className="text-xs text-gray-400">Assigned {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
                {canManage && (
                  <button
                    onClick={() => setAssignModalOpen(true)}
                    className="text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                  >
                    Manage
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <StaffPropertyAssignmentModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        staffUuid={uuid}
        existingAssignments={assignments}
        onSaved={() => {
          setAssignmentsLoading(true);
          StaffPropertyAssignmentService.index({ user_uuid: uuid, per_page: 100 })
            .then((res) => {
              if (res?.success) {
                setAssignments(Array.isArray(res.data) ? res.data : (res.data?.data || []));
              }
            })
            .finally(() => setAssignmentsLoading(false));
        }}
      />
    </div>
  );
}
