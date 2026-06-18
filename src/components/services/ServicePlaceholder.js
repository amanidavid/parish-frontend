'use client';
import Link from 'next/link';
import { SERVICE_REGISTRY } from '@/modules/services/serviceRegistry';

export default function ServicePlaceholder({ serviceId }) {
  const config = SERVICE_REGISTRY[serviceId];
  if (!config) return null;

  return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
        style={{ backgroundColor: config.bg }}
      >
        <svg className="w-10 h-10" style={{ color: config.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={config.icon} />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{config.label}</h1>
      <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
        This module is coming soon. You'll be able to {config.description.toLowerCase()}
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back to Dashboard
        </Link>
        <Link
          href="/properties"
          className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Go to Properties
        </Link>
      </div>
    </div>
  );
}
