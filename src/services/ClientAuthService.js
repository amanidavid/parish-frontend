import apiFetch from '@/lib/apiFetch';

const BASE = '/api/v1/app/auth';

const ClientAuthService = {
  async updateProfile(data) {
    return apiFetch(`${BASE}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async changePassword(data) {
    return apiFetch(`${BASE}/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
};

export default ClientAuthService;
