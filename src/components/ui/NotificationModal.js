'use client';
import { useEffect, useRef } from 'react';
import useUiStore from '@/store/uiStore';

const ICONS = {
  success: (
    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  ),
  error: (
    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  ),
};

const TITLES = {
  success: 'Success',
  error: 'Error',
};

export default function NotificationModal() {
  const modal = useUiStore((s) => s.modalNotification);
  const closeModal = useUiStore((s) => s.closeModal);

  const open = modal !== null;
  const type = modal?.type || 'success';
  const title = modal?.title || TITLES[type];
  const message = modal?.message || '';

  const modalRef = useRef(modal);
  modalRef.current = modal;
  const closeModalRef = useRef(closeModal);
  closeModalRef.current = closeModal;

  const handleClose = () => {
    const m = modalRef.current;
    if (m?.onRefresh && m?.type === 'success') m.onRefresh();
    closeModalRef.current();
  };

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="relative bg-white rounded-lg shadow-2xl w-full max-w-sm text-center p-6"
        role="alertdialog"
        aria-modal="true"
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {ICONS[type]}

        <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-5">{message}</p>

        <button
          type="button"
          onClick={handleClose}
          className="inline-flex items-center justify-center h-9 px-6 rounded-md text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
