'use client';
import { useState, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import useUiStore from '@/store/uiStore';

/** Icon button used in the topbar action row */
const IconButton = memo(function IconButton({ onClick, badge, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
    >
      {children}
      {badge > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
});

/** User initials avatar */
function Avatar({ name }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';
  return (
    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
      {initials}
    </div>
  );
}

export default function TopBar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [addNewOpen, setAddNewOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const permissions = useAuthStore((s) => s.permissions);

  const quickActions = [
    { href: '/properties/create', label: 'Property', permission: 'properties.create', color: '#2563eb', bg: '#eff6ff', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { href: '/customers/create', label: 'Customer', permission: 'customers.create', color: '#7c3aed', bg: '#f5f3ff', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { href: '/staff/create', label: 'Staff', permission: 'staff.manage', color: '#059669', bg: '#ecfdf5', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { href: '/staff-property-assignments', label: 'Assignment', permission: 'staff_property_assignments.create', color: '#ea580c', bg: '#fff7ed', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  ].filter((item) => permissions.some((p) => p.name === item.permission));

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
    clearAuth();
    router.push('/login');
  }, [clearAuth, router]);

  const handleSettingsClick = useCallback(() => {
    setUserMenuOpen(false);
    router.push('/settings');
  }, [router]);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-4 shrink-0 z-10">

      {/* Sidebar toggle — circle button like reference */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white hover:bg-primary-700 transition-colors shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
            d={sidebarOpen ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
        </svg>
      </button>

      {/* Search bar */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search properties, customers..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:bg-white transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded">⌘</kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded">K</kbd>
          </span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <IconButton title="Notifications" badge={0}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </IconButton>

        <IconButton title="Settings" onClick={handleSettingsClick}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </IconButton>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Add New dropdown */}
        {quickActions.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setAddNewOpen((v) => !v)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm hover:shadow transition-all shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New</span>
              <svg className="w-3 h-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {addNewOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setAddNewOpen(false)} />
                <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl border border-gray-200 shadow-2xl z-30 p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Quick Create</p>
                  <div className="grid grid-cols-3 gap-2">
                    {quickActions.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setAddNewOpen(false)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                      >
                        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.bg }}>
                          <svg className="w-5 h-5" style={{ color: item.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                          </svg>
                        </span>
                        <span className="text-[11px] font-medium text-gray-600 group-hover:text-gray-900 text-center leading-tight">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-xl pl-1 pr-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            <Avatar name={user?.name} />
            <div className="hidden md:block text-left">
              <p className="text-[13px] font-semibold text-gray-900 leading-tight">{user?.name || 'User'}</p>
              <p className="text-[11px] text-gray-400 leading-tight">{user?.phone || 'Workspace'}</p>
            </div>
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-12 w-56 bg-white rounded-xl border border-gray-200 shadow-xl z-30 overflow-hidden">
                {/* User info */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 bg-gray-50">
                  <Avatar name={user?.name} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.phone || user?.email || ''}</p>
                  </div>
                </div>
                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={handleSettingsClick}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </button>
                  <button
                    onClick={handleSettingsClick}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                </div>
                <div className="border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {loggingOut ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
