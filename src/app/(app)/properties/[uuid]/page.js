'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PropertyService from '@/services/PropertyService';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmModal from '@/components/ui/ConfirmModal';

const FloorsTab = dynamic(() => import('@/components/properties/FloorsTab'));
const UnitsTab = dynamic(() => import('@/components/properties/UnitsTab'));
const ContractsTab = dynamic(() => import('@/components/properties/ContractsTab'));

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'floors', label: 'Floors' },
  { id: 'units', label: 'Units' },
  { id: 'contracts', label: 'Contracts' },
];

function SummaryCell({ label, value, large, color }) {
  return (
    <div className="px-6 py-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      {large
        ? <p className="text-2xl font-bold" style={{ color: color || '#1e293b' }}>{value ?? 0}</p>
        : <p className="text-sm font-medium text-gray-700">{value || <span className="text-gray-300">—</span>}</p>
      }
    </div>
  );
}

function PageAlert({ type, message, onClose }) {
  if (!message) return null;
  const ok = type === 'success';
  return (
    <div className={`flex items-start gap-3 rounded-md px-4 py-3 border ${ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <svg className={`w-4 h-4 mt-0.5 shrink-0 ${ok ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {ok
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        }
      </svg>
      <p className={`text-sm flex-1 ${ok ? 'text-green-800' : 'text-red-700'}`}>{message}</p>
      <button onClick={onClose} className={`${ok ? 'text-green-400 hover:text-green-700' : 'text-red-400 hover:text-red-700'} transition-colors`}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function PropertyDetailPage() {
  const { uuid } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab') || '';
  const validTabs = TABS.map((t) => t.id);
  const initialTab = validTabs.includes(urlTab) ? urlTab : 'overview';

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(initialTab);
  const [activeFloor, setActiveFloor] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    PropertyService.show(uuid)
      .then((data) => {
        if (data?.success && data?.data) {
          setProperty(data.data);
        } else {
          setError(data?.message || 'Failed to load property details');
        }
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [uuid]);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(t);
  }, [notification]);

  const notify = useCallback((type, message) => setNotification({ type, message }), []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const data = await PropertyService.destroy(uuid);
      if (data?.success !== false) {
        router.push('/properties');
      } else {
        setDeleteOpen(false);
        notify('error', data?.message);
      }
    } catch {
      setDeleteOpen(false);
      notify('error', 'Network error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-5 bg-gray-100 rounded w-40" />
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-6 space-y-3">
            <div className="h-6 bg-gray-100 rounded w-56" />
            <div className="h-4 bg-gray-100 rounded w-32" />
          </div>
          <div className="border-t border-gray-100 grid grid-cols-4 divide-x divide-gray-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-6 py-4 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-16" />
                <div className="h-5 bg-gray-100 rounded w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center max-w-md mx-auto">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/properties" className="btn-secondary">Back to Properties</Link>
      </div>
    );
  }

  const handleTabChange = (tabId) => {
    if (tabId === 'units') setActiveFloor(null);
    setTab(tabId);
  };

  return (
    <div className="space-y-5">
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
          Back to Properties
        </Link>
      </div>

      <PageAlert type={notification?.type} message={notification?.message} onClose={() => setNotification(null)} />

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{property?.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {property?.type && <span className="text-sm text-gray-500">{property.type.name}</span>}
                {property?.type && <span className="text-gray-300">·</span>}
                <StatusBadge status={property?.status} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/properties/${uuid}/edit`} className="btn-secondary text-sm">Edit</Link>
            <button className="btn-danger text-sm" onClick={() => setDeleteOpen(true)} disabled={deleting}>Delete</button>
          </div>
        </div>

        <div className="border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-gray-100">
          <SummaryCell label="Country" value={property?.location?.country?.name ?? null} />
          <SummaryCell label="Region" value={property?.location?.region?.name ?? null} />
          <SummaryCell label="District" value={property?.location?.district?.name ?? null} />
          <SummaryCell label="Address" value={property?.address_line ?? null} />
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-3.5 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Property Details</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              <div className="px-6 py-4">
                <p className="text-xs font-medium text-gray-400 mb-1.5">Property Name</p>
                <p className="text-sm font-semibold text-gray-900">{property?.name || <span className="text-gray-300">—</span>}</p>
              </div>
              <div className="px-6 py-4">
                <p className="text-xs font-medium text-gray-400 mb-1.5">Status</p>
                <StatusBadge status={property?.status} />
              </div>
              <div className="px-6 py-4">
                <p className="text-xs font-medium text-gray-400 mb-1.5">Type</p>
                <p className="text-sm font-semibold text-gray-900">{property?.type?.name || <span className="text-gray-300">—</span>}</p>
              </div>
              <div className="px-6 py-4">
                <p className="text-xs font-medium text-gray-400 mb-1.5">Address</p>
                <p className="text-sm font-semibold text-gray-900">{property?.address_line || <span className="text-gray-300">—</span>}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <SummaryCell label="Floors" value={property?.floors_count} large color="#2563eb" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <SummaryCell label="Units" value={property?.units_count} large color="#059669" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <SummaryCell label="Contracts" value={property?.contracts_count} large color="#ea580c" />
            </div>
          </div>
        </div>
      )}

      {tab === 'floors' && <FloorsTab propertyUuid={uuid} onViewUnits={(floor) => { setActiveFloor(floor); setTab('units'); }} />}
      {tab === 'units' && (
        <UnitsTab
          propertyUuid={uuid}
          initialFloor={activeFloor}
          onNotify={notify}
          onBackToFloors={() => { setActiveFloor(null); setTab('floors'); }}
        />
      )}
      {tab === 'contracts' && <ContractsTab propertyUuid={uuid} onNotify={notify} />}

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
