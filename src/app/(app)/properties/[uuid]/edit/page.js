'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PropertyService from '@/services/PropertyService';
import PropertyForm from '@/components/properties/PropertyForm';
import useUiStore from '@/store/uiStore';

export default function EditPropertyPage() {
  const { uuid } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    PropertyService.show(uuid)
      .then((data) => {
        if (data?.success && data?.data) {
          setProperty(data.data);
        } else {
          useUiStore.getState().showModal({ type: 'error', message: data?.message || 'Failed to load property details' });
        }
      })
      .catch(() => useUiStore.getState().showModal({ type: 'error', message: 'Network error. Please try again.' }))
      .finally(() => setFetching(false));
  }, [uuid]);

  const handleSubmit = async (form) => {
    setLoading(true);
    try {
      const data = await PropertyService.update(uuid, form);
      if (data?.success) {
        useUiStore.getState().showModal({
          type: 'success',
          message: data?.message || 'Property updated successfully.',
          onRefresh: () => router.push(`/properties/${uuid}`),
        });
        return {};
      }
      useUiStore.getState().showModal({
        type: 'error',
        message: data?.message || 'Failed to update property.',
      });
      return { errors: data?.errors || {} };
    } catch {
      useUiStore.getState().showModal({ type: 'error', message: 'Network error. Please try again.' });
      return {};
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-5 bg-gray-100 rounded w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded" />
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded" style={{ width: `${70 - i * 8}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-500 mb-4">Property not found.</p>
        <Link href="/properties" className="btn-secondary">← Back</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Edit Property</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Updating <span className="text-gray-700 font-medium">{property?.name}</span>
          </p>
        </div>
        <Link
          href={`/properties/${uuid}`}
          className="btn-secondary text-sm flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Property
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Property Information</p>

        <PropertyForm
          initial={property}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
