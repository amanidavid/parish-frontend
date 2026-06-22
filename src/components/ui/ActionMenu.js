'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

export default function ActionMenu({ actions = [] }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 160;
    const menuHeight = Math.min(actions.length * 36 + 8, 240);
    let left = rect.right - menuWidth;
    let top = rect.bottom + 4;

    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }
    if (left < 8) left = 8;
    if (top + menuHeight > window.innerHeight - 8) {
      top = rect.top - menuHeight - 4;
    }

    setPos({ top, left });
  }, [actions.length]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => setOpen(false);
    const onResize = () => setOpen(false);
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !triggerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, updatePosition]);

  if (!actions.length) return null;

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!open) updatePosition();
          setOpen((p) => !p);
        }}
        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Actions"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: 160 }}
          className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-fade-in"
        >
          {actions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              disabled={action.disabled}
              onClick={() => {
                setOpen(false);
                action.onClick?.();
              }}
              className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center gap-2
                ${action.danger
                  ? 'text-red-600 hover:bg-red-50 disabled:text-red-300'
                  : 'text-gray-700 hover:bg-gray-50 disabled:text-gray-300'}
                ${action.className || ''}`}
            >
              {action.icon && <span className="shrink-0">{action.icon}</span>}
              <span className="truncate">{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
