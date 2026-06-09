import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { token, tenantUuid } = await request.json();
  const jar = await cookies();

  const cookieOpts = {
    httpOnly: true,
    // secure: process.env.NODE_ENV === 'production',
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };

  jar.set('app_token', token, cookieOpts);
  if (tenantUuid) jar.set('tenant_uuid', tenantUuid, cookieOpts);

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete('app_token');
  jar.delete('tenant_uuid');
  return NextResponse.json({ ok: true });
}
