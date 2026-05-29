/**
 * Properties Module — Tab & Component Registry
 *
 * Centralized configuration for the Property detail page tabs.
 * - Tabs are lazy-loaded (code-split) on first open
 * - After first mount, tab state is preserved via mount-once pattern
 * - Overview is inline (not lazy) since it renders property header data
 */
import dynamic from 'next/dynamic';

/* ── Lazy-loaded tab panels (code-split) ─────────────────────────────── */
export const FloorsTab = dynamic(() => import('@/components/properties/FloorsTab'));
export const UnitsTab = dynamic(() => import('@/components/properties/UnitsTab'));
export const ContractsTab = dynamic(() => import('@/components/properties/ContractsTab'));

/* ── Tab definitions ───────────────────────────────────────────────── */
export const PROPERTY_TABS = [
  { id: 'overview', label: 'Overview', lazy: false },
  { id: 'floors', label: 'Floors', lazy: true },
  { id: 'units', label: 'Units', lazy: true },
  { id: 'contracts', label: 'Contracts', lazy: true },
];

export const DEFAULT_TAB = 'overview';

export const VALID_TAB_IDS = PROPERTY_TABS.map((t) => t.id);

/* ── Tab component resolver ────────────────────────────────────────── */
const TAB_COMPONENTS = {
  floors: FloorsTab,
  units: UnitsTab,
  contracts: ContractsTab,
};

/**
 * Resolve a tab ID to its React component.
 * Returns null for 'overview' (rendered inline).
 */
export function resolveTabComponent(tabId) {
  return TAB_COMPONENTS[tabId] || null;
}

/**
 * Check if a tab ID is valid.
 */
export function isValidTab(tabId) {
  return VALID_TAB_IDS.includes(tabId);
}

/**
 * Sanitize URL tab param — falls back to DEFAULT_TAB if invalid.
 */
export function sanitizeTab(tabId) {
  return isValidTab(tabId) ? tabId : DEFAULT_TAB;
}
