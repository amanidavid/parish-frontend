'use client';
import { useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import PageProgress from '@/components/ui/PageProgress';
import useUiStore from '@/store/uiStore';
import useAuthStore from '@/store/authStore';
import apiFetch from '@/lib/apiFetch';

export default function AppLayout({ children }) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setPermissions = useAuthStore((s) => s.setPermissions);
  const setRoles = useAuthStore((s) => s.setRoles);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (window.innerWidth < 768) {
      if (useUiStore.getState().sidebarOpen) toggleSidebar();
    }
    const onResize = () => {
      if (window.innerWidth < 768 && useUiStore.getState().sidebarOpen) {
        toggleSidebar();
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* Fetch user permissions on mount */
  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/v1/app/auth/me')
      .then((data) => {
        if (cancelled) return;
        if (data?.success && data.data?.tenant_user) {
          const tu = data.data.tenant_user;
          setPermissions(tu.permissions || []);
          setRoles((tu.roles || []).map((r) => (typeof r === 'string' ? r : r.name)));
          /* Also update user object so avatar/name stay in sync */
          if (tu) {
            setAuth(tu, useAuthStore.getState().token, useAuthStore.getState().tenantUuid);
          }
        }
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [setPermissions, setRoles, setAuth]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f8fafc' }}>
      {/* Mobile backdrop — closes sidebar on tap */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — overlay on mobile, in-flow on desktop */}
      <Sidebar open={sidebarOpen} />

      {/* Global page-transition loader */}
      <PageProgress />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
