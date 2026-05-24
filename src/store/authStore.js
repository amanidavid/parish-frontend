'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      tenantUuid: null,
      setAuth: (user, token, tenantUuid) => set({ user, token, tenantUuid }),
      updateUser: (user) => set({ user }),
      clearAuth: () => set({ user: null, token: null, tenantUuid: null }),
    }),
    {
      name: 'parish-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        tenantUuid: state.tenantUuid,
      }),
    }
  )
);

export default useAuthStore;
