'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import useUiStore from '@/store/uiStore';
import Spinner from '@/components/ui/Spinner';

/**
 * GlobalPageProgress
 * ------------------
 * Intercepts anchor-tag clicks to detect navigation start.
 * Listens to usePathname() to detect navigation end.
 * Shows:
 *   1. A thin animated gradient progress bar at the very top of the viewport.
 *   2. A floating pill (bottom-right) with the creative Spinner + "Loading…" text.
 *
 * Place this once inside <AppLayout> — it mounts globally for the whole app.
 */
export default function PageProgress() {
  const isNavigating = useUiStore((s) => s.isNavigating);
  const setNavigating = useUiStore((s) => s.setNavigating);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const timerRef = useRef(null);

  /* ── Detect navigation START by intercepting anchor clicks ──────────── */
  useEffect(() => {
    const handleClick = (e) => {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      /* Ignore external, hash, email, tel links */
      if (
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('#') ||
        href.startsWith('mailto') ||
        href.startsWith('tel')
      ) return;
      /* Ignore same-page navigation */
      const target = href.split('?')[0].split('#')[0];
      const current = pathnameRef.current.split('?')[0];
      if (target === current) return;

      setNavigating(true);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [setNavigating]);

  /* ── Detect navigation END when pathname changes ────────────────────── */
  useEffect(() => {
    if (pathname !== pathnameRef.current) {
      pathnameRef.current = pathname;
      if (timerRef.current) clearTimeout(timerRef.current);
      /* Small grace delay so the new page content renders before we hide */
      timerRef.current = setTimeout(() => setNavigating(false), 200);
    }
  }, [pathname, setNavigating]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  if (!isNavigating) return null;

  return (
    <>
      {/* ── Top progress bar ── */}
      <div
        className="fixed top-0 left-0 right-0 z-[9999] h-[3px] overflow-hidden"
        aria-hidden="true"
      >
        <div className="page-progress-bar" />
      </div>

      {/* ── Floating loading pill (bottom-right) ── */}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 bg-white border border-gray-200 rounded-full shadow-lg px-4 py-2.5 page-progress-pill"
        role="status"
        aria-live="polite"
      >
        <Spinner size="sm" />
        <span className="text-sm font-semibold text-gray-700 tracking-tight">Loading…</span>
      </div>
    </>
  );
}
