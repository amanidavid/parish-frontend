const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function apiFetch(path, options = {}, token = null, tenantUuid = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(tenantUuid ? { 'X-Tenant-Id': tenantUuid } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    cache: options.cache || 'no-store',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data?.message || 'Request failed');
    error.status = res.status;
    error.errors = data?.errors || null;
    throw error;
  }

  return data;
}

export async function serverFetch(path, options = {}) {
  const { cookies } = await import('next/headers');
  const jar = await cookies();
  const token = jar.get('app_token')?.value || null;
  const tenantUuid = jar.get('tenant_uuid')?.value || null;
  return apiFetch(path, options, token, tenantUuid);
}
