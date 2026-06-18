'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import PropertyService from '@/services/PropertyService';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/ui/ConfirmModal';
import useConfirmModal from '@/hooks/useConfirmModal';
import PropertyFormModal from './PropertyFormModal';
import useCan from '@/hooks/useCan';

const PER_PAGE = 15;

function capitalize(str) {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${70 - i * 8}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function PropertiesPageClient({ initialItems = [], initialMeta = null, initialError = null }) {
  const [properties, setProperties] = useState(initialItems);
  const [meta, setMeta] = useState(initialMeta);
  const [loading, setLoading] = useState(!initialMeta && !initialError);
  const [error, setError] = useState(initialError);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(initialMeta?.current_page ?? 1);
  const confirmModal = useConfirmModal();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editProperty, setEditProperty] = useState(null);
  const searchRef = useRef(null);

  const canCreate = useCan('properties.create');
  const canDelete = useCan('properties.delete');
  const hydratedInitialRef = useRef(Boolean(initialMeta) && !initialError);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PropertyService.index({
        name: appliedSearch || undefined,
        page,
        per_page: PER_PAGE,
      });
      if (data?.success) {
        setProperties(data.data || []);
        setMeta(data.meta || null);
      } else {
        setError(data?.message || 'Failed to load properties');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, page]);

  useEffect(() => {
    if (hydratedInitialRef.current && page === 1 && !appliedSearch) {
      hydratedInitialRef.current = false;
      return;
    }

    fetchProperties();
  }, [fetchProperties, page, appliedSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput('');
    setAppliedSearch('');
    setPage(1);
  };

  const handleDelete = useCallback(async () => {
    const res = await confirmModal.execute(
      (prop) => PropertyService.destroy(prop.uuid),
      { successMessage: 'Property deleted successfully.', errorMessage: 'Failed to delete property.' }
    );
    if (res?.success) {
      hydratedInitialRef.current = false;
      fetchProperties();
    }
  }, [confirmModal, fetchProperties]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage all registered properties</p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setEditProperty(null); setFormModalOpen(true); }}
            className="btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Property
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search by property name..."
            className="input pl-9 pr-8"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button type="submit" className="btn-secondary">
          Search
        </button>
      </form>

      {error && (
        <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-300 hover:text-red-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-8">
                  <span className="sr-only">#</span>
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Floors</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Units</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-sm text-gray-500 font-medium">No properties found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {appliedSearch ? 'No results match your search. Try a different keyword.' : 'Register your first property to get started.'}
                    </p>
                    {appliedSearch && (
                      <button onClick={handleClear} className="mt-3 text-xs text-blue-600 hover:underline">Clear search</button>
                    )}
                  </td>
                </tr>
              ) : (
                properties.map((prop, idx) => (
                  <tr
                    key={prop.uuid}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-xs text-gray-400 w-8">
                      {((page - 1) * PER_PAGE) + idx + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/properties/${prop.uuid}`}
                        className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {prop.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-sm">
                      {prop.type?.name || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-sm">
                      {capitalize(prop.location?.ward?.name) || capitalize(prop.location?.district?.name) || prop.address_line || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 rounded bg-gray-100 text-gray-600 text-xs font-semibold px-2">
                        {prop.floors_count ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 rounded bg-blue-50 text-blue-700 text-xs font-semibold px-2">
                        {prop.units_count ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={prop.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/properties/${prop.uuid}`}
                          className="h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => { setEditProperty(prop); setFormModalOpen(true); }}
                          className="h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => confirmModal.prompt(prop)}
                            className="h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.total > PER_PAGE && (
          <div className="border-t border-gray-100">
            <Pagination meta={meta} onPageChange={setPage} />
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmModal.open}
        onClose={confirmModal.close}
        onConfirm={handleDelete}
        onRetry={handleDelete}
        danger
        loading={confirmModal.loading}
        result={confirmModal.result}
        title="Delete Property"
        message={`Delete "${confirmModal.item?.name}"? All associated floors and units will also be removed. This cannot be undone.`}
        confirmLabel="Delete Property"
      />

      <PropertyFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        initial={editProperty}
        onSaved={() => {
          hydratedInitialRef.current = false;
          fetchProperties();
        }}
      />
    </div>
  );
}
