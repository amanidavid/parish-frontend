'use client';
import { memo, useCallback } from 'react';
import { usePropertyAccess } from '@/contexts/PropertyAccessContext';

const AccessBanner = memo(function AccessBanner({ onViewSubscription }) {
  const access = usePropertyAccess();

  /* ── Preferred: backend provides explicit display_banner ── */
  const displayBanner = access?.display_banner;
  if (displayBanner) {
    if (displayBanner.scope === 'none') return null;
    // scope = 'workspace' | 'property' — render below using its message
  }

  /* ── Fallback: strict precedence, never mix messages ── */
  const workspaceBlocked = access?.workspace?.allowed === false;
  const propertyBlocked = access?.property_subscription?.allowed === false;

  if (!workspaceBlocked && !propertyBlocked && !displayBanner) return null;

  const scope = displayBanner?.scope || (workspaceBlocked ? 'workspace' : 'property');
  const message = displayBanner?.message
    || (workspaceBlocked ? access?.workspace?.message : null)
    || (propertyBlocked ? access?.property_subscription?.message : null)
    || 'Property subscription access is required.';

  const handleClick = useCallback(() => {
    onViewSubscription?.();
  }, [onViewSubscription]);

  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 shadow-sm bg-gradient-to-br from-amber-50 via-white to-orange-50/40 ring-amber-200/70">
      <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full blur-3xl opacity-30 bg-amber-300" />
      <div className="relative px-5 py-4 flex items-start sm:items-center gap-3.5">
        <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ring-1 bg-amber-500 text-white ring-amber-400/50">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            Actions restricted
          </p>
          <p className="text-xs text-amber-700/90 mt-0.5 leading-relaxed">
            {message}
          </p>
        </div>
        {onViewSubscription && (
          <button
            onClick={handleClick}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200/80 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View subscription
          </button>
        )}
      </div>
    </div>
  );
});

export default AccessBanner;
