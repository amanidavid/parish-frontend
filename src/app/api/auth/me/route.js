import { cookies } from 'next/headers';

export async function GET() {
  try {
    const token = cookies().get('access_token')?.value;
    const res = await fetch(`${process.env.API_BASE_URL}/v1/auth/me`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: 0 },
    });
    if (res.status === 401) {
      // try refresh once
      const refreshed = await fetch(`${process.env.API_BASE_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const refreshedJson = await refreshed.json();
      if (refreshed.ok && refreshedJson?.data?.access_token) {
        cookies().set('access_token', refreshedJson.data.access_token, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: refreshedJson?.data?.expires_in ?? 3900,
          secure: process.env.NODE_ENV === 'production',
        });
        const retry = await fetch(`${process.env.API_BASE_URL}/v1/auth/me`, {
          headers: { Authorization: `Bearer ${refreshedJson.data.access_token}` },
        });
        const retryJson = await retry.json();
        return Response.json(retryJson, { status: retry.status });
      }
      const j = await res.json();
      return Response.json(j, { status: 401 });
    }
    const json = await res.json();
    return Response.json(json, { status: res.status });
  } catch (e) {
    return Response.json({ success: false, message: e.message, data: null }, { status: 500 });
  }
}
