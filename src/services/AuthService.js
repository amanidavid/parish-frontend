import { cookies } from 'next/headers';

const LARAVEL = process.env.LARAVEL_API_URL || 'http://localhost:8000/api/v1';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === 'production',
};

/**
 * Makes a request to the Laravel API.
 *
 * @param {string} path
 * @param {object} options
 * @returns {Promise<{json: object, status: number}>}
 */
async function laravelRequest(path, options = {}) {
  const res = await fetch(`${LARAVEL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  const json = await res.json().catch(() => ({
    success: false,
    message: 'Invalid server response',
    data: null,
    errors: null,
  }));

  return { json, status: res.status };
}

/**
 * Stores auth cookies after successful OTP verification.
 *
 * @param {object} data  - data from verify-otp response
 */
async function persistSession(data) {
  const jar = await cookies();

  if (data?.access_token) {
    jar.set('app_token', data.access_token, COOKIE_OPTS);
  }

  const tenants = data?.tenants || [];
  const activeTenant =
    tenants.find((t) => t.provisioning_status === 'completed') || tenants[0];

  if (activeTenant?.tenant_uuid) {
    jar.set('tenant_uuid', activeTenant.tenant_uuid, COOKIE_OPTS);
  }
}

/** Clears all auth cookies. */
async function clearSession() {
  const jar = await cookies();
  jar.delete('app_token');
  jar.delete('tenant_uuid');
}

const AuthService = {
  /**
   * Validates credentials and dispatches an OTP challenge.
   * Returns { challenge_id } on success.
   *
   * @param {{ phone: string, password: string }} body
   */
  async login(body) {
    return laravelRequest('/app/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Registers a new user and provisions their workspace.
   *
   * @param {object} body
   */
  async register(body) {
    return laravelRequest('/app/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Verifies an OTP, sets httpOnly cookies on success,
   * and returns the session data.
   *
   * @param {{ challenge_id: string, code: string }} body
   */
  async verifyOtp(body) {
    const result = await laravelRequest('/app/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (result.status === 200 && result.json?.success) {
      await persistSession(result.json.data);
    }

    return result;
  },

  /**
   * Calls Laravel logout and clears local cookies.
   */
  async logout() {
    const jar = await cookies();
    const token = jar.get('app_token')?.value;

    await laravelRequest('/app/auth/logout', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {});

    await clearSession();
  },

  /**
   * Sends a forgot-password OTP.
   *
   * @param {{ phone: string }} body
   */
  async forgotPassword(body) {
    return laravelRequest('/app/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Resets the password using the OTP challenge.
   *
   * @param {{ challenge_id: string, code: string, password: string, password_confirmation: string }} body
   */
  async resetPassword(body) {
    return laravelRequest('/app/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};

export default AuthService;
