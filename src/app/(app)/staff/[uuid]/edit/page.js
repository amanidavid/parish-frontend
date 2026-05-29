'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StaffService from '@/services/StaffService';
import StaffForm from '@/components/staff/StaffForm';

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="h-9 bg-gray-100 rounded animate-pulse w-1/3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`h-9 bg-gray-100 rounded animate-pulse ${i < 2 ? 'sm:col-span-2' : ''}`} />
        ))}
      </div>
    </div>
  );
}

export default function EditStaffPage() {
  const { uuid } = useParams();
  const router = useRouter();
  const [member, setMember] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uuid) return;

    StaffService.show(uuid)
      .then((data) => {
        if (data?.success && data?.data) {
          setMember(data.data);
        } else {
          setFetchError(data?.message || 'Failed to load staff details');
        }
      })
      .catch(() => setFetchError('Network error'))
      .finally(() => setFetching(false));
  }, [uuid]);

  const handleSubmit = async (form) => {
    setLoading(true);
    setError(null);
    try {
      const data = await StaffService.update(uuid, form);
      if (data?.success) {
        router.push(`/staff/${uuid}`);
        return {};
      }
      setError(data?.message);
      return { errors: data?.errors || {} };
    } catch {
      setError('Network error');
      return {};
    } finally {
      setLoading(false);
    }
  };

  if (!uuid) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">Edit Staff</h1>
          <Link href="/staff" className="btn-secondary text-sm">Back to Staff</Link>
        </div>
        <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">Staff member identifier is missing.</p>
        </div>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-5 bg-gray-100 rounded animate-pulse w-40" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-56 mt-1.5" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <Skeleton />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">Edit Staff</h1>
          <Link href="/staff" className="btn-secondary text-sm">Back to Staff</Link>
        </div>
        <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{fetchError}</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">Edit Staff</h1>
          <Link href="/staff" className="btn-secondary text-sm">Back to Staff</Link>
        </div>
        <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">Staff details could not be resolved for editing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Edit Staff</h1>
          <p className="text-sm text-gray-400 mt-0.5">Update staff member information</p>
        </div>
        <Link href={`/staff/${uuid}`} className="btn-secondary text-sm flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Staff Member
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-6">
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3">
            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <StaffForm
          key={[member.uuid, member.name, member.phone, member.base_user?.username, member.status].join(':')}
          initial={member}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
