import apiFetch from '@/lib/apiFetch';

const BASE = '/api/v1/app/access-control';

const AccessControlService = {
  /* Permissions */
  async listPermissions(params = {}) {
    const query = new URLSearchParams({ per_page: params.perPage || 50 });
    if (params.search) query.set('search', params.search);
    if (params.module) query.set('module', params.module);
    if (params.page && params.page > 1) query.set('page', params.page);
    return apiFetch(`${BASE}/permissions?${query}`);
  },

  async storePermission(name) {
    return apiFetch(`${BASE}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  },

  /* Roles */
  async listRoles(params = {}) {
    const query = new URLSearchParams({ per_page: params.perPage || 25 });
    if (params.search) query.set('search', params.search);
    if (params.page && params.page > 1) query.set('page', params.page);
    return apiFetch(`${BASE}/roles?${query}`);
  },

  async getRole(roleId) {
    return apiFetch(`${BASE}/roles/${roleId}`);
  },

  async createRole(name) {
    return apiFetch(`${BASE}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  },

  async deleteRole(roleId) {
    return apiFetch(`${BASE}/roles/${roleId}`, { method: 'DELETE' });
  },

  async syncRolePermissions(roleId, permissionIds) {
    return apiFetch(`${BASE}/roles/${roleId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission_ids: permissionIds }),
    });
  },

  /* User direct permissions */
  async syncUserDirectPermissions(tenantUserUuid, permissionIds) {
    return apiFetch(`${BASE}/users/${tenantUserUuid}/direct-permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission_ids: permissionIds }),
    });
  },
};

export default AccessControlService;
