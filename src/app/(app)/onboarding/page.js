'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useServiceStore from '@/store/serviceStore';
import { SERVICE_REGISTRY } from '@/modules/services/serviceRegistry';

const SERVICE_OPTIONS = [
  {
    id: 'properties',
    title: 'Property Management',
    description: 'Manage buildings, floors, units, contracts and tenants.',
    features: ['Property listings', 'Floor & unit tracking', 'Contract management', 'Tenant portal'],
  },
  {
    id: 'lodge',
    title: 'Lodge Management',
    description: 'Manage lodges, rooms, bookings, and housekeeping.',
    features: ['Room inventory', 'Booking calendar', 'Housekeeping tasks', 'Guest check-in/out'],
  },
  {
    id: 'restaurant',
    title: 'Restaurant POS',
    description: 'Manage tables, menu, orders and payments.',
    features: ['Table management', 'Digital menu', 'Order tracking', 'Payment processing'],
  },
];

function ServiceOptionCard({ option, selected, onSelect }) {
  const config = SERVICE_REGISTRY[option.id];
  return (
    <button
      onClick={() => onSelect(option.id)}
      className={`relative text-left rounded-2xl border-2 p-6 transition-all duration-200 flex flex-col gap-4 ${
        selected
          ? 'border-primary-600 bg-primary-50/40 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {selected && (
        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: config?.bg || '#f3f4f6' }}
      >
        <svg className="w-6 h-6" style={{ color: config?.color || '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={config?.icon || ''} />
        </svg>
      </div>

      <div>
        <h3 className="text-base font-bold text-gray-900">{option.title}</h3>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{option.description}</p>
      </div>

      <ul className="space-y-1.5">
        {option.features.map((feat) => (
          <li key={feat} className="flex items-center gap-2 text-xs text-gray-600">
            <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {feat}
          </li>
        ))}
      </ul>
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const setServices = useAuthStore((s) => s.setServices);
  const setActiveService = useServiceStore((s) => s.setActiveService);

  const handleActivate = async () => {
    if (!selected) return;
    setLoading(true);

    /* TODO: Call API to activate service for tenant */
    // const res = await fetch('/api/v1/app/services/activate', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ service_id: selected }),
    // });

    /* Mock: add service locally */
    const newService = { id: selected, label: SERVICE_REGISTRY[selected].label, active: true };
    setServices([newService]);
    setActiveService(selected);

    setTimeout(() => {
      setLoading(false);
      router.push(SERVICE_REGISTRY[selected].baseRoute);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Set Up Your First Service</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
          Choose the business module you want to start with. You can add more services later from your dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {SERVICE_OPTIONS.map((option) => (
          <ServiceOptionCard
            key={option.id}
            option={option}
            selected={selected === option.id}
            onSelect={setSelected}
          />
        ))}
      </div>

      <div className="mt-10 flex items-center justify-center gap-3">
        <button
          onClick={() => router.push('/dashboard')}
          className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          Skip for now
        </button>
        <button
          onClick={handleActivate}
          disabled={!selected || loading}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: !selected || loading ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          }}
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {loading ? 'Setting up...' : 'Activate Service'}
        </button>
      </div>
    </div>
  );
}
