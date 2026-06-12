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
      setAuth: (user, tenantUuid) => set({ user, tenantUuid }),
      updateUser: (user) => set({ user }),
      setNewUser: (val) => set({ isNewUser: val }),
      setPermissions: (permissions) => set({ permissions }),
      setRoles: (roles) => set({ roles }),
      clearAuth: () => set({ user: null, tenantUuid: null, isNewUser: false, permissions: [], roles: [] }),
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
      }),
    }
  )
);

export default useAuthStore;
