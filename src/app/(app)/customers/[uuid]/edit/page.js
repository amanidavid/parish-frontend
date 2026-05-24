'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerService from '@/services/CustomerService';
import CustomerForm from '@/components/customers/CustomerForm';

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="h-9 bg-gray-100 rounded animate-pulse w-1/3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`h-9 bg-gray-100 rounded animate-pulse ${i < 2 ? 'sm:col-span-2' : ''}`} />
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
            <div className="h-5 bg-gray-100 rounded animate-pulse w-40" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-56 mt-1.5" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
            <Skeleton />
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${70 - i * 10}%` }} />
            ))}
          </div>
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
        <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <p className="text-sm text-gray-400 mt-0.5">Update customer information</p>
        </div>
        <Link href={`/customers/${uuid}`} className="btn-secondary text-sm flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Customer
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Customer Information</p>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Current Details</p>
          <div className="space-y-3">
            {[
              { label: 'Display Name', value: customer?.display_name },
              { label: 'Type', value: customer?.customer_type },
              { label: 'Status', value: customer?.status },
              { label: 'Email', value: customer?.email },
              { label: 'Phone', value: customer?.phone },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-medium text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value || <span className="text-gray-300">—</span>}</p>
              </div>
            ))}
            {customer?.business_detail && (
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-400 mb-2">Business Info</p>
                {[
                  { label: 'Business Name', value: customer.business_detail.business_name },
                  { label: 'Registration No.', value: customer.business_detail.registration_number },
                  { label: 'Tax ID', value: customer.business_detail.tax_identifier },
                ].map(({ label, value }) => (
                  <div key={label} className="mt-1.5">
                    <p className="text-xs font-medium text-gray-400">{label}</p>
                    <p className="text-sm text-gray-700">{value || <span className="text-gray-300">—</span>}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
