'use client';
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PropertyService from '@/services/PropertyService';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  PROPERTY_TABS,
  DEFAULT_TAB,
  sanitizeTab,
  FloorsTab,
  ContractsTab,
  CustomersTab,
  MaintenanceTab,
  ReportsTab,
} from '@/modules/properties/propertiesModule';
import useUiStore from '@/store/uiStore';
import useCan from '@/hooks/useCan';

/* -- Memoized presentational components ------------------------------- */

/* CSS-only donut chart */
const OccupancyPie = memo(function OccupancyPie({ occupied, total }) {
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const deg = (pct / 100) * 360;
  const bg = `conic-gradient(#3b82f6 0deg ${deg}deg, #e5e7eb ${deg}deg 360deg)`;
  const vacant = Math.max(0, total - occupied);
  return (
    <div className="flex items-center gap-8">
      <div className="relative w-32 h-32 rounded-full" style={{ background: bg }}>
        <div className="absolute inset-5 bg-white rounded-full" />
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-gray-600">Occupied</span>
          <span className="font-semibold text-gray-900 ml-auto tabular-nums">{occupied}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
          <span className="text-gray-600">Vacant</span>
          <span className="font-semibold text-gray-900 ml-auto tabular-nums">{vacant}</span>
        </div>
      </div>
    </div>
  );
});

const StatCard = memo(function StatCard({ icon, value, label, subtitle, bg, iconColor }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
  );
});

