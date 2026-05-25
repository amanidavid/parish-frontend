import { cookies } from 'next/headers';
import PropertiesPageClient from '@/components/properties/PropertiesPageClient';

const LARAVEL_BASE = process.env.LARAVEL_API_URL || 'http://localhost:8000/api/v1';
const PER_PAGE = 15;

async function getInitialProperties() {
  const jar = await cookies();
  const token = jar.get('app_token')?.value;
  const tenantUuid = jar.get('tenant_uuid')?.value;

  if (!token || !tenantUuid) {
    return {
      items: [],
      meta: null,
      error: null,
    };
  }

  try {
    const response = await fetch(`${LARAVEL_BASE}/app/properties?page=1&per_page=${PER_PAGE}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Tenant-Id': tenantUuid,
      },
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.success) {
      return {
        items: [],
        meta: null,
        error: payload?.message || 'Failed to load properties',
      };
    }

    return {
      items: payload.data || [],
      meta: payload.meta || null,
      error: null,
    };
  } catch {
    return {
      items: [],
      meta: null,
      error: 'Network error',
    };
  }
}

export default async function PropertiesPage() {
  const initial = await getInitialProperties();

  return (
    <PropertiesPageClient
      initialItems={initial.items}
      initialMeta={initial.meta}
      initialError={initial.error}
    />
  );
}
