'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PropertyService from '@/services/PropertyService';
import PropertyForm from '@/components/properties/PropertyForm';
import useUiStore from '@/store/uiStore';

export default function CreatePropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (form) => {
    setLoading(true);
    try {
      const data = await PropertyService.store(form);
      if (data?.success) {
        useUiStore.getState().showModal({
          type: 'success',
          message: data?.message || 'Property created successfully.',
          onRefresh: () => router.push('/properties'),
        });
        return {};
      }
      useUiStore.getState().showModal({
        type: 'error',
        message: data?.message || 'Failed to create property.',
      });
      return { errors: data?.errors || {} };
    } catch {
      useUiStore.getState().showModal({ type: 'error', message: 'Network error. Please try again.' });
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

      <div className="bg-white border border-gray-200 rounded-md p-6">
        <PropertyForm onSubmit={handleSubmit} loading={loading} submitLabel="Create Property" />
      </div>
    </div>
  );
}
