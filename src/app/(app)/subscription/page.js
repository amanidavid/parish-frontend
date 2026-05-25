import { cookies } from 'next/headers';
import SubscriptionPageClient from './SubscriptionPageClient';

const LARAVEL_BASE = process.env.LARAVEL_API_URL || 'http://localhost:8000/api/v1';

async function getInitialData() {
  const jar = await cookies();
  const token = jar.get('app_token')?.value;
  const tenantUuid = jar.get('tenant_uuid')?.value;

  if (!token || !tenantUuid) {
    return {
      summary: null,
      summaryError: null,
      properties: [],
      meta: null,
      tableError: null,
    };
  }

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Tenant-Id': tenantUuid,
  };

  try {
    const [summaryResponse, propertiesResponse] = await Promise.all([
      fetch(`${LARAVEL_BASE}/app/workspace/subscription`, { headers, cache: 'no-store' }),
      fetch(`${LARAVEL_BASE}/app/workspace/subscription/properties?per_page=15&sort=name`, { headers, cache: 'no-store' }),
    ]);

    const [summaryPayload, propertiesPayload] = await Promise.all([
      summaryResponse.json().catch(() => null),
      propertiesResponse.json().catch(() => null),
    ]);

    return {
      summary: summaryResponse.ok && summaryPayload?.success ? (summaryPayload.data || null) : null,
      summaryError: summaryResponse.ok && summaryPayload?.success ? null : (summaryPayload?.message || 'Failed to load subscription summary'),
      properties: propertiesResponse.ok && propertiesPayload?.success ? (propertiesPayload.data || []) : [],
      meta: propertiesResponse.ok && propertiesPayload?.success ? (propertiesPayload.meta || null) : null,
      tableError: propertiesResponse.ok && propertiesPayload?.success ? null : (propertiesPayload?.message || 'Failed to load property breakdown'),
    };
  } catch {
    return {
      summary: null,
      summaryError: 'Network error',
      properties: [],
      meta: null,
      tableError: 'Network error',
    };
  }
}

export default async function Page() {
  const initial = await getInitialData();
  return (
    <SubscriptionPageClient
      initialSummary={initial.summary}
      initialSummaryError={initial.summaryError}
      initialProperties={initial.properties}
      initialMeta={initial.meta}
      initialTableError={initial.tableError}
    />
  );
}
