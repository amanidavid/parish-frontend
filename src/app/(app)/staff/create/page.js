'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StaffService from '@/services/StaffService';
import StaffForm from '@/components/staff/StaffForm';
import useUiStore from '@/store/uiStore';

export default function CreateStaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (form) => {
    setLoading(true);
    try {
      const data = await StaffService.store(form);
      if (data?.success) {
        useUiStore.getState().showModal({
          type: 'success',
          message: data?.message || 'Staff created successfully.',
          onRefresh: () => router.push('/staff'),
        });
        return {};
      }
      useUiStore.getState().showModal({
        type: 'error',
        message: data?.message || 'Failed to create staff.',
      });
      return { errors: data?.errors || {} };
    } catch {
      useUiStore.getState().showModal({ type: 'error', message: 'Network error. Please try again.' });
      return {};
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">New Staff</h1>
          <p className="text-sm text-gray-400 mt-0.5">Invite a new staff member to your workspace</p>
        </div>
        <Link href="/staff" className="btn-secondary text-sm flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Staff
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Staff Information</p>

          <StaffForm onSubmit={handleSubmit} loading={loading} submitLabel="Create Staff" />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Quick Tips</p>
          <ul className="space-y-3">
            {[
              { icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', text: 'Staff are workspace-specific. Each staff member gets a unique username and login credentials.' },
              { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', text: 'If you do not set a password, the system will auto-generate a secure temporary password for the staff member.' },
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', text: 'Assign appropriate roles to control what actions each staff member can perform in the workspace.' },
            ].map(({ icon, text }, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
