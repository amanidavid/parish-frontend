'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useServiceStore from '@/store/serviceStore';
import { SERVICE_REGISTRY, getService } from '@/modules/services/serviceRegistry';
import useCan from '@/hooks/useCan';

function ServiceCard({ service, statValue, onActivate }) {
  const router = useRouter();
  const config = getService(service.id);
  if (!config) return null;

  const handleClick = () => {
    onActivate(service.id);
    router.push(config.baseRoute);
  };

  return (
    <button
      onClick={handleClick}
      className="group text-left bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: config.bg }}
        >
          <svg className="w-6 h-6" style={{ color: config.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={config.icon} />
          </svg>
        </div>
        <span className="text-xs font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
          Open →
        </span>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900">{config.label}</h3>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{config.description}</p>
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
        {config.stats.map((stat) => (
          <div key={stat.key} className="flex flex-col">
            <span className="text-xl font-bold text-gray-900">{statValue?.[stat.key] ?? 0}</span>
            <span className="text-xs text-gray-500">{stat.label}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

function AddServiceCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6 hover:border-gray-400 hover:bg-white transition-all duration-200 flex flex-col items-center justify-center gap-3 min-h-[200px]"
    >
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">Add New Service</p>
        <p className="text-xs text-gray-400 mt-0.5">Lodge, Restaurant, etc.</p>
      </div>
    </button>
  );
}

function ActivityItem({ icon, title, subtitle, time, serviceColor }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: serviceColor ? `${serviceColor}15` : '#f3f4f6', color: serviceColor || '#6b7280' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      <span className="text-xs text-gray-400 shrink-0">{time}</span>
    </div>
  );
}

export default function ServiceHub() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const services = useAuthStore((s) => s.services);
  const setActiveService = useServiceStore((s) => s.setActiveService);
  /* TODO: restore permission check after backend implements services.manage */
  const canManageServices = true; // useCan('services.manage');

  // Mock stats — replace with API calls
  const stats = useMemo(() => ({
    properties: { properties: 4, units: 12, contracts: 3 },
    lodge: { lodges: 2, rooms: 45, bookings: 8 },
    restaurant: { outlets: 1, tables: 12, orders: 23 },
  }), []);

  const activeServices = useMemo(() => {
    return (services || []).filter((s) => s.active !== false);
  }, [services]);

  const handleActivate = (serviceId) => {
    setActiveService(serviceId);
  };

  const handleAddService = () => {
    router.push('/onboarding');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name || user?.display_name || 'there'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeServices.length === 0
              ? 'You have no active services yet. Add one to get started.'
              : `You have ${activeServices.length} active service${activeServices.length !== 1 ? 's' : ''}. Select one to manage.`}
          </p>
        </div>
        {/* Add Service button hidden for live release — re-enable when multi-service API is ready */
        /*
        <div className="flex items-center gap-2">
          {canManageServices && (
            <button
              onClick={handleAddService}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Service
            </button>
          )}
        </div>
        */}
      </div>

      {/* Service Cards Grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Your Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              statValue={stats[service.id]}
              onActivate={handleActivate}
            />
          ))}

          {/* Add New Service Card hidden for live release */}
          {/* {canManageServices && <AddServiceCard onClick={handleAddService} />} */}

          {/* Empty state */}
          {activeServices.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">No services active</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                You have no properties yet. Create your first property to start managing your business.
              </p>
              {/* Onboarding hidden for live release
              {canManageServices && (
                <button
                  onClick={handleAddService}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Set Up Your First Service
                </button>
              )}
              */}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {activeServices.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Recent Activity</h2>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-1">
            <ActivityItem
              icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              title="Contract signed — Unit G-019"
              subtitle="Property Management • Ubungo Plaza"
              time="10 min ago"
              serviceColor="#2563eb"
            />
            <ActivityItem
              icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              title="New booking — Room 204"
              subtitle="Lodge • Arusha Lodge"
              time="1 hr ago"
              serviceColor="#7c3aed"
            />
            <ActivityItem
              icon="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              title="Order #482 completed"
              subtitle="Restaurant • Table 3"
              time="2 hrs ago"
              serviceColor="#059669"
            />
            <ActivityItem
              icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              title="Maintenance request resolved"
              subtitle="Property Management • Sunsete Roof"
              time="Yesterday"
              serviceColor="#2563eb"
            />
          </div>
        </div>
      )}

      {/* Shared Quick Access */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Shared Tools</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { href: '/staff', label: 'Staff', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: '#4b5563' },
            { href: '/reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: '#2563eb' },
            { href: '/access-control', label: 'Access Control', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: '#059669' },
            { href: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z', color: '#6b7280' },
          ].map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all duration-200 flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${tool.color}15`, color: tool.color }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={tool.icon} />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700">{tool.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
