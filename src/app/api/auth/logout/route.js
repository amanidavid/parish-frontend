import AuthService from '@/services/AuthService';

export async function POST() {
  try {
    await AuthService.logout();
    return Response.json({ success: true, message: 'Logged out successfully', data: null });
  } catch (e) {
    return Response.json({ success: false, message: 'Server error', data: null, errors: null }, { status: 500 });
  }
}
