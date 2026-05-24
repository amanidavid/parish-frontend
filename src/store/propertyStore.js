'use client';
import { create } from 'zustand';

const usePropertyStore = create((set) => ({
  activeProperty: null,
  setActiveProperty: (property) => set({ activeProperty: property }),
  clearActiveProperty: () => set({ activeProperty: null }),
}));

export default usePropertyStore;
