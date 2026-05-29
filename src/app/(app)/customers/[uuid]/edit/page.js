'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import CustomerForm from '@/components/customers/CustomerForm';
import CustomerService from '@/services/CustomerService';

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="h-9 w-1/3 animate-pulse rounded bg-gray-100" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={`h-9 animate-pulse rounded bg-gray-100 ${index < 2 ? 'sm:col-span-2' : ''}`} />
        ))}
      </div>
    </div>
  );
}

export default function EditCustomerPage() {
  const { uuid } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    CustomerService.show(uuid)
      .then((data) => {
        if (data?.success && data?.data) {
          setCustomer(data.data);
        } else {
          setFetchError(data?.message || 'Failed to load customer details');
        }
      })
      .catch(() => setFetchError('Network error'))
      .finally(() => setFetching(false));
  }, [uuid]);

  const handleSubmit = async (form) => {
    setLoading(true);
    setError(null);

    try {
      const data = await CustomerService.update(uuid, form);

      if (data?.success) {
        router.push(`/customers/${uuid}`);
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
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
            <div className="mt-1.5 h-4 w-56 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <Skeleton />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">Edit Customer</h1>
          <Link href="/customers" className="btn-secondary text-sm">Back to Customers</Link>
        </div>
        <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{fetchError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Edit Customer</h1>
          <p className="mt-0.5 text-sm text-gray-400">Update customer information</p>
        </div>
        <Link href={`/customers/${uuid}`} className="btn-secondary text-sm flex items-center gap-1.5">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Customer
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-gray-400">Customer Information</p>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <CustomerForm
          initial={customer}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
