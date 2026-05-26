'use client';

/**
 * Global reusable Spinner.
 * Uses the primary button color (#2563eb / blue-600).
 *
 * Sizes: xs | sm | md | lg | xl
 * Variants: default (dual-ring) | dots | pulse
 */

const SIZES = {
  xs: { outer: 'w-3.5 h-3.5', border: 'border-2', inner: 'w-1.5 h-1.5' },
  sm: { outer: 'w-5 h-5',   border: 'border-2', inner: 'w-2 h-2' },
  md: { outer: 'w-8 h-8',   border: 'border-[3px]', inner: 'w-3 h-3' },
  lg: { outer: 'w-12 h-12', border: 'border-4', inner: 'w-4 h-4' },
  xl: { outer: 'w-16 h-16', border: 'border-4', inner: 'w-5 h-5' },
};

export default function Spinner({ size = 'md', className = '' }) {
  const s = SIZES[size] || SIZES.md;
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${s.outer} ${className}`}
    >
      {/* Outer track ring */}
      <span className={`absolute inset-0 rounded-full ${s.border} border-blue-100`} />
      {/* Spinning arc — top + right coloured */}
      <span
        className={`absolute inset-0 rounded-full ${s.border} border-transparent border-t-blue-600 border-r-blue-500 animate-spin`}
        style={{ animationDuration: '0.65s', animationTimingFunction: 'cubic-bezier(0.4,0,0.2,1)' }}
      />
      {/* Inner counter-spinning arc for depth */}
      <span
        className={`absolute ${s.inner} rounded-full border-2 border-transparent border-b-blue-300 animate-spin`}
        style={{ animationDuration: '1.1s', animationDirection: 'reverse', animationTimingFunction: 'cubic-bezier(0.4,0,0.2,1)' }}
      />
    </span>
  );
}

/** Full-page centred spinner with optional label — use inside page sections */
export function PageSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 select-none">
      <Spinner size="lg" />
      {label && <p className="text-sm font-medium text-gray-400 animate-pulse">{label}</p>}
    </div>
  );
}
