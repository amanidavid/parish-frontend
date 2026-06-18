'use client';
import useAuthStore from '@/store/authStore';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {user?.name
              ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
              : 'U'}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{user?.name || 'User'}</p>
            <p className="text-sm text-gray-500">{user?.email || 'No email'}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</label>
            <p className="mt-1 text-sm text-gray-900">{user?.phone || '—'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email</label>
            <p className="mt-1 text-sm text-gray-900">{user?.email || '—'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">User ID</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{user?.user_uuid || user?.uuid || '—'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Role</label>
            <p className="mt-1 text-sm text-gray-900">{user?.role || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
