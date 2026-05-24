'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PropertyService from '@/services/PropertyService';
import PropertyForm from '@/components/properties/PropertyForm';

export default function CreatePropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (form) => {
    setLoading(true);
    setError(null);
    try {
      const data = await PropertyService.store(form);
      if (data?.success) {
        router.push('/properties');
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

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">New Property</h1>
          <p className="text-sm text-gray-400 mt-0.5">Register a property to your workspace</p>
        </div>
        <Link
          href="/properties"
          className="btn-secondary text-sm flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Properties
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

          <PropertyForm onSubmit={handleSubmit} loading={loading} submitLabel="Create Property" />
        </div>

        {/* Tips panel */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Quick Tips</p>
          <ul className="space-y-3">
            {[
              { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Property name is required and must be unique within your workspace.' },
              { icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', text: 'Selecting a property type helps with filtering and reporting.' },
              { icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5', text: 'After creating a property, you can add floors and units from the property detail page.' },
            ].map(({ icon, text }, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
