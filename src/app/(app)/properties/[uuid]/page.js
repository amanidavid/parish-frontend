import { cookies } from 'next/headers';
import { Suspense } from 'react';
import PropertyDetailClient from './PropertyDetailClient';

const LARAVEL_BASE = process.env.LARAVEL_API_URL || 'http://localhost:8000/api/v1';

/**
 * Server Component — SSR-fetches the property header before sending HTML.
 * The property name, status, location and counts are visible immediately
 * with zero client-side round-trip on page load.
 *
 * Tab content (Floors / Units / Contracts) is lazy-loaded client-side on
 * first open and then cached in React state (mount-once pattern).
 */
async function fetchProperty(uuid) {
  const jar = await cookies();
  const token = jar.get('app_token')?.value;
  const tenantUuid = jar.get('tenant_uuid')?.value;

  if (!token || !tenantUuid) return { property: null, error: null };

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Tenant-Id': tenantUuid,
  };

  try {
    const res = await fetch(`${LARAVEL_BASE}/app/properties/${uuid}`, {
      headers,
      cache: 'no-store',
    });
    const payload = await res.json().catch(() => null);
    return {
      property: res.ok && payload?.success ? (payload.data || null) : null,
      error: res.ok && payload?.success
        ? null
        : (payload?.message || 'Failed to load property'),
    };
  } catch {
    return { property: null, error: 'Network error' };
  }
}

/* Suspense fallback — shown while the client component hydrates */
function PropertySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 bg-gray-100 rounded w-40" />
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 space-y-3">
          <div className="h-6 bg-gray-100 rounded w-56" />
          <div className="h-4 bg-gray-100 rounded w-32" />
        </div>
        <div className="border-t border-gray-100 grid grid-cols-4 divide-x divide-gray-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-6 py-4 space-y-2">
              <div className="h-3 bg-gray-100 rounded w-16" />
              <div className="h-5 bg-gray-100 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function Page({ params }) {
  const { uuid } = await params;
  const { property, error } = await fetchProperty(uuid);

  return (
    <Suspense fallback={<PropertySkeleton />}>
      <PropertyDetailClient
        uuid={uuid}
        initialProperty={property}
        initialError={error}
      />
    </Suspense>
  );
}
