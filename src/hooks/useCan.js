import { useMemo } from 'react';
import useAuthStore from '@/store/authStore';

/**
 * Hook to check if the current user has specific permission(s).
 *
 * @param {string|string[]} permission - Single permission name or array of names
 * @param {'any'|'all'} mode - 'any' = at least one, 'all' = must have all
 * @returns {boolean}
 *
 * Examples:
 *   const canEdit = useCan('properties.edit');
 *   const canManage = useCan(['roles.manage', 'users.manage'], 'any');
 *   const canEverything = useCan(['properties.create', 'properties.edit'], 'all');
 */
export default function useCan(permission, mode = 'any') {
  const permissions = useAuthStore((s) => s.permissions);

  return useMemo(() => {
    if (!permissions || permissions.length === 0) return false;

    const names = permissions.map((p) => p.name);
    const required = Array.isArray(permission) ? permission : [permission];

    if (mode === 'all') {
      return required.every((p) => names.includes(p));
    }
    return required.some((p) => names.includes(p));
  }, [permissions, permission, mode]);
}
