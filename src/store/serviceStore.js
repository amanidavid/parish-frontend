'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Service Store — manages which service the user is currently viewing.
 *
 * - activeService: currently selected service id (e.g. 'properties')
 * - userServices: list of services the tenant has activated
 * - lastVisitedRoute: per-service route memory (optional)
 */
const useServiceStore = create(
  persist(
    (set, get) => ({
      activeService: null,
      userServices: [],
      lastVisited: {}, // { properties: '/properties/abc', lodge: '/lodges/xyz' }

      setActiveService: (serviceId) => {
        set({ activeService: serviceId });
      },

      setUserServices: (services) => {
        set({ userServices: services });
        // Auto-select first service if none active
        const current = get().activeService;
        if (!current && services?.length > 0) {
          set({ activeService: services[0].id });
        }
      },

      addService: (service) => {
        set((state) => {
          const exists = state.userServices.some((s) => s.id === service.id);
          const next = exists ? state.userServices : [...state.userServices, service];
          return {
            userServices: next,
            activeService: state.activeService || service.id,
          };
        });
      },

      recordVisit: (serviceId, route) => {
        set((state) => ({
          lastVisited: { ...state.lastVisited, [serviceId]: route },
        }));
      },

      clearServiceStore: () => set({ activeService: null, userServices: [], lastVisited: {} }),
    }),
    {
      name: 'parish-services',
      partialize: (state) => ({
        activeService: state.activeService,
        userServices: state.userServices,
        lastVisited: state.lastVisited,
      }),
    }
  )
);

export default useServiceStore;
