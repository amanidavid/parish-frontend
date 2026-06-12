import AuthService from '@/services/AuthService';
import { cookies } from 'next/headers';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
  secure: process.env.COOKIE_SECURE === 'true',
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { json, status } = await AuthService.login(body);

    /* If direct auth (no OTP), persist cookies immediately */
    const data = json?.data;
    if (status === 200 && json?.success && data?.access_token) {
      const jar = await cookies();
      jar.set('app_token', data.access_token, COOKIE_OPTS);

      const tenant = data?.tenant || data?.tenants?.[0];
      if (tenant?.tenant_uuid) {
        jar.set('tenant_uuid', tenant.tenant_uuid, COOKIE_OPTS);
      }
    }

    return Response.json(json, { status });
  } catch (e) {
    return Response.json({ success: false, message: 'Server error', data: null, errors: null }, { status: 500 });
  }
}
