import AuthService from '@/services/AuthService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { json, status } = await AuthService.verifyOtp(body);
    return Response.json(json, { status });
  } catch (e) {
    return Response.json({ success: false, message: 'Server error', data: null, errors: null }, { status: 500 });
  }
}
