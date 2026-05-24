'use client';
import { create } from 'zustand';

const useUiStore = create((set) => ({
  sidebarOpen: true,
  activeSlideOver: null,
  notification: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openSlideOver: (payload) => set({ activeSlideOver: payload }),
  closeSlideOver: () => set({ activeSlideOver: null }),

  showNotification: (message, type = 'success') => {
    set({ notification: { message, type } });
    setTimeout(() => set({ notification: null }), 3500);
  },
  clearNotification: () => set({ notification: null }),
}));

export default useUiStore;
