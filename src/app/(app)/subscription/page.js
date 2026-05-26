import { cookies } from 'next/headers';
import SubscriptionPageClient from './SubscriptionPageClient';

const LARAVEL_BASE = process.env.LARAVEL_API_URL || 'http://localhost:8000/api/v1';

/**
 * SSR only the active tab (Billing Summary) for fast TTFB.
 * Property Cost Breakdown is lazy-loaded client-side on first tab open,
 * then cached in React state — no re-fetch on subsequent tab switches.
 */
async function getInitialData() {
  const jar = await cookies();
  const token = jar.get('app_token')?.value;
  const tenantUuid = jar.get('tenant_uuid')?.value;

  if (!token || !tenantUuid) {
    return { summary: null, summaryError: null };
  }

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Tenant-Id': tenantUuid,
  };

  try {
    const summaryResponse = await fetch(
      `${LARAVEL_BASE}/app/workspace/subscription`,
      { headers, cache: 'no-store' },
    );
    const summaryPayload = await summaryResponse.json().catch(() => null);
    return {
      summary: summaryResponse.ok && summaryPayload?.success ? (summaryPayload.data || null) : null,
      summaryError: summaryResponse.ok && summaryPayload?.success
        ? null
        : (summaryPayload?.message || 'Failed to load subscription summary'),
    };
  } catch {
    return { summary: null, summaryError: 'Network error' };
  }
}

export default async function Page() {
  const initial = await getInitialData();
  return (
    <SubscriptionPageClient
      initialSummary={initial.summary}
      initialSummaryError={initial.summaryError}
    />
  );
}
