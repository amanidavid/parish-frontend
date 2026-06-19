'use client';
import { create } from 'zustand';

const useUiStore = create((set) => ({
  sidebarOpen: true,
  activeSlideOver: null,
  notification: null,
  modalNotification: null,
  isNavigating: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openSlideOver: (payload) => set({ activeSlideOver: payload }),
  closeSlideOver: () => set({ activeSlideOver: null }),
  setNavigating: (v) => set({ isNavigating: v }),

  /* -- Toast notification (lightweight fallback) -- */
  showNotification: (message, type = 'success') => {
    set({ notification: { message, type } });
    setTimeout(() => set({ notification: null }), 3500);
  },
  clearNotification: () => set({ notification: null }),

  /* -- Modal notification (prominent, global) -- */
  showModal: (payload) => set({ modalNotification: payload }),
  closeModal: () => set({ modalNotification: null }),
}));

export default useUiStore;
