/**
 * Service Registry — Central configuration for all business modules.
 *
 * Each service defines:
 * - id: unique key
 * - label: display name
 * - icon: SVG path for icon
 * - description: short description shown in onboarding/hub
 * - color: brand color for the service card
 * - nav: service-specific sidebar navigation
 * - permissions: required permissions to see/use the service
 * - baseRoute: root route for the service (e.g. /properties)
 */

export const SERVICE_REGISTRY = {
  properties: {
    id: 'properties',
    label: 'Property Management',
    shortLabel: 'Properties',
    description: 'Manage buildings, floors, units, contracts and tenants.',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    color: '#2563eb',
    bg: '#eff6ff',
    baseRoute: '/properties',
    nav: [
      { href: '/properties', label: 'Properties', permission: 'properties.view' },
      { href: '/maintenance', label: 'Maintenance', permission: 'maintenance_jobs.view' },
    ],
    stats: [
      { key: 'properties', label: 'Properties', icon: 'building' },
      { key: 'units', label: 'Units', icon: 'grid' },
      { key: 'contracts', label: 'Active Contracts', icon: 'file' },
    ],
    quickActions: [
      { href: '/properties', label: 'Property', permission: 'properties.create', color: '#2563eb', bg: '#eff6ff', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { href: '/staff', label: 'Staff', permission: 'staff.manage', color: '#059669', bg: '#ecfdf5', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    ],
  },

  lodge: {
    id: 'lodge',
    label: 'Lodge Management',
    shortLabel: 'Lodge',
    description: 'Manage lodges, rooms, bookings, and housekeeping.',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    color: '#7c3aed',
    bg: '#f5f3ff',
    baseRoute: '/lodges',
    nav: [
      { href: '/lodges', label: 'Lodges', permission: 'lodges.view' },
      { href: '/bookings', label: 'Bookings', permission: 'bookings.view' },
      { href: '/housekeeping', label: 'Housekeeping', permission: 'housekeeping.view' },
    ],
    stats: [
      { key: 'lodges', label: 'Lodges', icon: 'building' },
      { key: 'rooms', label: 'Rooms', icon: 'grid' },
      { key: 'bookings', label: 'Today\'s Bookings', icon: 'calendar' },
    ],
    quickActions: [
      { href: '/lodges/create', label: 'Lodge', permission: 'lodges.create', color: '#7c3aed', bg: '#f5f3ff', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { href: '/rooms/create', label: 'Room', permission: 'rooms.create', color: '#8b5cf6', bg: '#faf5ff', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
      { href: '/bookings/create', label: 'Booking', permission: 'bookings.create', color: '#d97706', bg: '#fffbeb', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    ],
  },

  restaurant: {
    id: 'restaurant',
    label: 'Restaurant POS',
    shortLabel: 'Restaurant',
    description: 'Manage tables, menu, orders and payments.',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    color: '#059669',
    bg: '#ecfdf5',
    baseRoute: '/restaurants',
    nav: [
      { href: '/restaurants', label: 'Outlets', permission: 'restaurants.view' },
      { href: '/menu', label: 'Menu', permission: 'menu.view' },
      { href: '/orders', label: 'Orders', permission: 'orders.view' },
    ],
    stats: [
      { key: 'outlets', label: 'Outlets', icon: 'store' },
      { key: 'tables', label: 'Tables', icon: 'grid' },
      { key: 'orders', label: 'Today\'s Orders', icon: 'cart' },
    ],
    quickActions: [
      { href: '/restaurants/create', label: 'Outlet', permission: 'restaurants.create', color: '#059669', bg: '#ecfdf5', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { href: '/menu/create', label: 'Menu Item', permission: 'menu.create', color: '#10b981', bg: '#ecfdf5', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
      { href: '/orders/create', label: 'Order', permission: 'orders.create', color: '#0ea5e9', bg: '#f0f9ff', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
    ],
  },
};

/** Shared navigation shown regardless of active service */
export const SHARED_NAV_GROUPS = [
  {
    group: 'People',
    items: [
      { href: '/staff', label: 'Staff', permission: 'staff.manage' },
      { href: '/staff-property-assignments', label: 'Assignments', permission: 'staff_property_assignments.view' },
    ],
  },
  {
    group: 'Workspace',
    items: [
      { href: '/reports', label: 'Reports', permission: 'reports.view' },
      { href: '/subscription', label: 'Subscription' },
      { href: '/access-control', label: 'Access Control', permission: 'roles.manage' },
      { href: '/settings', label: 'Settings', permission: 'settings.view' },
    ],
  },
];

/** Helper: get service config by id */
export function getService(id) {
  return SERVICE_REGISTRY[id] || null;
}

/** Helper: get all service IDs */
export function getServiceIds() {
  return Object.keys(SERVICE_REGISTRY);
}

/** Helper: get navigation for a specific service */
export function getServiceNav(serviceId) {
  const svc = getService(serviceId);
  if (!svc) return [];
  return [
    {
      group: svc.label,
      items: svc.nav.map((n) => ({
        ...n,
        icon: svc.icon,
      })),
    },
  ];
}

/** Helper: get shared nav (always visible) */
export function getSharedNav() {
  return SHARED_NAV_GROUPS;
}

/** Helper: combine service nav + shared nav for sidebar */
export function getFullSidebarNav(serviceId) {
  const serviceNav = serviceId ? getServiceNav(serviceId) : [];
  return [...serviceNav, ...getSharedNav()];
}
