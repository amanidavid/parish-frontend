'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CustomerService from '@/services/CustomerService';
import CustomerForm from '@/components/customers/CustomerForm';
import useUiStore from '@/store/uiStore';

export default function CreateCustomerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyUuid = searchParams.get('property_uuid') || '';
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (form) => {
    setLoading(true);
    try {
      const data = await CustomerService.store(form);
      if (data?.success) {
        useUiStore.getState().showModal({
          type: 'success',
          message: data?.message || 'Customer created successfully.',
          onRefresh: () => {
            if (propertyUuid) {
              router.push(`/properties/${propertyUuid}?tab=customers`);
            } else {
              router.push('/customers');
            }
          },
        });
        return {};
      }
      useUiStore.getState().showModal({
        type: 'error',
        message: data?.message || 'Failed to create customer.',
      });
      return { errors: data?.errors || {} };
    } catch {
      useUiStore.getState().showModal({ type: 'error', message: 'Network error. Please try again.' });
      return {};
    } finally {
      setLoading(false);
    }
  };

  const backHref = propertyUuid ? `/properties/${propertyUuid}?tab=customers` : '/customers';
  const backLabel = propertyUuid ? 'Back to Property' : 'Back to Customers';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">New Customer</h1>
          <p className="text-sm text-gray-400 mt-0.5">Register a new tenant or business client</p>
        </div>
        <Link href={backHref} className="btn-secondary text-sm flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Customer Information</p>

        <CustomerForm onSubmit={handleSubmit} loading={loading} submitLabel="Create Customer" propertyUuid={propertyUuid} />
      </div>
    </div>
  );
}
