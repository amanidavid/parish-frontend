'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      tenantUuid: null,
      isNewUser: false,
      permissions: [],
      roles: [],
      services: [], // [{ id, label, active }]
      scope: 'full', // 'full' | 'limited'
      assignments: {}, // { properties: ['uuid'], lodge: ['uuid'] }
      setAuth: (user, tenantUuid, services, scope = 'full', assignments = {}) =>
        set({ user, tenantUuid, services: services || [], scope, assignments }),
      updateUser: (user) => set({ user }),
      setNewUser: (val) => set({ isNewUser: val }),
      setPermissions: (permissions) => set({ permissions }),
      setRoles: (roles) => set({ roles }),
      setServices: (services) => set({ services }),
      setScope: (scope, assignments = {}) => set({ scope, assignments }),
      clearAuth: () => set({ user: null, tenantUuid: null, isNewUser: false, permissions: [], roles: [], services: [], scope: 'full', assignments: {} }),
      /* Check if user has a specific permission */
      can: (permissionName) => {
        const state = get();
        if (!state.user) return false;
        return state.permissions.some((p) => p.name === permissionName);
      },
    }),
    {
      name: 'parish-auth',
      partialize: (state) => ({
        user: state.user,
        tenantUuid: state.tenantUuid,
        permissions: state.permissions,
        roles: state.roles,
        services: state.services,
        scope: state.scope,
        assignments: state.assignments,
      }),
    }
  )
);

export default useAuthStore;
