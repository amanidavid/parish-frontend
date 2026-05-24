'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PropertyService from '@/services/PropertyService';
import PropertyForm from '@/components/properties/PropertyForm';

export default function EditPropertyPage() {
  const { uuid } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

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
      .finally(() => setFetching(false));
  }, [uuid]);

  const handleSubmit = async (form) => {
    setLoading(true);
    setError(null);
    try {
      const data = await PropertyService.update(uuid, form);
      if (data?.success) {
        router.push(`/properties/${uuid}`);
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

  if (error && !property) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-red-600 mb-4">{error}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Property Information</p>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <PropertyForm
            initial={property}
            onSubmit={handleSubmit}
            loading={loading}
            submitLabel="Save Changes"
          />
        </div>

        {/* Current details panel */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Current Details</p>
          {[
            { label: 'Status', value: property?.status ? property.status.charAt(0).toUpperCase() + property.status.slice(1) : '—' },
            { label: 'Type', value: property?.type?.name || '—' },
            { label: 'Floors', value: property?.floors_count ?? 0 },
            { label: 'Units', value: property?.units_count ?? 0 },
            { label: 'Postal Code', value: property?.postal_code || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-xs text-gray-400">{label}</span>
              <span className="text-sm font-medium text-gray-700">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
