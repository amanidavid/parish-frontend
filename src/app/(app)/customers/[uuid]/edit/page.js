'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import CustomerForm from '@/components/customers/CustomerForm';
import CustomerService from '@/services/CustomerService';
import useUiStore from '@/store/uiStore';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    CustomerService.show(uuid)
      .then((data) => {
        if (data?.success && data?.data) {
          setCustomer(data.data);
        } else {
          useUiStore.getState().showModal({ type: 'error', message: data?.message || 'Failed to load customer details' });
        }
      })
      .catch(() => useUiStore.getState().showModal({ type: 'error', message: 'Network error. Please try again.' }))
      .finally(() => setFetching(false));
  }, [uuid]);

  const handleSubmit = async (form) => {
    setLoading(true);
    try {
      const data = await CustomerService.update(uuid, form);
      if (data?.success) {
        useUiStore.getState().showModal({
          type: 'success',
          message: data?.message || 'Customer updated successfully.',
          onRefresh: () => router.push(`/customers/${uuid}`),
        });
        return {};
      }
      useUiStore.getState().showModal({
        type: 'error',
        message: data?.message || 'Failed to update customer.',
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

  if (!customer) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">Edit Customer</h1>
          <Link href="/customers" className="btn-secondary text-sm">Back to Customers</Link>
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
