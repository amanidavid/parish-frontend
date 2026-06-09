import AuthService from '@/services/AuthService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { json, status } = await AuthService.forgotPassword(body);
    return Response.json(json, { status });
  } catch {
    return Response.json(
      { success: false, message: 'Server error', data: null, errors: null },
      { status: 500 },
    );
  }
}
