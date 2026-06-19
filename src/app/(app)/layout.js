'use client';
import { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import PageProgress from '@/components/ui/PageProgress';
import NotificationModal from '@/components/ui/NotificationModal';
import useUiStore from '@/store/uiStore';
import useAuthStore from '@/store/authStore';
import useServiceStore from '@/store/serviceStore';

function ProvisioningScreen({ status }) {
  const isFailed = status === 'failed';
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="text-center max-w-sm px-6">
        {isFailed ? (
          <>
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-900">Workspace setup failed</p>
            <p className="text-sm text-gray-500 mt-2">Please contact support to resolve this issue.</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-5">
              <svg className="animate-spin w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-900">Setting up your workspace</p>
            <p className="text-sm text-gray-500 mt-2">This usually takes a few seconds. Please wait&hellip;</p>
          </>
        )}
      </div>
    </div>
  );
}

/* Static demo services for testing multi-service UI before backend is ready */
const DEMO_SERVICES = [
  { id: 'properties', label: 'Property Management', active: true },
  /* { id: 'lodge', label: 'Lodge Management', active: true }, */
  /* { id: 'restaurant', label: 'Restaurant POS', active: true }, */
];

export default function AppLayout({ children }) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const [provisioningStatus, setProvisioningStatus] = useState(null);
  const pollRef = useRef(null);

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

  /* Fetch user permissions on mount, handle provisioning-pending gracefully */
  useEffect(() => {
    let cancelled = false;

    const loadMe = async () => {
      const res = await fetch('/api/v1/app/auth/me', { cache: 'no-store' });
      if (cancelled) return;

      if (res.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return;
      }

      if (res.status === 503) {
        const body = await res.json().catch(() => ({}));
        const status = body?.errors?.provisioning_status || 'pending';
        setProvisioningStatus(status);
        if (status !== 'failed') {
          pollRef.current = setTimeout(loadMe, 3000);
        }
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (data?.success && data.data?.tenant_user) {
        const tu = data.data.tenant_user;
        /* Use backend services if available; otherwise fall back to DEMO_SERVICES for testing */
        const userServices = data.data.services?.length > 0 ? data.data.services : DEMO_SERVICES;
        /* Demo: toggle between 'full' and 'limited' to test both views */
        const DEMO_SCOPE = 'full'; // change to 'limited' to test restricted view
        const DEMO_ASSIGNMENTS = DEMO_SCOPE === 'limited'
          ? { properties: ['prop-001', 'prop-002'] } // assigned to 2 properties only
          : {};
        /* For limited users, filter services to only those in assignments */
        const scopedServices = DEMO_SCOPE === 'limited'
          ? userServices.filter((s) => Object.keys(DEMO_ASSIGNMENTS).includes(s.id))
          : userServices;
        setProvisioningStatus(null);
        useAuthStore.getState().setPermissions(tu.permissions || []);
        useAuthStore.getState().setRoles((tu.roles || []).map((r) => (typeof r === 'string' ? r : r.name)));
        useAuthStore.getState().setAuth(tu, useAuthStore.getState().tenantUuid, scopedServices, DEMO_SCOPE, DEMO_ASSIGNMENTS);
        useAuthStore.getState().setServices(scopedServices);
        if (scopedServices?.length > 0) {
          useServiceStore.getState().setActiveService(scopedServices[0].id);
        }
      }
    };

    loadMe();
    return () => {
      cancelled = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  if (provisioningStatus) {
    return <ProvisioningScreen status={provisioningStatus} />;
  }

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

      {/* Global notification modal */}
      <NotificationModal />

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
