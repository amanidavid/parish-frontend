'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerService from '@/services/CustomerService';
import CustomerForm from '@/components/customers/CustomerForm';

export default function CreateCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (form) => {
    setLoading(true);
    setError(null);
    try {
      const data = await CustomerService.store(form);
      if (data?.success) {
        router.push('/customers');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">New Customer</h1>
          <p className="text-sm text-gray-400 mt-0.5">Register a new tenant or business client</p>
        </div>
        <Link href="/customers" className="btn-secondary text-sm flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Customers
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Customer Information</p>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3">
            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <CustomerForm onSubmit={handleSubmit} loading={loading} submitLabel="Create Customer" />
      </div>
    </div>
  );
}
