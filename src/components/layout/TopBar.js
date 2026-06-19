'use client';
import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useServiceStore from '@/store/serviceStore';
import useUiStore from '@/store/uiStore';
import { SERVICE_REGISTRY } from '@/modules/services/serviceRegistry';
import ChangePasswordModal from '@/components/auth/ChangePasswordModal';

/** Icon button used in the topbar action row */
function IconButton({ onClick, badge, title, children }) {
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
}

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

const GLOBAL_ROUTES = ['/staff', '/subscription', '/access-control'];

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const services = useAuthStore((s) => s.services);
  const activeService = useServiceStore((s) => s.activeService);
  const setActiveService = useServiceStore((s) => s.setActiveService);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const isGlobalPage = GLOBAL_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
    clearAuth();
    router.push('/login');
  }, [clearAuth, router]);

  const handleViewProfileClick = useCallback(() => {
    setUserMenuOpen(false);
    router.push('/profile');
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

      {/* Service Switcher */}
      {!isGlobalPage && services?.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setServiceMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {activeService && SERVICE_REGISTRY[activeService] ? (
              <>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: SERVICE_REGISTRY[activeService].color }}
                />
                <span>{SERVICE_REGISTRY[activeService].shortLabel}</span>
              </>
            ) : (
              <span className="text-gray-400">Select service</span>
            )}
            <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {serviceMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setServiceMenuOpen(false)} />
              <div className="absolute left-0 top-10 w-60 bg-white rounded-lg border border-gray-200 shadow-xl z-30 py-1">
                {services.map((svc) => {
                  const config = SERVICE_REGISTRY[svc.id];
                  if (!config) return null;
                  return (
                    <button
                      key={svc.id}
                      onClick={() => {
                        setActiveService(svc.id);
                        setServiceMenuOpen(false);
                        router.push(config.baseRoute);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors ${activeService === svc.id ? 'bg-gray-50 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                      <span className="whitespace-nowrap">{config.label}</span>
                      {activeService === svc.id && (
                        <svg className="w-3.5 h-3.5 ml-auto text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
                {/* Onboarding hidden for live release — re-enable when multi-service API is ready */
                /*
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => {
                    setServiceMenuOpen(false);
                    router.push('/onboarding');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Service
                </button>
                */}
              </div>
            </>
          )}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg pl-1 pr-3 py-1.5 hover:bg-gray-50 transition-colors"
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
              <div className="absolute right-0 top-12 w-56 bg-white rounded-lg border border-gray-200 shadow-xl z-30 overflow-hidden">
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
                    onClick={handleViewProfileClick}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    View Profile
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
      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </header>
  );
}
