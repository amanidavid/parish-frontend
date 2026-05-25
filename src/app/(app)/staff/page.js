import { cookies } from 'next/headers';
import StaffPageClient from './StaffPageClient';

const LARAVEL_BASE = process.env.LARAVEL_API_URL || 'http://localhost:8000/api/v1';

async function getInitialData() {
  const jar = await cookies();
  const token = jar.get('app_token')?.value;
  const tenantUuid = jar.get('tenant_uuid')?.value;

  if (!token || !tenantUuid) {
    return { items: [], meta: null, error: null };
  }

  try {
    const response = await fetch(`${LARAVEL_BASE}/app/staff-users?page=1&per_page=15&sort=name`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Tenant-Id': tenantUuid,
      },
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.success) {
      return { items: [], meta: null, error: payload?.message || 'Failed to load staff' };
    }

    return { items: payload.data || [], meta: payload.meta || null, error: null };
  } catch {
    return { items: [], meta: null, error: 'Network error' };
  }
}

export default async function Page() {
  const initial = await getInitialData();
  return <StaffPageClient initialItems={initial.items} initialMeta={initial.meta} initialError={initial.error} />;
}