const ContractStatusList = memo(function ContractStatusList({ activeContracts = 0 }) {
  const statuses = [
    { label: 'Draft', color: 'bg-gray-400', hex: '#9ca3af', count: 0 },
    { label: 'Active', color: 'bg-green-500', hex: '#22c55e', count: activeContracts },
    { label: 'Expired', color: 'bg-amber-500', hex: '#f59e0b', count: 0 },
    { label: 'Terminated', color: 'bg-red-500', hex: '#ef4444', count: 0 },
    { label: 'Renewed', color: 'bg-purple-500', hex: '#a855f7', count: 0 },
    { label: 'Pending', color: 'bg-cyan-500', hex: '#06b6d4', count: 0 },
  ];
  const total = statuses.reduce((sum, s) => sum + s.count, 0);
  const hasData = total > 0;

  let currentDeg = 0;
  const gradient = hasData
    ? statuses
      .filter((s) => s.count > 0)
      .map((s) => {
        const deg = (s.count / total) * 360;
        const seg = `${s.hex} ${currentDeg}deg ${currentDeg + deg}deg`;
        currentDeg += deg;
        return seg;
      })
      .join(', ')
    : '#e5e7eb 0deg 360deg';
  const bg = `conic-gradient(${gradient})`;

  return (
    <div className="flex items-center gap-8">
      <div className="relative w-32 h-32 rounded-full shrink-0" style={{ background: bg }}>
        <div className="absolute inset-5 bg-white rounded-full flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900">{total}</span>
        </div>
      </div>
      <div className="flex-1 space-y-2.5 min-w-0">
        {statuses.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
            <span className="text-sm text-gray-600">{s.label}</span>
            <span className="text-sm font-semibold text-gray-900 ml-auto tabular-nums">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default function PropertyDetailClient({ uuid, initialProperty = null, initialError = null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab') || '';
  const initialTab = sanitizeTab(urlTab);

  const [property, setProperty] = useState(initialProperty);
  const [loading, setLoading] = useState(!initialProperty && !initialError);
  const [error, setError] = useState(initialError);
  const [tab, setTab] = useState(initialTab);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = useCan('properties.delete');

  /*
   * mountedTabs tracks which tab components have been opened at least once.
   * Once mounted, a tab stays in the DOM (hidden) so state and data are preserved.
   * Tabs beyond 'overview' are code-split and only load their JS on first open.
   */
  /* Permission guard for tabs */
  const canViewFloors = useCan('property_floors.view');
  const canViewContracts = useCan(['customer_contracts.view', 'contract.view', 'contracts.view'], 'any');
  const canViewCustomers = useCan('customers.view');
  const canViewMaintenance = useCan('maintenance_jobs.view');
  const canViewReports = useCan('reports.view');

  const permissionMap = {
    floors: canViewFloors,
    contracts: canViewContracts,
    customers: canViewCustomers,
    maintenance: canViewMaintenance,
    reports: canViewReports,
  };

  const visibleTabs = useMemo(() =>
    PROPERTY_TABS.filter((t) => !t.permission || permissionMap[t.id]),
    [canViewFloors, canViewContracts, canViewCustomers, canViewMaintenance, canViewReports]
  );

  /* Ensure active tab is visible; fallback if permission revoked */
  const safeTab = visibleTabs.some((t) => t.id === tab) ? tab : DEFAULT_TAB;

  const [mountedTabs, setMountedTabs] = useState(() => new Set([safeTab]));

  /* Fallback client-side fetch — only runs if SSR did not provide property data */
  useEffect(() => {
    if (property || error) return;
    setLoading(true);
    PropertyService.show(uuid)
      .then((data) => {
        if (data?.success && data?.data) setProperty(data.data);
        else setError(data?.message || 'Failed to load property details');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [uuid]); // stable — only runs when SSR gave no data

  /* activateTab: adds tab to mountedTabs (mounts it for the first time) and switches view */
  const activateTab = useCallback((tabId) => {
    setMountedTabs((prev) => {
      if (prev.has(tabId)) return prev; // already mounted, no state change
      const next = new Set(prev);
      next.add(tabId);
      return next;
    });
    setTab(tabId);
  }, []);

  const handleTabChange = (tabId) => {
    activateTab(tabId);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const data = await PropertyService.destroy(uuid);
      if (data?.success !== false) {
        router.push('/properties');
      } else {
        setDeleteOpen(false);
        useUiStore.getState().showModal({ type: 'error', message: data?.message || 'Failed to delete property' });
      }
    } catch {
      setDeleteOpen(false);
      useUiStore.getState().showModal({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-5 bg-gray-100 rounded w-40" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 bg-gray-100 rounded-full w-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-56 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center max-w-md mx-auto">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/properties" className="btn-secondary">Back</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb + back */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/properties" className="hover:text-gray-800 transition-colors">Properties</Link>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium truncate max-w-xs">{property?.name}</span>
        </nav>
        <Link href="/properties" className="btn-secondary text-sm flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      {/* -- Pill-style Tab Bar ----------------------------------------------- */}
      <div className="flex flex-wrap gap-2">
        {visibleTabs.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${isActive
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* -- Overview Tab --------------------------------------------------- */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              value={property?.floors_count || 0}
              label="Total Floors"
              bg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              }
              value={property?.units_count || 0}
              label="Total Units"
              subtitle={`${property?.contracts_count || 0} occupied · ${Math.max(0, (property?.units_count || 0) - (property?.contracts_count || 0))} vacant`}
              bg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <StatCard
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              value={property?.contracts_count || 0}
              label="Active Contracts"
              bg="bg-amber-50"
              iconColor="text-amber-600"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Overall Occupancy */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-6">Overall Occupancy</h3>
              <div className="flex items-center justify-center">
                <OccupancyPie occupied={property?.contracts_count || 0} total={property?.units_count || 0} />
              </div>
            </div>

            {/* Contract Status */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-6">Contract Status</h3>
              <ContractStatusList activeContracts={property?.contracts_count || 0} />
            </div>
          </div>
        </div>
      )}

      {/*
       * -- Mount-once tab panels ----------------------------------------------
       * Each tab component mounts the first time its tab is opened, then stays
       * mounted forever (CSS hidden). This preserves scroll position, search
       * input, pagination state, and — critically — avoids re-fetching data on
       * every tab switch, no matter how many records the tab has loaded.
       */}

      {/* Floors tab */}
      {mountedTabs.has('floors') && (
        <div className={tab !== 'floors' ? 'hidden' : ''}>
          <FloorsTab propertyUuid={uuid} />
        </div>
      )}

      {/* Contracts tab */}
      {mountedTabs.has('contracts') && (
        <div className={tab !== 'contracts' ? 'hidden' : ''}>
          <ContractsTab propertyUuid={uuid} />
        </div>
      )}

      {/* Customers tab */}
      {mountedTabs.has('customers') && (
        <div className={tab !== 'customers' ? 'hidden' : ''}>
          <CustomersTab propertyUuid={uuid} />
        </div>
      )}

      {/* Maintenance tab */}
      {mountedTabs.has('maintenance') && (
        <div className={tab !== 'maintenance' ? 'hidden' : ''}>
          <MaintenanceTab propertyUuid={uuid} />
        </div>
      )}

      {/* Reports tab */}
      {mountedTabs.has('reports') && (
        <div className={tab !== 'reports' ? 'hidden' : ''}>
          <ReportsTab propertyUuid={uuid} />
        </div>
      )}

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Property"
        message={`Delete "${property?.name}"? This cannot be undone.`}
        confirmLabel="Delete Property"
      />
    </div>
  );
}
